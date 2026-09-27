import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.llm.embedder import embed_query
from app.core.vector.qdrant import search_entities

DEFAULT_QUERY = "sign in is broken on the checkout page"
DEFAULT_COMPANY = "CMP-N4E701V5B0"


def main() -> None:
    args = sys.argv[1:]
    query = args[0] if args else DEFAULT_QUERY
    company_id = args[1] if len(args) > 1 else DEFAULT_COMPANY

    print(f"Query  : {query}")
    print(f"Company: {company_id}\n")

    results = search_entities(
        embed_query(query),
        company_id=company_id,
        entity_type="bug",
        limit=5,
    )

    if not results:
        print("No matches. Run scripts/reindex.py first.")
        return

    for rank, hit in enumerate(results, start=1):
        print(f"{rank}. score {hit['score']:.3f}  {hit.get('entity_id')}")
        print(f"   {hit.get('title')}")


if __name__ == "__main__":
    main()
