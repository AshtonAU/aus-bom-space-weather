"""Diagnostics for AUS BOM Space Weather."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from homeassistant.const import CONF_API_KEY
from homeassistant.helpers.device_registry import DeviceEntry
from homeassistant.helpers.redact import async_redact_data

from .api import coerce_number, sanitize_error_message
from .const import DEFAULT_STALE_AFTER_MINUTES, DOMAIN
from .summary import (
    active_alert_details,
    active_alert_keys,
    api_error_codes,
    api_error_details,
    api_error_meanings,
    api_errors,
    aurora_possible,
    aurora_visibility,
    condition_label,
    condition_tone,
    data_age_minutes,
    data_health_label,
    data_is_stale,
    endpoint_health,
    geomagnetic_storm_active,
    latest_source_timestamp,
    source_age_minutes,
    space_weather_severity,
)

TO_REDACT = {
    CONF_API_KEY,
    "apiKey",
    "api-key",
    "authorization",
    "password",
    "secret",
    "token",
    "access_token",
}
MAX_DIAGNOSTIC_STRING_LENGTH = 500


async def async_get_config_entry_diagnostics(hass, config_entry) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    coordinator = hass.data.get(DOMAIN, {}).get(config_entry.entry_id)
    latest_data = getattr(coordinator, "data", None)
    stale_after_minutes = getattr(
        coordinator,
        "stale_after_minutes",
        DEFAULT_STALE_AFTER_MINUTES,
    )
    return {
        "entry": async_redact_data(config_entry.as_dict(), TO_REDACT),
        "coordinator": coordinator_diagnostics(coordinator),
        "health": health_diagnostics(latest_data, stale_after_minutes=stale_after_minutes),
        "payload_shape": payload_shape(latest_data),
        "latest_data": scrub_payload(latest_data),
    }


async def async_get_device_diagnostics(
    hass,
    config_entry,
    device: DeviceEntry,
) -> dict[str, Any]:
    """Return diagnostics for the service device."""
    return await async_get_config_entry_diagnostics(hass, config_entry)


def scrub_payload(payload: Any) -> Any:
    """Remove noisy or sensitive fields from payload diagnostics."""
    if isinstance(payload, dict):
        return {
            key: "REDACTED" if sensitive_key(key) else scrub_payload(value)
            for key, value in payload.items()
        }
    if isinstance(payload, list):
        return [scrub_payload(item) for item in payload]
    if isinstance(payload, str):
        return truncate_diagnostic_string(sanitize_error_message(payload) or payload)
    return payload


def coordinator_diagnostics(coordinator: Any) -> dict[str, Any]:
    """Return coordinator state without exposing client internals."""
    if coordinator is None:
        return {"present": False}

    update_interval = getattr(coordinator, "update_interval", None)
    return {
        "present": True,
        "k_index_location": getattr(coordinator, "k_index_location", None),
        "last_update_success": getattr(coordinator, "last_update_success", None),
        "stale_after_minutes": getattr(
            coordinator,
            "stale_after_minutes",
            DEFAULT_STALE_AFTER_MINUTES,
        ),
        "update_interval_seconds": interval_seconds(update_interval),
    }


def health_diagnostics(
    payload: Any,
    *,
    stale_after_minutes: int | float,
) -> dict[str, Any]:
    """Return computed data-health diagnostics from the latest coordinator payload."""
    data = payload if isinstance(payload, dict) else {}
    errors = api_errors(data)
    endpoints = endpoint_health(data)
    return {
        "data_health": data_health_label(data),
        "fetched_at": data.get("fetched_at"),
        "age_minutes": data_age_minutes(data),
        "latest_source_time": latest_source_timestamp(data),
        "source_age_minutes": source_age_minutes(data),
        "stale": data_is_stale(data, stale_after_minutes=stale_after_minutes),
        "stale_after_minutes": stale_after_minutes,
        "failed_endpoints": sorted(errors),
        "error_count": len(errors),
        "api_error_codes": api_error_codes(data),
        "api_error_meanings": api_error_meanings(data),
        "api_error_details": api_error_details(data),
        "endpoint_status": endpoints,
        "active_alerts": active_alert_keys(data),
        "active_alert_details": active_alert_details(data),
        "condition": {
            "label": condition_label(data),
            "tone": condition_tone(data),
        },
        "severity": space_weather_severity(data),
        "aurora_visibility": aurora_visibility(data),
        "aurora_possible": aurora_possible(data),
        "geomagnetic_storm": geomagnetic_storm_active(data),
        "k_index_location": data.get("k_index_location"),
        "index_values": {
            "a_index": coerce_number((data.get("a_index") or {}).get("index")),
            "k_index": coerce_number((data.get("k_index") or {}).get("index")),
            "dst_index": coerce_number((data.get("dst_index") or {}).get("index")),
        },
    }


def payload_shape(payload: Any) -> Any:
    """Return a compact type/shape summary for the latest payload."""
    if isinstance(payload, dict):
        return {
            str(key): payload_shape(value)
            for key, value in payload.items()
            if not sensitive_key(str(key))
        }
    if isinstance(payload, list):
        return {
            "type": "list",
            "length": len(payload),
            "sample": payload_shape(payload[0]) if payload else None,
        }
    if payload is None:
        return "none"
    return type(payload).__name__


def sensitive_key(key: str) -> bool:
    """Return true for keys that should never appear in diagnostics."""
    lowered = str(key).lower()
    return lowered in {item.lower() for item in TO_REDACT} or "api_key" in lowered


def truncate_diagnostic_string(value: str) -> str:
    """Bound free-text diagnostics so payload downloads stay readable."""
    text = " ".join(str(value).split())
    if len(text) <= MAX_DIAGNOSTIC_STRING_LENGTH:
        return text
    return f"{text[:MAX_DIAGNOSTIC_STRING_LENGTH]}...<truncated>"


def interval_seconds(value: Any) -> int | None:
    """Return a timedelta-like value as whole seconds."""
    if isinstance(value, timedelta):
        return int(value.total_seconds())
    return None
