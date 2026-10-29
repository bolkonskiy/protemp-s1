"""Уставки, которые гриль сам не присылает. На старте ничего не отправляется."""

from __future__ import annotations

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import UnitOfTemperature, UnitOfTime
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from . import ChefTempHub

_UNSET = {"unknown", "unavailable", "none", ""}


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    hub: ChefTempHub = entry.runtime_data
    async_add_entities(
        [
            FanTemperature(hub),
            FanTimer(hub),
            DomeLimit(hub, minimum=True),
            DomeLimit(hub, minimum=False),
        ]
    )


class _RememberedNumber(NumberEntity, RestoreEntity):
    _attr_should_poll = False
    _attr_has_entity_name = True
    _attr_mode = NumberMode.BOX
    _default = 0.0
    _fan_field: str | None = None

    def __init__(self, hub: ChefTempHub, key: str) -> None:
        self._hub = hub
        self._attr_unique_id = f"{hub.mac}_{key}"
        self._attr_device_info = hub.device_info

    @property
    def available(self) -> bool:
        if self._fan_field:
            return self._hub.fan_ready
        return True

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_state()
        restored = last.state if last else None
        if self._fan_field:
            restored = await self._hub.async_remembered(self.entity_id, restored)
        if restored and restored.lower() not in _UNSET:
            self._apply_local(float(restored))
            if self._fan_field:
                self._hub.note_fan_field(self._fan_field)
        elif not self._fan_field:
            self._apply_local(self._default)
        self.async_on_remove(self._hub.listen(self._updated))

    def _apply_local(self, value: float) -> None:
        self._attr_native_value = value

    @callback
    def _updated(self) -> None:
        self.async_write_ha_state()


class FanTemperature(_RememberedNumber):
    _attr_translation_key = "setpoint"
    _fan_field = "temp"
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    _attr_native_min_value = 30
    _attr_native_max_value = 200
    _attr_native_step = 1
    _attr_icon = "mdi:thermometer"
    _default = 78.0

    def __init__(self, hub: ChefTempHub) -> None:
        super().__init__(hub, "setpoint")

    def _apply_local(self, value: float) -> None:
        self._hub.fan.temp_c = value
        super()._apply_local(value)

    @callback
    def _updated(self) -> None:
        self._attr_native_value = self._hub.fan.temp_c
        super()._updated()

    async def async_set_native_value(self, value: float) -> None:
        previous = self._hub.fan.temp_c
        self._hub.fan.temp_c = value
        self._attr_native_value = value
        self.async_write_ha_state()
        try:
            await self._hub.async_send_fan()
        except Exception:
            self._hub.fan.temp_c = previous
            self._attr_native_value = previous
            self.async_write_ha_state()
            raise


class FanTimer(_RememberedNumber):
    _attr_translation_key = "timer"
    _fan_field = "seconds"
    _attr_native_unit_of_measurement = UnitOfTime.SECONDS
    _attr_native_min_value = 0
    _attr_native_max_value = 3600
    _attr_native_step = 1
    _attr_icon = "mdi:timer-outline"
    _default = 120.0

    def __init__(self, hub: ChefTempHub) -> None:
        super().__init__(hub, "timer")

    def _apply_local(self, value: float) -> None:
        self._hub.fan.seconds = int(value)
        super()._apply_local(value)

    @callback
    def _updated(self) -> None:
        self._attr_native_value = self._hub.fan.seconds
        super()._updated()

    async def async_set_native_value(self, value: float) -> None:
        previous = self._hub.fan.seconds
        self._hub.fan.seconds = int(value)
        self._attr_native_value = int(value)
        self.async_write_ha_state()
        try:
            await self._hub.async_send_fan()
        except Exception:
            self._hub.fan.seconds = previous
            self._attr_native_value = previous
            self.async_write_ha_state()
            raise


class DomeLimit(_RememberedNumber):
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    _attr_native_min_value = 0
    _attr_native_max_value = 300
    _attr_native_step = 1
    _attr_icon = "mdi:thermometer-alert"
    _attr_entity_registry_enabled_default = False

    def __init__(self, hub: ChefTempHub, minimum: bool) -> None:
        self._minimum = minimum
        super().__init__(hub, "minimum" if minimum else "maximum")
        self._attr_translation_key = "minimum" if minimum else "maximum"
        self._default = 70.0 if minimum else 150.0

    def _apply_local(self, value: float) -> None:
        if self._minimum:
            self._hub.limit_min_c = int(value)
        else:
            self._hub.limit_max_c = int(value)
        super()._apply_local(value)

    @callback
    def _updated(self) -> None:
        current = self._hub.limit_min_c if self._minimum else self._hub.limit_max_c
        self._attr_native_value = current
        super()._updated()

    async def async_set_native_value(self, value: float) -> None:
        if self._minimum:
            previous = self._hub.limit_min_c
            self._hub.limit_min_c = int(value)
        else:
            previous = self._hub.limit_max_c
            self._hub.limit_max_c = int(value)
        try:
            await self._hub.async_send_limit(self._minimum)
        except Exception:
            if self._minimum:
                self._hub.limit_min_c = previous
            else:
                self._hub.limit_max_c = previous
            raise
        self._attr_native_value = int(value)
        self.async_write_ha_state()
