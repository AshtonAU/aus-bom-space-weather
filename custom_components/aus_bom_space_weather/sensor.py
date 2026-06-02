"""Sensors for AUS BOM Space Weather."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

from homeassistant.components.sensor import SensorEntity, SensorEntityDescription, SensorStateClass
from homeassistant.const import EntityCategory

from .api import coerce_number
from .const import DEFAULT_STALE_AFTER_MINUTES, DOMAIN
from .entity import AusBomSpaceWeatherEntity, clean_attributes
from .summary import (
    active_alert_details,
    active_alert_keys,
    alert_is_active,
    api_error_codes,
    api_error_details,
    api_error_meanings,
    api_errors,
    aurora_visibility,
    condition_label,
    condition_tone,
    current_aurora_notice,
    data_age_minutes,
    data_health_label,
    data_is_stale,
    endpoint_health,
    g_scale_from_k_index,
    g_scale_label,
    geomagnetic_activity_label,
    index_severity,
    latest_source_timestamp,
    severity_level_label,
    severity_level_tone,
    source_age_minutes,
    space_weather_severity,
)

INDEX_API_METADATA = {
    "a_index": {
        "bom_api_method": "get-a-index",
        "documented_value_type": "integer",
        "documented_value_min": 0,
        "documented_value_max": 400,
        "documented_cadence_minutes": 1440,
        "cadence_source": "valid_time day start",
        "source_time_field": "valid_time",
        "valid_time_meaning": "UTC start of the day to which the A index pertains",
    },
    "k_index": {
        "bom_api_method": "get-k-index",
        "documented_value_type": "integer",
        "documented_value_min": 0,
        "documented_value_max": 9,
        "documented_cadence_minutes": 180,
        "cadence_source": "valid_time three-hour period start",
        "source_time_field": "analysis_time",
        "valid_time_meaning": "UTC start of the 3-hour period to which the K index pertains",
        "analysis_time_meaning": "UTC time when the K index calculation was made",
    },
    "dst_index": {
        "bom_api_method": "get-dst-index",
        "documented_value_type": "unbounded signed integer",
        "likely_value_min": -2000,
        "likely_value_max": 300,
        "example_cadence_minutes": 10,
        "cadence_source": "documented historical examples",
        "source_time_field": "valid_time",
        "valid_time_meaning": "UTC time to which the Dst index pertains",
    },
}


@dataclass(frozen=True, kw_only=True)
class AusBomSensorDescription(SensorEntityDescription):
    """Describes a BOM SWS sensor."""

    source_key: str
    value_fn: Callable[[dict[str, Any] | None], Any]


def index_value(item: dict[str, Any] | None) -> int | float | None:
    """Return the numeric BOM index value."""
    if not item:
        return None
    return coerce_number(item.get("index"))


def index_source_time(index_key: str, source: dict[str, Any] | None) -> Any:
    """Return the preferred source timestamp for one index payload."""
    if not source:
        return None
    if index_key == "k_index":
        return source.get("analysis_time") or source.get("valid_time")
    return source.get("valid_time")


INDEX_SENSORS = (
    AusBomSensorDescription(
        key="a_index",
        translation_key="a_index",
        source_key="a_index",
        icon="mdi:alpha-a-box-outline",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=index_value,
    ),
    AusBomSensorDescription(
        key="k_index",
        translation_key="k_index",
        source_key="k_index",
        icon="mdi:alpha-k-box-outline",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=index_value,
    ),
    AusBomSensorDescription(
        key="dst_index",
        translation_key="dst_index",
        source_key="dst_index",
        icon="mdi:magnet",
        native_unit_of_measurement="nT",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=index_value,
    ),
)

async def async_setup_entry(hass, config_entry, async_add_entities):
    """Set up AUS BOM Space Weather sensors."""
    coordinator = hass.data[DOMAIN][config_entry.entry_id]
    async_add_entities(
        [AusBomIndexSensor(coordinator, config_entry, description) for description in INDEX_SENSORS]
        + [
            AusBomConditionSensor(coordinator, config_entry),
            AusBomSeverityLevelSensor(coordinator, config_entry),
            AusBomGeomagneticActivitySensor(coordinator, config_entry),
            AusBomAuroraNoticeSensor(coordinator, config_entry),
            AusBomAuroraVisibilitySensor(coordinator, config_entry),
            AusBomAuroraKIndexSensor(coordinator, config_entry),
            AusBomAuroraLatitudeBandSensor(coordinator, config_entry),
            AusBomMagneticStormScaleSensor(coordinator, config_entry),
            AusBomActiveAlertCountSensor(coordinator, config_entry),
            AusBomApiErrorCountSensor(coordinator, config_entry),
            AusBomEndpointStatusSensor(coordinator, config_entry),
            AusBomDataAgeSensor(coordinator, config_entry),
            AusBomDataHealthSensor(coordinator, config_entry),
        ]
    )


class AusBomIndexSensor(AusBomSpaceWeatherEntity, SensorEntity):
    """Sensor for a numeric BOM SWS index."""

    entity_description: AusBomSensorDescription

    def __init__(self, coordinator, config_entry, description: AusBomSensorDescription) -> None:
        super().__init__(coordinator, config_entry, description.key)
        self.entity_description = description

    @property
    def native_value(self) -> int | float | None:
        """Return the current index value."""
        return self.entity_description.value_fn(self._source)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return useful BOM metadata as attributes."""
        attributes = clean_attributes(self._source)
        attributes.update(INDEX_API_METADATA.get(self.entity_description.key, {}))
        source_time = index_source_time(self.entity_description.key, self._source)
        if source_time:
            attributes["source_time"] = source_time
        attributes.update(index_severity(self.entity_description.key, self.native_value))
        attributes["fetched_at"] = self.coordinator.data.get("fetched_at")
        if self.entity_description.key == "k_index":
            attributes["location"] = self.coordinator.data.get("k_index_location")
        return self.with_integration_attributes(attributes)

    @property
    def _source(self) -> dict[str, Any] | None:
        """Return the source object for this sensor."""
        value = self.coordinator.data.get(self.entity_description.source_key)
        return value if isinstance(value, dict) else None


