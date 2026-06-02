"""Config flow for AUS BOM Space Weather."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.const import CONF_API_KEY
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import (
    AusBomSpaceWeatherApiError,
    AusBomSpaceWeatherAuthError,
    AusBomSpaceWeatherClient,
    auth_error_reason,
)
from .const import (
    CONF_K_INDEX_LOCATION,
    CONF_STALE_AFTER_MINUTES,
    CONF_UPDATE_INTERVAL,
    DEFAULT_K_INDEX_LOCATION,
    DEFAULT_STALE_AFTER_MINUTES,
    DEFAULT_UPDATE_INTERVAL_MINUTES,
    DOMAIN,
    K_INDEX_LOCATIONS,
)
from .entry_helpers import entry_title, location_is_configured, location_unique_id


class AusBomSpaceWeatherConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle an AUS BOM Space Weather config flow."""

    VERSION = 1

    def __init__(self) -> None:
        """Initialise flow state."""
        self._reauth_entry = None

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        """Handle the initial step."""
        errors: dict[str, str] = {}
        if user_input is not None:
            k_index_location = user_input[CONF_K_INDEX_LOCATION]
            await self.async_set_unique_id(location_unique_id(k_index_location))
            if location_is_configured(self.hass, k_index_location):
                errors[CONF_K_INDEX_LOCATION] = "already_configured"
            else:
                self._abort_if_unique_id_configured()

                try:
                    await self._async_validate_api_key(user_input[CONF_API_KEY])
                except AusBomSpaceWeatherAuthError as exc:
                    errors["base"] = auth_error_reason(exc)
                except AusBomSpaceWeatherApiError:
                    errors["base"] = "cannot_connect"
                except Exception:  # noqa: BLE001 - Home Assistant config flows surface unknown failures.
                    errors["base"] = "unknown"
                else:
                    return self.async_create_entry(
                        title=entry_title(k_index_location),
                        data={CONF_API_KEY: user_input[CONF_API_KEY].strip()},
                        options={
                            CONF_K_INDEX_LOCATION: k_index_location,
                            CONF_UPDATE_INTERVAL: DEFAULT_UPDATE_INTERVAL_MINUTES,
                            CONF_STALE_AFTER_MINUTES: DEFAULT_STALE_AFTER_MINUTES,
                        },
                    )

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_API_KEY): str,
                    vol.Required(
                        CONF_K_INDEX_LOCATION,
                        default=DEFAULT_K_INDEX_LOCATION,
                    ): vol.In(K_INDEX_LOCATIONS),
                }
            ),
            errors=errors,
        )

    async def async_step_reauth(self, entry_data: dict[str, Any]):
        """Handle reauthentication when the stored API key is rejected."""
        entry_id = self.context.get("entry_id")
        self._reauth_entry = (
            self.hass.config_entries.async_get_entry(entry_id) if entry_id else None
        )
        if self._reauth_entry is None:
            return self.async_abort(reason="reauth_entry_missing")

        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(self, user_input: dict[str, Any] | None = None):
        """Ask the user for a replacement BOM SWS API key."""
        errors: dict[str, str] = {}
        if user_input is not None:
            api_key = user_input[CONF_API_KEY].strip()
            try:
                await self._async_validate_api_key(api_key)
            except AusBomSpaceWeatherAuthError as exc:
                errors["base"] = auth_error_reason(exc)
            except AusBomSpaceWeatherApiError:
                errors["base"] = "cannot_connect"
            except Exception:  # noqa: BLE001 - Home Assistant config flows surface unknown failures.
                errors["base"] = "unknown"
            else:
                return self.async_update_reload_and_abort(
                    self._reauth_entry,
                    data_updates={CONF_API_KEY: api_key},
                )

        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=vol.Schema({vol.Required(CONF_API_KEY): str}),
            errors=errors,
        )

    async def _async_validate_api_key(self, api_key: str) -> None:
        """Validate the API key before storing the entry."""
        client = AusBomSpaceWeatherClient(async_get_clientsession(self.hass), api_key)
        await client.async_validate()

    @staticmethod
    def async_get_options_flow(config_entry):
        """Return the options flow."""
        return AusBomSpaceWeatherOptionsFlow(config_entry)


class AusBomSpaceWeatherOptionsFlow(config_entries.OptionsFlow):
    """Handle AUS BOM Space Weather options."""

    def __init__(self, config_entry) -> None:
        self._config_entry = config_entry

    async def async_step_init(self, user_input: dict[str, Any] | None = None):
        """Manage integration options."""
        errors: dict[str, str] = {}
        if user_input is not None:
            k_index_location = user_input[CONF_K_INDEX_LOCATION]
            if location_is_configured(
                self.hass,
                k_index_location,
                exclude_entry_id=self._config_entry.entry_id,
            ):
                errors[CONF_K_INDEX_LOCATION] = "already_configured"
            else:
                self.hass.config_entries.async_update_entry(
                    self._config_entry,
                    title=entry_title(k_index_location),
                )
                return self.async_create_entry(title="", data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_K_INDEX_LOCATION,
                        default=self._config_entry.options.get(
                            CONF_K_INDEX_LOCATION,
                            DEFAULT_K_INDEX_LOCATION,
                        ),
                    ): vol.In(K_INDEX_LOCATIONS),
                    vol.Required(
                        CONF_UPDATE_INTERVAL,
                        default=self._config_entry.options.get(
                            CONF_UPDATE_INTERVAL,
                            DEFAULT_UPDATE_INTERVAL_MINUTES,
                        ),
                    ): vol.All(vol.Coerce(int), vol.Range(min=5, max=180)),
                    vol.Required(
                        CONF_STALE_AFTER_MINUTES,
                        default=self._config_entry.options.get(
                            CONF_STALE_AFTER_MINUTES,
                            DEFAULT_STALE_AFTER_MINUTES,
                        ),
                    ): vol.All(vol.Coerce(int), vol.Range(min=15, max=1440)),
                }
            ),
            errors=errors,
        )
