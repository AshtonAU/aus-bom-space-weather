"""Config entry helpers for AUS BOM Space Weather."""

from __future__ import annotations

import re
from typing import Any

from .const import CONF_K_INDEX_LOCATION, DEFAULT_K_INDEX_LOCATION, DOMAIN, NAME


def entry_title(k_index_location: str) -> str:
    """Return a readable config entry title for one observing location."""
    return f"{NAME} ({k_index_location})"


def device_name(k_index_location: str | None) -> str:
    """Return a readable device registry name for one integration entry."""
    return entry_title(k_index_location or DEFAULT_K_INDEX_LOCATION)


def location_unique_id(k_index_location: str) -> str:
    """Return a stable, non-secret unique id for a K-index observing location."""
    slug = re.sub(r"[^a-z0-9]+", "_", k_index_location.lower()).strip("_")
    return f"{DOMAIN}_{slug or 'default'}"


def entry_location(entry: Any) -> str | None:
    """Return the configured K-index location for a config entry."""
    return (
        entry.options.get(CONF_K_INDEX_LOCATION)
        or entry.data.get(CONF_K_INDEX_LOCATION)
        or DEFAULT_K_INDEX_LOCATION
    )


def configured_locations(hass: Any, *, exclude_entry_id: str | None = None) -> set[str]:
    """Return K-index locations already configured for this integration."""
    entries = hass.config_entries.async_entries(DOMAIN)
    return {
        location
        for entry in entries
        if entry.entry_id != exclude_entry_id
        for location in [entry_location(entry)]
        if location
    }


def location_is_configured(
    hass: Any,
    k_index_location: str,
    *,
    exclude_entry_id: str | None = None,
) -> bool:
    """Return true when another config entry already uses this location."""
    return k_index_location in configured_locations(hass, exclude_entry_id=exclude_entry_id)
