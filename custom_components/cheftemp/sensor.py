"""Купол, турбинка и каналы щупов CH1–CH4."""

from __future__ import annotations

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import PERCENTAGE, UnitOfTemperature
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import ChefTempHub
from .const import PROBE_SLOTS, PROBE_TIPS


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    hub: ChefTempHub = entry.runtime_data
    async_add_entities(
        [
            DomeSensor(hub),
            FanRunSensor(hub),
            BatterySensor(hub),
            *channel_sensors(hub),
        ]
    )


class DomeSensor(SensorEntity):
    """Купол, целые °C из кадра AA 55 57."""

    _attr_should_poll = False
    _attr_has_entity_name = True
    _attr_translation_key = "dome"
    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    _attr_suggested_display_precision = 0
    _attr_icon = "mdi:grill"

    def __init__(self, hub: ChefTempHub) -> None:
        self._hub = hub
        self._attr_unique_id = f"{hub.mac}_ambient"
        self._attr_device_info = hub.device_info

    @property
    def available(self) -> bool:
        return self._hub.dome_fresh

    @property
    def native_value(self) -> int | None:
        if not self._hub.dome_fresh:
            return None
        return self._hub.dome_c

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self._hub.listen(self._updated))

    @callback
    def _updated(self) -> None:
        self.async_write_ha_state()


class FanRunSensor(SensorEntity):
    """Состояние турбинки по кадру 0x73, как в прилке."""

    _attr_should_poll = False
    _attr_has_entity_name = True
    _attr_translation_key = "fan"
    _attr_icon = "mdi:fan"
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = ["offline", "slow", "fast", "paused", "stopped"]

    def __init__(self, hub: ChefTempHub) -> None:
        self._hub = hub
        self._attr_unique_id = f"{hub.mac}_fan"
        self._attr_device_info = hub.device_info

    @property
    def native_value(self) -> str:
        return self._hub.fan_state

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self._hub.listen(self._updated))

    @callback
    def _updated(self) -> None:
        self.async_write_ha_state()


class BatterySensor(SensorEntity):
    """Заряд из кадра 0x58, опкод 0x10."""

    _attr_should_poll = False
    _attr_has_entity_name = True
    _attr_translation_key = "battery"
    _attr_device_class = SensorDeviceClass.BATTERY
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = PERCENTAGE

    def __init__(self, hub: ChefTempHub) -> None:
        self._hub = hub
        self._attr_unique_id = f"{hub.mac}_battery"
        self._attr_device_info = hub.device_info

    @property
    def available(self) -> bool:
        return self._hub.battery_fresh

    @property
    def native_value(self) -> int | None:
        if not self._hub.battery_fresh:
            return None
        return self._hub.battery_pct

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self._hub.listen(self._updated))

    @callback
    def _updated(self) -> None:
        self.async_write_ha_state()


def channel_sensors(hub: ChefTempHub) -> list[SensorEntity]:
    sensors: list[SensorEntity] = []
    for slot in PROBE_SLOTS:
        sensors.append(ChannelPartSensor(hub, slot, "temp"))
        sensors.extend(ChannelPartSensor(hub, slot, f"t{n}") for n in PROBE_TIPS)
        sensors.append(ChannelPartSensor(hub, slot, "ambient"))
        sensors.append(ChannelPartSensor(hub, slot, "battery"))
    return sensors


class ChannelPartSensor(SensorEntity):
    """Один датчик канала: temp / t1–t5 / ambient / battery. На устройстве S1."""

    _attr_should_poll = False
    _attr_has_entity_name = True
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, hub: ChefTempHub, slot: int, part: str) -> None:
        self._hub = hub
        self._slot = slot
        self._part = part
        if part == "temp":
            self._attr_unique_id = f"{hub.mac}_ch{slot}"
        else:
            self._attr_unique_id = f"{hub.mac}_ch{slot}_{part}"
        self._attr_device_info = hub.device_info
        self._attr_translation_key = {
            "temp": "channel",
            "ambient": "channel_ambient",
            "battery": "channel_battery",
        }.get(part, "channel_tip")
        placeholders = {"slot": str(slot)}
        if part.startswith("t") and part[1:].isdigit():
            placeholders["n"] = part[1:]
        self._attr_translation_placeholders = placeholders
        if part == "battery":
            self._attr_device_class = SensorDeviceClass.BATTERY
            self._attr_native_unit_of_measurement = PERCENTAGE
            self._attr_icon = "mdi:battery"
            self._attr_suggested_display_precision = 0
        else:
            self._attr_device_class = SensorDeviceClass.TEMPERATURE
            self._attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
            self._attr_icon = "mdi:thermometer"
            self._attr_suggested_display_precision = 0 if part == "ambient" else 1

    def _probe(self):
        if not self._hub.probe_fresh(self._slot):
            return None
        return self._hub.probes.get(self._slot)

    def _reading(self) -> float | int | None:
        probe = self._probe()
        if probe is None:
            return None
        if self._part == "temp":
            return probe.min_internal
        if self._part == "ambient":
            return probe.ambient_c
        if self._part == "battery":
            return probe.battery_pct
        index = int(self._part[1:]) - 1
        return probe.tips[index]

    @property
    def available(self) -> bool:
        return self._reading() is not None

    @property
    def native_value(self) -> float | int | None:
        return self._reading()

    @property
    def extra_state_attributes(self) -> dict[str, object] | None:
        if self._part != "temp":
            return None
        probe = self._probe()
        if probe is None:
            return None
        attrs: dict[str, object] = {}
        if probe.battery_pct is not None:
            attrs["battery"] = probe.battery_pct
        if probe.signal is not None:
            attrs["signal"] = probe.signal
        return attrs or None

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self._hub.listen(self._updated))

    @callback
    def _updated(self) -> None:
        self.async_write_ha_state()
