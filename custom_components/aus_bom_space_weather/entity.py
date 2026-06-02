"""Shared entity helpers for AUS BOM Space Weather."""

from __future__ import annotations

from typing import Any

from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import ATTRIBUTION, DOMAIN
from .entry_helpers import device_name


class AusBomSpaceWeatherEntity(CoordinatorEntity):
    """Base entity for AUS BOM Space Weather."""

    _attr_attribution = ATTRIBUTION
    _attr_has_entity_name = True

    def __init__(self, coordinator, config_entry, key: str) -> None:
        super().__init__(coordinator)
        self._config_entry = config_entry
        self._attr_unique_id = f"{config_entry.entry_id}_{key}"

    @property
    def device_info(self) -> dict[str, Any]:
        """Return device information for the BOM SWS service."""
        return {
            "identifiers": {(DOMAIN, self._config_entry.entry_id)},
            "name": device_name(getattr(self.coordinator, "k_index_location", None)),
            "manufacturer": "Australian Bureau of Meteorology",
            "model": "Space Weather Services API",
        }

    @property
    def integration_state_attributes(self) -> dict[str, Any]:
        """Return common attributes used by cards, automations, and diagnostics."""
        return clean_attributes(
            {
                "entry_id": self._config_entry.entry_id,
                "k_index_location": getattr(self.coordinator, "k_index_location", None),
            }
        )

    def with_integration_attributes(self, attributes: dict[str, Any] | None = None) -> dict[str, Any]:
        """Return entity attributes with stable integration metadata attached."""
        merged = clean_attributes(attributes or {})
        merged.update(self.integration_state_attributes)
        return merged


def clean_attributes(value: Any) -> dict[str, Any]:
    """Return a shallow attribute dict with empty values removed."""
    if not isinstance(value, dict):
        return {}
    return {
        key: attr_value
        for key, attr_value in value.items()
        if attr_value is not None and attr_value != ""
    }
