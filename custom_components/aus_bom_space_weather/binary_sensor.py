"""Binary sensors for AUS BOM Space Weather alerts."""

from __future__ import annotations

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
    BinarySensorEntityDescription,
)
from homeassistant.const import EntityCategory

from .api import coerce_number
from .const import DEFAULT_STALE_AFTER_MINUTES, DOMAIN
from .entity import AusBomSpaceWeatherEntity, clean_attributes
from .summary import (
    active_alert_keys,
    alert_is_active,
    alert_metadata,
    aurora_possible,
    aurora_visibility,
    data_age_minutes,
    data_is_stale,
    g_scale_from_k_index,
    geomagnetic_storm_active,
    latest_source_timestamp,
    source_age_minutes,
    space_weather_severity,
)


ALERT_SENSORS = (
    BinarySensorEntityDescription(
        key="magnetic_alert",
        translation_key="magnetic_alert",
        device_class=BinarySensorDeviceClass.PROBLEM,
        icon="mdi:magnet-on",
    ),
    BinarySensorEntityDescription(
        key="magnetic_warning",
        translation_key="magnetic_warning",
        device_class=BinarySensorDeviceClass.PROBLEM,
        icon="mdi:alert-outline",
    ),
    BinarySensorEntityDescription(
        key="aurora_alert",
        translation_key="aurora_alert",
        device_class=BinarySensorDeviceClass.PROBLEM,
        icon="mdi:weather-night",
    ),
    BinarySensorEntityDescription(
        key="aurora_watch",
        translation_key="aurora_watch",
        device_class=BinarySensorDeviceClass.PROBLEM,
        icon="mdi:eye-outline",
    ),
    BinarySensorEntityDescription(
        key="aurora_outlook",
        translation_key="aurora_outlook",
        device_class=BinarySensorDeviceClass.PROBLEM,
        icon="mdi:calendar-search",
    ),
)

DERIVED_BINARY_SENSORS = (
    BinarySensorEntityDescription(
        key="aurora_possible",
        translation_key="aurora_possible",
        icon="mdi:weather-night",
    ),
    BinarySensorEntityDescription(
        key="geomagnetic_storm",
        translation_key="geomagnetic_storm",
        icon="mdi:weather-lightning-rainy",
        device_class=BinarySensorDeviceClass.PROBLEM,
    ),
    BinarySensorEntityDescription(
        key="data_stale",
        translation_key="data_stale",
        icon="mdi:clock-alert-outline",
        device_class=BinarySensorDeviceClass.PROBLEM,
        entity_category=EntityCategory.DIAGNOSTIC,
    ),
)


async def async_setup_entry(hass, config_entry, async_add_entities):
    """Set up AUS BOM Space Weather binary sensors."""
    coordinator = hass.data[DOMAIN][config_entry.entry_id]
    async_add_entities(
        [
            AusBomAlertBinarySensor(coordinator, config_entry, description)
            for description in ALERT_SENSORS
        ]
        + [
            AusBomDerivedBinarySensor(coordinator, config_entry, description)
            for description in DERIVED_BINARY_SENSORS
        ]
    )


class AusBomAlertBinarySensor(AusBomSpaceWeatherEntity, BinarySensorEntity):
    """Binary sensor for a current BOM alert/watch/outlook."""

    entity_description: BinarySensorEntityDescription

    def __init__(
        self,
        coordinator,
        config_entry,
        description: BinarySensorEntityDescription,
    ) -> None:
        super().__init__(coordinator, config_entry, description.key)
        self.entity_description = description

    @property
    def is_on(self) -> bool:
        """Return true when the alert payload is currently valid."""
        return alert_is_active(self._source)

    @property
    def extra_state_attributes(self) -> dict[str, object]:
        """Return alert payload fields as attributes."""
        attributes = clean_attributes(self._source)
        attributes.update(alert_metadata(self.entity_description.key, self._source))
        attributes["fetched_at"] = self.coordinator.data.get("fetched_at")
        return self.with_integration_attributes(attributes)

    @property
    def _source(self) -> dict[str, object] | None:
        """Return the current alert payload."""
        value = self.coordinator.data.get(self.entity_description.key)
        return value if isinstance(value, dict) else None


class AusBomDerivedBinarySensor(AusBomSpaceWeatherEntity, BinarySensorEntity):
    """Binary sensor derived from normalized current space-weather data."""

    entity_description: BinarySensorEntityDescription

    def __init__(
        self,
        coordinator,
        config_entry,
        description: BinarySensorEntityDescription,
    ) -> None:
        super().__init__(coordinator, config_entry, description.key)
        self.entity_description = description

    @property
    def is_on(self) -> bool:
        """Return true when the derived condition is active."""
        if self.entity_description.key == "aurora_possible":
            return aurora_possible(self.coordinator.data)
        if self.entity_description.key == "geomagnetic_storm":
            return geomagnetic_storm_active(self.coordinator.data)
        if self.entity_description.key == "data_stale":
            return data_is_stale(
                self.coordinator.data,
                stale_after_minutes=getattr(
                    self.coordinator,
                    "stale_after_minutes",
                    DEFAULT_STALE_AFTER_MINUTES,
                ),
            )
        return False

    @property
    def extra_state_attributes(self) -> dict[str, object]:
        """Return useful normalized data behind the derived condition."""
        if self.entity_description.key == "aurora_possible":
            return self._aurora_possible_attributes()
        if self.entity_description.key == "geomagnetic_storm":
            return self._geomagnetic_storm_attributes()
        if self.entity_description.key == "data_stale":
            return self._data_stale_attributes()
        return self.with_integration_attributes()

    def _aurora_possible_attributes(self) -> dict[str, object]:
        """Return aurora visibility details."""
        visibility = aurora_visibility(self.coordinator.data)
        return self.with_integration_attributes(
            {
                "visibility": visibility.get("state"),
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
            }
        )

    def _geomagnetic_storm_attributes(self) -> dict[str, object]:
        """Return geomagnetic storm details."""
        severity = space_weather_severity(self.coordinator.data)
        k_index = coerce_number((self.coordinator.data.get("k_index") or {}).get("index"))
        return self.with_integration_attributes(
            {
                "severity_level": severity.get("level"),
                "severity_label": severity.get("label"),
                "tone": severity.get("tone"),
                "source": severity.get("source"),
                "source_key": severity.get("source_key"),
                "active_alerts": active_alert_keys(self.coordinator.data),
                "g_scale": g_scale_from_k_index(k_index),
                "k_index": k_index,
                "location": self.coordinator.data.get("k_index_location"),
                "fetched_at": self.coordinator.data.get("fetched_at"),
            }
        )

    def _data_stale_attributes(self) -> dict[str, object]:
        """Return stale-data diagnostics."""
        stale_after_minutes = getattr(
            self.coordinator,
            "stale_after_minutes",
            DEFAULT_STALE_AFTER_MINUTES,
        )
        return self.with_integration_attributes(
            {
                "age_minutes": data_age_minutes(self.coordinator.data),
                "source_age_minutes": source_age_minutes(self.coordinator.data),
                "latest_source_time": latest_source_timestamp(self.coordinator.data),
                "stale_after_minutes": stale_after_minutes,
                "last_success": getattr(self.coordinator, "last_update_success", None),
                "fetched_at": self.coordinator.data.get("fetched_at"),
            }
        )
