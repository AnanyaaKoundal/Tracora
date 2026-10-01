import uuid
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.config import settings
from app.core.llm.embedder import embed_query

NAMESPACE = uuid.UUID("6f1a1c1e-0000-4000-8000-000000000000")
_client: QdrantClient | None = None


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(url=settings.qdrant_url, timeout=30)
    return _client


def entity_point_id(entity_type: str, entity_id: str) -> str:
    return str(uuid.uuid5(NAMESPACE, f"{entity_type}:{entity_id}"))


def embed_dim() -> int:
    return len(embed_query("dimension probe"))


def ensure_collection() -> None:
    client = get_client()
    name = settings.qdrant_collection
    size = embed_dim()

    if any(c.name == name for c in client.get_collections().collections):
        current = client.get_collection(name).config.params.vectors.size
        if current != size:
            raise RuntimeError(
                f"Collection '{name}' is sized {current} but the current embedding model "
                f"produces {size}. Reindex, or point OLLAMA_EMBED_MODEL back at the old one."
            )
        return

    client.create_collection(
        collection_name=name,
        vectors_config=VectorParams(size=size, distance=Distance.COSINE),
    )


def upsert_entities(records: list[dict[str, Any]]) -> None:
    points = [
        PointStruct(
            id=entity_point_id(record["type"], record["entity_id"]),
            vector=record["vector"],
            payload={
                "type": record["type"],
                "entity_id": record["entity_id"],
                "company_id": record.get("company_id"),
                "title": record.get("title"),
                "text": record.get("text"),
                "project_id": record.get("project_id"),
                "project_name": record.get("project_name"),
                "status": record.get("status"),
            },
        )
        for record in records
    ]
    get_client().upsert(collection_name=settings.qdrant_collection, points=points)


def search_entities(
    query_vector: list[float],
    company_id: str | None = None,
    entity_type: str | None = None,
    project_id: str | None = None,
    limit: int = 5,
    score_threshold: float | None = None,
) -> list[dict[str, Any]]:
    conditions = []
    if company_id:
        conditions.append(
            FieldCondition(key="company_id", match=MatchValue(value=company_id))
        )
    if entity_type:
        conditions.append(FieldCondition(key="type", match=MatchValue(value=entity_type)))
    # Hard scoping for a chosen project. This is a narrowing filter, not a security
    # boundary: company_id is the tenant boundary, project_id only narrows within it.
    if project_id:
        conditions.append(
            FieldCondition(key="project_id", match=MatchValue(value=project_id))
        )

    response = get_client().query_points(
        collection_name=settings.qdrant_collection,
        query=query_vector,
        query_filter=Filter(must=conditions) if conditions else None,
        limit=limit,
        with_payload=True,
        score_threshold=score_threshold,
    )
    return [{"score": point.score, **dict(point.payload or {})} for point in response.points]
