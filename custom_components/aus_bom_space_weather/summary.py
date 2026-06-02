"""Pure summary helpers for AUS BOM Space Weather data."""

from __future__ import annotations

import re
from datetime import UTC, date, datetime, time
from typing import Any

from .api import BOM_API_ERROR_CODES, coerce_number
from .const import (
    CURRENT_ENDPOINTS,
    ENDPOINT_API_METHODS,
    ENDPOINT_CATEGORIES,
    ENDPOINT_LABELS,
    ENDPOINT_LOCATION_OPTIONS,
    ENDPOINT_OPTION_FIELDS,
    ENDPOINT_REQUEST_FIELDS,
    ENDPOINT_RESPONSE_CONSTRAINTS,
    ENDPOINT_RESPONSE_FIELDS,
)

AURORA_NOTICE_KEYS = (
    ("aurora_alert", "alert"),
    ("aurora_watch", "watch"),
    ("aurora_outlook", "outlook"),
)

SOURCE_TIMESTAMP_FIELDS = (
    "analysis_time",
    "valid_time",
    "issue_time",
    "start_time",
    "start_date",
)

CONDITION_PRIORITY = (
    ("aurora_alert", "Aurora alert", "aurora"),
    ("magnetic_alert", "Magnetic alert", "storm"),
    ("magnetic_warning", "Magnetic warning", "warning"),
    ("aurora_watch", "Aurora watch", "watch"),
    ("aurora_outlook", "Aurora outlook", "outlook"),
)

ALERT_DEFINITIONS = {
    "aurora_alert": {
        "label": "Aurora alert",
        "category": "aurora",
        "notice_type": "alert",
        "tone": "aurora",
        "priority": 1,
    },
    "magnetic_alert": {
        "label": "Magnetic alert",
        "category": "magnetic",
        "notice_type": "alert",
        "tone": "storm",
        "priority": 2,
    },
    "magnetic_warning": {
        "label": "Magnetic warning",
        "category": "magnetic",
        "notice_type": "warning",
        "tone": "warning",
        "priority": 3,
    },
    "aurora_watch": {
        "label": "Aurora watch",
        "category": "aurora",
        "notice_type": "watch",
        "tone": "watch",
        "priority": 4,
    },
    "aurora_outlook": {
        "label": "Aurora outlook",
        "category": "aurora",
        "notice_type": "outlook",
        "tone": "outlook",
        "priority": 5,
    },
}

ALERT_API_METADATA = {
    "aurora_alert": {
        "bom_api_method": "get-aurora-alert",
        "source_time_field": "start_time",
        "source_time_meaning": "UTC time at which the alert became active",
        "validity_end_field": "valid_until",
        "documented_k_aus_min": 0,
        "documented_k_aus_max": 9,
        "documented_lat_band_values": ["high", "mid", "low", "equatorial"],
    },
    "aurora_watch": {
        "bom_api_method": "get-aurora-watch",
        "source_time_field": "issue_time",
        "source_time_meaning": "UTC time at which the watch was issued",
        "validity_start_field": "start_date",
        "validity_end_field": "end_date",
        "documented_k_aus_min": 0,
        "documented_k_aus_max": 9,
        "documented_lat_band_values": ["high", "mid", "low", "equatorial"],
        "documented_cause_values": ["coronal hole", "coronal mass ejection"],
    },
    "aurora_outlook": {
        "bom_api_method": "get-aurora-outlook",
        "source_time_field": "issue_time",
        "source_time_meaning": "UTC time at which the outlook was issued",
        "validity_start_field": "start_date",
        "validity_end_field": "end_date",
        "documented_k_aus_min": 0,
        "documented_k_aus_max": 9,
        "documented_lat_band_values": ["high", "mid", "low", "equatorial"],
        "documented_cause_values": ["coronal hole", "coronal mass ejection"],
    },
    "magnetic_alert": {
        "bom_api_method": "get-mag-alert",
        "source_time_field": "start_time",
        "source_time_meaning": "UTC time at which the alert became active",
        "validity_end_field": "valid_until",
        "documented_g_scale_min": 1,
        "documented_g_scale_max": 5,
        "documented_description_values": ["minor", "major", "severe"],
    },
    "magnetic_warning": {
        "bom_api_method": "get-mag-warning",
        "source_time_field": "issue_time",
        "source_time_meaning": "UTC time at which the warning was issued",
        "validity_start_field": "start_date",
        "validity_end_field": "end_date",
        "documented_cause_values": [
            "coronal hole",
            "coronal mass ejection",
            "disappearing filament",
            "flare",
        ],
        "documented_activity_shape": "array of date/forecast objects",
    },
}

