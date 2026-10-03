"""The data tools reading through Express.

_get_bug and _find_projects now go through data_client instead of Mongo. These pin the
result shape the prompt depends on, and that a missing record becomes a not_found result
rather than an exception. No network: data_client is stubbed.

_find_projects with an empty query lists projects, so the embedding fallback (which
would hit Ollama) is never reached.
"""

import pytest

from app.core import data_client
from app.domains.agent import tools


@pytest.mark.unit
def test_get_bug_shapes_record(monkeypatch):
    monkeypatch.setattr(
        data_client,
        "get_bug",
        lambda bug_id, auth: {
            "bug_id": bug_id,
            "bug_name": "Mobile View crashes",
            "bug_description": "Goes blank on save.",
            "bug_status": "Open",
            "bug_priority": 2,
            "project_name": "Test2",
            "reported_by": "EMP-1",
            "assigned_to": "EMP-2",
            "createdAt": "2026-01-01 10:00:00",
        },
    )

    result = tools._get_bug("Bearer t", "B-1")

    assert result["status"] == "ok"
    bug = result["bug"]
    assert bug["bug_id"] == "B-1"
    assert bug["priority"] == "High"  # bug_priority 2 -> label
    assert bug["project"] == "Test2"
    assert bug["created_at"] == "2026-01-01 10:00:00"


@pytest.mark.unit
def test_get_bug_missing_is_not_found(monkeypatch):
    monkeypatch.setattr(data_client, "get_bug", lambda bug_id, auth: None)
    assert tools._get_bug("Bearer t", "B-none")["status"] == "not_found"


@pytest.mark.unit
def test_get_bug_blank_id_short_circuits(monkeypatch):
    called = {"n": 0}

    def spy(bug_id, auth):
        called["n"] += 1
        return None

    monkeypatch.setattr(data_client, "get_bug", spy)
    assert tools._get_bug(None, "   ")["status"] == "not_found"
    assert called["n"] == 0


@pytest.mark.unit
def test_find_projects_empty_query_lists_projects(monkeypatch):
    monkeypatch.setattr(
        data_client,
        "list_projects",
        lambda auth: [
            {
                "project_id": "PRJ-1",
                "project_name": "Mobile App",
                "project_status": "Active",
                "project_description": "React Native app.",
            }
        ],
    )

    result = tools._find_projects("CMP", "Bearer t", query="")

    assert result["status"] == "ok"
    assert result["results"] == [
        {
            "project_id": "PRJ-1",
            "name": "Mobile App",
            "status": "Active",
            "description": "React Native app.",
        }
    ]


@pytest.mark.unit
def test_find_projects_substring_match_uses_listed_projects(monkeypatch):
    monkeypatch.setattr(
        data_client,
        "list_projects",
        lambda auth: [
            {"project_id": "PRJ-1", "project_name": "Mobile App"},
            {"project_id": "PRJ-2", "project_name": "Website Redesign"},
        ],
    )

    result = tools._find_projects("CMP", "Bearer t", query="mobile")

    assert result["status"] == "ok"
    assert result["results"][0]["project_id"] == "PRJ-1"