class AusBomGeomagneticActivitySensor(AusBomSpaceWeatherEntity, SensorEntity):
    """Derived human-readable geomagnetic activity sensor."""

    _attr_translation_key = "geomagnetic_activity"
    _attr_icon = "mdi:weather-lightning"

    def __init__(self, coordinator, config_entry) -> None:
        super().__init__(coordinator, config_entry, "geomagnetic_activity")

    @property
    def native_value(self) -> str | None:
        """Return a plain activity label from the current K index."""
        k_value = coerce_number((self.coordinator.data.get("k_index") or {}).get("index"))
        return geomagnetic_activity_label(k_value)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the numeric K index and configured observing location."""
        k_value = coerce_number((self.coordinator.data.get("k_index") or {}).get("index"))
        return self.with_integration_attributes({
            "k_index": k_value,
            "location": self.coordinator.data.get("k_index_location"),
            "fetched_at": self.coordinator.data.get("fetched_at"),
        })


class AusBomConditionSensor(AusBomSpaceWeatherEntity, SensorEntity):
    """Overall condition sensor for dashboards, automations, and card health."""

    _attr_translation_key = "condition"
    _attr_icon = "mdi:weather-sunny-alert"

    def __init__(self, coordinator, config_entry) -> None:
        super().__init__(coordinator, config_entry, "condition")

    @property
    def native_value(self) -> str:
        """Return the highest-priority condition label."""
        return condition_label(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return current condition metadata and partial API failure details."""
        errors = api_errors(self.coordinator.data)
        active = active_alert_keys(self.coordinator.data)
        return self.with_integration_attributes({
            "tone": condition_tone(self.coordinator.data),
            "active_alerts": active,
            "active_alert_details": active_alert_details(self.coordinator.data),
            "active_alert_count": len(active),
            "failed_endpoints": sorted(errors),
            "error_count": len(errors),
            "api_errors": errors,
            "api_error_codes": api_error_codes(self.coordinator.data),
            "api_error_meanings": api_error_meanings(self.coordinator.data),
            "api_error_details": api_error_details(self.coordinator.data),
            "k_index": coerce_number((self.coordinator.data.get("k_index") or {}).get("index")),
            "a_index": coerce_number((self.coordinator.data.get("a_index") or {}).get("index")),
            "dst_index": coerce_number((self.coordinator.data.get("dst_index") or {}).get("index")),
            "location": self.coordinator.data.get("k_index_location"),
            "fetched_at": self.coordinator.data.get("fetched_at"),
        })