K_INDEX_SEVERITY = (
    (9, "extreme_storm", "Extreme storm", "storm"),
    (8, "severe_storm", "Severe storm", "storm"),
    (7, "strong_storm", "Strong storm", "warning"),
    (6, "moderate_storm", "Moderate storm", "warning"),
    (5, "minor_storm", "Minor storm", "watch"),
    (4, "active", "Active", "active"),
    (3, "unsettled", "Unsettled", "outlook"),
)

A_INDEX_SEVERITY = (
    (100, "storm", "Storm", "storm"),
    (50, "warning", "Warning", "warning"),
    (30, "watch", "Watch", "watch"),
    (15, "active", "Active", "active"),
)

DST_INDEX_SEVERITY = (
    (-250, "storm", "Storm", "storm"),
    (-100, "warning", "Warning", "warning"),
    (-50, "watch", "Watch", "watch"),
    (-30, "active", "Active", "active"),
)

G_SCALE_LABELS = {
    0: "Below storm",
    1: "Minor storm",
    2: "Moderate storm",
    3: "Strong storm",
    4: "Severe storm",
    5: "Extreme storm",
}

ALERT_SEVERITY_LEVELS = {
    "aurora_alert": 5,
    "magnetic_alert": 4,
    "magnetic_warning": 3,
    "aurora_watch": 3,
    "aurora_outlook": 2,
}

SEVERITY_LEVEL_LABELS = {
    0: ("Quiet", "quiet"),
    1: ("Unsettled", "outlook"),
    2: ("Active", "active"),
    3: ("Watch", "watch"),
    4: ("Warning", "warning"),
    5: ("Severe", "storm"),
}

AURORA_VISIBILITY_LABELS = {
    0: ("none", "No current visibility signal", "quiet"),
    1: ("low", "Low chance", "outlook"),
    2: ("possible", "Possible", "watch"),
    3: ("likely", "Likely", "aurora"),
}


def geomagnetic_activity_label(k_index: int | float | None) -> str | None:
    """Map the K index to a dashboard-friendly activity label."""
    if k_index is None:
        return None
    if k_index >= 9:
        return "Extreme storm"
    if k_index >= 8:
        return "Severe storm"
    if k_index >= 7:
        return "Strong storm"
    if k_index >= 6:
        return "Moderate storm"
    if k_index >= 5:
        return "Minor storm"
    if k_index >= 4:
        return "Active"
    if k_index >= 3:
        return "Unsettled"
    return "Quiet"


def index_severity(index_key: str, value: Any) -> dict[str, str]:
    """Return a normalized severity payload for index sensors."""
    number = coerce_number(value)
    if number is None:
        return {"severity": "unknown", "severity_label": "Unknown", "tone": "neutral"}

    if index_key == "k_index":
        for threshold, severity, label, tone in K_INDEX_SEVERITY:
            if number >= threshold:
                return {"severity": severity, "severity_label": label, "tone": tone}
        return {"severity": "quiet", "severity_label": "Quiet", "tone": "quiet"}

    if index_key == "a_index":
        for threshold, severity, label, tone in A_INDEX_SEVERITY:
            if number >= threshold:
                return {"severity": severity, "severity_label": label, "tone": tone}
        return {"severity": "quiet", "severity_label": "Quiet", "tone": "quiet"}

    if index_key == "dst_index":
        for threshold, severity, label, tone in DST_INDEX_SEVERITY:
            if number <= threshold:
                return {"severity": severity, "severity_label": label, "tone": tone}
        return {"severity": "quiet", "severity_label": "Quiet", "tone": "quiet"}

    return {"severity": "unknown", "severity_label": "Unknown", "tone": "neutral"}


