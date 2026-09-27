import httpx

from app.config import settings

DOCUMENT_PREFIX = "search_document: "
QUERY_PREFIX = "search_query: "
TIMEOUT_SECONDS = 60.0


def _embed(texts: list[str]) -> list[list[float]]:
    response = httpx.post(
        f"{settings.ollama_host}/api/embed",
        json={"model": settings.ollama_embed_model, "input": texts},
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()["embeddings"]


def embed_documents(texts: list[str]) -> list[list[float]]:
    return _embed([f"{DOCUMENT_PREFIX}{text}" for text in texts])


def embed_query(text: str) -> list[float]:
    return _embed([f"{QUERY_PREFIX}{text}"])[0]
