import json
from typing import Any

from app.core.llm.chat import chat, parse_json

TITLE_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
    },
    "required": ["title"],
}

SYSTEM_PROMPT = (
    "You write bug report titles for a project tracking tool. "
    "Given a raw bug description, suggest a single short, specific title "
    "of at most 10-15 words that describes the actual problem. "
    "Respond with JSON only."
)

MAX_TITLE_LENGTH = 120


class SuggestionError(RuntimeError):
    pass


def _validate(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise SuggestionError(f"expected object, got {type(data).__name__}")

    title = data.get("title")
    if not isinstance(title, str) or not title.strip():
        raise SuggestionError("title is empty or not a string")

    cleaned = " ".join(title.split())[:MAX_TITLE_LENGTH]

    return {"title": cleaned}


def suggest_title(description: str) -> dict[str, Any]:
    raw = chat(
        [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": description},
        ],
        json_schema=TITLE_SCHEMA,
    )

    try:
        parsed = parse_json(raw)
    except json.JSONDecodeError as exc:
        raise SuggestionError(f"model did not return valid JSON: {exc}") from exc

    return _validate(parsed)
