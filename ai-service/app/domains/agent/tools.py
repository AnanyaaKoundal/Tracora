from collections.abc import Callable
from typing import Any

from app.config import settings
from app.core import data_client
from app.core.llm.embedder import embed_query
from app.core.vector.qdrant import search_entities
from app.domains.projects.resolver import choose_project, resolve_project

DESCRIPTION_CHAR_LIMIT = 600
DEFAULT_LIMIT = 5
MAX_LIMIT = 10

_PRIORITY_LABELS = {1: "Critical", 2: "High", 3: "Medium", 4: "Low", 5: "Trivial"}


def _iso(value: Any) -> str | None:
    if hasattr(value, "isoformat"):
        return value.isoformat()
    # Express serialises dates to JSON, so they arrive as strings over HTTP.
    return value if isinstance(value, str) else None

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
        "name": "get_bug",
        "description": (
            "Read one bug by its exact id. Use it when the user pastes or gives a bug id, "
            "or when a shared bug page gives you one, before describing that bug. Returns "
            "the bug's id, title, description, status, priority, project, reporter and "
            "assignee. If 'status' is 'not_found' no such bug exists in this company."
        ),
        "args": {
            "type": "object",
            "properties": {
                "bug_id": {
                    "type": "string",
                    "description": "The exact bug id, for example B-0822667617.",
                },
            },
            "required": ["bug_id"],
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


def function_schemas() -> list[dict[str, Any]]:
    """The tool specs in the OpenAI `tools` wire format for native tool calling.

    TOOL_SPECS already carries a JSON Schema per tool under "args", so this is a shape
    change, not a second source of truth. Descriptions and argument schemas travel with
    the call, which is what lets the model stop guessing argument names.
    """
    return [
        {
            "type": "function",
            "function": {
                "name": spec["name"],
                "description": spec["description"],
                "parameters": spec["args"],
            },
        }
        for spec in TOOL_SPECS
    ]


def _clamp_limit(limit: Any) -> int:
    try:
        value = int(limit)
    except (TypeError, ValueError):
        return DEFAULT_LIMIT
    return max(1, min(value, MAX_LIMIT))


def _project_scope(
    company_id: str, project: str | None, authorization: str | None
) -> dict[str, Any] | None:
    """Decide which project a bug search should be filtered to.

    Returns None for the whole company. Only a project named in the message reaches the
    filter; an ambiguous or unknown reference is reported back instead of guessed.
    """
    candidate = project.strip() if isinstance(project, str) else ""
    if candidate:
        projects = data_client.list_projects(authorization)
        return choose_project(candidate, company_id, projects)
    return None


def _find_similar_bugs(
    company_id: str,
    authorization: str | None,
    text: str,
    limit: Any = DEFAULT_LIMIT,
    project: str | None = None,
) -> dict[str, Any]:
    """Search and label the strength of the best hit.

    The label matters more than the filter. Returning nothing hides near misses the
    engineer might still want to read, so weak hits are kept and marked instead. That
    gives the model an explicit "this is not the same bug" signal rather than leaving
    it to infer relevance from a number it was never told how to interpret.
    """
    scope = _project_scope(company_id, project, authorization)
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


def _get_bug(authorization: str | None, bug_id: str) -> dict[str, Any]:
    """Return one bug by exact id, or a not_found result.

    The deterministic counterpart to find_similar_bugs: an id is not in any vector, so
    semantic search can never match one, but reading by id is exact and cheap. Express
    returns not_found when the bug is missing or not visible to this user, and the two
    are deliberately indistinguishable.
    """
    reference = bug_id.strip() if isinstance(bug_id, str) else ""
    if not reference:
        return {"status": "not_found", "bug_id": bug_id}

    bug = data_client.get_bug(reference, authorization)
    if not bug:
        return {"status": "not_found", "bug_id": reference}

    return {
        "status": "ok",
        "bug": {
            "bug_id": bug.get("bug_id"),
            "title": bug.get("bug_name"),
            "description": (bug.get("bug_description") or "")[:DESCRIPTION_CHAR_LIMIT],
            "status": bug.get("bug_status"),
            "priority": _PRIORITY_LABELS.get(bug.get("bug_priority"), bug.get("bug_priority")),
            "project": bug.get("project_name"),
            "reported_by": bug.get("reported_by"),
            "assigned_to": bug.get("assigned_to"),
            "created_at": _iso(bug.get("createdAt")),
            "updated_at": _iso(bug.get("updatedAt")),
        },
    }


def _find_projects(
    company_id: str,
    authorization: str | None,
    query: str | None = None,
    limit: Any = DEFAULT_LIMIT,
) -> dict[str, Any]:
    """Rank the user's visible projects against a reference, or list them when empty."""
    capped = _clamp_limit(limit)
    text = (query or "").strip()
    projects = data_client.list_projects(authorization)

    if not text:
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
                for project in projects[:capped]
            ],
        }

    candidates = [
        candidate
        for candidate in resolve_project(text, company_id, projects)
        if candidate.score >= settings.project_match_min_score
    ][:capped]
    return {
        "status": "ok" if candidates else "not_found",
        "reference": text,
        "results": [candidate.as_dict() for candidate in candidates],
    }


def build_registry(
    company_id: str, authorization: str | None
) -> dict[str, Callable[..., Any]]:
    """Map tool name -> implementation.

    Every closure captures company_id and the caller's token from the authenticated
    request context. The model supplies only the declared arguments, so it has no path
    to choose a tenant or read data the user could not see in the UI.
    """
    return {
        "find_similar_bugs": lambda text, limit=DEFAULT_LIMIT, project=None: (
            _find_similar_bugs(company_id, authorization, text, limit, project)
        ),
        "find_projects": lambda query=None, limit=DEFAULT_LIMIT: _find_projects(
            company_id, authorization, query, limit
        ),
        "get_bug": lambda bug_id: _get_bug(authorization, bug_id),
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
