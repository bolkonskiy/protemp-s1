"""ChefTemp ProTemp S1 через облачный MQTT."""

from __future__ import annotations

import asyncio
from dataclasses import replace
from datetime import datetime, timedelta, timezone
import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STOP
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo

from .const import (
    DEFAULT_HOST,
    DEFAULT_PORT,
    DOME_STALE_SECONDS,
    DOMAIN,
    PLATFORMS,
    S1_FAN_IDX,
)
from .link import CloudLink
from .protocol import FanRun, FanSetting, Probe, alarm_frame, fan_state, limit_frame, parse_stream

_LOGGER = logging.getLogger(__name__)
_UNSET = {"unknown", "unavailable", "none", ""}
_FAN_SNAPSHOT = ("fan_mode", "fan_seconds", "fan_temp", "fan_strength")

# Старые unique_id / entity_id были транслитом. 1.2.5 перекладывает их на английский.
_UID_MIGRATE = (
    ("sensor", "kupol", "ambient", "sensor.protemp_s1_ambient"),
    ("sensor", "ventiliator_rabota", "fan", "sensor.protemp_s1_fan"),
    ("sensor", "zaryad", "battery", "sensor.protemp_s1_battery"),
    ("number", "ventiliator", "setpoint", "number.protemp_s1_setpoint"),
    ("number", "taimer", "timer", "number.protemp_s1_timer"),
    ("select", "rezhim", "mode", "select.protemp_s1_mode"),
    ("select", "sila", "speed", "select.protemp_s1_speed"),
    ("switch", "avaria", "alarm", "switch.protemp_s1_alarm"),
    ("number", "maksimum", "maximum", "number.protemp_s1_maximum"),
    ("number", "minimum", "minimum", "number.protemp_s1_minimum"),
)


def _migrate_entity_ids(hass: HomeAssistant, mac: str) -> None:
    registry = er.async_get(hass)
    for domain, old_suffix, new_suffix, new_eid in _UID_MIGRATE:
        old_uid = f"{mac}_{old_suffix}"
        new_uid = f"{mac}_{new_suffix}"
        entity_id = registry.async_get_entity_id(domain, DOMAIN, old_uid)
        if entity_id is None:
            entity_id = registry.async_get_entity_id(domain, DOMAIN, new_uid)
        if entity_id is None:
            continue
        item = registry.async_get(entity_id)
        kwargs: dict[str, str] = {}
        if item is not None and item.unique_id != new_uid:
            kwargs["new_unique_id"] = new_uid
        if entity_id != new_eid and registry.async_get(new_eid) is None:
            kwargs["new_entity_id"] = new_eid
        if not kwargs:
            continue
        registry.async_update_entity(entity_id, **kwargs)
        _LOGGER.info("Переименовал %s → %s", entity_id, kwargs)


