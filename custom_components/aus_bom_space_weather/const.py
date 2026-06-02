"""Constants for the AUS BOM Space Weather integration."""

from __future__ import annotations

from datetime import timedelta

DOMAIN = "aus_bom_space_weather"
NAME = "AUS BOM Space Weather"
ATTRIBUTION = "Data provided by the Australian Bureau of Meteorology Space Weather Services"

API_BASE_URL = "https://sws-data.sws.bom.gov.au/api/v1"
API_TIMEOUT_SECONDS = 30

CONF_K_INDEX_LOCATION = "k_index_location"
CONF_UPDATE_INTERVAL = "update_interval"
CONF_STALE_AFTER_MINUTES = "stale_after_minutes"

DEFAULT_K_INDEX_LOCATION = "Australian region"
DEFAULT_UPDATE_INTERVAL_MINUTES = 15
DEFAULT_STALE_AFTER_MINUTES = 90

FRONTEND_URL_PATH = "/aus_bom_space_weather"
FRONTEND_CARD_FILENAME = "aus-bom-space-weather-card.js"
FRONTEND_REGISTERED_KEY = "_frontend_registered"
HISTORY_VIEW_REGISTERED_KEY = "_history_view_registered"
SERVICE_REGISTERED_KEY = "_service_registered"

SERVICE_REFRESH = "refresh"
SERVICE_FIELD_ENTRY_ID = "entry_id"

DEFAULT_HISTORY_WINDOW = timedelta(hours=24)
MAX_HISTORY_WINDOW = timedelta(days=7)
HISTORY_CACHE_TTL = timedelta(minutes=5)

PLATFORMS = ["sensor", "binary_sensor", "button", "select"]

AUSTRALIAN_REGION = "Australian region"

K_INDEX_LOCATIONS = (
    AUSTRALIAN_REGION,
    "Alice Springs",
    "Canberra",
    "Cocos Island",
    "Narrabri",
    "Darwin",
    "Hobart",
    "Launceston",
    "Learmonth",
    "Melbourne",
    "Norfolk Island",
    "Perth",
    "Sydney",
    "Townsville",
    "Casey",
    "Davis",
    "Macquarie Island",
    "Mawson",
)

ALERT_ENDPOINTS = (
    "magnetic_alert",
    "magnetic_warning",
    "aurora_alert",
    "aurora_watch",
    "aurora_outlook",
)

INDEX_ENDPOINTS = (
    "a_index",
    "k_index",
    "dst_index",
)

CURRENT_ENDPOINTS = INDEX_ENDPOINTS + ALERT_ENDPOINTS

ENDPOINT_LABELS = {
    "a_index": "A index",
    "k_index": "K index",
    "dst_index": "Dst index",
    "magnetic_alert": "Magnetic alert",
    "magnetic_warning": "Magnetic warning",
    "aurora_alert": "Aurora alert",
    "aurora_watch": "Aurora watch",
    "aurora_outlook": "Aurora outlook",
}

ENDPOINT_API_METHODS = {
    "a_index": "get-a-index",
    "k_index": "get-k-index",
    "dst_index": "get-dst-index",
    "magnetic_alert": "get-mag-alert",
    "magnetic_warning": "get-mag-warning",
    "aurora_alert": "get-aurora-alert",
    "aurora_watch": "get-aurora-watch",
    "aurora_outlook": "get-aurora-outlook",
}

ENDPOINT_CATEGORIES = {
    "a_index": "index",
    "k_index": "index",
    "dst_index": "index",
    "magnetic_alert": "notice",
    "magnetic_warning": "notice",
    "aurora_alert": "notice",
    "aurora_watch": "notice",
    "aurora_outlook": "notice",
}

ENDPOINT_REQUEST_FIELDS = {
    "a_index": ("api_key", "options"),
    "k_index": ("api_key", "options"),
    "dst_index": ("api_key", "options"),
    "magnetic_alert": ("api_key",),
    "magnetic_warning": ("api_key",),
    "aurora_alert": ("api_key",),
    "aurora_watch": ("api_key",),
    "aurora_outlook": ("api_key",),
}

ENDPOINT_OPTION_FIELDS = {
    "a_index": ("location", "start", "end"),
    "k_index": ("location", "start", "end"),
    "dst_index": ("location", "start", "end"),
    "magnetic_alert": (),
    "magnetic_warning": (),
    "aurora_alert": (),
    "aurora_watch": (),
    "aurora_outlook": (),
}

ENDPOINT_LOCATION_OPTIONS = {
    "a_index": (AUSTRALIAN_REGION,),
    "k_index": K_INDEX_LOCATIONS,
    "dst_index": (AUSTRALIAN_REGION,),
    "magnetic_alert": (),
    "magnetic_warning": (),
    "aurora_alert": (),
    "aurora_watch": (),
    "aurora_outlook": (),
}

ENDPOINT_RESPONSE_FIELDS = {
    "a_index": ("valid_time", "index"),
    "k_index": ("valid_time", "analysis_time", "index"),
    "dst_index": ("valid_time", "index"),
    "magnetic_alert": ("start_time", "valid_until", "g_scale", "description"),
    "magnetic_warning": ("issue_time", "start_date", "end_date", "cause", "activity", "date", "forecast", "comments"),
    "aurora_alert": ("start_time", "valid_until", "k_aus", "lat_band", "description"),
    "aurora_watch": ("issue_time", "start_date", "end_date", "cause", "k_aus", "lat_band", "comments"),
    "aurora_outlook": ("issue_time", "start_date", "end_date", "cause", "k_aus", "lat_band", "comments"),
}

ENDPOINT_RESPONSE_CONSTRAINTS = {
    "a_index": {
        "index": {"integer_range": [0, 400]},
    },
    "k_index": {
        "index": {"integer_range": [0, 9]},
    },
    "dst_index": {
        "index": {
            "likely_range": [-2000, 300],
            "value_type": "unbounded signed integer",
        },
    },
    "magnetic_alert": {
        "g_scale": {"g_scale_range": [1, 5]},
        "description": {"allowed_values": ["minor", "major", "severe"]},
    },
    "magnetic_warning": {
        "cause": {
            "allowed_values": [
                "coronal hole",
                "coronal mass ejection",
                "disappearing filament",
                "flare",
            ],
        },
    },
    "aurora_alert": {
        "k_aus": {"numeric_range": [0, 9]},
        "lat_band": {"allowed_values": ["high", "mid", "low", "equatorial"]},
    },
    "aurora_watch": {
        "cause": {"allowed_values": ["coronal hole", "coronal mass ejection"]},
        "k_aus": {"numeric_range": [0, 9]},
        "lat_band": {"allowed_values": ["high", "mid", "low", "equatorial"]},
    },
    "aurora_outlook": {
        "cause": {"allowed_values": ["coronal hole", "coronal mass ejection"]},
        "k_aus": {"numeric_range": [0, 9]},
        "lat_band": {"allowed_values": ["high", "mid", "low", "equatorial"]},
    },
}