class AusBomSeverityLevelSensor(AusBomSpaceWeatherEntity, SensorEntity):
    """Normalized 0-5 severity sensor for automations and custom dashboards."""

    _attr_translation_key = "severity_level"
    _attr_icon = "mdi:gauge"
    _attr_native_unit_of_measurement = "level"

    def __init__(self, coordinator, config_entry) -> None:
        super().__init__(coordinator, config_entry, "severity_level")

    @property
    def native_value(self) -> int | None:
        """Return the highest normalized current severity level."""
        level = space_weather_severity(self.coordinator.data).get("level")
        return int(level) if level is not None else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return normalized severity metadata and source contributors."""
        severity = space_weather_severity(self.coordinator.data)
        level = severity.get("level")
        return self.with_integration_attributes({
            "severity_label": severity.get("label") or severity_level_label(level),
            "tone": severity.get("tone") or severity_level_tone(level),
            "source": severity.get("source"),
            "source_key": severity.get("source_key"),
            "contributors": severity.get("contributors", []),
            "active_alerts": active_alert_keys(self.coordinator.data),
            "k_index": coerce_number((self.coordinator.data.get("k_index") or {}).get("index")),
            "a_index": coerce_number((self.coordinator.data.get("a_index") or {}).get("index")),
            "dst_index": coerce_number((self.coordinator.data.get("dst_index") or {}).get("index")),
            "location": self.coordinator.data.get("k_index_location"),
            "fetched_at": self.coordinator.data.get("fetched_at"),
        })


class AusBomAuroraNoticeSensor(AusBomSpaceWeatherEntity, SensorEntity):
    """Sensor showing the highest-priority current aurora notice type."""

    _attr_translation_key = "aurora_notice"
    _attr_icon = "mdi:weather-night"

    def __init__(self, coordinator, config_entry) -> None:
        super().__init__(coordinator, config_entry, "aurora_notice")

    @property
    def native_value(self) -> str:
        """Return alert, watch, outlook, or none."""
        notice_type, _notice = current_aurora_notice(self.coordinator.data)
        return notice_type or "none"

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the active aurora notice payload."""
        notice_type, notice = current_aurora_notice(self.coordinator.data)
        attributes = clean_attributes(notice)
        attributes["notice_type"] = notice_type or "none"
        attributes["fetched_at"] = self.coordinator.data.get("fetched_at")
        return self.with_integration_attributes(attributes)


class AusBomAuroraVisibilitySensor(AusBomSpaceWeatherEntity, SensorEntity):
    """Sensor showing a compact aurora viewing recommendation."""

    _attr_translation_key = "aurora_visibility"
    _attr_icon = "mdi:weather-night"

    def __init__(self, coordinator, config_entry) -> None:
        super().__init__(coordinator, config_entry, "aurora_visibility")

    @property
    def native_value(self) -> str:
        """Return none, low, possible, or likely."""
        return str(aurora_visibility(self.coordinator.data)["state"])

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return visibility recommendation details."""
        visibility = aurora_visibility(self.coordinator.data)
        return self.with_integration_attributes({
            "level": visibility.get("level"),
            "label": visibility.get("label"),
            "tone": visibility.get("tone"),
            "source": visibility.get("source"),
            "source_key": visibility.get("source_key"),
            "notice_type": visibility.get("notice_type"),
            "k_aus": visibility.get("k_aus"),
            "lat_band": visibility.get("lat_band"),
            "summary": visibility.get("summary"),
            "k_index": visibility.get("k_index")
            or coerce_number((self.coordinator.data.get("k_index") or {}).get("index")),
            "location": self.coordinator.data.get("k_index_location"),
            "fetched_at": self.coordinator.data.get("fetched_at"),
        })


class AusBomAuroraKIndexSensor(AusBomSpaceWeatherEntity, SensorEntity):
    """Sensor for the current or forecast aurora K-Aus value."""

    _attr_translation_key = "aurora_k_aus"
    _attr_icon = "mdi:alpha-k-circle-outline"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator, config_entry) -> None:
        super().__init__(coordinator, config_entry, "aurora_k_aus")

    @property
    def native_value(self) -> int | float | None:
        """Return K-Aus from the highest priority aurora notice."""
        _notice_type, notice = current_aurora_notice(self.coordinator.data)
        return coerce_number((notice or {}).get("k_aus"))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return source metadata for the aurora K-Aus value."""
        notice_type, notice = current_aurora_notice(self.coordinator.data)
        return self.with_integration_attributes(
            {
                "notice_type": notice_type or "none",
                "source_key": notice_type and f"aurora_{notice_type}",
                "lat_band": (notice or {}).get("lat_band"),
                "fetched_at": self.coordinator.data.get("fetched_at"),
            }
        )


