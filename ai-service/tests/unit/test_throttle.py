"""The eval pacer: it must retry throttles, leave other errors alone, and restore state.

The pacer is what makes a free tier (Groq) usable. If it silently failed to retry, a
429 would be scored as a model failure; if it failed to restore the dispatch, it would
leak into the rest of the process.
"""

import pytest

from app.core.llm import providers
from app.core.llm.providers import OPENAI_SHAPE, BackendError
from evals import throttle

pytestmark = pytest.mark.unit


def _install(monkeypatch, func):
    monkeypatch.setitem(providers._DISPATCH, OPENAI_SHAPE, func)


def test_is_rate_limit_on_status_and_text():
    assert throttle.is_rate_limit(BackendError("groq", 429, "u", "slow down"))
    assert throttle.is_rate_limit(BackendError("groq", 503, "u", "overloaded"))
    assert throttle.is_rate_limit(RuntimeError("429 Too Many Requests"))
    assert not throttle.is_rate_limit(BackendError("groq", 400, "u", "bad request"))


def test_paced_retries_then_succeeds(monkeypatch):
    calls = {"n": 0}

    def flaky(backend, messages, schema, max_tokens, temperature, tools=None, tool_choice=None):
        calls["n"] += 1
        if calls["n"] < 3:
            raise BackendError("groq", 429, "u", "slow down")
        return "ok"

    _install(monkeypatch, flaky)
    monkeypatch.setattr(throttle.time, "sleep", lambda _s: None)

    pacer = throttle.Pacer(pace=0, retries=3, base_delay=0)
    with throttle.paced(pacer):
        result = providers._DISPATCH[OPENAI_SHAPE](object(), [], None, 1, 0.0)

    assert result == "ok"
    assert calls["n"] == 3
    assert pacer.retried == 2


def test_paced_does_not_retry_non_throttle(monkeypatch):
    calls = {"n": 0}

    def failing(backend, messages, schema, max_tokens, temperature, tools=None, tool_choice=None):
        calls["n"] += 1
        raise BackendError("groq", 400, "u", "bad request")

    _install(monkeypatch, failing)
    monkeypatch.setattr(throttle.time, "sleep", lambda _s: None)

    with throttle.paced(throttle.Pacer(pace=0, retries=5, base_delay=0)):
        with pytest.raises(BackendError):
            providers._DISPATCH[OPENAI_SHAPE](object(), [], None, 1, 0.0)

    assert calls["n"] == 1


def test_paced_gives_up_after_retries(monkeypatch):
    def always(backend, messages, schema, max_tokens, temperature, tools=None, tool_choice=None):
        raise BackendError("groq", 429, "u", "slow down")

    _install(monkeypatch, always)
    monkeypatch.setattr(throttle.time, "sleep", lambda _s: None)

    pacer = throttle.Pacer(pace=0, retries=2, base_delay=0)
    with throttle.paced(pacer):
        with pytest.raises(BackendError):
            providers._DISPATCH[OPENAI_SHAPE](object(), [], None, 1, 0.0)

    assert pacer.retried == 2


def test_paced_restores_dispatch():
    original = providers._DISPATCH[OPENAI_SHAPE]
    with throttle.paced(throttle.Pacer()):
        assert providers._DISPATCH[OPENAI_SHAPE] is not original
    assert providers._DISPATCH[OPENAI_SHAPE] is original
