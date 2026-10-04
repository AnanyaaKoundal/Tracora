import json
import time
from typing import Any

from app.config import settings
from app.core.llm.providers import (
    UNPAID,
    Backend,
    BackendUnavailable,
    Completion,
    _DISPATCH,
    invoke_retrying,
    registry,
    resolve_order,
)
from app.core.logging import log

DEFAULT_TEMPERATURE = 0.2
DEFAULT_MAX_TOKENS = 300


def _failure_detail(
    exc: Exception,
    messages: list[dict[str, Any]],
    max_tokens: int,
    json_schema: dict[str, Any] | None,
    tools: list[dict[str, Any]] | None = None,
) -> str:
    """The full cause of a failed call, for the indented log block.

    No message text: only shape (counts and sizes) plus the provider's own error body.
    That is enough to see a rejected request without writing a bug tracker into logs.
    """
    total_chars = sum(len(str(m.get("content", ""))) for m in messages)
    lines = [
        f"request: {len(messages)} messages, {total_chars} chars, "
        f"max_tokens={max_tokens}, schema={'yes' if json_schema is not None else 'no'}, "
        f"tools={len(tools) if tools else 0}"
    ]
    status = getattr(exc, "status", None)
    if status is not None:
        lines.append(f"status: HTTP {status}  {getattr(exc, 'url', '')}")
        lines.append(f"body: {getattr(exc, 'body', None) or exc}")
    else:
        lines.append(f"error: {type(exc).__name__}: {exc}")
    return "\n".join(lines)


def complete(
    messages: list[dict[str, Any]],
    *,
    tools: list[dict[str, Any]] | None = None,
    tool_choice: str | None = None,
    model: str | None = None,
    json_schema: dict[str, Any] | None = None,
    num_predict: int | None = None,
    deadline: float | None = None,
) -> Completion:
    """One chat call against the configured backend, returning text and/or tool calls.

    This is the native-tool-calling entry point; `chat()` wraps it for text-only
    callers. `model` selects a specific Ollama model. Hosted backends use the model id
    from config, because a local name like "phi3:latest" is meaningless to them.

    Each backend is tried with bounded retries for transient faults (see
    `invoke_retrying`). `deadline` is an optional time.monotonic instant: once it passes
    no further backend or retry is attempted, so the whole turn stays inside the caller's
    timeout. Raises BackendUnavailable if every candidate backend fails, with the reason
    for each so the cause is visible in the log.
    """
    max_tokens = num_predict if num_predict is not None else DEFAULT_MAX_TOKENS
    temperature = settings.llm_temperature

    order = resolve_order()

    if tools:
        # Native tool calling is a per-model capability. Drop backends whose model
        # cannot do it so a tool-driven turn degrades to a capable backend instead of
        # a malformed reply. Plain-text calls (tools=None) still use every backend.
        capable = [b for b in order if b.supports_tools]
        for backend in order:
            if not backend.supports_tools:
                log(
                    "llm.fallback",
                    backend=backend.name,
                    reason="backend model does not support native tools",
                    next_up=[b.name for b in capable],
                )
        order = capable

    if not order:
        if tools:
            raise BackendUnavailable(
                "no backend that supports native tool calling is available"
            )
        raise BackendUnavailable(
            "no chat backend is available. Set LLM_BACKEND, or add a credential for "
            "one of: " + ", ".join(sorted(UNPAID))
        )
    log("llm.resolved", order=[b.name for b in order])

    if model is not None and order[0].name == "ollama":
        order[0] = Backend(
            name=order[0].name,
            shape=order[0].shape,
            model=model,
            needs_key=False,
            supports_tools=order[0].supports_tools,
        )

    failures: list[str] = []
    for attempt, backend in enumerate(order):
        if deadline is not None and time.monotonic() >= deadline:
            failures.append("turn deadline reached before trying " + backend.name)
            break
        try:
            completion = invoke_retrying(
                backend,
                messages,
                json_schema,
                max_tokens,
                temperature,
                tools,
                tool_choice,
                deadline=deadline,
            )
        except BackendUnavailable as exc:
            failures.append(str(exc))
            log(
                "llm.fallback",
                backend=backend.name,
                cost="paid" if backend.name not in UNPAID else "free",
                reason=str(exc),
                next_up=[b.name for b in order[attempt + 1 :]],
                detail=_failure_detail(exc, messages, max_tokens, json_schema, tools),
            )
        except Exception as exc:  # network error, malformed response, bad credential
            reason = f"{backend.name}: {type(exc).__name__}: {exc}"
            failures.append(reason)
            log(
                "llm.fallback",
                backend=backend.name,
                reason=reason,
                next_up=[b.name for b in order[attempt + 1 :]],
                detail=_failure_detail(exc, messages, max_tokens, json_schema, tools),
            )
        else:
            # The whole point of a fallback chain is that a turn can be served by
            # something other than what was configured. Say which one won, and
            # whether it cost anything.
            log(
                "llm.ok",
                backend=backend.name,
                cost="paid" if backend.name not in UNPAID else "free",
                skipped=[b.name for b in order[:attempt]],
            )
            return completion

    raise BackendUnavailable("all chat backends failed -> " + " | ".join(failures))


def chat(
    messages: list[dict[str, Any]],
    model: str | None = None,
    json_schema: dict[str, Any] | None = None,
    num_predict: int | None = None,
) -> str:
    """Text-only convenience wrapper around `complete()`.

    Used by callers that never use tools. Raises if the model answered with only a
    tool call and no text, which keeps the old string contract intact.
    """
    completion = complete(
        messages, model=model, json_schema=json_schema, num_predict=num_predict
    )
    if not completion.content or not completion.content.strip():
        raise BackendUnavailable("backend returned no text content")
    return completion.content


def active_backend() -> str:
    """Name of the backend that would serve the next call, for status endpoints."""
    order = resolve_order()
    if not order:
        return "none"
    return f"{order[0].name} ({order[0].model})"


def backend_inventory() -> list[dict[str, Any]]:
    return [
        {
            "backend": backend.name,
            "model": backend.model,
            "credential_env": backend.env_key or "none (local)",
            "configured": backend.is_available(),
            "paid": backend.name not in UNPAID,
        }
        for backend in registry().values()
    ]


def parse_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = [line for line in cleaned.splitlines() if not line.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()
    return json.loads(cleaned)
