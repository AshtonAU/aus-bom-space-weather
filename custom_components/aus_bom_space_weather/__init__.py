"""AUS BOM Space Weather integration."""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

from .api import AusBomSpaceWeatherClient
from .const import (
    CONF_K_INDEX_LOCATION,
    CONF_STALE_AFTER_MINUTES,
    CONF_UPDATE_INTERVAL,
    DEFAULT_K_INDEX_LOCATION,
    DEFAULT_STALE_AFTER_MINUTES,
    DEFAULT_UPDATE_INTERVAL_MINUTES,
    DOMAIN,
    FRONTEND_REGISTERED_KEY,
    FRONTEND_URL_PATH,
    HISTORY_VIEW_REGISTERED_KEY,
    PLATFORMS,
    SERVICE_REFRESH,
    SERVICE_FIELD_ENTRY_ID,
    SERVICE_REGISTERED_KEY,
)


async def async_setup(hass, config):
    """Set up integration-wide services."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    _register_services(hass, domain_data)
    return True


async def async_setup_entry(hass, entry):
    """Set up AUS BOM Space Weather from a config entry."""
    from homeassistant.const import CONF_API_KEY
    from homeassistant.helpers.aiohttp_client import async_get_clientsession

    from .coordinator import AusBomSpaceWeatherCoordinator

    domain_data = hass.data.setdefault(DOMAIN, {})
    await _async_register_frontend_path(hass, domain_data)
    _register_history_view(hass, domain_data)
    _register_services(hass, domain_data)

    client = AusBomSpaceWeatherClient(
        async_get_clientsession(hass),
        entry.data[CONF_API_KEY],
    )
    coordinator = AusBomSpaceWeatherCoordinator(
        hass,
        client,
        k_index_location=entry.options.get(CONF_K_INDEX_LOCATION, DEFAULT_K_INDEX_LOCATION),
        update_interval_minutes=entry.options.get(
            CONF_UPDATE_INTERVAL,
            DEFAULT_UPDATE_INTERVAL_MINUTES,
        ),
        stale_after_minutes=entry.options.get(
            CONF_STALE_AFTER_MINUTES,
            DEFAULT_STALE_AFTER_MINUTES,
        ),
    )
    await coordinator.async_config_entry_first_refresh()

    domain_data[entry.entry_id] = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    return True


async def async_unload_entry(hass, entry):
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unload_ok


async def _async_update_listener(hass, entry):
    """Reload on options changes."""
    await hass.config_entries.async_reload(entry.entry_id)


async def _async_register_frontend_path(hass, domain_data):
    """Serve the bundled Lovelace card from the custom integration directory."""
    if domain_data.get(FRONTEND_REGISTERED_KEY):
        return

    www_path = Path(__file__).parent / "www"
    if hasattr(hass.http, "async_register_static_paths"):
        from homeassistant.components.http import StaticPathConfig

        await hass.http.async_register_static_paths(
            [StaticPathConfig(FRONTEND_URL_PATH, str(www_path), True)]
        )
    else:
        hass.http.register_static_path(FRONTEND_URL_PATH, str(www_path), True)

    domain_data[FRONTEND_REGISTERED_KEY] = True


def _register_history_view(hass, domain_data):
    """Register the authenticated history endpoint used by the card."""
    if domain_data.get(HISTORY_VIEW_REGISTERED_KEY):
        return

    from .history import AusBomSpaceWeatherHistoryView

    hass.http.register_view(AusBomSpaceWeatherHistoryView)
    domain_data[HISTORY_VIEW_REGISTERED_KEY] = True


def _register_services(hass, domain_data):
    """Register integration services once."""
    if domain_data.get(SERVICE_REGISTERED_KEY):
        return

    import voluptuous as vol

    async def async_refresh_service(call) -> None:
        """Refresh configured BOM SWS coordinators."""
        entry_id = call.data.get(SERVICE_FIELD_ENTRY_ID)
        coordinators = list(_coordinators_for_refresh(hass.data.get(DOMAIN, {}), entry_id))
        if entry_id and not coordinators:
            from homeassistant.exceptions import HomeAssistantError

            raise HomeAssistantError(f"No AUS BOM Space Weather entry found for entry_id: {entry_id}")
        if coordinators:
            await asyncio.gather(
                *(coordinator.async_request_refresh() for coordinator in coordinators)
            )

    hass.services.async_register(
        DOMAIN,
        SERVICE_REFRESH,
        async_refresh_service,
        schema=vol.Schema({vol.Optional(SERVICE_FIELD_ENTRY_ID): str}),
    )
    domain_data[SERVICE_REGISTERED_KEY] = True


def _coordinators_for_refresh(domain_data: dict[str, Any], entry_id: str | None = None):
    """Yield coordinators selected by an optional config entry id."""
    if entry_id:
        coordinator = domain_data.get(entry_id)
        if hasattr(coordinator, "async_request_refresh"):
            yield coordinator
        return
    yield from _configured_coordinators(domain_data)


def _configured_coordinators(domain_data: dict[str, Any]):
    """Yield configured data coordinators from domain data."""
    for key, value in domain_data.items():
        if str(key).startswith("_"):
            continue
        if hasattr(value, "async_request_refresh"):
            yield value