def space_weather_severity(
    data: dict[str, Any],
    *,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Return a normalized 0-5 severity summary across alerts and index values."""
    candidates = severity_candidates(data, now=now)
    if not candidates:
        return {
            "level": None,
            "label": "Unknown",
            "tone": "neutral",
            "source": "unknown",
            "source_key": None,
            "contributors": [],
        }

    best = max(candidates, key=lambda candidate: (candidate["level"], candidate["priority"]))
    return {
        "level": best["level"],
        "label": best["label"],
        "tone": best["tone"],
        "source": best["source"],
        "source_key": best["source_key"],
        "contributors": [
            {key: value for key, value in candidate.items() if key != "priority"}
            for candidate in candidates
            if candidate["level"] > 0
        ],
    }


def severity_candidates(data: dict[str, Any], *, now: datetime | None = None) -> list[dict[str, Any]]:
    """Return normalized severity candidates from active notices and index sensors."""
    candidates: list[dict[str, Any]] = []
    for alert_key in active_alert_keys(data, now=now):
        metadata = alert_metadata(alert_key, data.get(alert_key), now=now)
        level = alert_severity_level(alert_key, metadata)
        candidates.append(
            {
                "level": level,
                "label": metadata["label"],
                "tone": metadata["tone"],
                "source": "alert",
                "source_key": alert_key,
                "priority": 10,
            }
        )

    for index_key in ("k_index", "a_index", "dst_index"):
        source = data.get(index_key)
        value = coerce_number((source or {}).get("index") if isinstance(source, dict) else None)
        if value is None:
            continue
        severity = index_severity(index_key, value)
        candidates.append(
            {
                "level": index_severity_level(index_key, value),
                "label": severity["severity_label"],
                "tone": severity["tone"],
                "source": "index",
                "source_key": index_key,
                "value": value,
                "priority": 1,
            }
        )

    return candidates


def alert_severity_level(alert_key: str, metadata: dict[str, Any]) -> int:
    """Return a normalized 0-5 level for one active alert/watch/outlook payload."""
    configured_level = ALERT_SEVERITY_LEVELS.get(alert_key, 1)
    g_scale = coerce_number(metadata.get("g_scale"))
    if g_scale is None:
        return configured_level
    return max(configured_level, min(max(int(g_scale), 0), 5))


def index_severity_level(index_key: str, value: Any) -> int:
    """Return a normalized 0-5 severity level for one index value."""
    number = coerce_number(value)
    if number is None:
        return 0
    if index_key == "k_index":
        if number >= 9:
            return 5
        if number >= 7:
            return 4
        if number >= 5:
            return 3
        if number >= 4:
            return 2
        if number >= 3:
            return 1
        return 0
    if index_key == "a_index":
        if number >= 100:
            return 5
        if number >= 50:
            return 4
        if number >= 30:
            return 3
        if number >= 15:
            return 2
        return 0
    if index_key == "dst_index":
        if number <= -250:
            return 5
        if number <= -100:
            return 4
        if number <= -50:
            return 3
        if number <= -30:
            return 2
        return 0
    return 0


def severity_level_label(level: Any) -> str | None:
    """Return the generic label for a normalized severity level."""
    number = coerce_number(level)
    if number is None:
        return None
    label, _tone = SEVERITY_LEVEL_LABELS.get(int(number), ("Unknown", "neutral"))
    return label


def severity_level_tone(level: Any) -> str:
    """Return the generic frontend tone for a normalized severity level."""
    number = coerce_number(level)
    if number is None:
        return "neutral"
    _label, tone = SEVERITY_LEVEL_LABELS.get(int(number), ("Unknown", "neutral"))
    return tone


def g_scale_from_k_index(k_index: Any) -> int | None:
    """Return an estimated NOAA-style G scale from a K/Kp index value."""
    number = coerce_number(k_index)
    if number is None:
        return None
    if number >= 9:
        return 5
    if number >= 8:
        return 4
    if number >= 7:
        return 3
    if number >= 6:
        return 2
    if number >= 5:
        return 1
    return 0


def g_scale_label(g_scale: Any) -> str | None:
    """Return a human-readable NOAA-style G-scale label."""
    number = coerce_number(g_scale)
    if number is None:
        return None
    return G_SCALE_LABELS.get(int(number))


def current_aurora_notice(
    data: dict[str, Any],
    *,
    now: datetime | None = None,
) -> tuple[str | None, dict[str, Any] | None]:
    """Return the highest-priority active aurora notice payload."""
    for key, notice_type in AURORA_NOTICE_KEYS:
        notice = data.get(key)
        if alert_is_active(notice, now=now):
            return notice_type, notice
    return None, None


def aurora_visibility(
    data: dict[str, Any],
    *,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Return a compact aurora visibility recommendation for dashboards."""
    notice_type, notice = current_aurora_notice(data, now=now)
    if notice_type:
        level = aurora_visibility_level_from_notice(notice_type)
        state, label, tone = AURORA_VISIBILITY_LABELS[level]
        result = {
            "state": state,
            "level": level,
            "label": label,
            "tone": tone,
            "source": "notice",
            "source_key": f"aurora_{notice_type}",
            "notice_type": notice_type,
        }
        result.update(aurora_visibility_notice_attributes(notice or {}))
        return result

    k_value = coerce_number((data.get("k_index") or {}).get("index"))
    if k_value is not None and k_value >= 7:
        level = 2
    elif k_value is not None and k_value >= 5:
        level = 1
    else:
        level = 0

    state, label, tone = AURORA_VISIBILITY_LABELS[level]
    return {
        "state": state,
        "level": level,
        "label": label,
        "tone": tone,
        "source": "k_index" if k_value is not None else "unknown",
        "source_key": "k_index" if k_value is not None else None,
        "k_index": k_value,
    }


def aurora_possible(data: dict[str, Any], *, now: datetime | None = None) -> bool:
    """Return true when aurora visibility is possible or likely."""
    level = coerce_number(aurora_visibility(data, now=now).get("level"))
    return bool(level is not None and level >= 2)


def geomagnetic_storm_active(data: dict[str, Any], *, now: datetime | None = None) -> bool:
    """Return true when magnetic alerts or K-index conditions indicate storming."""
    if alert_is_active(data.get("magnetic_alert"), now=now):
        return True
    if alert_is_active(data.get("magnetic_warning"), now=now):
        return True
    return g_scale_from_k_index((data.get("k_index") or {}).get("index")) in {1, 2, 3, 4, 5}


def aurora_visibility_level_from_notice(notice_type: str) -> int:
    """Map active BOM aurora notice type to a compact 0-3 visibility level."""
    if notice_type == "alert":
        return 3
    if notice_type == "watch":
        return 2
    if notice_type == "outlook":
        return 1
    return 0


def aurora_visibility_notice_attributes(notice: dict[str, Any]) -> dict[str, Any]:
    """Return useful active aurora notice fields for visibility state attributes."""
    attributes: dict[str, Any] = {}
    k_aus = coerce_number(notice.get("k_aus"))
    lat_band = first_non_empty(notice, "lat_band")
    summary = alert_summary(notice)
    if k_aus is not None:
        attributes["k_aus"] = k_aus
    if lat_band:
        attributes["lat_band"] = lat_band
    if summary:
        attributes["summary"] = summary
    return attributes


def condition_label(data: dict[str, Any], *, now: datetime | None = None) -> str:
    """Return a single current condition label."""
    _key, label, _tone = current_priority_notice(data, now=now)
    if label:
        return label

    k_value = coerce_number((data.get("k_index") or {}).get("index"))
    return geomagnetic_activity_label(k_value) or "Unknown"


def condition_tone(data: dict[str, Any], *, now: datetime | None = None) -> str:
    """Return a frontend tone name for the current condition."""
    _key, _label, tone = current_priority_notice(data, now=now)
    if tone:
        return tone

    k_value = coerce_number((data.get("k_index") or {}).get("index"))
    if k_value is None:
        return "neutral"
    if k_value >= 8:
        return "storm"
    if k_value >= 6:
        return "warning"
    if k_value >= 5:
        return "watch"
    if k_value >= 4:
        return "active"
    if k_value >= 3:
        return "outlook"
    return "quiet"


def current_priority_notice(
    data: dict[str, Any],
    *,
    now: datetime | None = None,
) -> tuple[str | None, str | None, str | None]:
    """Return the highest-priority current notice key, label, and tone."""
    for key, label, tone in CONDITION_PRIORITY:
        notice = data.get(key)
        if alert_is_active(notice, now=now):
            return key, label, tone
    return None, None, None


def active_alert_keys(data: dict[str, Any], *, now: datetime | None = None) -> list[str]:
    """Return all currently active notice keys in priority order."""
    return [
        key
        for key, _label, _tone in CONDITION_PRIORITY
        if alert_is_active(data.get(key), now=now)
    ]


def active_alert_details(data: dict[str, Any], *, now: datetime | None = None) -> list[dict[str, Any]]:
    """Return normalized active alert metadata in dashboard priority order."""
    return [
        alert_metadata(key, data.get(key), now=now)
        for key in active_alert_keys(data, now=now)
    ]


def alert_metadata(alert_key: str, payload: Any, *, now: datetime | None = None) -> dict[str, Any]:
    """Return stable metadata for one alert/watch/outlook payload."""
    definition = ALERT_DEFINITIONS.get(
        alert_key,
        {
            "label": alert_key.replace("_", " ").title(),
            "category": "unknown",
            "notice_type": "unknown",
            "tone": "neutral",
            "priority": 99,
        },
    )
    source = payload if isinstance(payload, dict) else {}
    metadata: dict[str, Any] = {
        "alert_key": alert_key,
        "label": definition["label"],
        "category": definition["category"],
        "notice_type": definition["notice_type"],
        "tone": definition["tone"],
        "priority": definition["priority"],
        "active": alert_is_active(source, now=now),
        "expired": alert_is_expired(source, now=now),
        "pending": alert_is_pending(source, now=now),
    }
    metadata.update(ALERT_API_METADATA.get(alert_key, {}))

    summary = alert_summary(source)
    if summary:
        metadata["summary"] = summary

    issued_at = first_non_empty(source, "issue_time")
    starts_at = first_non_empty(source, "start_time", "start_date")
    ends_at = first_non_empty(source, "valid_until", "end_date")
    source_time = first_non_empty(source, metadata.get("source_time_field", ""), "issue_time", "start_time", "start_date")
    if source_time:
        metadata["source_time"] = source_time
    if issued_at:
        metadata["issued_at"] = issued_at
    if starts_at:
        metadata["starts_at"] = starts_at
    if ends_at:
        metadata["ends_at"] = ends_at
        metadata["expires_at"] = ends_at

    k_aus = coerce_number(source.get("k_aus"))
    g_scale = coerce_number(source.get("g_scale"))
    lat_band = first_non_empty(source, "lat_band")
    if k_aus is not None:
        metadata["k_aus"] = k_aus
    if g_scale is not None:
        metadata["g_scale"] = g_scale
    if lat_band:
        metadata["lat_band"] = lat_band

    cause = first_non_empty(source, "cause")
    if cause:
        metadata["cause"] = str(cause)

    forecast_days = activity_forecast_days(source.get("activity"))
    if forecast_days:
        metadata["forecast_days"] = forecast_days

    return metadata


def alert_is_active(payload: Any, *, now: datetime | None = None) -> bool:
    """Return true when an alert payload is present and currently valid."""
    if not isinstance(payload, dict) or not payload:
        return False
    return not alert_is_pending(payload, now=now) and not alert_is_expired(payload, now=now)


def alert_is_pending(payload: Any, *, now: datetime | None = None) -> bool:
    """Return true when an alert start time is in the future."""
    if not isinstance(payload, dict) or not payload:
        return False
    starts_at = parse_bom_datetime(first_non_empty(payload, "start_time", "start_date"))
    return bool(starts_at and starts_at > utc_reference(now))


def alert_is_expired(payload: Any, *, now: datetime | None = None) -> bool:
    """Return true when an alert end/valid-until time has passed."""
    if not isinstance(payload, dict) or not payload:
        return False
    end_value = first_non_empty(payload, "valid_until", "end_date")
    ends_at = parse_bom_datetime(end_value, end_of_day=is_date_only(end_value))
    return bool(ends_at and ends_at < utc_reference(now))


def parse_bom_datetime(value: Any, *, end_of_day: bool = False) -> datetime | None:
    """Parse BOM SWS date/time values as UTC datetimes."""
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, date):
        parsed = datetime.combine(value, time.max if end_of_day else time.min)
    else:
        text = str(value).strip()
        if not text:
            return None
        text = normalize_bom_datetime_text(text)
        try:
            if is_date_only(text):
                parsed_date = date.fromisoformat(text)
                parsed = datetime.combine(parsed_date, time.max if end_of_day else time.min)
            else:
                parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        except ValueError:
            return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def normalize_bom_datetime_text(value: str) -> str:
    """Normalize stable BOM docs/API timestamp quirks before parsing."""
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:", value):
        return f"{value}00"
    return value


