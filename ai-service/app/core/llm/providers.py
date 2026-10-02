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
from dataclasses import dataclass, field
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


class BackendError(BackendUnavailable):
    """A backend answered with an HTTP error.

    Carries the status, url and full response body so the caller can log the cause
    directly instead of re-parsing it out of the message string.
    """

    def __init__(self, backend: str, status: int, url: str, body: str) -> None:
        super().__init__(f"{backend} returned {status}: {body}")
        self.backend_name = backend
        self.status = status
        self.url = url
        self.body = body


def _parse_arguments(raw: Any) -> dict[str, Any]:
    """Tool-call arguments arrive as a JSON string (OpenAI) or a ready dict (Ollama).

    A malformed string becomes an empty dict rather than an exception. The loop then
    sees a missing required argument and sends a correction back to the model, the same
    path a wrong tool name takes.
    """
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
        except (ValueError, TypeError):
            return {}
        return parsed if isinstance(parsed, dict) else {}
    return {}


@dataclass(frozen=True)
class ToolCall:
    """One function call the model asked for."""

    id: str
    name: str
    arguments: dict[str, Any]

    def as_openai_message(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "type": "function",
            "function": {
                "name": self.name,
                "arguments": json.dumps(self.arguments, ensure_ascii=False),
            },
        }


@dataclass
class Completion:
    """One model reply, shaped to carry either text or tool calls (or both)."""

    content: str | None
    tool_calls: list[ToolCall] = field(default_factory=list)
    usage: dict[str, Any] = field(default_factory=dict)
    finish_reason: str | None = None


def _parse_tool_calls(raw_calls: list[Any]) -> list[ToolCall]:
    """Read tool calls from either wire shape.

    OpenAI sends `{id, type, function:{name, arguments}}`, Ollama sends
    `{function:{name, arguments}}` with arguments already an object. The same reader
    covers both; the id is synthesized when a provider omits it.
    """
    calls: list[ToolCall] = []
    for index, raw in enumerate(raw_calls):
        if not isinstance(raw, dict):
            continue
        function = raw.get("function") if isinstance(raw.get("function"), dict) else {}
        calls.append(
            ToolCall(
                id=str(raw.get("id") or f"call_{index}"),
                name=str(function.get("name") or ""),
                arguments=_parse_arguments(function.get("arguments")),
            )
        )
    return calls


