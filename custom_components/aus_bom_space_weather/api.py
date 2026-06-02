"""Client for the Bureau of Meteorology Space Weather Services API."""

from __future__ import annotations

import asyncio
import re
from collections.abc import Awaitable, Iterator, Mapping
from datetime import UTC, datetime
from typing import Any

from aiohttp import ClientError, ClientSession

from .const import (
    API_BASE_URL,
    API_TIMEOUT_SECONDS,
    AUSTRALIAN_REGION,
)

BOM_API_ERROR_CODES = {
    "01": "Unsupported HTTP request method",
    "11": "Unrecognised API request",
    "12": "Unsupported API version",
    "13": "Unsupported API request method",
    "14": "Request body cannot be parsed",
    "21": "Missing API key",
    "22": "Unsupported API key",
    "23": "Requested data not permitted to the API key provided",
    "31": "Missing field",
    "32": "Unsupported field",
    "41": "Missing option",
    "42": "Unsupported option name",
    "43": "Unsupported option value",
}
BOM_AUTH_ERROR_CODES = frozenset({"22", "23"})


class AusBomSpaceWeatherApiError(Exception):
    """Raised when the BOM SWS API request fails."""

    def __init__(
        self,
        message: str,
        *,
        error_details: list[dict[str, str]] | None = None,
    ) -> None:
        super().__init__(message)
        self.error_details = error_details or []


class AusBomSpaceWeatherAuthError(AusBomSpaceWeatherApiError):
    """Raised when the BOM SWS API key is rejected."""


def auth_error_reason(error: AusBomSpaceWeatherAuthError) -> str:
    """Return the Home Assistant config-flow reason for a BOM auth error."""
    codes = {detail.get("code") for detail in error.error_details if detail.get("code")}
    return "not_permitted" if "23" in codes else "invalid_auth"


