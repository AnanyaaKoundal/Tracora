from collections.abc import Callable
from typing import Any

from app.config import settings
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
            "before. Returns a 'match' field of 'strong' or 'weak', the best similarity "
            "score, and a list of bugs with their id, title, description and score."
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


def _find_similar_bugs(company_id: str, text: str, limit: Any = DEFAULT_LIMIT) -> dict[str, Any]:
    """Search and label the strength of the best hit.

    The label matters more than the filter. Returning nothing hides near misses the
    engineer might still want to read, so weak hits are kept and marked instead. That
    gives the model an explicit "this is not the same bug" signal rather than leaving
    it to infer relevance from a number it was never told how to interpret.
    """
    hits = search_entities(
        embed_query(text),
        company_id=company_id,
        entity_type="bug",
        limit=_clamp_limit(limit),
    )

    matches = [
        {
            "bug_id": hit["entity_id"],
            "title": hit.get("title"),
            "similarity": round(hit["score"], 3),
            "description": (hit.get("text") or "")[:DESCRIPTION_CHAR_LIMIT],
        }
        for hit in hits
    ]

    best = max((m["similarity"] for m in matches), default=0.0)
    return {
        "match": "strong" if best >= settings.similar_strong_threshold else "weak",
        "best_similarity": round(best, 3),
        "results": matches,
    }


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
