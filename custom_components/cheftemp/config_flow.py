"""Добавление ProTemp S1."""

from __future__ import annotations

import ipaddress
import re
import selectors
import socket
import time
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.core import HomeAssistant

from .const import DEFAULT_HOST, DEFAULT_PORT, DOMAIN
from .link import wait_for_frame

_MAC = re.compile(r"^[0-9A-F]{12}$")
_HELLO = b"HF-A11ASSISTHREAD"
_UDP_PORT = 48899


def _compact_mac(value: str) -> str:
    return re.sub(r"[^0-9A-Fa-f]", "", value).upper()


def normalize_mac(value: str) -> str:
    compact = _compact_mac(value)
    if not _MAC.match(compact):
        raise ValueError("bad_mac")
    return compact


def _colon_mac(mac: str) -> str:
    compact = _compact_mac(mac)
    if not _MAC.match(compact):
        return mac
    return ":".join(compact[i : i + 2] for i in range(0, 12, 2))


def _iface_targets() -> list[tuple[str, str]]:
    """Адрес интерфейса и его broadcast. Loopback и link-local пропускаем."""
    import ifaddr

    seen: set[str] = set()
    targets: list[tuple[str, str]] = []
    for adapter in ifaddr.get_adapters():
        for ip in adapter.ips:
            raw = ip.ip
            if not isinstance(raw, str):
                continue
            try:
                addr = ipaddress.IPv4Address(raw)
            except ValueError:
                continue
            if addr.is_loopback or addr.is_link_local:
                continue
            net = ipaddress.IPv4Network((addr, int(ip.network_prefix)), strict=False)
            bcast = str(net.broadcast_address)
            key = f"{raw}|{bcast}"
            if key in seen:
                continue
            seen.add(key)
            targets.append((raw, bcast))
    return targets


def _parse_hello(data: bytes) -> tuple[str, str] | None:
    mac = ""
    ip = ""
    for part in data.decode(errors="ignore").split(","):
        part = part.strip()
        compact = _compact_mac(part)
        if _MAC.match(compact) and compact.startswith("74E9D8"):
            mac = compact
        elif re.fullmatch(r"\d{1,3}(?:\.\d{1,3}){3}", part):
            ip = part
    if not mac:
        return None
    return mac, ip


def _scan_blocking(timeout: float) -> dict[str, str]:
    """Hello на broadcast каждого IPv4 интерфейса. На адрес модуля ничего не шлём."""
    found: dict[str, str] = {}
    socks: list[socket.socket] = []
    selector: selectors.DefaultSelector | None = None
    targets = _iface_targets()
    if not targets:
        targets = [("", "255.255.255.255")]
    try:
        for src, bcast in targets:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind((src, 0) if src else ("", 0))
                sock.setblocking(False)
                sock.sendto(_HELLO, (bcast, _UDP_PORT))
            except OSError:
                sock.close()
                continue
            socks.append(sock)
        selector = selectors.DefaultSelector()
        for sock in socks:
            selector.register(sock, selectors.EVENT_READ)
        deadline = time.monotonic() + timeout
        while socks and time.monotonic() < deadline:
            remaining = deadline - time.monotonic()
            events = selector.select(remaining)
            if not events:
                break
            for key, _mask in events:
                sock = key.fileobj
                try:
                    data, _addr = sock.recvfrom(1024)
                except OSError:
                    continue
                parsed = _parse_hello(data)
                if parsed is None:
                    continue
                mac, ip = parsed
                found[mac] = ip
    finally:
        if selector is not None:
            selector.close()
        for sock in socks:
            sock.close()
    return found


def _from_tracker(hass: HomeAssistant) -> dict[str, str]:
    found: dict[str, str] = {}
    for state in hass.states.async_all("device_tracker"):
        attrs = state.attributes
        mac = _compact_mac(str(attrs.get("mac") or attrs.get("mac_address") or ""))
        if _MAC.match(mac) and mac.startswith("74E9D8"):
            found[mac] = str(attrs.get("ip") or attrs.get("ip_address") or "")
    return found