def is_date_only(value: Any) -> bool:
    """Return true for YYYY-MM-DD date-only strings."""
    text = str(value or "").strip()
    return len(text) == 10 and text[4] == "-" and text[7] == "-"


def utc_reference(now: datetime | None = None) -> datetime:
    """Return a timezone-aware UTC reference time."""
    if now is None:
        return datetime.now(UTC)
    if now.tzinfo is None:
        return now.replace(tzinfo=UTC)
    return now.astimezone(UTC)


def alert_summary(payload: dict[str, Any]) -> str | None:
    """Return a compact human-readable alert summary from endpoint-specific text fields."""
    value = first_non_empty(payload, "description", "comments", "forecast", "cause", "activity")
    if not value:
        return None
    if isinstance(value, list):
        return activity_summary(value)
    summary = " ".join(str(value).split())
    return summary[:500]


def activity_forecast_days(value: Any) -> list[dict[str, str]]:
    """Return normalized day forecasts from a BOM warning activity payload."""
    if not isinstance(value, list):
        return []

    forecast_days = []
    for item in value:
        if not isinstance(item, dict):
            continue
        date_value = first_non_empty(item, "date")
        forecast_value = first_non_empty(item, "forecast")
        if not date_value and not forecast_value:
            continue
        forecast_days.append(
            {
                key: " ".join(str(raw_value).split())
                for key, raw_value in (
                    ("date", date_value),
                    ("forecast", forecast_value),
                )
                if raw_value
            }
        )
    return forecast_days


