"""Citation extraction, without a model.

Tool results are the only source of citations; the reply is the filter. These pin both
halves: what a result exposes, and which candidates a reply actually names.
"""

import pytest

from app.domains.agent.loop import _cited, _context_records, _records_in


@pytest.mark.unit
def test_records_from_get_bug():
    result = {"status": "ok", "bug": {"bug_id": "B-1", "title": "Crash"}}
    assert _records_in(result) == [{"type": "bug", "id": "B-1", "title": "Crash"}]


@pytest.mark.unit
def test_records_from_find_similar_bugs():
    result = {
        "status": "ok",
        "results": [
            {"bug_id": "B-1", "title": "Crash"},
            {"bug_id": "B-2", "title": "Lag"},
        ],
    }
    assert _records_in(result) == [
        {"type": "bug", "id": "B-1", "title": "Crash"},
        {"type": "bug", "id": "B-2", "title": "Lag"},
    ]


@pytest.mark.unit
def test_records_from_find_projects():
    result = {"status": "ok", "results": [{"project_id": "PRJ-1", "name": "Website"}]}
    assert _records_in(result) == [
        {"type": "project", "id": "PRJ-1", "title": "Website"}
    ]


@pytest.mark.unit
def test_not_found_has_no_records():
    assert _records_in({"status": "not_found", "bug_id": "B-9"}) == []
    assert _records_in({"status": "project_not_found", "results": []}) == []


@pytest.mark.unit
def test_cited_keeps_only_named_records():
    records = {
        "B-1": {"type": "bug", "id": "B-1", "title": "Crash"},
        "B-2": {"type": "bug", "id": "B-2", "title": "Lag"},
    }
    assert _cited(records, "Try **B-2**, it matches.") == [
        {"type": "bug", "id": "B-2", "title": "Lag"}
    ]


@pytest.mark.unit
def test_cited_is_empty_when_reply_names_nothing():
    records = {"B-1": {"type": "bug", "id": "B-1", "title": "Crash"}}
    assert _cited(records, "I couldn't find anything relevant.") == []


@pytest.mark.unit
def test_context_bug_is_a_candidate():
    context = {
        "kind": "bug",
        "label": "B-1",
        "data": {"title": "Checkout crash"},
    }
    assert _context_records(context) == {
        "B-1": {"type": "bug", "id": "B-1", "title": "Checkout crash"}
    }


@pytest.mark.unit
def test_context_without_a_bug_page_yields_nothing():
    assert _context_records({"kind": "page", "label": "Projects"}) == {}
    assert _context_records(None) == {}
