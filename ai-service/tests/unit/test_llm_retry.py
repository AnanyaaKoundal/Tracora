"""The production retry path: transient faults get another attempt, terminal ones do not.

The eval pacer retries throttles but only exists during a run. This is the retry the
running service uses, so one 429 or timeout does not become a failed turn. The loop must
also tell a genuine outage apart from the model simply having nothing to say.
"""

import pytest

from app.config import settings
from app.core.llm import providers
from app.core.llm.providers import (
    Backend,
    BackendError,
    BackendUnavailable,
    Completion,
    is_retryable,
    invoke_retrying,
    retry_delay,
)
from app.domains.agent import loop

pytestmark = pytest.mark.unit


def _backend() -> Backend:
    return Backend(name="groq", shape="openai", model="m", base_url="u", env_key="k")


@pytest.mark.parametrize("status", [408, 409, 425, 429, 500, 502, 503, 504])
def test_transient_statuses_are_retryable(status):
    assert is_retryable(BackendError("groq", status, "u", "x"))


@pytest.mark.parametrize("status", [400, 401, 403, 404, 422])
def test_terminal_statuses_are_not_retryable(status):
    assert not is_retryable(BackendError("groq", status, "u", "x"))


def test_missing_status_is_retryable():
    assert is_retryable(BackendUnavailable("provider returned no content"))


def test_retry_delay_prefers_a_capped_retry_after(monkeypatch):
    monkeypatch.setattr(settings, "llm_retry_max_seconds", 20.0)
    assert retry_delay(3, retry_after=7.0) == 7.0
    assert retry_delay(3, retry_after=999.0) == 20.0


def test_retry_delay_grows_then_caps(monkeypatch):
    monkeypatch.setattr(settings, "llm_retry_base_seconds", 1.0)
    monkeypatch.setattr(settings, "llm_retry_max_seconds", 4.0)
    monkeypatch.setattr(providers.random, "uniform", lambda _a, _b: 0.0)
    assert retry_delay(1) == 1.0
    assert retry_delay(2) == 2.0
    assert retry_delay(5) == 4.0


def test_invoke_retrying_succeeds_after_transient_failures(monkeypatch):
    monkeypatch.setattr(settings, "llm_max_attempts", 3)
    monkeypatch.setattr(settings, "llm_retry_base_seconds", 0.0)
    monkeypatch.setattr(providers.time, "sleep", lambda _s: None)
    calls = {"n": 0}

    def flaky(*_args, **_kwargs):
        calls["n"] += 1
        if calls["n"] < 3:
            raise BackendError("groq", 429, "u", "slow down")
        return "ok"

    monkeypatch.setattr(providers, "invoke", flaky)
    assert invoke_retrying(_backend(), [], None, 1, 0.0) == "ok"
    assert calls["n"] == 3


def test_invoke_retrying_does_not_retry_a_terminal_error(monkeypatch):
    monkeypatch.setattr(settings, "llm_max_attempts", 5)
    monkeypatch.setattr(providers.time, "sleep", lambda _s: None)
    calls = {"n": 0}

    def terminal(*_args, **_kwargs):
        calls["n"] += 1
        raise BackendError("groq", 400, "u", "bad request")

    monkeypatch.setattr(providers, "invoke", terminal)
    with pytest.raises(BackendError):
        invoke_retrying(_backend(), [], None, 1, 0.0)
    assert calls["n"] == 1


def test_invoke_retrying_stops_once_the_deadline_has_passed(monkeypatch):
    monkeypatch.setattr(settings, "llm_max_attempts", 5)
    calls = {"n": 0}

    def always(*_args, **_kwargs):
        calls["n"] += 1
        raise BackendError("groq", 503, "u", "overloaded")

    monkeypatch.setattr(providers, "invoke", always)
    with pytest.raises(BackendError):
        invoke_retrying(
            _backend(), [], None, 1, 0.0, deadline=providers.time.monotonic() - 1
        )
    assert calls["n"] == 1


def test_invoke_retrying_honours_retry_after(monkeypatch):
    monkeypatch.setattr(settings, "llm_max_attempts", 2)
    slept: list[float] = []
    monkeypatch.setattr(providers.time, "sleep", lambda seconds: slept.append(seconds))
    calls = {"n": 0}

    def throttled(*_args, **_kwargs):
        calls["n"] += 1
        if calls["n"] == 1:
            raise BackendError("groq", 429, "u", "slow down", retry_after=3.0)
        return "ok"

    monkeypatch.setattr(providers, "invoke", throttled)
    assert invoke_retrying(_backend(), [], None, 1, 0.0) == "ok"
    assert slept == [3.0]


def test_run_turn_reports_unavailable_when_the_backend_fails(monkeypatch):
    def boom(*_args, **_kwargs):
        raise BackendUnavailable("all chat backends failed")

    monkeypatch.setattr(loop, "complete", boom)
    reply, steps, citations = loop.run_turn("hello", "CMP-1")
    assert reply == loop.UNAVAILABLE_REPLY
    assert steps == []
    assert citations == []


def test_run_turn_uses_the_step_budget_message_when_the_model_is_silent(monkeypatch):
    def silent(*_args, **_kwargs):
        return Completion(content=None, tool_calls=[])

    monkeypatch.setattr(loop, "complete", silent)
    reply, _steps, _citations = loop.run_turn("hello", "CMP-1")
    assert reply == loop.FALLBACK_REPLY