def activity_summary(value: Any) -> str | None:
    """Return a compact summary from a day-by-day activity forecast payload."""
    forecast_days = activity_forecast_days(value)
    if not forecast_days:
        return None
    summary = "; ".join(
        ": ".join(part for part in (day.get("date"), day.get("forecast")) if part)
        for day in forecast_days
    )
    return summary[:500]


def first_non_empty(payload: dict[str, Any], *keys: str) -> Any:
    """Return the first present, non-empty payload value for the supplied keys."""
    for key in keys:
        value = payload.get(key)
        if value is not None and value != "":
            return value
    return None


def api_errors(data: dict[str, Any]) -> dict[str, str]:
    """Return partial API errors as a string dictionary."""
    errors = data.get("errors")
    if not isinstance(errors, dict):
        return {}
    return {str(key): str(value) for key, value in errors.items() if value}


def api_error_details(data: dict[str, Any]) -> dict[str, list[dict[str, str]]]:
    """Return structured BOM API error details by failed endpoint."""
    details = data.get("error_details")
    if not isinstance(details, dict):
        return {}
    result: dict[str, list[dict[str, str]]] = {}
    for endpoint, entries in details.items():
        if not isinstance(entries, list):
            continue
        normalized_entries = [
            normalized_api_error_detail(entry)
            for entry in entries
            if isinstance(entry, dict)
        ]
        clean_entries = [entry for entry in normalized_entries if entry]
        if clean_entries:
            result[str(endpoint)] = clean_entries
    return result