class AusBomSpaceWeatherClient:
    """Small async client for BOM SWS JSON POST endpoints."""

    def __init__(
        self,
        session: ClientSession,
        api_key: str,
        *,
        base_url: str = API_BASE_URL,
        timeout_seconds: int = API_TIMEOUT_SECONDS,
    ) -> None:
        self._session = session
        self._api_key = api_key.strip()
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds

    async def async_validate(self) -> None:
        """Validate the configured API key with a low-cost current A index request."""
        await self.async_get_a_index()

    async def async_get_a_index(
        self,
        *,
        location: str = AUSTRALIAN_REGION,
        start: str | None = None,
        end: str | None = None,
    ) -> dict[str, Any]:
        """Fetch A index data."""
        return await self._async_post("get-a-index", options_for_location(location, start, end))

    async def async_get_k_index(
        self,
        *,
        location: str,
        start: str | None = None,
        end: str | None = None,
    ) -> dict[str, Any]:
        """Fetch K index data for the configured observing location."""
        return await self._async_post("get-k-index", options_for_location(location, start, end))

    async def async_get_dst_index(
        self,
        *,
        location: str = AUSTRALIAN_REGION,
        start: str | None = None,
        end: str | None = None,
    ) -> dict[str, Any]:
        """Fetch Dst index data."""
        return await self._async_post("get-dst-index", options_for_location(location, start, end))

    async def async_get_alert(self, endpoint: str) -> dict[str, Any]:
        """Fetch a current alert/watch/outlook endpoint."""
        return await self._async_post(endpoint.replace("_", "-"))

    async def async_get_latest_bundle(self, *, k_index_location: str) -> dict[str, Any]:
        """Fetch the current space weather bundle used by Home Assistant entities."""
        responses, errors, error_details = await gather_api_requests(
            {
                "a_index": self.async_get_a_index(),
                "k_index": self.async_get_k_index(location=k_index_location),
                "dst_index": self.async_get_dst_index(),
                "magnetic_alert": self.async_get_alert("get-mag-alert"),
                "magnetic_warning": self.async_get_alert("get-mag-warning"),
                "aurora_alert": self.async_get_alert("get-aurora-alert"),
                "aurora_watch": self.async_get_alert("get-aurora-watch"),
                "aurora_outlook": self.async_get_alert("get-aurora-outlook"),
            }
        )
        if not responses:
            raise AusBomSpaceWeatherApiError("All BOM SWS current data requests failed")

        payload = {
            "fetched_at": datetime.now(UTC).isoformat(),
            "k_index_location": k_index_location,
            "a_index": latest_entry(responses.get("a_index")),
            "k_index": latest_entry(responses.get("k_index")),
            "dst_index": latest_entry(responses.get("dst_index")),
            "magnetic_alert": latest_entry(responses.get("magnetic_alert")),
            "magnetic_warning": latest_entry(responses.get("magnetic_warning")),
            "aurora_alert": latest_entry(responses.get("aurora_alert")),
            "aurora_watch": latest_entry(responses.get("aurora_watch")),
            "aurora_outlook": latest_entry(responses.get("aurora_outlook")),
        }
        if errors:
            payload["errors"] = errors
        if error_details:
            payload["error_details"] = error_details
        return payload

    async def async_get_history_bundle(
        self,
        *,
        k_index_location: str,
        start: datetime,
        end: datetime,
    ) -> dict[str, Any]:
        """Fetch historical A, K and Dst index data for graphing."""
        start_text = format_api_time(start)
        end_text = format_api_time(end)
        responses, errors, error_details = await gather_api_requests(
            {
                "a_index": self.async_get_a_index(start=start_text, end=end_text),
                "k_index": self.async_get_k_index(
                    location=k_index_location,
                    start=start_text,
                    end=end_text,
                ),
                "dst_index": self.async_get_dst_index(start=start_text, end=end_text),
            }
        )
        if not responses:
            raise AusBomSpaceWeatherApiError("All BOM SWS history requests failed")

        payload = {
            "fetched_at": datetime.now(UTC).isoformat(),
            "start": start_text,
            "end": end_text,
            "k_index_location": k_index_location,
            "a_index": data_entries(responses.get("a_index")),
            "k_index": data_entries(responses.get("k_index")),
            "dst_index": data_entries(responses.get("dst_index")),
        }
        if errors:
            payload["errors"] = errors
        if error_details:
            payload["error_details"] = error_details
        return payload

    async def _async_post(
        self,
        method: str,
        options: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        """POST to one BOM SWS method and return the decoded response."""
        payload: dict[str, Any] = {"api_key": self._api_key}
        if options:
            payload["options"] = dict(options)

        url = f"{self._base_url}/{method.strip('/')}"
        try:
            async with asyncio.timeout(self._timeout_seconds):
                async with self._session.post(
                    url,
                    headers={"Content-Type": "application/json; charset=utf-8"},
                    json=payload,
                ) as response:
                    response_payload = await read_json_response(response)
                    error_details = api_error_details_from_payload(response_payload)
                    error_message = format_api_errors(response_payload)
                    if is_auth_error_response(response.status, error_details):
                        raise AusBomSpaceWeatherAuthError(
                            error_message,
                            error_details=error_details,
                        )
                    if response.status >= 400:
                        raise AusBomSpaceWeatherApiError(
                            error_message,
                            error_details=error_details,
                        )
                    if not isinstance(response_payload, dict):
                        raise AusBomSpaceWeatherApiError("BOM SWS returned a non-object response")
                    return response_payload
        except TimeoutError as exc:
            raise AusBomSpaceWeatherApiError("Timed out while contacting BOM SWS") from exc
        except ClientError as exc:
            raise AusBomSpaceWeatherApiError(f"Could not contact BOM SWS: {exc}") from exc


def options_for_location(
    location: str,
    start: str | None = None,
    end: str | None = None,
) -> dict[str, str]:
    """Build index endpoint options while omitting absent historical bounds."""
    options = {"location": location}
    if start:
        options["start"] = start
    if end:
        options["end"] = end
    return options


async def gather_api_requests(
    requests: Mapping[str, Awaitable[dict[str, Any]]],
) -> tuple[dict[str, dict[str, Any]], dict[str, str], dict[str, list[dict[str, str]]]]:
    """Gather BOM requests while preserving partial non-auth failures."""
    keys = tuple(requests.keys())
    results = await asyncio.gather(*requests.values(), return_exceptions=True)
    responses: dict[str, dict[str, Any]] = {}
    errors: dict[str, str] = {}
    error_details: dict[str, list[dict[str, str]]] = {}

    for key, result in zip(keys, results, strict=True):
        if isinstance(result, AusBomSpaceWeatherAuthError):
            raise result
        if isinstance(result, Exception):
            errors[key] = sanitized_exception_message(result)
            if isinstance(result, AusBomSpaceWeatherApiError) and result.error_details:
                error_details[key] = api_error_details_from_payload({"errors": result.error_details})
            continue
        responses[key] = result

    return responses, errors, error_details


async def read_json_response(response: Any) -> Any:
    """Read an aiohttp response as JSON, preserving useful text on parse failure."""
    try:
        return await response.json(content_type=None)
    except Exception as exc:  # noqa: BLE001 - third-party response parsers vary.
        text = await response.text()
        sanitized_text = sanitize_error_message(text) or "empty response"
        raise AusBomSpaceWeatherApiError(
            f"BOM SWS returned an invalid JSON response: {sanitized_text[:200]}"
        ) from exc


def latest_entry(payload: Mapping[str, Any] | None) -> dict[str, Any] | None:
    """Return the newest object from a BOM response data array."""
    for item in reversed(data_entries(payload)):
        return item
    return None


def data_entries(payload: Mapping[str, Any] | None) -> list[dict[str, Any]]:
    """Return all object entries from a BOM response data array."""
    if not payload:
        return []
    data = payload.get("data")
    if not isinstance(data, list):
        return []
    return [dict(item) for item in iter_data_mappings(data)]


def iter_data_mappings(items: list[Any]) -> Iterator[Mapping[str, Any]]:
    """Yield object entries from BOM data arrays, including nested demo arrays."""
    for item in items:
        if isinstance(item, Mapping):
            yield item
        elif isinstance(item, list):
            yield from iter_data_mappings(item)


def format_api_errors(payload: Any) -> str:
    """Format BOM SWS API errors into a readable message."""
    messages = []
    for error in api_error_details_from_payload(payload):
        code = error.get("code")
        message = error.get("message")
        if code and message:
            messages.append(f"{code}: {message}")
        elif message:
            messages.append(message)
    if messages:
        return "; ".join(messages)
    return "BOM SWS request failed"


def is_auth_error_response(status: int, error_details: list[dict[str, str]]) -> bool:
    """Return true for BOM auth/permission failures documented as 403."""
    if status != 403:
        return False
    codes = {detail.get("code") for detail in error_details if detail.get("code")}
    return not codes or bool(codes & BOM_AUTH_ERROR_CODES)


def api_error_details_from_payload(payload: Any) -> list[dict[str, str]]:
    """Return sanitized BOM error detail objects from a response payload."""
    if not isinstance(payload, Mapping):
        return []
    errors = payload.get("errors")
    if not isinstance(errors, list):
        return []
    details = []
    for error in errors:
        if not isinstance(error, Mapping):
            continue
        detail: dict[str, str] = {}
        code = normalized_api_error_code(error.get("code"))
        message = sanitize_error_message(error.get("message"))
        if code:
            detail["code"] = code
            if meaning := BOM_API_ERROR_CODES.get(code):
                detail["meaning"] = meaning
        if message:
            detail["message"] = message
        if detail:
            details.append(detail)
    return details


def normalized_api_error_code(code: Any) -> str | None:
    """Normalize BOM error-code values so int 1 and string 01 compare equally."""
    if code is None:
        return None
    text = str(code).strip()
    if not text:
        return None
    return text.zfill(2) if text.isdigit() else text


def sanitized_exception_message(error: Exception) -> str:
    """Return an exception string with sensitive API details redacted."""
    return sanitize_error_message(str(error)) or error.__class__.__name__


def sanitize_error_message(message: Any) -> str | None:
    """Avoid leaking API keys through Home Assistant errors and entity attributes."""
    if not message:
        return None
    text = str(message)
    text = re.sub(r"Unsupported API key:\s*[^,;<>\s]+", "Unsupported API key", text, flags=re.IGNORECASE)
    text = re.sub(r'("api_key"\s*:\s*")[^"]+(")', r"\1REDACTED\2", text, flags=re.IGNORECASE)
    text = re.sub(r"('api_key'\s*:\s*')[^']+(')", r"\1REDACTED\2", text, flags=re.IGNORECASE)
    text = re.sub(r"(\bapi[_ -]?key\s*[=:]\s*)[^,;&<>\s]+", r"\1REDACTED", text, flags=re.IGNORECASE)
    return text


def coerce_number(value: Any) -> int | float | None:
    """Coerce BOM numeric fields, which are sometimes strings, to numbers."""
    if value in (None, "") or isinstance(value, bool):
        return None
    if isinstance(value, int | float):
        return value
    try:
        number = float(str(value))
    except (TypeError, ValueError):
        return None
    if number.is_integer():
        return int(number)
    return number


def format_api_time(value: datetime) -> str:
    """Format a datetime for BOM SWS API historical request bounds."""
    return value.astimezone(UTC).strftime("%Y-%m-%d %H:%M:%S")
