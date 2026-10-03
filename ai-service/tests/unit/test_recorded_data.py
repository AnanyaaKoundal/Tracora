"""The fixture-backed data layer for evals.

This is what lets an eval spend a live model without Mongo, Express or a token. It must
filter strictly by tenant and restore the real client on exit.
"""

import pytest

from app.core import data_client
from evals import recorded_data

CORPUS = {
    "projects": [
        {"project_id": "PRJ-1", "company_id": "C1", "project_name": "App"},
        {"project_id": "PRJ-2", "company_id": "C2", "project_name": "Other"},
    ],
    "bugs": [
        {
            "bug_id": "B-1",
            "company_id": "C1",
            "bug_name": "Crash",
            "bug_description": "d",
            "bug_status": "Open",
            "bug_priority": 1,
            "project_id": "PRJ-1",
        },
        {
            "bug_id": "B-2",
            "company_id": "C2",
            "bug_name": "Leak",
            "bug_description": "d",
            "bug_status": "Open",
            "bug_priority": 1,
            "project_id": "PRJ-2",
        },
    ],
}


@pytest.mark.unit
def test_recorded_data_filters_by_tenant():
    data = recorded_data.RecordedData("C1", CORPUS)

    assert data.get_bug("B-1") is not None
    assert data.get_bug("B-2") is None
    assert [p["project_id"] for p in data.list_projects()] == ["PRJ-1"]


@pytest.mark.unit
def test_recorded_bug_carries_project_name():
    data = recorded_data.RecordedData("C1", CORPUS)
    assert data.get_bug("B-1")["project_name"] == "App"


@pytest.mark.unit
def test_patched_swaps_and_restores_client():
    original_get = data_client.get_bug
    original_list = data_client.list_projects

    with recorded_data.patched("C1", CORPUS):
        assert data_client.get_bug("B-1", None)["bug_id"] == "B-1"
        assert data_client.get_bug("B-2", None) is None

    assert data_client.get_bug is original_get
    assert data_client.list_projects is original_list
