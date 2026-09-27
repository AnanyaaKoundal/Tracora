from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.core.db.mongo import count_documents, find_bugs, list_collections, ping

router = APIRouter(prefix="/debug", tags=["debug"])

TRACKED = ("bugs", "comments", "companies", "employees", "projects", "roles")


@router.get("/mongo")
def check_mongo() -> dict[str, Any]:
    try:
        ping()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"MongoDB unreachable: {exc}") from exc

    collections = list_collections()
    counts = {name: count_documents(name) for name in TRACKED if name in collections}

    return {"connected": True, "collections": collections, "counts": counts}


@router.get("/bugs")
def read_bugs(
    company_id: str | None = Query(default=None),
    limit: int = Query(default=5, ge=1, le=50),
) -> dict[str, Any]:
    try:
        bugs = find_bugs(company_id=company_id, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"MongoDB unreachable: {exc}") from exc

    return {"count": len(bugs), "bugs": bugs}