def normalized_api_error_detail(entry: dict[str, Any]) -> dict[str, str]:
    """Return one normalized BOM API error detail object."""
    detail: dict[str, str] = {}
    code = normalized_api_error_code(entry.get("code"))
    message = entry.get("message")
    if code:
        detail["code"] = code
        if meaning := entry.get("meaning") or BOM_API_ERROR_CODES.get(code):
            detail["meaning"] = str(meaning)
    if message:
        detail["message"] = str(message)
    return detail


def api_error_codes(data: dict[str, Any]) -> dict[str, list[str]]:
    """Return normalized BOM API error codes by failed endpoint."""
    details = api_error_details(data)
    codes_by_endpoint = {
        endpoint: codes
        for endpoint, entries in details.items()
        if (codes := unique_error_codes(entry.get("code") for entry in entries))
    }
    for endpoint, message in api_errors(data).items():
        if endpoint in codes_by_endpoint:
            continue
        if codes := parse_api_error_codes(message):
            codes_by_endpoint[endpoint] = codes
    return codes_by_endpoint


def api_error_meanings(data: dict[str, Any]) -> dict[str, list[str]]:
    """Return stable documented BOM API error meanings by failed endpoint."""
    details = api_error_details(data)
    meanings_by_endpoint = {
        endpoint: meanings
        for endpoint, entries in details.items()
        if (meanings := unique_error_meanings(entry.get("meaning") for entry in entries))
    }
    for endpoint, codes in api_error_codes(data).items():
        if endpoint in meanings_by_endpoint:
            continue
        meanings = unique_error_meanings(BOM_API_ERROR_CODES.get(code) for code in codes)
        if meanings:
            meanings_by_endpoint[endpoint] = meanings
    return meanings_by_endpoint


