"""The grounding validator: a reply may quote only ids that were grounded.

This is the guardrail that turns "the model might invent a bug id" into a checkable
property. No model and no services.
"""

import pytest

from app.domains.agent.loop import _ids_in, _ungrounded_ids


@pytest.mark.unit
def test_ids_in_reads_nested_structures():
    payload = {"results": [{"bug_id": "B-1"}, {"note": "see PRJ-ABC"}]}
    assert _ids_in(payload) == {"B-1", "PRJ-ABC"}


@pytest.mark.unit
def test_ungrounded_ids_flags_an_unknown_id():
    assert _ungrounded_ids("Try **B-1**, or maybe **B-2**.", {"B-1"}) == ["B-2"]


@pytest.mark.unit
def test_ungrounded_ids_empty_when_all_grounded():
    assert _ungrounded_ids("Try **B-1** and **PRJ-X**.", {"B-1", "PRJ-X"}) == []
