import json
from typing import Any

from app.config import settings
from app.core.llm.providers import (
    UNPAID,
    Backend,
    BackendUnavailable,
    _DISPATCH,
    invoke,
    registry,
    resolve_order,
)
from app.core.logging import log

DEFAULT_TEMPERATURE = 0.2
DEFAULT_MAX_TOKENS = 300

def chat(
    messages: list[dict[str, str]],
    model: str | None = None,
    json_schema: dict[str, Any] | None = None,
    num_predict: int | None = None,
) -> str:
    """One chat call against the configured backend.

    `model` selects a specific Ollama model, as it always has. Hosted backends use the
    model id from config, because a local name like "phi3:latest" is meaningless to
    them. Callers that care which model answered should read the config, not pass one.

    Raises BackendUnavailable if every candidate backend fails, with the reason for
    each so the cause is visible in the 502 the API returns.
    """
    max_tokens = num_predict if num_predict is not None else DEFAULT_MAX_TOKENS
    temperature = settings.llm_temperature

    order = resolve_order()
    if not order:
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
        )

    failures: list[str] = []
    for attempt, backend in enumerate(order):
        try:
            content, _usage = invoke(backend, messages, json_schema, max_tokens, temperature)
        except BackendUnavailable as exc:
            failures.append(str(exc))
            log(
                "llm.fallback",
                backend=backend.name,
                cost="paid" if backend.name not in UNPAID else "free",
                reason=str(exc)[:120],
                next_up=[b.name for b in order[attempt + 1 :]],
            )
        except Exception as exc:  # network error, malformed response, bad credential
            reason = f"{backend.name}: {type(exc).__name__}: {exc}"
            failures.append(reason)
            log(
                "llm.fallback",
                backend=backend.name,
                reason=f"{type(exc).__name__}: {exc}"[:120],
                next_up=[b.name for b in order[attempt + 1 :]],
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
            return content

    raise BackendUnavailable("all chat backends failed -> " + " | ".join(failures))


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