class AusBomAuroraLatitudeBandSensor(AusBomSpaceWeatherEntity, SensorEntity):
    """Sensor for the current or forecast aurora visibility latitude band."""

    _attr_translation_key = "aurora_latitude_band"
    _attr_icon = "mdi:latitude"

    def __init__(self, coordinator, config_entry) -> None:
        super().__init__(coordinator, config_entry, "aurora_latitude_band")

    @property
    def native_value(self) -> str:
        """Return the BOM latitude band for aurora visibility."""
        _notice_type, notice = current_aurora_notice(self.coordinator.data)
        return str((notice or {}).get("lat_band") or "none")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return source metadata for the aurora latitude band."""
        notice_type, notice = current_aurora_notice(self.coordinator.data)
        return self.with_integration_attributes(
            {
                "notice_type": notice_type or "none",
                "source_key": notice_type and f"aurora_{notice_type}",
                "k_aus": (notice or {}).get("k_aus"),
                "fetched_at": self.coordinator.data.get("fetched_at"),
            }
        )


class AusBomMagneticStormScaleSensor(AusBomSpaceWeatherEntity, SensorEntity):
    """Sensor for the current magnetic storm G scale."""

    _attr_translation_key = "magnetic_storm_scale"
    _attr_icon = "mdi:weather-lightning-rainy"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator, config_entry) -> None:
        super().__init__(coordinator, config_entry, "magnetic_storm_scale")

    @property
    def native_value(self) -> int | float | None:
        """Return an active alert G scale, falling back to K-index-derived scale."""
        alert_scale = coerce_number((self._active_magnetic_alert or {}).get("g_scale"))
        if alert_scale is not None:
            return alert_scale
        return g_scale_from_k_index(self._k_index)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return magnetic storm scale details."""
        alert_scale = coerce_number((self._active_magnetic_alert or {}).get("g_scale"))
        scale = self.native_value
        attributes = clean_attributes(self._active_magnetic_alert)
        scale_source = (
            "magnetic_alert"
            if alert_scale is not None
            else "k_index"
            if self._k_index is not None
            else "unknown"
        )
        attributes.update(
            {
                "scale_label": g_scale_label(scale),
                "scale_source": scale_source,
                "derived_from_k_index": alert_scale is None and self._k_index is not None,
                "k_index": self._k_index,
                "location": self.coordinator.data.get("k_index_location"),
            }
        )
        attributes["fetched_at"] = self.coordinator.data.get("fetched_at")
        return self.with_integration_attributes(attributes)

    @property
    def _active_magnetic_alert(self) -> dict[str, Any] | None:
        """Return the current active magnetic alert payload."""
        alert = self.coordinator.data.get("magnetic_alert")
        return alert if alert_is_active(alert) else None

    @property
    def _k_index(self) -> int | float | None:
        """Return the current K index."""
        return coerce_number((self.coordinator.data.get("k_index") or {}).get("index"))


class AusBomActiveAlertCountSensor(AusBomSpaceWeatherEntity, SensorEntity):
    """Sensor for the number of active BOM alert/watch/outlook payloads."""

    _attr_translation_key = "active_alert_count"
    _attr_icon = "mdi:alert-circle-outline"
    _attr_native_unit_of_measurement = "alerts"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator, config_entry) -> None:
        super().__init__(coordinator, config_entry, "active_alert_count")

    @property
    def native_value(self) -> int:
        """Return the active alert count."""
        return len(active_alert_keys(self.coordinator.data))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return active alert metadata."""
        return self.with_integration_attributes({
            "active_alerts": active_alert_keys(self.coordinator.data),
            "active_alert_details": active_alert_details(self.coordinator.data),
            "fetched_at": self.coordinator.data.get("fetched_at"),
        })


class AusBomApiErrorCountSensor(AusBomSpaceWeatherEntity, SensorEntity):
    """Diagnostic sensor for partial BOM endpoint failures."""

    _attr_translation_key = "api_error_count"
    _attr_icon = "mdi:cloud-alert-outline"
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_native_unit_of_measurement = "endpoints"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator, config_entry) -> None:
        super().__init__(coordinator, config_entry, "api_error_count")

    @property
    def native_value(self) -> int:
        """Return the number of failed endpoints in the latest partial refresh."""
        return len(api_errors(self.coordinator.data))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return failed endpoint details."""
        errors = api_errors(self.coordinator.data)
        return self.with_integration_attributes({
            "failed_endpoints": sorted(errors),
            "api_errors": errors,
            "api_error_codes": api_error_codes(self.coordinator.data),
            "api_error_meanings": api_error_meanings(self.coordinator.data),
            "api_error_details": api_error_details(self.coordinator.data),
            "fetched_at": self.coordinator.data.get("fetched_at"),
        })