def _ollama_messages(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Translate the loop's OpenAI-shaped history into Ollama's shape.

    Ollama names the tool on the result message (tool_name) and wants arguments as an
    object, where OpenAI uses a tool_call id and a JSON string. Keeping the loop in one
    canonical format and translating here means every backend sees the same history.
    """
    id_to_name: dict[str, str] = {}
    translated: list[dict[str, Any]] = []
    for message in messages:
        role = message.get("role")
        if role == "assistant" and message.get("tool_calls"):
            calls = []
            for call in message["tool_calls"]:
                function = call.get("function") if isinstance(call.get("function"), dict) else {}
                calls.append(
                    {
                        "function": {
                            "name": function.get("name"),
                            "arguments": _parse_arguments(function.get("arguments")),
                        }
                    }
                )
                if call.get("id"):
                    id_to_name[str(call["id"])] = str(function.get("name") or "")
            translated.append(
                {
                    "role": "assistant",
                    "content": message.get("content") or "",
                    "tool_calls": calls,
                }
            )
        elif role == "tool":
            name = id_to_name.get(str(message.get("tool_call_id") or "")) or message.get("name")
            translated.append(
                {"role": "tool", "tool_name": name, "content": message.get("content") or ""}
            )
        else:
            translated.append({"role": role, "content": message.get("content") or ""})
    return translated


@dataclass(frozen=True)
class Backend:
    name: str
    shape: str
    model: str
    base_url: str | None = None
    env_key: str | None = None
    # A backend with no key requirement (local Ollama) is always available.
    needs_key: bool = True
    # Native tool calling is a model capability, not a wire-format one. A backend whose
    # model cannot do it is skipped for tool-driven turns but still serves plain-text
    # calls (titles, health checks).
    supports_tools: bool = True

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
            supports_tools=settings.ollama_supports_tools,
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
    tools: list[dict[str, Any]] | None = None,
    tool_choice: str | None = None,
) -> Completion:
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

    if tools:
        payload["tools"] = tools
        if tool_choice:
            payload["tool_choice"] = tool_choice

    url = f"{backend.base_url}/chat/completions"
    response = httpx.post(
        url,
        json=payload,
        headers={"Authorization": f"Bearer {backend.api_key()}"},
        timeout=settings.llm_timeout_seconds,
    )

    if response.status_code >= 400:
        # The full body, not a slice. An error body is the one place a provider tells
        # you exactly what it rejected; clipping it is how a 400 stays a mystery.
        raise BackendError(backend.name, response.status_code, url, response.text)

    body = response.json()
    choice = body["choices"][0]
    message = choice["message"]
    content = message.get("content")
    tool_calls = _parse_tool_calls(message.get("tool_calls") or [])
    if not tool_calls and (not isinstance(content, str) or not content.strip()):
        # Reasoning models can spend the whole budget on a thinking channel and
        # return an empty answer. Surface that instead of a bare JSON error. A turn
        # that asked for a tool is fine with no prose.
        raise BackendUnavailable(
            f"{backend.name} returned no content (finish_reason={choice.get('finish_reason')})"
        )

    usage = body.get("usage") or {}
    return Completion(
        content=content if isinstance(content, str) and content.strip() else None,
        tool_calls=tool_calls,
        usage={
            "prompt_tokens": usage.get("prompt_tokens"),
            "completion_tokens": usage.get("completion_tokens"),
            "total_tokens": usage.get("total_tokens"),
        },
        finish_reason=choice.get("finish_reason"),
    )


def call_ollama(
    backend: Backend,
    messages: list[dict[str, Any]],
    json_schema: dict[str, Any] | None,
    max_tokens: int,
    temperature: float,
    tools: list[dict[str, Any]] | None = None,
    tool_choice: str | None = None,
) -> Completion:
    import httpx

    payload: dict[str, Any] = {
        "model": backend.model,
        "messages": _ollama_messages(messages),
        "stream": False,
        "options": {"temperature": temperature, "num_predict": max_tokens},
    }
    # Only constrain output when a schema is asked for. The old code forced JSON on
    # every call; native tool calling needs plain prose for the final answer.
    if json_schema is not None:
        payload["format"] = json_schema
    if tools:
        # Ollama has no tool_choice. "none" is expressed by sending no tools, which the
        # loop already does for its forced answer.
        payload["tools"] = tools

    url = f"{settings.ollama_host}/api/chat"
    response = httpx.post(
        url,
        json=payload,
        timeout=settings.llm_timeout_seconds,
    )

    if response.status_code >= 400:
        raise BackendError(backend.name, response.status_code, url, response.text)

    body = response.json()
    message = body.get("message") if isinstance(body.get("message"), dict) else {}
    content = message.get("content")
    tool_calls = _parse_tool_calls(message.get("tool_calls") or [])
    if not tool_calls and (not isinstance(content, str) or not content.strip()):
        raise BackendUnavailable(f"{backend.name} returned no content")
    return Completion(
        content=content if isinstance(content, str) and content.strip() else None,
        tool_calls=tool_calls,
        usage={
            "prompt_tokens": body.get("prompt_eval_count"),
            "completion_tokens": body.get("eval_count"),
        },
    )


Dispatcher = Callable[
    [
        Backend,
        list[dict[str, Any]],
        dict[str, Any] | None,
        int,
        float,
        list[dict[str, Any]] | None,
        str | None,
    ],
    Completion,
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
    tools: list[dict[str, Any]] | None = None,
    tool_choice: str | None = None,
) -> Completion:
    """One model call, timed and logged. Returns a Completion (text and/or tool calls)."""
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
        completion = dispatch(
            backend, messages, json_schema, max_tokens, temperature, tools, tool_choice
        )
        # One token figure, not five. prompt/completion split is only interesting when
        # hunting a prompt that grew, and LOG_VERBOSE covers that.
        stage.add(tokens=completion.usage.get("total_tokens"))
        log_verbose("llm.preview", preview=completion.content)
        return completion
