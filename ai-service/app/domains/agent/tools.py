from collections.abc import Callable
from typing import Any

from app.config import settings
from app.core.db.mongo import all_projects
from app.core.llm.embedder import embed_query
from app.core.vector.qdrant import search_entities
from app.domains.projects.resolver import choose_project, resolve_project

DESCRIPTION_CHAR_LIMIT = 600
DEFAULT_LIMIT = 5
MAX_LIMIT = 10

TOOL_SPECS: list[dict[str, Any]] = [
    {
        "name": "find_similar_bugs",
        "description": (
            "Search this company's existing bugs by meaning. Use it whenever the user "
            "describes a problem, or asks whether something similar has been reported "
            "before. If the user names or hints at a project to search within, put their "
            "wording in 'project'; do not invent a project id. Returns a 'match' field of "
            "'strong' or 'weak', the best similarity score, and a list of bugs with their "
            "id, title, project, description and score. If 'status' is 'ambiguous' the "
            "project reference matched more than one project and you must ask which one. "
            "If 'status' is 'project_not_found' no such project exists for this company."
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
                "project": {
                    "type": "string",
                    "description": (
                        "Optional. The project the user named or referred to, in their own "
                        "words. Omit it to search the whole company."
                    ),
                },
            },
            "required": ["text"],
        },
    },
    {
        "name": "find_projects",
        "description": (
            "Look up this company's projects by name or description. Use it when the user "
            "asks about a project itself, or when you need to know whether a project exists "
            "before searching bugs inside it. Returns each project's id, name, status and "
            "description. An empty query lists every project."
        ),
        "args": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The project name or description to look for. May be empty.",
                },
                "limit": {
                    "type": "integer",
                    "description": f"How many projects to return, {1}-{MAX_LIMIT}.",
                },
            },
            "required": [],
        },
    },
]


def _clamp_limit(limit: Any) -> int:
    try:
        value = int(limit)
    except (TypeError, ValueError):
        return DEFAULT_LIMIT
    return max(1, min(value, MAX_LIMIT))


def _project_scope(
    company_id: str, project: str | None, context_project_id: str | None
) -> dict[str, Any] | None:
    """Decide which project a bug search should be filtered to.

    Returns None for the whole company. An explicit reference in the message takes
    precedence over the sticky UI scope, so naming a different project works even when
    the panel is narrowed to one. Only a resolved decision reaches the filter; an
    ambiguous or unknown reference is reported back instead of guessed.
    """
    candidate = project.strip() if isinstance(project, str) else ""
    if candidate:
        return choose_project(candidate, company_id)
    if context_project_id:
        return choose_project("", company_id, context_project_id=context_project_id)
    return None


def _find_similar_bugs(
    company_id: str,
    text: str,
    limit: Any = DEFAULT_LIMIT,
    project: str | None = None,
    context_project_id: str | None = None,
) -> dict[str, Any]:
    """Search and label the strength of the best hit.

    The label matters more than the filter. Returning nothing hides near misses the
    engineer might still want to read, so weak hits are kept and marked instead. That
    gives the model an explicit "this is not the same bug" signal rather than leaving
    it to infer relevance from a number it was never told how to interpret.
    """
    scope = _project_scope(company_id, project, context_project_id)
    if scope and scope["status"] == "ambiguous":
        return {
            "status": "ambiguous",
            "reference": scope.get("reference"),
            "candidates": scope.get("candidates", []),
            "results": [],
        }
    if scope and scope["status"] == "not_found":
        return {
            "status": "project_not_found",
            "reference": scope.get("reference"),
            "results": [],
        }

    project_id = scope["project_id"] if scope else None
    hits = search_entities(
        embed_query(text),
        company_id=company_id,
        entity_type="bug",
        project_id=project_id,
        limit=_clamp_limit(limit),
    )

    matches = [
        {
            "bug_id": hit["entity_id"],
            "title": hit.get("title"),
            "project": hit.get("project_name"),
            "similarity": round(hit["score"], 3),
            "description": (hit.get("text") or "")[:DESCRIPTION_CHAR_LIMIT],
        }
        for hit in hits
    ]

    best = max((m["similarity"] for m in matches), default=0.0)
    return {
        "status": "ok",
        "scope": scope.get("project_id") if scope else None,
        "match": "strong" if best >= settings.similar_strong_threshold else "weak",
        "best_similarity": round(best, 3),
        "results": matches,
    }


def _find_projects(company_id: str, query: str | None = None, limit: Any = DEFAULT_LIMIT) -> dict[str, Any]:
    """Rank a company's projects against a reference, or list them when query is empty."""
    capped = _clamp_limit(limit)
    text = (query or "").strip()

    if not text:
        projects = all_projects(company_id)[:capped]
        return {
            "status": "ok",
            "reference": None,
            "results": [
                {
                    "project_id": project.get("project_id"),
                    "name": project.get("project_name"),
                    "status": project.get("project_status"),
                    "description": (project.get("project_description") or "")[:DESCRIPTION_CHAR_LIMIT]
                    or None,
                }
                for project in projects
            ],
        }

    candidates = [
        candidate
        for candidate in resolve_project(text, company_id)
        if candidate.score >= settings.project_match_min_score
    ][:capped]
    return {
        "status": "ok" if candidates else "not_found",
        "reference": text,
        "results": [candidate.as_dict() for candidate in candidates],
    }


def build_registry(
    company_id: str, context_project_id: str | None = None
) -> dict[str, Callable[..., Any]]:
    """Map tool name -> implementation.

    Every closure captures company_id from the authenticated request context. The
    model supplies only the declared arguments, so it has no path to choose a tenant.
    """
    return {
        "find_similar_bugs": lambda text, limit=DEFAULT_LIMIT, project=None: (
            _find_similar_bugs(company_id, text, limit, project, context_project_id)
        ),
        "find_projects": lambda query=None, limit=DEFAULT_LIMIT: _find_projects(
            company_id, query, limit
        ),
    }


def allowed_args(name: str) -> set[str]:
    for spec in TOOL_SPECS:
        if spec["name"] == name:
            return set(spec["args"]["properties"].keys())
    return set()


def required_args(name: str) -> set[str]:
    for spec in TOOL_SPECS:
        if spec["name"] == name:
            return set(spec["args"].get("required", []))
    return set()
