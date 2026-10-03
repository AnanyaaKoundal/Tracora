import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from mongo import (
    count_documents,
    find_bugs,
    list_collections,
    ping,
)

TRACKED = ("bugs", "comments", "companies", "employees", "projects", "roles")


def main() -> None:
    print("Pinging MongoDB...")
    ping()
    print("Connected.\n")

    collections = list_collections()
    print(f"Collections: {', '.join(collections)}\n")

    for name in TRACKED:
        if name in collections:
            print(f"  {name:<12} {count_documents(name)} documents")

    sample = find_bugs(limit=1)
    if sample:
        bug = sample[0]
        print(f"\nSample bug: {bug.get('bug_id')}")
        print(f"  title:       {bug.get('bug_name')}")
        print(f"  description: {str(bug.get('bug_description'))[:200]}")
    else:
        print("\nNo bugs found yet.")


if __name__ == "__main__":
    main()