class AusBomEndpointStatusSensor(AusBomSpaceWeatherEntity, SensorEntity):
    """Diagnostic sensor for current API endpoint health."""

    _attr_translation_key = "endpoint_status"
    _attr_icon = "mdi:api"
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator, config_entry) -> None:
        super().__init__(coordinator, config_entry, "endpoint_status")

    @property
    def native_value(self) -> str:
        """Return ok, partial, failed, or unknown."""
        return str(endpoint_health(self.coordinator.data)["state"])

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return endpoint-level API health details."""
        health = endpoint_health(self.coordinator.data)
        return self.with_integration_attributes({
            "total_count": health["total_count"],
            "ok_count": health["ok_count"],
            "failed_count": health["failed_count"],
            "empty_count": health["empty_count"],
            "failed_endpoints": health["failed_endpoints"],
            "empty_endpoints": health["empty_endpoints"],
            "endpoints": health["endpoints"],
            "fetched_at": self.coordinator.data.get("fetched_at"),
        })


class AusBomDataHealthSensor(AusBomSpaceWeatherEntity, SensorEntity):
    """Diagnostic sensor for overall integration data health."""

    _attr_translation_key = "data_health"
    _attr_icon = "mdi:cloud-check-outline"
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator, config_entry) -> None:
        super().__init__(coordinator, config_entry, "data_health")

    @property
    def native_value(self) -> str:
        """Return ok, partial, or unknown."""
        return data_health_label(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return health details useful for dashboards and diagnostics."""
        errors = api_errors(self.coordinator.data)
        stale_after_minutes = getattr(
            self.coordinator,
            "stale_after_minutes",
            DEFAULT_STALE_AFTER_MINUTES,
        )
        return self.with_integration_attributes({
            "failed_endpoints": sorted(errors),
            "error_count": len(errors),
            "api_error_codes": api_error_codes(self.coordinator.data),
            "api_error_meanings": api_error_meanings(self.coordinator.data),
            "api_error_details": api_error_details(self.coordinator.data),
            "active_alert_count": len(active_alert_keys(self.coordinator.data)),
            "age_minutes": data_age_minutes(self.coordinator.data),
            "source_age_minutes": source_age_minutes(self.coordinator.data),
            "latest_source_time": latest_source_timestamp(self.coordinator.data),
            "stale": data_is_stale(
                self.coordinator.data,
                stale_after_minutes=stale_after_minutes,
            ),
            "stale_after_minutes": stale_after_minutes,
            "last_success": getattr(self.coordinator, "last_update_success", None),
            "fetched_at": self.coordinator.data.get("fetched_at"),
        })


class AusBomDataAgeSensor(AusBomSpaceWeatherEntity, SensorEntity):
    """Diagnostic sensor for age of the latest successful BOM bundle."""

    _attr_translation_key = "data_age"
    _attr_icon = "mdi:clock-outline"
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_native_unit_of_measurement = "min"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator, config_entry) -> None:
        super().__init__(coordinator, config_entry, "data_age")

    @property
    def native_value(self) -> int | None:
        """Return the age in whole minutes since the latest successful bundle fetch."""
        return data_age_minutes(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return freshness metadata useful for automations."""
        stale_after_minutes = getattr(
            self.coordinator,
            "stale_after_minutes",
            DEFAULT_STALE_AFTER_MINUTES,
        )
        return self.with_integration_attributes({
            "stale": data_is_stale(
                self.coordinator.data,
                stale_after_minutes=stale_after_minutes,
            ),
            "stale_after_minutes": stale_after_minutes,
            "source_age_minutes": source_age_minutes(self.coordinator.data),
            "latest_source_time": latest_source_timestamp(self.coordinator.data),
            "last_success": getattr(self.coordinator, "last_update_success", None),
            "fetched_at": self.coordinator.data.get("fetched_at"),
        })
