from fastapi import APIRouter, HTTPException

from app.core.llm.embedder import embed_query
from app.core.vector.qdrant import search_entities
from app.domains.bugs.content import compose_bug_text
from app.domains.bugs.suggest_title import SuggestionError, suggest_title
from app.models.bug import (
    DuplicateMatch,
    DuplicatesRequest,
    DuplicatesResponse,
    SuggestionRequest,
    SuggestionResponse,
)

router = APIRouter(prefix="/bugs", tags=["bugs"])


@router.post("/duplicates", response_model=DuplicatesResponse)
def find_duplicates(payload: DuplicatesRequest) -> DuplicatesResponse:
    text = compose_bug_text(payload.title, payload.description)
    if not text.strip(". "):
        raise HTTPException(status_code=422, detail="Nothing to search")

    hits = search_entities(
        embed_query(text),
        company_id=payload.company_id,
        entity_type="bug",
        limit=payload.limit,
        score_threshold=payload.threshold,
    )

    return DuplicatesResponse(
        matches=[
            DuplicateMatch(
                bug_id=hit["entity_id"],
                title=hit.get("title"),
                score=round(hit["score"], 4),
            )
            for hit in hits
        ]
    )


@router.post("/suggest-title", response_model=SuggestionResponse)
def suggest(payload: SuggestionRequest) -> SuggestionResponse:
    try:
        suggestion = suggest_title(payload.description)
    except SuggestionError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"LLM unavailable: {exc}") from exc

    return SuggestionResponse(**suggestion)