def parse_api_error_codes(message: Any) -> list[str]:
    """Extract normalized BOM error-code prefixes from formatted error text."""
    codes: list[str] = []
    seen: set[str] = set()
    for part in str(message or "").split(";"):
        match = re.match(r"\s*(\d{1,2})\s*:", part)
        if not match:
            continue
        code = normalized_api_error_code(match.group(1))
        if code not in seen:
            seen.add(code)
            codes.append(code)
    return codes


def normalized_api_error_code(code: Any) -> str | None:
    """Normalize BOM error-code values so int 1 and string 01 compare equally."""
    if code is None:
        return None
    text = str(code).strip()
    if not text:
        return None
    return text.zfill(2) if text.isdigit() else text


def unique_error_codes(values: Any) -> list[str]:
    """Return normalized error codes once, preserving first-seen order."""
    codes: list[str] = []
    seen: set[str] = set()
    for value in values:
        code = normalized_api_error_code(value)
        if code and code not in seen:
            seen.add(code)
            codes.append(code)
    return codes


def unique_error_meanings(values: Any) -> list[str]:
    """Return documented error meanings once, preserving first-seen order."""
    meanings: list[str] = []
    seen: set[str] = set()
    for value in values:
        meaning = str(value).strip() if value else ""
        if meaning and meaning not in seen:
            seen.add(meaning)
            meanings.append(meaning)
    return meanings


def data_health_label(data: dict[str, Any]) -> str:
    """Return a compact health label for dashboards and automations."""
    if api_errors(data):
        return "partial"
    if any(isinstance(data.get(key), dict) and data.get(key) for key in ("a_index", "k_index", "dst_index")):
        return "ok"
    return "unknown"


