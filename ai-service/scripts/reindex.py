import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from mongo import all_bugs, all_projects
from app.core.llm.embedder import embed_documents
from app.core.vector.qdrant import ensure_collection, upsert_entities
from app.domains.bugs.content import compose_bug_text
from app.domains.projects.content import compose_project_text

BATCH_SIZE = 16


def build_text(bug: dict) -> str:
    return compose_bug_text(bug.get("bug_name"), bug.get("bug_description"))


def index_projects() -> int:
    projects = [
        project
        for project in all_projects()
        if compose_project_text(
            project.get("project_name"), project.get("project_description")
        ).strip(". ").strip()
    ]
    if not projects:
        return 0

    print(f"Indexing {len(projects)} projects...\n")
    for start in range(0, len(projects), BATCH_SIZE):
        chunk = projects[start : start + BATCH_SIZE]
        vectors = embed_documents(
            [
                compose_project_text(p.get("project_name"), p.get("project_description"))
                for p in chunk
            ]
        )
        records = [
            {
                "type": "project",
                "entity_id": project["project_id"],
                "company_id": project.get("company_id"),
                "title": project.get("project_name"),
                "text": compose_project_text(
                    project.get("project_name"), project.get("project_description")
                ),
                "status": project.get("project_status"),
                "vector": vector,
            }
            for project, vector in zip(chunk, vectors)
        ]
        upsert_entities(records)
    return len(projects)


def index_bugs() -> int:
    # project_name is denormalised into the payload so retrieved bugs can be shown
    # with their project without a second lookup.
    project_names = {
        project["project_id"]: project.get("project_name") for project in all_projects()
    }

    bugs = [bug for bug in all_bugs() if build_text(bug).strip(". ").strip()]
    if not bugs:
        return 0

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
                "project_id": bug.get("project_id"),
                "project_name": project_names.get(bug.get("project_id")),
                "vector": vector,
            }
            for bug, vector in zip(chunk, vectors)
        ]
        upsert_entities(records)
        print(f"  {start + len(chunk)}/{len(bugs)}")
    return len(bugs)


def main() -> None:
    ensure_collection()
    print("Collection ready.\n")

    project_count = index_projects()
    if project_count:
        print(f"  indexed {project_count} projects\n")

    bug_count = index_bugs()
    if not bug_count and not project_count:
        print("No indexable documents found.")
        return

    print("\nDone.")


if __name__ == "__main__":
    main()
