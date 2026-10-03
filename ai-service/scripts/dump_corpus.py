"""Regenerate evals/fixtures/corpus.json from the development database.

A one-off operation, not a test: it copies the current tenants into the snapshot the
eval runner reads so evals can run without Mongo or Express. Re-run it when the seed
data changes.

    python scripts/dump_corpus.py
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from mongo import get_db  # noqa: E402

OUT = Path(__file__).resolve().parents[1] / "evals" / "fixtures" / "corpus.json"

PROJECT_FIELDS = (
    "project_id",
    "company_id",
    "project_name",
    "project_status",
    "project_description",
)
BUG_FIELDS = (
    "bug_id",
    "company_id",
    "bug_name",
    "bug_status",
    "bug_priority",
    "project_id",
    "reported_by",
    "assigned_to",
)


def main() -> None:
    db = get_db()

    projects = [
        {field: project.get(field) for field in PROJECT_FIELDS}
        for project in db["projects"].find({}, {"_id": 0})
    ]
    bugs = [
        {field: bug.get(field) for field in BUG_FIELDS}
        | {"bug_description": (bug.get("bug_description") or "")[:400]}
        for bug in db["bugs"].find({}, {"_id": 0})
    ]

    payload = {
        "note": (
            "Recorded snapshot of the development tenants, used by evals/recorded_data.py "
            "so evals can run without Mongo or Express. Regenerate with scripts/dump_corpus.py."
        ),
        "projects": projects,
        "bugs": bugs,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {OUT} ({len(projects)} projects, {len(bugs)} bugs)")


if __name__ == "__main__":
    main()
