"""Скорость вентилятора: 1 медленно, 2 быстро."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from . import ChefTempHub

_SPEED = {"fast": 2, "slow": 1}
_SPEED_LABELS = {2: "fast", 1: "slow"}
_SPEED_FROM = {
    "fast": 2,
    "быстро": 2,
    "сильная": 2,
    "slow": 1,
    "медленно": 1,
    "слабая": 1,
}

# Снято с прилки 21.10.2026: 2 температура, 1 таймер, 0 выкл.
_MODES = {"temperature": 2, "timer": 1, "off": 0}
_MODE_LABELS = {2: "temperature", 1: "timer", 0: "off"}
_MODE_FROM = {
    "temperature": 2,
    "температура": 2,
    "по температуре": 2,
    "timer": 1,
    "таймер": 1,
    "по таймеру": 1,
    "off": 0,
    "выкл": 0,
}


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    hub: ChefTempHub = entry.runtime_data
    async_add_entities([FanMode(hub), FanStrength(hub)])


class FanMode(SelectEntity, RestoreEntity):
    """Температура, таймер или выкл. В кадре это один байт."""

    _attr_should_poll = False
    _attr_has_entity_name = True
    _attr_translation_key = "mode"
    _attr_icon = "mdi:fan"
    _attr_options = list(_MODES)

    def __init__(self, hub: ChefTempHub) -> None:
        self._hub = hub
        self._attr_unique_id = f"{hub.mac}_mode"
        self._attr_device_info = hub.device_info

    @property
    def available(self) -> bool:
        return self._hub.fan_ready

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_state()
        restored = await self._hub.async_remembered(
            self.entity_id, last.state if last else None
        )
        mode = _MODE_FROM.get(restored.strip().lower()) if restored else None
        if mode is not None:
            self._hub.fan.mode = mode
            self._hub.note_fan_field("mode")
            self._attr_current_option = _MODE_LABELS[mode]
        self.async_on_remove(self._hub.listen(self._updated))

    @callback
    def _updated(self) -> None:
        self._attr_current_option = _MODE_LABELS.get(self._hub.fan.mode)
        self.async_write_ha_state()

    async def async_select_option(self, option: str) -> None:
        previous = self._hub.fan.mode
        self._hub.fan.mode = _MODES[option]
        # Состояние сразу. Иначе экран ещё видит «выкл» и через секунду шлёт его снова.
        self._attr_current_option = option
        self.async_write_ha_state()
        try:
            await self._hub.async_send_fan()
        except Exception:
            self._hub.fan.mode = previous
            self._attr_current_option = _MODE_LABELS.get(previous)
            self.async_write_ha_state()
            raise


class FanStrength(SelectEntity, RestoreEntity):
    _attr_should_poll = False
    _attr_has_entity_name = True
    _attr_translation_key = "speed"
    _attr_icon = "mdi:fan-chevron-up"
    _attr_options = list(_SPEED)

    def __init__(self, hub: ChefTempHub) -> None:
        self._hub = hub
        self._attr_unique_id = f"{hub.mac}_speed"
        self._attr_device_info = hub.device_info

    @property
    def available(self) -> bool:
        return self._hub.fan_ready

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_state()
        restored = await self._hub.async_remembered(
            self.entity_id, last.state if last else None
        )
        strength = _SPEED_FROM.get(restored.strip().lower()) if restored else None
        if strength is not None:
            self._hub.fan.strength = strength
            self._hub.note_fan_field("strength")
            self._attr_current_option = _SPEED_LABELS[strength]
        self.async_on_remove(self._hub.listen(self._updated))

    @callback
    def _updated(self) -> None:
        self._attr_current_option = _SPEED_LABELS.get(self._hub.fan.strength)
        self.async_write_ha_state()

    async def async_select_option(self, option: str) -> None:
        previous = self._hub.fan.strength
        self._hub.fan.strength = _SPEED[option]
        self._attr_current_option = option
        self.async_write_ha_state()
        try:
            await self._hub.async_send_fan()
        except Exception:
            self._hub.fan.strength = previous
            self._attr_current_option = _SPEED_LABELS.get(previous)
            self.async_write_ha_state()
            raise
