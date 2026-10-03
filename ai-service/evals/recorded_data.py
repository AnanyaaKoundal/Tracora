"""Fixture-backed tenant data for evals.

An eval should spend a live model, not require Mongo and Express and a login token. This
swaps the two data-client calls the agent makes for lookups into a recorded snapshot, so
a run is reproducible and needs no infrastructure beyond the model and the retrieval
stack.

What is *not* stubbed: semantic search still goes to Qdrant and Ollama, so the strong or
weak label the model sees is the real one. Only the deterministic reads (get_bug,
find_projects) are served from the snapshot.

The patch is applied to the module the agent calls, so no production code changes.
"""

from __future__ import annotations

import json
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from app.core import data_client

CORPUS_PATH = Path(__file__).resolve().parent / "fixtures" / "corpus.json"


def load_corpus(path: Path | str = CORPUS_PATH) -> dict[str, Any]:
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


class RecordedData:
    def __init__(self, company_id: str, corpus: dict[str, Any] | None = None) -> None:
        self.company_id = company_id
        corpus = corpus if corpus is not None else load_corpus()

        names = {p["project_id"]: p.get("project_name") for p in corpus["projects"]}
        self.projects = [
            p for p in corpus["projects"] if p.get("company_id") == company_id
        ]

        self.bugs: dict[str, dict[str, Any]] = {}
        for bug in corpus["bugs"]:
            if bug.get("company_id") != company_id:
                continue
            record = dict(bug)
            record["project_name"] = names.get(bug.get("project_id"))
            self.bugs[bug["bug_id"]] = record

    def get_bug(self, bug_id: str, authorization: str | None = None) -> dict[str, Any] | None:
        return self.bugs.get(bug_id)

    def list_projects(self, authorization: str | None = None) -> list[dict[str, Any]]:
        return self.projects


@contextmanager
def patched(company_id: str, corpus: dict[str, Any] | None = None) -> Iterator[RecordedData]:
    data = RecordedData(company_id, corpus)
    original_get = data_client.get_bug
    original_list = data_client.list_projects
    data_client.get_bug = data.get_bug  # type: ignore[assignment]
    data_client.list_projects = data.list_projects  # type: ignore[assignment]
    try:
        yield data
    finally:
        data_client.get_bug = original_get  # type: ignore[assignment]
        data_client.list_projects = original_list  # type: ignore[assignment]
