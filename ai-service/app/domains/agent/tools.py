from collections.abc import Callable
from typing import Any

from app.core.llm.embedder import embed_query
from app.core.vector.qdrant import search_entities

DESCRIPTION_CHAR_LIMIT = 600
DEFAULT_LIMIT = 5
MAX_LIMIT = 10

TOOL_SPECS: list[dict[str, Any]] = [
    {
        "name": "find_similar_bugs",
        "description": (
            "Search this company's existing bugs by meaning. Use it whenever the user "
            "describes a problem, or asks whether something similar has been reported "
            "before. Returns bug id, title, description and a similarity score."
        ),
        "args": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "What to search for, phrased as the user's own description.",
                },
                "limit": {
                    "type": "integer",
                    "description": f"How many bugs to return, {1}-{MAX_LIMIT}.",
                },
            },
            "required": ["text"],
        },
    }
]


def _clamp_limit(limit: Any) -> int:
    try:
        value = int(limit)
    except (TypeError, ValueError):
        return DEFAULT_LIMIT
    return max(1, min(value, MAX_LIMIT))


def _find_similar_bugs(company_id: str, text: str, limit: Any = DEFAULT_LIMIT) -> list[dict[str, Any]]:
    hits = search_entities(
        embed_query(text),
        company_id=company_id,
        entity_type="bug",
        limit=_clamp_limit(limit),
    )
    return [
        {
            "bug_id": hit["entity_id"],
            "title": hit.get("title"),
            "similarity": round(hit["score"], 3),
            "description": (hit.get("text") or "")[:DESCRIPTION_CHAR_LIMIT],
        }
        for hit in hits
    ]


def build_registry(company_id: str) -> dict[str, Callable[..., Any]]:
    """Map tool name -> implementation.

    Every closure captures company_id from the authenticated request context. The
    model supplies only the declared arguments, so it has no path to choose a tenant.
    """
    return {
        "find_similar_bugs": lambda text, limit=DEFAULT_LIMIT: _find_similar_bugs(
            company_id, text, limit
        )
    }


def allowed_args(name: str) -> set[str]:
    for spec in TOOL_SPECS:
        if spec["name"] == name:
            return set(spec["args"]["properties"].keys())
    return set()
