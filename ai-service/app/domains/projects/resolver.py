import re
from dataclasses import dataclass
from typing import Any

from app.config import settings
from app.core.llm.embedder import embed_query
from app.core.vector.qdrant import search_entities

DESCRIPTION_CHAR_LIMIT = 400
CANDIDATE_LIMIT = 5


@dataclass
class ProjectCandidate:
    project_id: str
    name: str
    score: float
    status: str | None = None
    description: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "project_id": self.project_id,
            "name": self.name,
            "score": round(self.score, 3),
            "status": self.status,
            "description": self.description,
        }


def _normalize(value: str | None) -> str:
    """Lowercase and collapse punctuation so "Mobile-App" and "mobile app" match.

    Deliberately not phonetic. Embeddings already cover meaning and spelling drift;
    a phonetic pass would make near-miss names collide and add false ambiguities.
    """
    text = (value or "").lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return " ".join(text.split())


def _candidate(project: dict, score: float) -> ProjectCandidate:
    description = (project.get("project_description") or "").strip()
    return ProjectCandidate(
        project_id=project.get("project_id") or "",
        name=project.get("project_name") or "",
        score=score,
        status=project.get("project_status"),
        description=description[:DESCRIPTION_CHAR_LIMIT] or None,
    )


def resolve_project(
    reference: str, company_id: str, projects: list[dict]
) -> list[ProjectCandidate]:
    """Rank the caller's visible projects against a free-text reference.

    Returns a ranked list, never a single pick: choosing is the caller's job and must
    account for how close the runner-up is. `projects` comes from Express, already
    tenant- and role-scoped, so exact and substring matching can run on it directly.
    Only when those miss does the embedding fallback run, over project entities in the
    vector store.
    """
    ref = _normalize(reference)
    if not ref or not projects:
        return []

    by_id = {p.get("project_id"): p for p in projects}

    exact = [p for p in projects if _normalize(p.get("project_name")) == ref]
    if exact:
        return [_candidate(p, 1.0) for p in exact]

    substring = [
        p
        for p in projects
        if ref in _normalize(p.get("project_name"))
        or _normalize(p.get("project_name")) in ref
    ]
    if substring:
        return [_candidate(p, 0.9) for p in substring][:CANDIDATE_LIMIT]

    hits = search_entities(
        embed_query(reference),
        company_id=company_id,
        entity_type="project",
        limit=CANDIDATE_LIMIT,
    )
    candidates: list[ProjectCandidate] = []
    for hit in hits:
        project = by_id.get(hit.get("entity_id"))
        if project:
            candidates.append(_candidate(project, float(hit["score"])))
    return candidates


def choose_project(
    reference: str, company_id: str, projects: list[dict]
) -> dict[str, Any]:
    """Turn a reference into a decision: resolved, ambiguous, or not_found.

    The policy is separate from the scorer so the thresholds live in one place and the
    ranking can be tested on its own. A thin margin between the top two is treated as
    ambiguous on purpose. Answering about the wrong project is a worse failure than
    asking one extra question, so ties and near-ties abstain.
    """
    candidates = resolve_project(reference, company_id, projects)
    if not candidates:
        return {"status": "not_found", "reference": reference, "candidates": []}

    top = candidates[0]
    if top.score < settings.project_match_min_score:
        return {
            "status": "not_found",
            "reference": reference,
            "candidates": [c.as_dict() for c in candidates[:CANDIDATE_LIMIT]],
        }

    runner_up = candidates[1] if len(candidates) > 1 else None
    if runner_up and (top.score - runner_up.score) < settings.project_match_margin:
        return {
            "status": "ambiguous",
            "reference": reference,
            "candidates": [c.as_dict() for c in candidates[:CANDIDATE_LIMIT]],
        }

    return {
        "status": "resolved",
        "project_id": top.project_id,
        "source": "match",
        "candidates": [c.as_dict() for c in candidates[:CANDIDATE_LIMIT]],
    }
