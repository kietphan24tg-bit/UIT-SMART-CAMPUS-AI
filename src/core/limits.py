from __future__ import annotations

import threading
import time
from contextlib import contextmanager
from dataclasses import dataclass

from fastapi import HTTPException, status

from src.core.config import settings

try:
    from redis import Redis
    from redis.exceptions import RedisError
except ImportError:  # pragma: no cover
    Redis = None

    class RedisError(Exception):
        pass


@dataclass(frozen=True)
class RateLimitPolicy:
    limit: int
    window_seconds: int
    fail_closed: bool = False


class GuardrailStore:
    def __init__(self, redis_url: str | None = None) -> None:
        self.redis_url = redis_url or settings.redis_url
        self._local_lock = threading.Lock()
        self._local_counters: dict[str, tuple[int, float]] = {}
        self._local_concurrency: dict[str, tuple[int, float]] = {}
        self._redis = None

    @property
    def available(self) -> bool:
        return bool(self.redis_url and Redis is not None)

    def ping(self) -> bool:
        if not self.available:
            return False
        try:
            self._client().ping()
            return True
        except RedisError:
            return False

    def enforce_rate_limit(self, key: str, policy: RateLimitPolicy) -> None:
        try:
            count = self._increment(key, policy.window_seconds)
        except RedisError:
            if policy.fail_closed:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Rate limiting backend is unavailable.",
                )
            count = self._increment_local(key, policy.window_seconds)

        if count > policy.limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Retry later.",
            )

    @contextmanager
    def concurrency_slot(self, key: str, limit: int):
        claimed = False
        try:
            current = self._increment_concurrency(key, ttl_seconds=max(int(settings.agent_total_timeout_seconds), 30))
            if current > limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many concurrent requests for this user.",
                )
            claimed = True
            yield
        finally:
            if claimed:
                self._decrement_concurrency(key)

    def _client(self):
        if self._redis is None:
            if Redis is None or not self.redis_url:
                raise RedisError("Redis is unavailable.")
            self._redis = Redis.from_url(self.redis_url, decode_responses=True)
        return self._redis

    def _increment(self, key: str, ttl_seconds: int) -> int:
        client = self._client()
        value = client.incr(key)
        if value == 1:
            client.expire(key, ttl_seconds)
        return int(value)

    def _increment_concurrency(self, key: str, ttl_seconds: int) -> int:
        if self.available:
            try:
                client = self._client()
                value = client.incr(key)
                client.expire(key, ttl_seconds)
                return int(value)
            except RedisError:
                pass
        return self._increment_local_concurrency(key, ttl_seconds)

    def _decrement_concurrency(self, key: str) -> None:
        if self.available:
            try:
                client = self._client()
                client.decr(key)
                return
            except RedisError:
                pass
        with self._local_lock:
            current, expires_at = self._local_concurrency.get(key, (0, 0.0))
            next_value = max(current - 1, 0)
            if next_value == 0:
                self._local_concurrency.pop(key, None)
            else:
                self._local_concurrency[key] = (next_value, expires_at)

    def _increment_local(self, key: str, ttl_seconds: int) -> int:
        now = time.monotonic()
        with self._local_lock:
            current, expires_at = self._local_counters.get(key, (0, 0.0))
            if expires_at <= now:
                current = 0
            current += 1
            self._local_counters[key] = (current, now + ttl_seconds)
            return current

    def _increment_local_concurrency(self, key: str, ttl_seconds: int) -> int:
        now = time.monotonic()
        with self._local_lock:
            current, expires_at = self._local_concurrency.get(key, (0, 0.0))
            if expires_at <= now:
                current = 0
            current += 1
            self._local_concurrency[key] = (current, now + ttl_seconds)
            return current


guardrail_store = GuardrailStore()
