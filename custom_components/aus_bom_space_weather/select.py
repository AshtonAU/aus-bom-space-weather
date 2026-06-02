"""Select entities for AUS BOM Space Weather."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.exceptions import HomeAssistantError

from .const import CONF_K_INDEX_LOCATION, DOMAIN, K_INDEX_LOCATIONS
from .entry_helpers import entry_title, location_is_configured
from .entity import AusBomSpaceWeatherEntity


async def async_setup_entry(hass, config_entry, async_add_entities):
    """Set up AUS BOM Space Weather selects."""
    coordinator = hass.data[DOMAIN][config_entry.entry_id]
    async_add_entities([AusBomKIndexLocationSelect(coordinator, config_entry)])


class AusBomKIndexLocationSelect(AusBomSpaceWeatherEntity, SelectEntity):
    """Select the BOM SWS K-index observing location."""

    _attr_translation_key = "k_index_location"
    _attr_icon = "mdi:map-marker-radius-outline"
    _attr_options = list(K_INDEX_LOCATIONS)

    def __init__(self, coordinator, config_entry) -> None:
        super().__init__(coordinator, config_entry, "k_index_location")

    @property
    def current_option(self) -> str:
        """Return the current K-index location."""
        return self.coordinator.k_index_location

    @property
    def extra_state_attributes(self) -> dict[str, object]:
        """Return integration metadata for dashboard auto-discovery."""
        return self.with_integration_attributes()

    async def async_select_option(self, option: str) -> None:
        """Persist and apply a new K-index observing location."""
        if option not in K_INDEX_LOCATIONS:
            raise HomeAssistantError(f"Unsupported K-index location: {option}")
        if option == self.coordinator.k_index_location:
            return
        if location_is_configured(self.hass, option, exclude_entry_id=self._config_entry.entry_id):
            raise HomeAssistantError(f"K-index location already configured: {option}")

        options = dict(self._config_entry.options)
        options[CONF_K_INDEX_LOCATION] = option
        self.hass.config_entries.async_update_entry(
            self._config_entry,
            title=entry_title(option),
            options=options,
        )
        self.coordinator.k_index_location = option
        await self.coordinator.async_request_refresh()
