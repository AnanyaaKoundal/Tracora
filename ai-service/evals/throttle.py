"""Rate-limit handling for live eval runs.

A free tier (Groq, HF router) enforces requests-per-minute and tokens-per-minute. Without
spacing, a 41-case run trips a 429 and the runner records it as a FAIL, so a rate limit
looks like a model failure and the baseline is garbage.

This paces model calls and retries the ones that still get throttled. It lives entirely
at the eval layer: it swaps the OpenAI-shaped dispatch function on the providers module
while a run is active and restores it afterwards, so no production code changes and the
loop's own single-attempt failover is untouched.

Only OpenAI-shaped backends (groq, hf, openai) are paced. Ollama is local and has no
quota, so its dispatch is left alone.
"""

from __future__ import annotations

import random
import time
from contextlib import contextmanager
from typing import Iterator

from app.core.llm import providers
from app.core.llm.providers import OPENAI_SHAPE

# 429 is the obvious one; some providers signal overload with 503.
_RATE_LIMIT_STATUS = {429, 503}
_RATE_LIMIT_HINTS = ("429", "rate limit", "rate_limit", "too many requests", "overloaded")


def is_rate_limit(exc: BaseException) -> bool:
    """True if an exception is a throttle response worth retrying.

    `BackendError` carries the HTTP status, so that is checked directly. Anything else
    (e.g. the generic `BackendUnavailable` the fallback loop raises after wrapping the
    cause) is matched on its text.
    """
    if getattr(exc, "status", None) in _RATE_LIMIT_STATUS:
        return True
    text = str(exc).lower()
    return any(hint in text for hint in _RATE_LIMIT_HINTS)


class Pacer:
    """Spacing between calls plus exponential backoff on a throttle response."""

    def __init__(
        self,
        *,
        pace: float = 0.0,
        retries: int = 0,
        base_delay: float = 2.0,
        max_delay: float = 60.0,
        jitter: float = 0.25,
    ) -> None:
        self.pace = max(0.0, pace)
        self.retries = max(0, retries)
        self.base_delay = max(0.0, base_delay)
        self.max_delay = max(self.base_delay, max_delay)
        self.jitter = jitter
        self.retried = 0
        self._last = 0.0

    def wait_turn(self) -> None:
        gap = self.pace - (time.monotonic() - self._last)
        if gap > 0:
            time.sleep(gap)

    def delay(self, attempt: int) -> float:
        backoff = min(self.max_delay, self.base_delay * (2 ** (attempt - 1)))
        return backoff + random.uniform(0, self.jitter * backoff)


@contextmanager
def paced(pacer: Pacer) -> Iterator[Pacer]:
    """Swap the OpenAI-shaped dispatch for a pacing/retrying wrapper for the run."""
    original = providers._DISPATCH[OPENAI_SHAPE]

    def dispatch(
        backend,
        messages,
        json_schema,
        max_tokens,
        temperature,
        tools=None,
        tool_choice=None,
    ):
        for attempt in range(pacer.retries + 1):
            pacer.wait_turn()
            try:
                result = original(
                    backend, messages, json_schema, max_tokens, temperature, tools, tool_choice
                )
            except Exception as exc:  # noqa: BLE001 - re-raised unless it is throttleable
                pacer._last = time.monotonic()
                if not is_rate_limit(exc) or attempt >= pacer.retries:
                    raise
                pacer.retried += 1
                delay = pacer.delay(attempt + 1)
                print(
                    f"    [pace] rate limited; retry {attempt + 1}/{pacer.retries} "
                    f"in {delay:.1f}s"
                )
                time.sleep(delay)
            else:
                pacer._last = time.monotonic()
                return result
        raise AssertionError("unreachable")

    providers._DISPATCH[OPENAI_SHAPE] = dispatch
    try:
        yield pacer
    finally:
        providers._DISPATCH[OPENAI_SHAPE] = original
