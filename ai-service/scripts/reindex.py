import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.db.mongo import all_bugs
from app.core.llm.embedder import embed_documents
from app.core.vector.qdrant import ensure_collection, upsert_entities
from app.domains.bugs.content import compose_bug_text

BATCH_SIZE = 16


def build_text(bug: dict) -> str:
    return compose_bug_text(bug.get("bug_name"), bug.get("bug_description"))


def main() -> None:
    ensure_collection()
    print("Collection ready.\n")

    bugs = [bug for bug in all_bugs() if build_text(bug).strip(". ").strip()]
    if not bugs:
        print("No indexable bugs found.")
        return

    print(f"Indexing {len(bugs)} bugs...\n")

    for start in range(0, len(bugs), BATCH_SIZE):
        chunk = bugs[start : start + BATCH_SIZE]
        vectors = embed_documents([build_text(bug) for bug in chunk])

        records = [
            {
                "type": "bug",
                "entity_id": bug["bug_id"],
                "company_id": bug.get("company_id"),
                "title": bug.get("bug_name"),
                "text": build_text(bug),
                "vector": vector,
            }
            for bug, vector in zip(chunk, vectors)
        ]
        upsert_entities(records)
        print(f"  {start + len(chunk)}/{len(bugs)}")

    print("\nDone.")


if __name__ == "__main__":
    main()
