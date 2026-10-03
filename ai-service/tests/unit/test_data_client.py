"""The client that reads tenant data from Express.

No network: httpx.get is replaced with a stub, so these pin the wire contract the agent
depends on -- status handling, payload shape, and the headers that prove who is asking.
"""

import pytest

from app.core import data_client


class _Response:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


@pytest.fixture
def captured(monkeypatch):
    calls = {}

    def fake_get(url, headers=None, timeout=None):
        calls["url"] = url
        calls["headers"] = headers
        return calls["response"]

    monkeypatch.setattr(data_client.httpx, "get", fake_get)
    return calls


@pytest.mark.unit
def test_get_bug_returns_data(captured):
    captured["response"] = _Response(200, {"data": {"bug_id": "B-1"}})
    assert data_client.get_bug("B-1", "Bearer t") == {"bug_id": "B-1"}


@pytest.mark.unit
def test_get_bug_404_is_none(captured):
    captured["response"] = _Response(404, {"message": "Bug not found"})
    assert data_client.get_bug("B-1", "Bearer t") is None


@pytest.mark.unit
def test_get_bug_other_status_raises(captured):
    captured["response"] = _Response(500, {})
    with pytest.raises(data_client.DataClientError):
        data_client.get_bug("B-1", "Bearer t")


@pytest.mark.unit
def test_headers_carry_internal_key_and_identity(captured):
    captured["response"] = _Response(200, {"data": []})
    data_client.list_projects("Bearer abc")
    assert captured["url"].endswith("/agent/projects")
    assert captured["headers"]["x-internal-key"]
    assert captured["headers"]["Authorization"] == "Bearer abc"


@pytest.mark.unit
def test_list_projects_empty_payload_is_empty_list(captured):
    captured["response"] = _Response(200, {})
    assert data_client.list_projects("Bearer abc") == []
