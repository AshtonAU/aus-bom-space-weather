"""Button entities for AUS BOM Space Weather."""

from __future__ import annotations

from typing import Any

from homeassistant.components.button import ButtonEntity, ButtonEntityDescription

from .const import DOMAIN
from .entity import AusBomSpaceWeatherEntity


BUTTONS = (
    ButtonEntityDescription(
        key="refresh",
        translation_key="refresh",
        icon="mdi:refresh",
    ),
)


async def async_setup_entry(hass, config_entry, async_add_entities):
    """Set up AUS BOM Space Weather buttons."""
    coordinator = hass.data[DOMAIN][config_entry.entry_id]
    async_add_entities(
        [AusBomRefreshButton(coordinator, config_entry, description) for description in BUTTONS]
    )


class AusBomRefreshButton(AusBomSpaceWeatherEntity, ButtonEntity):
    """Button that refreshes BOM SWS data on demand."""

    entity_description: ButtonEntityDescription

    def __init__(
        self,
        coordinator,
        config_entry,
        description: ButtonEntityDescription,
    ) -> None:
        super().__init__(coordinator, config_entry, description.key)
        self.entity_description = description

    async def async_press(self) -> None:
        """Request an immediate coordinator refresh."""
        await self.coordinator.async_request_refresh()

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return current refresh metadata."""
        return self.with_integration_attributes({
            "last_success": getattr(self.coordinator, "last_update_success", None),
            "fetched_at": self.coordinator.data.get("fetched_at"),
        })
