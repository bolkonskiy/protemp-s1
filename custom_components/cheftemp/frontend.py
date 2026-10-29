"""Карточка Lovelace едет вместе с интеграцией."""

from __future__ import annotations

from pathlib import Path

from homeassistant.core import HomeAssistant

from .const import DOMAIN, VERSION

_FLAG = f"{DOMAIN}_frontend"


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Раздать www/ и подключить JS без ручного Lovelace resource."""
    if hass.data.get(_FLAG):
        return
    hass.data[_FLAG] = True
    www = Path(__file__).parent / "www"
    url = f"/{DOMAIN}/protemp-s1-card.js?v={VERSION}"
    try:
        from homeassistant.components.http import StaticPathConfig

        await hass.http.async_register_static_paths(
            [StaticPathConfig(f"/{DOMAIN}", www, False)]
        )
    except (ImportError, AttributeError):
        hass.http.register_static_path(f"/{DOMAIN}", str(www), False)
    from homeassistant.components.frontend import add_extra_js_url

    add_extra_js_url(hass, url)
