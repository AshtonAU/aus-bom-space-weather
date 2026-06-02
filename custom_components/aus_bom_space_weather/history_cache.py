"""Small async cache for BOM SWS history payloads."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

HistoryFetcher = Callable[[datetime, datetime], Awaitable[dict[str, Any]]]
NowFunc = Callable[[], datetime]


@dataclass(slots=True)
class CachedHistoryBundle:
    """Cached history response and the time it was fetched."""

    fetched_at: datetime
    payload: dict[str, Any]


class HistoryBundleCache:
    """Cache and de-duplicate historical BOM SWS index requests."""

    def __init__(
        self,
        *,
        ttl: timedelta,
        now_func: NowFunc | None = None,
    ) -> None:
        self._ttl = ttl
        self._now_func = now_func or (lambda: datetime.now(UTC))
        self._cache: dict[int, CachedHistoryBundle] = {}
        self._inflight: dict[int, asyncio.Task[dict[str, Any]]] = {}

    async def async_get(
        self,
        *,
        hours: int,
        fetcher: HistoryFetcher,
    ) -> dict[str, Any]:
        """Return cached history or fetch it once for concurrent callers."""
        cache_key = int(hours)
        now = self._now()
        cached = self._cache.get(cache_key)
        if cached is not None and now - cached.fetched_at < self._ttl:
            return cached.payload

        if inflight := self._inflight.get(cache_key):
            return await inflight

        start = now - timedelta(hours=cache_key)
        task = asyncio.create_task(fetcher(start, now))
        self._inflight[cache_key] = task
        try:
            payload = await task
        finally:
            self._inflight.pop(cache_key, None)

        self._cache[cache_key] = CachedHistoryBundle(fetched_at=now, payload=payload)
        return payload

    def clear(self) -> None:
        """Clear cached payloads while leaving active fetches alone."""
        self._cache.clear()

    def _now(self) -> datetime:
        """Return a timezone-aware current timestamp."""
        now = self._now_func()
        if now.tzinfo is None:
            return now.replace(tzinfo=UTC)
        return now.astimezone(UTC)
