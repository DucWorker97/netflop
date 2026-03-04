"""
Redis caching layer for AI Curator recommendations.
Provides async get/set with JSON serialization and configurable TTL.
"""

import json
from typing import Any, Optional

import redis.asyncio as aioredis

from .config import settings

# Default TTLs (seconds)
TTL_RECOMMENDATIONS = 15 * 60  # 15 min – personalised, refreshes often
TTL_SIMILAR = 60 * 60          # 1 hour – content-based, stable
TTL_TRENDING = 15 * 60         # 15 min – popularity shifts
TTL_POPULARITY = 60 * 60       # 1 hour – recomputed periodically

# Key prefixes
_PREFIX = "ai-curator"


def _key(namespace: str, *parts: str) -> str:
    return f"{_PREFIX}:{namespace}:{':'.join(parts)}"


class RecommendationCache:
    """Thin async Redis wrapper with JSON serialization."""

    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None

    async def connect(self):
        """Create connection pool.  Safe to call multiple times."""
        if self._redis is not None:
            return
        try:
            self._redis = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=3,
            )
            await self._redis.ping()
            print("[OK] Redis cache connected")
        except Exception as e:
            print(f"[WARN] Redis unavailable – caching disabled: {e}")
            self._redis = None

    async def close(self):
        if self._redis:
            await self._redis.aclose()
            self._redis = None

    # ── generic helpers ──────────────────────────────────────────────

    async def get(self, key: str) -> Optional[Any]:
        if not self._redis:
            return None
        try:
            raw = await self._redis.get(key)
            return json.loads(raw) if raw else None
        except Exception:
            return None

    async def set(self, key: str, value: Any, ttl: int = 300):
        if not self._redis:
            return
        try:
            await self._redis.set(key, json.dumps(value, default=str), ex=ttl)
        except Exception:
            pass  # cache write failures are non-fatal

    async def delete(self, key: str):
        if not self._redis:
            return
        try:
            await self._redis.delete(key)
        except Exception:
            pass

    async def invalidate_prefix(self, prefix: str):
        """Delete all keys matching a prefix (scan-based, safe for prod)."""
        if not self._redis:
            return
        try:
            cursor = 0
            while True:
                cursor, keys = await self._redis.scan(cursor, match=f"{prefix}*", count=100)
                if keys:
                    await self._redis.delete(*keys)
                if cursor == 0:
                    break
        except Exception:
            pass

    # ── domain-specific API ──────────────────────────────────────────

    async def get_recommendations(self, user_id: str, limit: int) -> Optional[list]:
        return await self.get(_key("recs", user_id, str(limit)))

    async def set_recommendations(self, user_id: str, limit: int, data: list):
        await self.set(_key("recs", user_id, str(limit)), data, TTL_RECOMMENDATIONS)

    async def get_similar(self, movie_id: str, limit: int) -> Optional[list]:
        return await self.get(_key("similar", movie_id, str(limit)))

    async def set_similar(self, movie_id: str, limit: int, data: list):
        await self.set(_key("similar", movie_id, str(limit)), data, TTL_SIMILAR)

    async def get_trending(self, days: int, limit: int) -> Optional[list]:
        return await self.get(_key("trending", str(days), str(limit)))

    async def set_trending(self, days: int, limit: int, data: list):
        await self.set(_key("trending", str(days), str(limit)), data, TTL_TRENDING)

    async def invalidate_user(self, user_id: str):
        """Called after a rating/watch event to bust that user's cache."""
        await self.invalidate_prefix(_key("recs", user_id))

    async def invalidate_movie(self, movie_id: str):
        """Called after movie metadata changes."""
        await self.invalidate_prefix(_key("similar", movie_id))

    async def invalidate_all(self):
        """Full cache flush (used after retrain)."""
        await self.invalidate_prefix(f"{_PREFIX}:")


# Module-level singleton
cache = RecommendationCache()
