"""Human-readable logging for the agent path.

Styled to match the Express server's existing console output (emoji prefix, bracketed
stage name), so both halves of the project read the same way in the terminal.

What you get, for one question:

    ▶  Question received          "blank screen after logging in"
    🧠 Model call                 hf / openai/gpt-oss-120b
    ✅ Model answered             1.6s · 322 tokens
    🔍 Tool: find_similar_bugs    5 bugs found · best 0.64 (weak match)
    ↩  Model chose to answer
    ✅ Turn complete              6.4s · answered

This logs timings, model identity and hit counts, which is what you need to tell a
free model apart from a fast one. It deliberately does not log message text, tool
arguments, bug titles or company ids: those are the contents of someone's bug
tracker, and a log file is the wrong place for them. Set LOG_VERBOSE=true locally
when you need to see the actual strings.
"""

from __future__ import annotations

import os
import sys
import time
from contextvars import ContextVar
from typing import Any

LOG_VERBOSE = os.environ.get("LOG_VERBOSE", "false").strip().lower() in ("1", "true", "yes")

# Per-request tag so two turns in the terminal don't look identical.
request_id: ContextVar[str] = ContextVar("request_id", default="-")

# How each call site describes itself. A stage name and a format string, because
# "what happened" and "what it looked like" are different things.
_STYLES: dict[str, tuple[str, str]] = {
    "turn.start": ("▶", "Question received"),
    "turn.done": ("✅", "Turn complete"),
    "turn.error": ("❌", "Turn failed"),
    "turn.failed": ("❌", "Turn failed"),
    "turn": ("⏱️", "Turn total"),
    "agent.triage": ("🤔", "Enough detail to search"),
    "agent.clarify": ("❓", "Question too broad, asking first"),
    "agent.retrieval": ("🔍", "Tool: find_similar_bugs"),
    "agent.retrieval.done": ("📊", "Search results"),
    "agent.history": ("🧵", "Conversation history"),
    "agent.step": ("↩", "Model chose to {action}"),
    "agent.turn": ("💬", "Outcome: {outcome}"),
    "llm.resolved": ("🎯", "Using backends: {order}"),
    "llm.start": ("🧠", "Asking {backend} ({model})"),
    "llm": ("✅", "Model answered"),
    "llm.failed": ("⚠️", "Model call failed"),
    "llm.fallback": ("🔁", "Switching backend"),
    "llm.ok": ("🏁", "Answer served by {backend} (${cost})"),
    "llm.preview": ("👀", "Model said"),
    "startup": ("🚀", "ai-service starting"),
}


def _truncate(value: Any, width: int = 70) -> str:
    text = " ".join(str(value).split())
    return text if len(text) <= width else text[: width - 3] + "..."


def _fields_in(template: str) -> list[str]:
    """The {placeholders} a headline template uses, so they are not repeated."""
    out: list[str] = []
    depth = 0
    current = ""
    for char in template:
        if char == "{":
            depth += 1
            current = ""
        elif char == "}":
            if depth:
                depth -= 1
                if depth == 0:
                    out.append(current)
        elif depth:
            current += char
    return out


def _render(event: str, fields: dict[str, Any]) -> str:
    """Turn one event into a single readable line."""
    icon, template = _STYLES.get(event, ("•", event))

    # Fields consumed by the template itself are not repeated as details.
    skip = {"event", "rid", "ms", "preview"}

    # Stage timings read best inline: "1.6s", and tokens when we have them.
    timing = ""
    if fields.get("ms") is not None:
        seconds = fields["ms"] / 1000
        timing = f"{seconds:.1f}s" if seconds >= 1 else f"{fields['ms']}ms"

    tokens = fields.get("total_tokens")
    if tokens is not None:
        timing = f"{timing} · {tokens} tokens" if timing else f"{tokens} tokens"

    try:
        headline = template.format(**{k: v for k, v in fields.items()})
    except (KeyError, IndexError, ValueError):
        headline = template

    details: list[str] = []
    if timing:
        details.append(timing)
    # A field already named in the headline, or empty, is noise in the tail.
    named = {token.strip("{}").split(".")[-1].split(":")[0] for token in _fields_in(template)}
    for key, value in fields.items():
        if key in skip or key in ("total_tokens", "total") or key in named:
            continue
        if value is None or value == "" or value == []:
            continue
        details.append(f"{key}={_truncate(value, 40)}")

    line = f"{icon}  {headline}"
    if details:
        line += f"  ({' · '.join(details)})"
    return line


def _emit(event: str, message: str, level: str, **fields: Any) -> None:
    tag = request_id.get()
    # The id stays on the line: it's short, and without it concurrent turns are
    # impossible to tell apart.
    print(f"[{tag}] {_render(event, fields)}", file=sys.stdout, flush=True)


def log(event: str, message: str = "", **fields: Any) -> None:
    _emit(event, message, "info", **fields)


def log_verbose(event: str, message: str = "", **fields: Any) -> None:
    """Opt-in. Carries user-derived text, so it is off by default."""
    if not LOG_VERBOSE:
        return
    _emit(event, message, "verbose", **fields)


class Stage:
    """Times a block and prints a line when it finishes, pass or fail.

    Usage:
        with Stage("agent.retrieval", tool="find_similar_bugs") as s:
            hits = search(...)
            s.add(results=len(hits))

    Two log lines for three lines of code. Worth it only where the timing is the
    point; a plain `time.perf_counter()` and a `log()` call reads better anywhere else.
    """

    def __init__(self, event: str, **fields: Any) -> None:
        self.event = event
        self.fields = fields
        self.start = 0.0

    def __enter__(self) -> "Stage":
        self.start = time.perf_counter()
        return self

    def add(self, **fields: Any) -> None:
        self.fields.update(fields)

    def __exit__(self, exc_type, exc, tb) -> bool:
        elapsed = round((time.perf_counter() - self.start) * 1000)
        if exc_type is not None:
            self.fields["error"] = f"{exc_type.__name__}: {_truncate(exc, 60)}"
            self.fields["ms"] = elapsed
            log(f"{self.event}.failed", **self.fields)
            return False
        self.fields["ms"] = elapsed
        log(self.event, **self.fields)
        return False
