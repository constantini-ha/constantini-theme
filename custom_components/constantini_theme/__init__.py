"""Constantini theme: a light and a dark look, and a sun and moon switch in the sidebar."""
from __future__ import annotations

from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url, remove_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_THEMES_UPDATED
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.loader import async_get_integration
from homeassistant.util.yaml import load_yaml_dict

from .const import (
    DEFAULT_DARK_THEME_KEY,
    DEFAULT_THEME_KEY,
    DOMAIN,
    STOCK_THEME,
    SWITCH_FILE,
    THEME_FILE,
    THEME_NAME,
    THEMES_KEY,
)

HERE = Path(__file__).parent
STATIC_FLAG = f"{DOMAIN}_static"


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    themes = await hass.async_add_executor_job(
        load_yaml_dict, str(HERE / "themes" / THEME_FILE)
    )
    theme = themes[THEME_NAME]

    @callback
    def install(_event: Event | None = None) -> None:
        current = hass.data.setdefault(THEMES_KEY, {})
        # Reloading the YAML themes replaces the whole table, so the theme goes back in.
        if current.get(THEME_NAME) is theme:
            return
        current[THEME_NAME] = theme
        if hass.data.get(DEFAULT_THEME_KEY, STOCK_THEME) == STOCK_THEME:
            hass.data[DEFAULT_THEME_KEY] = THEME_NAME
        if not hass.data.get(DEFAULT_DARK_THEME_KEY):
            hass.data[DEFAULT_DARK_THEME_KEY] = THEME_NAME
        hass.bus.async_fire(EVENT_THEMES_UPDATED)

    install()
    entry.async_on_unload(hass.bus.async_listen(EVENT_THEMES_UPDATED, install))

    integration = await async_get_integration(hass, DOMAIN)
    # Serving under the version keeps a browser from holding on to an old file.
    base = f"/{DOMAIN}/frontend/{integration.version}"
    if not hass.data.get(STATIC_FLAG):
        hass.data[STATIC_FLAG] = True
        await hass.http.async_register_static_paths(
            [StaticPathConfig(base, str(HERE / "frontend"), cache_headers=True)]
        )
    url = f"{base}/{SWITCH_FILE}"
    add_extra_js_url(hass, url)
    entry.async_on_unload(lambda: remove_extra_js_url(hass, url))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.get(THEMES_KEY, {}).pop(THEME_NAME, None)
    if hass.data.get(DEFAULT_THEME_KEY) == THEME_NAME:
        hass.data[DEFAULT_THEME_KEY] = STOCK_THEME
    if hass.data.get(DEFAULT_DARK_THEME_KEY) == THEME_NAME:
        hass.data[DEFAULT_DARK_THEME_KEY] = None
    hass.bus.async_fire(EVENT_THEMES_UPDATED)
    return True
