"""Сигнализация купола. Режим вентилятора — список, не выключатель."""

from __future__ import annotations

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from . import ChefTempHub


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    hub: ChefTempHub = entry.runtime_data
    async_add_entities([DomeAlarm(hub)])


class _RememberedSwitch(SwitchEntity, RestoreEntity):
    _attr_should_poll = False
    _attr_has_entity_name = True
    _default = False

    def __init__(self, hub: ChefTempHub, key: str) -> None:
        self._hub = hub
        self._attr_unique_id = f"{hub.mac}_{key}"
        self._attr_device_info = hub.device_info

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_state()
        if last and last.state in {"on", "off"}:
            self._apply_local(last.state == "on")
        else:
            self._apply_local(self._default)
        self.async_on_remove(self._hub.listen(self._updated))

    def _apply_local(self, value: bool) -> None:
        self._attr_is_on = value

    @callback
    def _updated(self) -> None:
        self.async_write_ha_state()


class DomeAlarm(_RememberedSwitch):
    """Выключатель сигнализации купола."""

    _attr_translation_key = "alarm"
    _attr_icon = "mdi:bell-alert-outline"
    _attr_entity_registry_enabled_default = False
    _default = True

    def __init__(self, hub: ChefTempHub) -> None:
        super().__init__(hub, "alarm")

    def _apply_local(self, value: bool) -> None:
        self._hub.alarm = value
        super()._apply_local(value)

    @callback
    def _updated(self) -> None:
        self._attr_is_on = self._hub.alarm
        super()._updated()

    async def _set(self, value: bool) -> None:
        previous = self._hub.alarm
        self._hub.alarm = value
        try:
            await self._hub.async_send_alarm()
        except Exception:
            self._hub.alarm = previous
            raise
        self._attr_is_on = value
        self.async_write_ha_state()

    async def async_turn_on(self, **kwargs: object) -> None:
        await self._set(True)

    async def async_turn_off(self, **kwargs: object) -> None:
        await self._set(False)
