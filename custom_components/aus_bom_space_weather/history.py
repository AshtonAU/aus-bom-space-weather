"""Authenticated backend history endpoint for the Lovelace card."""

from __future__ import annotations

from http import HTTPStatus
from typing import Any

from aiohttp import web

from homeassistant.components.http import HomeAssistantView

from .api import AusBomSpaceWeatherApiError
from .const import (
    DEFAULT_HISTORY_WINDOW,
    DOMAIN,
    FRONTEND_URL_PATH,
    HISTORY_VIEW_REGISTERED_KEY,
    MAX_HISTORY_WINDOW,
    SERVICE_FIELD_ENTRY_ID,
)


class AusBomSpaceWeatherHistoryView(HomeAssistantView):
    """Return BOM SWS index history through the Home Assistant backend."""

    url = f"/api{FRONTEND_URL_PATH}/history"
    name = f"api:{DOMAIN}:history"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        """Handle a history request from the card."""
        hass = request.app["hass"]
        entry_id = request.query.get(SERVICE_FIELD_ENTRY_ID)
        coordinator = _coordinator_for_request(hass.data.get(DOMAIN, {}), entry_id)
        if coordinator is None:
            error = (
                f"No AUS BOM Space Weather entry found for entry_id: {entry_id}"
                if entry_id
                else "AUS BOM Space Weather is not configured"
            )
            return web.json_response(
                {"error": error},
                status=HTTPStatus.NOT_FOUND,
        )

        hours = _bounded_hours(request.query.get("hours"))

        try:
            payload = await coordinator.async_get_history_bundle(hours=hours)
        except AusBomSpaceWeatherApiError as exc:
            return web.json_response(
                {"error": str(exc)},
                status=HTTPStatus.BAD_GATEWAY,
            )

        return web.json_response(payload)


def _coordinator_for_request(domain_data: dict[str, Any], entry_id: str | None = None) -> Any | None:
    """Return the requested coordinator, or the first configured coordinator."""
    if entry_id:
        coordinator = domain_data.get(entry_id)
        return coordinator if hasattr(coordinator, "async_get_history_bundle") else None
    return _first_coordinator(domain_data)


def _first_coordinator(domain_data: dict[str, Any]) -> Any | None:
    """Return the first configured data coordinator."""
    for key, value in domain_data.items():
        if key == HISTORY_VIEW_REGISTERED_KEY:
            continue
        if hasattr(value, "async_get_history_bundle"):
            return value
    return None


def _bounded_hours(raw_value: str | None) -> int:
    """Parse and bound requested history hours."""
    try:
        hours = int(raw_value) if raw_value else int(DEFAULT_HISTORY_WINDOW.total_seconds() / 3600)
    except (TypeError, ValueError):
        hours = int(DEFAULT_HISTORY_WINDOW.total_seconds() / 3600)

    max_hours = int(MAX_HISTORY_WINDOW.total_seconds() / 3600)
    return max(1, min(max_hours, hours))