def endpoint_health(data: dict[str, Any]) -> dict[str, Any]:
    """Return endpoint-level current API health details."""
    errors = api_errors(data)
    error_codes = api_error_codes(data)
    error_details = api_error_details(data)
    error_meanings = api_error_meanings(data)
    endpoints = []
    for endpoint in CURRENT_ENDPOINTS:
        value = data.get(endpoint) if isinstance(data, dict) else None
        failed = endpoint in errors
        has_payload = isinstance(value, dict) and bool(value)
        status = "failed" if failed else "ok" if has_payload else "empty"
        detail = {
            "endpoint": endpoint,
            "label": ENDPOINT_LABELS.get(endpoint, endpoint.replace("_", " ").title()),
            "bom_api_method": ENDPOINT_API_METHODS.get(endpoint),
            "category": ENDPOINT_CATEGORIES.get(endpoint, "unknown"),
            "documented": endpoint in ENDPOINT_API_METHODS,
            "request_fields": list(ENDPOINT_REQUEST_FIELDS.get(endpoint, ())),
            "option_fields": list(ENDPOINT_OPTION_FIELDS.get(endpoint, ())),
            "location_options": list(ENDPOINT_LOCATION_OPTIONS.get(endpoint, ())),
            "response_fields": list(ENDPOINT_RESPONSE_FIELDS.get(endpoint, ())),
            "response_constraints": ENDPOINT_RESPONSE_CONSTRAINTS.get(endpoint, {}),
            "status": status,
            "has_payload": has_payload,
        }
        if failed:
            detail["error"] = errors[endpoint]
            if endpoint in error_codes:
                detail["error_codes"] = error_codes[endpoint]
            if endpoint in error_meanings:
                detail["error_meanings"] = error_meanings[endpoint]
            if endpoint in error_details:
                detail["error_details"] = error_details[endpoint]
        endpoints.append(detail)

    total_count = len(endpoints)
    failed_count = sum(1 for item in endpoints if item["status"] == "failed")
    empty_count = sum(1 for item in endpoints if item["status"] == "empty")
    ok_count = 0 if not isinstance(data, dict) or not data else total_count - failed_count

    if not isinstance(data, dict) or not data:
        state = "unknown"
    elif failed_count == 0:
        state = "ok"
    elif failed_count == total_count:
        state = "failed"
    else:
        state = "partial"

    return {
        "state": state,
        "total_count": total_count,
        "ok_count": ok_count,
        "failed_count": failed_count,
        "empty_count": empty_count,
        "failed_endpoints": [item["endpoint"] for item in endpoints if item["status"] == "failed"],
        "empty_endpoints": [item["endpoint"] for item in endpoints if item["status"] == "empty"],
        "endpoints": endpoints,
    }


def data_age_minutes(data: dict[str, Any], *, now: datetime | None = None) -> int | None:
    """Return the age in whole minutes of the latest successful BOM bundle."""
    fetched_at = parse_bom_datetime(data.get("fetched_at") if isinstance(data, dict) else None)
    if fetched_at is None:
        return None
    age_seconds = (utc_reference(now) - fetched_at).total_seconds()
    return max(0, int(age_seconds // 60))


def latest_source_timestamp(data: dict[str, Any]) -> str | None:
    """Return the newest BOM source timestamp found in current endpoint payloads."""
    timestamps = source_timestamp_candidates(data)
    if not timestamps:
        return None
    return max(timestamps).isoformat()


def source_age_minutes(data: dict[str, Any], *, now: datetime | None = None) -> int | None:
    """Return the age in whole minutes of the newest BOM source timestamp."""
    source_time = parse_bom_datetime(latest_source_timestamp(data))
    if source_time is None:
        return None
    age_seconds = (utc_reference(now) - source_time).total_seconds()
    return max(0, int(age_seconds // 60))


def source_timestamp_candidates(data: dict[str, Any]) -> list[datetime]:
    """Return parseable source timestamps from top-level current endpoint objects."""
    if not isinstance(data, dict):
        return []

    timestamps: list[datetime] = []
    for payload in data.values():
        if not isinstance(payload, dict):
            continue
        for field in SOURCE_TIMESTAMP_FIELDS:
            timestamp = parse_bom_datetime(payload.get(field))
            if timestamp is not None:
                timestamps.append(timestamp)
    return timestamps


def data_is_stale(
    data: dict[str, Any],
    *,
    stale_after_minutes: int | float,
    now: datetime | None = None,
) -> bool:
    """Return true when the latest successful BOM bundle is older than the threshold."""
    age = data_age_minutes(data, now=now)
    if age is None:
        return True
    threshold = coerce_number(stale_after_minutes)
    if threshold is None:
        threshold = 0
    return age > int(threshold)