class ChefTempConfigFlow(ConfigFlow, domain=DOMAIN):
    """Поиск гриля в сети или MAC вручную. Брокер один на всех."""

    VERSION = 1

    def __init__(self) -> None:
        self._mac: str | None = None
        self._found: dict[str, str] = {}

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        return self.async_show_menu(
            step_id="user",
            menu_options=["scan", "manual"],
        )

    async def async_step_scan(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            return await self._confirm_mac(str(user_input["mac"]))

        configured = {
            str(entry.data.get("mac", "")).upper()
            for entry in self.hass.config_entries.async_entries(DOMAIN)
        }
        found = await self.hass.async_add_executor_job(_scan_blocking, 3.0)
        if not found:
            found = _from_tracker(self.hass)
        self._found = {mac: ip for mac, ip in found.items() if mac not in configured}
        if not self._found:
            if found:
                return self.async_abort(
                    reason="already_added",
                    description_placeholders={"mac": _colon_mac(next(iter(found)))},
                )
            return self.async_abort(reason="no_devices_found")

        labels = {
            mac: f"{_colon_mac(mac)}  ({ip})" if ip else _colon_mac(mac)
            for mac, ip in sorted(self._found.items())
        }
        return self.async_show_form(
            step_id="scan",
            data_schema=vol.Schema({vol.Required("mac"): vol.In(labels)}),
            description_placeholders={"count": str(len(self._found))},
        )

    async def async_step_manual(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                mac = normalize_mac(str(user_input["mac"]))
            except ValueError:
                errors["base"] = "bad_mac"
            else:
                return await self._confirm_mac(mac, errors)
        return self.async_show_form(
            step_id="manual",
            data_schema=vol.Schema({vol.Required("mac"): str}),
            errors=errors,
        )

    async def async_step_dhcp(self, discovery_info: Any) -> ConfigFlowResult:
        mac = _compact_mac(str(getattr(discovery_info, "macaddress", "")))
        if not (_MAC.match(mac) and mac.startswith("74E9D8")):
            return self.async_abort(reason="not_chefstemp_device")
        await self.async_set_unique_id(mac)
        self._abort_if_unique_id_configured()
        seen = await self._seen(mac)
        if seen is None:
            return self.async_abort(reason="cannot_connect")
        if not seen:
            return self.async_abort(reason="not_chefstemp_device")
        self._mac = mac
        return await self.async_step_discovery_confirm()

    async def async_step_discovery_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            return self._create(self._mac or "")
        return self.async_show_form(
            step_id="discovery_confirm",
            description_placeholders={"mac": _colon_mac(self._mac or "")},
        )

    async def _confirm_mac(
        self, mac: str, errors: dict[str, str] | None = None
    ) -> ConfigFlowResult:
        await self.async_set_unique_id(mac)
        self._abort_if_unique_id_configured()
        seen = await self._seen(mac)
        if seen is None:
            return self.async_show_form(
                step_id="manual",
                data_schema=vol.Schema({vol.Required("mac", default=mac): str}),
                errors={"base": "cannot_connect"},
            )
        if not seen:
            if errors is None:
                return self.async_abort(reason="no_data")
            errors["base"] = "no_data"
            return self.async_show_form(
                step_id="manual",
                data_schema=vol.Schema({vol.Required("mac", default=mac): str}),
                errors=errors,
            )
        self._mac = mac
        return await self.async_step_discovery_confirm()

    async def _seen(self, mac: str) -> bool | None:
        try:
            return await wait_for_frame(DEFAULT_HOST, DEFAULT_PORT, mac)
        except ConnectionError:
            return None

    def _create(self, mac: str) -> ConfigFlowResult:
        return self.async_create_entry(
            title=f"ProTemp S1 {mac[-6:]}",
            data={"mac": mac, "host": DEFAULT_HOST, "port": DEFAULT_PORT},
        )
