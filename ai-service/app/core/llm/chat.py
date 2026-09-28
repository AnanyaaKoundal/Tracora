import json
from typing import Any

import httpx

from app.config import settings

TIMEOUT_SECONDS = 180.0
LLM_OPTIONS = {"temperature": 0.2, "num_predict": 300}


def chat(
    messages: list[dict[str, str]],
    model: str | None = None,
    json_schema: dict[str, Any] | None = None,
    num_predict: int | None = None,
) -> str:
    options = dict(LLM_OPTIONS)
    if num_predict is not None:
        options["num_predict"] = num_predict

    payload: dict[str, Any] = {
        "model": model or settings.ollama_chat_model,
        "messages": messages,
        "stream": False,
        "options": options,
        "format": json_schema if json_schema is not None else "json",
    }

    response = httpx.post(
        f"{settings.ollama_host}/api/chat",
        json=payload,
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()["message"]["content"]


def parse_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = [line for line in cleaned.splitlines() if not line.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()
    return json.loads(cleaned)
