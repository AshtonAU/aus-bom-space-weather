"""Data coordinator for AUS BOM Space Weather."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import (
    AusBomSpaceWeatherApiError,
    AusBomSpaceWeatherAuthError,
    AusBomSpaceWeatherClient,
)
from .const import DOMAIN, HISTORY_CACHE_TTL
from .history_cache import HistoryBundleCache

_LOGGER = logging.getLogger(__name__)


class AusBomSpaceWeatherCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Coordinate polling from the BOM SWS API."""

    def __init__(
        self,
        hass: HomeAssistant,
        client: AusBomSpaceWeatherClient,
        *,
        k_index_location: str,
        update_interval_minutes: int,
        stale_after_minutes: int,
    ) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(minutes=update_interval_minutes),
        )
        self.client = client
        self.k_index_location = k_index_location
        self.stale_after_minutes = stale_after_minutes
        self._history_cache = HistoryBundleCache(ttl=HISTORY_CACHE_TTL)

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch latest data from BOM SWS."""
        try:
            return await self.client.async_get_latest_bundle(
                k_index_location=self.k_index_location
            )
        except AusBomSpaceWeatherAuthError as exc:
            raise ConfigEntryAuthFailed(str(exc)) from exc
        except AusBomSpaceWeatherApiError as exc:
            raise UpdateFailed(str(exc)) from exc

    async def async_get_history_bundle(self, *, hours: int) -> dict[str, Any]:
        """Return cached historical index data for the Lovelace card."""

        async def fetch_history(start: datetime, end: datetime) -> dict[str, Any]:
            return await self.client.async_get_history_bundle(
                k_index_location=self.k_index_location,
                start=start,
                end=end,
            )

        return await self._history_cache.async_get(hours=hours, fetcher=fetch_history)

    async def async_request_refresh(self) -> None:
        """Refresh current data and force the next history request to refetch."""
        self._history_cache.clear()
        await super().async_request_refresh()
