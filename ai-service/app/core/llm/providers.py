"""Pluggable chat backends behind one `chat()` call.

Every backend speaks either Ollama's native API or the OpenAI-compatible
`/chat/completions` shape, so adding a provider is a registry entry, not a code
change. The active backend is chosen by config, never by the model or the request.

Backend order for `LLM_BACKEND=auto` is `LLM_FALLBACK_ORDER`. Paid backends are
skipped unless `LLM_ALLOW_PAID=true`, so a demo can never quietly start spending
money because a free tier hit its limit.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Callable

from app.config import settings
from app.core.logging import Stage, log, log_verbose

OPENAI_SHAPE = "openai"
OLLAMA_SHAPE = "ollama"

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
HF_ROUTER_ROOT = "https://router.huggingface.co"
OPENAI_BASE_URL = "https://api.openai.com/v1"

UNPAID = frozenset({"ollama", "groq", "hf"})


class BackendUnavailable(RuntimeError):
    """A backend is not configured, or refused the request. Try the next one."""


@dataclass(frozen=True)
class Backend:
    name: str
    shape: str
    model: str
    base_url: str | None = None
    env_key: str | None = None
    # A backend with no key requirement (local Ollama) is always available.
    needs_key: bool = True

    def api_key(self) -> str:
        if not self.needs_key:
            return ""
        if not self.env_key:
            raise BackendUnavailable(f"backend '{self.name}' has no credential mapping")
        value = (getattr(settings, self.env_key, "") or os.environ.get(self.env_key, "")).strip()
        if not value:
            raise BackendUnavailable(
                f"backend '{self.name}' needs {self.env_key} to be set in the environment"
            )
        return value

    def is_available(self) -> bool:
        if not self.needs_key:
            return True
        try:
            self.api_key()
        except BackendUnavailable:
            return False
        return True


def _hf_base_url() -> str:
    """Pin a provider subpath when configured.

    `supports_structured_output` is a per-provider property, not a per-model one, so
    the unpinned router can land on a provider that ignores the schema. Pinning keeps
    the guarantee. Leave blank to use the router's own default routing.
    """
    provider = (settings.hf_provider or "").strip().strip("/")
    if provider:
        return f"{HF_ROUTER_ROOT}/{provider}/v1"
    return f"{HF_ROUTER_ROOT}/v1"


def registry() -> dict[str, Backend]:
    return {
        "ollama": Backend(
            name="ollama",
            shape=OLLAMA_SHAPE,
            model=settings.ollama_chat_model,
            needs_key=False,
        ),
        "groq": Backend(
            name="groq",
            shape=OPENAI_SHAPE,
            model=settings.groq_model,
            base_url=GROQ_BASE_URL,
            env_key="groq_api_key",
        ),
        "hf": Backend(
            name="hf",
            shape=OPENAI_SHAPE,
            model=settings.hf_model,
            base_url=_hf_base_url(),
            env_key="hf_token",
        ),
        "openai": Backend(
            name="openai",
            shape=OPENAI_SHAPE,
            model=settings.openai_model,
            base_url=OPENAI_BASE_URL,
            env_key="openai_api_key",
        ),
    }


def resolve_order() -> list[Backend]:
    """Backends to try, in order, for this request.

    `LLM_BACKEND` names a single backend to pin. `auto` walks `LLM_FALLBACK_ORDER` and
    drops anything unconfigured, so a missing API key degrades to the next option
    instead of raising.
    """
    known = registry()
    wanted = (settings.llm_backend or "ollama").strip().lower()

    if wanted != "auto":
        backend = known.get(wanted)
        if backend is None:
            valid = ", ".join(sorted(known)) + ", auto"
            raise BackendUnavailable(f"unknown LLM_BACKEND '{wanted}'. valid: {valid}")
        return [backend]

    order: list[Backend] = []
    for raw in (settings.llm_fallback_order or "").split(","):
        name = raw.strip().lower()
        if not name:
            continue
        backend = known.get(name)
        if backend is None:
            continue
        if name not in UNPAID and not settings.llm_allow_paid:
            continue
        if not backend.is_available():
            continue
        order.append(backend)
    return order


def call_openai_compatible(
    backend: Backend,
    messages: list[dict[str, Any]],
    json_schema: dict[str, Any] | None,
    max_tokens: int,
    temperature: float,
) -> str:
    import httpx

    payload: dict[str, Any] = {
        "model": backend.model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False,
    }

    if json_schema is not None:
        schema_block: dict[str, Any] = {"name": "response", "schema": json_schema}
        if settings.llm_strict_schema:
            schema_block["strict"] = True
        payload["response_format"] = {"type": "json_schema", "json_schema": schema_block}

    response = httpx.post(
        f"{backend.base_url}/chat/completions",
        json=payload,
        headers={"Authorization": f"Bearer {backend.api_key()}"},
        timeout=settings.llm_timeout_seconds,
    )

    if response.status_code >= 400:
        raise BackendUnavailable(
            f"{backend.name} returned {response.status_code}: {response.text[:300]}"
        )

    body = response.json()
    choice = body["choices"][0]
    message = choice["message"]
    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        # Reasoning models can spend the whole budget on a thinking channel and
        # return an empty answer. Surface that instead of a bare JSON error.
        raise BackendUnavailable(
            f"{backend.name} returned no content (finish_reason={choice.get('finish_reason')})"
        )

    usage = body.get("usage") or {}
    return content, {
        "prompt_tokens": usage.get("prompt_tokens"),
        "completion_tokens": usage.get("completion_tokens"),
        "total_tokens": usage.get("total_tokens"),
        "finish_reason": choice.get("finish_reason"),
    }


def call_ollama(
    backend: Backend,
    messages: list[dict[str, Any]],
    json_schema: dict[str, Any] | None,
    max_tokens: int,
    temperature: float,
) -> str:
    import httpx

    payload: dict[str, Any] = {
        "model": backend.model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": temperature, "num_predict": max_tokens},
        "format": json_schema if json_schema is not None else "json",
    }

    response = httpx.post(
        f"{settings.ollama_host}/api/chat",
        json=payload,
        timeout=settings.llm_timeout_seconds,
    )

    if response.status_code >= 400:
        raise BackendUnavailable(
            f"{backend.name} returned {response.status_code}: {response.text[:300]}"
        )

    body = response.json()
    content = body["message"]["content"]
    if not isinstance(content, str) or not content.strip():
        raise BackendUnavailable(f"{backend.name} returned no content")
    return content, {
        "prompt_tokens": body.get("prompt_eval_count"),
        "completion_tokens": body.get("eval_count"),
    }


Dispatcher = Callable[
    [Backend, list[dict[str, Any]], dict[str, Any] | None, int, float],
    tuple[str, dict[str, Any]],
]

_DISPATCH: dict[str, Dispatcher] = {
    OPENAI_SHAPE: call_openai_compatible,
    OLLAMA_SHAPE: call_ollama,
}


def invoke(
    backend: Backend,
    messages: list[dict[str, Any]],
    json_schema: dict[str, Any] | None,
    max_tokens: int,
    temperature: float,
) -> tuple[str, dict[str, Any]]:
    """One model call, timed and logged. Returns content plus token usage."""
    dispatch = _DISPATCH[backend.shape]
    # The backend name matters as much as the model: groq and hf serve the identical
    # "openai/gpt-oss-120b" string, so the model alone cannot say who answered or
    # whether the call was free.
    log(
        "llm.start",
        model=backend.model,
        backend=backend.name,
        cost="paid" if backend.name not in UNPAID else "free",
    )

    with Stage("llm") as stage:
        content, usage = dispatch(
            backend, messages, json_schema, max_tokens, temperature
        )
        # One token figure, not five. prompt/completion split is only interesting when
        # hunting a prompt that grew, and LOG_VERBOSE covers that.
        stage.add(tokens=usage.get("total_tokens"))
        log_verbose("llm.preview", preview=content)
        return content, usage