class ChefTempHub:
    """Состояние одного S1. Команды уходят только после действия в HA."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.entry = entry
        self.mac = str(entry.data["mac"]).upper()
        self.fan = FanSetting(idx=S1_FAN_IDX)
        if all(key in entry.data for key in _FAN_SNAPSHOT):
            self.fan.mode = int(entry.data["fan_mode"])
            self.fan.seconds = int(entry.data["fan_seconds"])
            self.fan.temp_c = float(entry.data["fan_temp"])
            self.fan.strength = int(entry.data["fan_strength"])
            self.fan.known = True
        self._fan_fields: set[str] = set()
        self.limit_min_c = 70
        self.limit_max_c = 150
        self.alarm = True
        self.dome_c: int | None = None
        self.dome_at: datetime | None = None
        self.fan_run: FanRun | None = None
        self.fan_run_at: datetime | None = None
        self.battery_pct: int | None = None
        self.battery_at: datetime | None = None
        self.probes: dict[int, Probe] = {}
        self.probe_at: dict[int, datetime] = {}
        self._listeners: list[Any] = []
        self._bufs: dict[str, bytearray] = {}
        self._task: asyncio.Task[None] | None = None
        self._stale: asyncio.Task[None] | None = None
        topic = self.mac
        self.down_topic = f"{self.mac}/down"
        client_id = f"ha-cheftemp-{self.mac[-6:].lower()}"
        self.link = CloudLink(
            str(entry.data.get("host") or DEFAULT_HOST),
            int(entry.data.get("port") or DEFAULT_PORT),
            client_id,
            [topic, self.down_topic],
            self._on_message,
        )

    @property
    def device_info(self) -> DeviceInfo:
        return DeviceInfo(
            identifiers={(DOMAIN, self.mac)},
            name="ProTemp S1",
            manufacturer="ChefsTemp",
            model="ProTemp S1",
        )

    @property
    def dome_fresh(self) -> bool:
        if self.dome_c is None or self.dome_at is None:
            return False
        return datetime.now(timezone.utc) - self.dome_at < timedelta(seconds=DOME_STALE_SECONDS)

    @property
    def battery_fresh(self) -> bool:
        if self.battery_pct is None or self.battery_at is None:
            return False
        return datetime.now(timezone.utc) - self.battery_at < timedelta(seconds=DOME_STALE_SECONDS)

    def probe_fresh(self, slot: int) -> bool:
        seen = self.probe_at.get(slot)
        if slot not in self.probes or seen is None:
            return False
        return datetime.now(timezone.utc) - seen < timedelta(seconds=DOME_STALE_SECONDS)

    @property
    def fan_state(self) -> str:
        """Последнее состояние, как в прилке. Молчание турбинки связь не обрывает."""
        dome = self.dome_c if self.dome_fresh else None
        return fan_state(self.fan_run, self.fan.mode, dome, self.fan.temp_c)

    def _apply_command(self) -> None:
        """Как Stand.setFanSet: после команды режим и сила берутся из неё."""
        if self.fan_run is None:
            return
        self.fan_run = replace(self.fan_run, mode=self.fan.mode, speed=self.fan.strength)

    @property
    def fan_ready(self) -> bool:
        """Все поля кадра пришли с провода или из памяти HA."""
        return self.fan.known

    def note_fan_field(self, field: str) -> None:
        """Запомнить восстановленное поле. Выдуманные 78/120/выкл сюда не попадают."""
        self._fan_fields.add(field)
        if {"mode", "temp", "seconds", "strength"} <= self._fan_fields:
            self.fan.known = True
            self._store_fan()
            self._notify()

    def _store_fan(self) -> None:
        snapshot = {
            "fan_mode": self.fan.mode,
            "fan_seconds": self.fan.seconds,
            "fan_temp": int(round(self.fan.temp_c)),
            "fan_strength": self.fan.strength,
        }
        if all(self.entry.data.get(key) == value for key, value in snapshot.items()):
            return
        data = dict(self.entry.data)
        data.update(snapshot)
        self.hass.config_entries.async_update_entry(self.entry, data=data)

    async def async_remembered(self, entity_id: str, restored: str | None) -> str | None:
        """Последнее настоящее значение. unavailable после старта без слота не затирает его."""
        if restored and restored.lower() not in _UNSET:
            return restored
        try:
            from homeassistant.components.recorder import get_instance
            from homeassistant.components.recorder.history import get_last_state_changes

            changes = await get_instance(self.hass).async_add_executor_job(
                get_last_state_changes, self.hass, 20, entity_id
            )
        except Exception:
            _LOGGER.debug("Не прочитал историю %s", entity_id, exc_info=True)
            return None
        rows = changes.get(entity_id, []) if isinstance(changes, dict) else []
        for item in reversed(list(rows)):
            value = getattr(item, "state", None)
            if value and str(value).lower() not in _UNSET:
                _LOGGER.info("Вернул %s = %s", entity_id, value)
                return str(value)
        return None

    def listen(self, update: Any) -> Any:
        self._listeners.append(update)

        def _remove() -> None:
            if update in self._listeners:
                self._listeners.remove(update)

        return _remove

    def start(self) -> None:
        # Фоновые: иначе bootstrap ждёт, пока они закончатся, и рестарт висит 5 минут.
        self._task = self.hass.async_create_background_task(self.link.run(), "cheftemp-link")
        self._stale = self.hass.async_create_background_task(
            self._watch_stale(),
            "cheftemp-stale",
        )

    async def stop(self) -> None:
        self.link.stop()
        for task in (self._task, self._stale):
            if task is None:
                continue
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    async def async_send_fan(self) -> None:
        if not self.fan_ready:
            raise HomeAssistantError("настройки вентилятора ещё не пришли с гриля")
        frame = self.fan.frame()
        _LOGGER.info("Вентилятор %s", frame.hex())
        await self.link.publish(self.down_topic, frame)
        self._apply_command()
        self._notify()

    async def async_send_limit(self, minimum: bool) -> None:
        value = self.limit_min_c if minimum else self.limit_max_c
        frame = limit_frame(minimum, value)
        _LOGGER.info("Лимит %s %s", "мин" if minimum else "макс", frame.hex())
        await self.link.publish(self.down_topic, frame)

    async def async_send_alarm(self) -> None:
        frame = alarm_frame(self.alarm)
        _LOGGER.info("Сигнализация %s", frame.hex())
        await self.link.publish(self.down_topic, frame)

    async def _on_message(self, topic: str, payload: bytes) -> None:
        buf = self._bufs.setdefault(topic, bytearray())
        buf.extend(payload)
        for item in parse_stream(buf):
            if item.dome_c is not None and not topic.endswith("/down"):
                self.dome_c = item.dome_c
                self.dome_at = datetime.now(timezone.utc)
                _LOGGER.debug("Купол %s °C", self.dome_c)
            if item.fan_run is not None and not topic.endswith("/down"):
                self.fan_run = item.fan_run
                self.fan_run_at = datetime.now(timezone.utc)
                _LOGGER.debug("Турбинка %s", item.fan_run)
            if item.fan is not None and not topic.endswith("/down"):
                item.fan.known = True
                item.fan.idx = S1_FAN_IDX
                self.fan = item.fan
                self._store_fan()
                self._apply_command()
            if item.limit_min_c is not None:
                self.limit_min_c = item.limit_min_c
            if item.limit_max_c is not None:
                self.limit_max_c = item.limit_max_c
            if item.alarm is not None:
                self.alarm = item.alarm
            if item.battery_pct is not None and not topic.endswith("/down"):
                self.battery_pct = item.battery_pct
                self.battery_at = datetime.now(timezone.utc)
            if item.probe is not None and not topic.endswith("/down"):
                self.probes[item.probe.slot] = item.probe
                self.probe_at[item.probe.slot] = datetime.now(timezone.utc)
                _LOGGER.debug("CH%s %s", item.probe.slot, item.probe.min_internal)
        self._notify()

    async def _watch_stale(self) -> None:
        while True:
            await asyncio.sleep(5)
            self._notify()

    @callback
    def _notify(self) -> None:
        for update in list(self._listeners):
            update()


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Подключить один S1."""
    mac = str(entry.data["mac"]).upper()
    _migrate_entity_ids(hass, mac)
    hub = ChefTempHub(hass, entry)
    entry.runtime_data = hub
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    hub.start()

    async def _on_stop(_event: object) -> None:
        await hub.stop()

    entry.async_on_unload(hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, _on_stop))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Отключить S1."""
    hub: ChefTempHub = entry.runtime_data
    await hub.stop()
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
