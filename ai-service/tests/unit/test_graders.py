"""The grader, exercised without a model.

The grader is pure logic, so it is the one part of the eval layer that can be unit
tested. These pin the checks that carry the most weight: grounding, honesty against the
tool's own label, tool choice, and numeric honesty.
"""

import pytest

from evals import graders


def case(**expect):
    return {"id": "t", "message": "m", "expect": expect}


def run(case_, reply, *, tools=None, results=None, error=None, seconds=0.1):
    return graders.grade(
        case_,
        reply=reply,
        steps=[],
        tools=tools or [],
        results=results or [],
        error=error,
        seconds=seconds,
    )


@pytest.mark.unit
def test_grounded_reply_passes():
    verdict = run(case(), "Try **B-1**.", results=[{"results": [{"bug_id": "B-1"}]}])
    assert verdict["checks"]["grounding"] is True
    assert verdict["passed"] is True


@pytest.mark.unit
def test_ungrounded_id_fails():
    verdict = run(case(), "Try **B-9**.", results=[{"results": [{"bug_id": "B-1"}]}])
    assert verdict["checks"]["grounding"] is False
    assert verdict["passed"] is False
    assert verdict["notes"]["ungrounded_ids"] == ["B-9"]


@pytest.mark.unit
def test_unicode_hyphen_id_still_matches():
    reply = "This is **B\u20110688034478**."
    verdict = run(
        case(expect_any_ids=["B-0688034478"]),
        reply,
        results=[{"results": [{"bug_id": "B-0688034478"}]}],
    )
    assert verdict["checks"]["grounding"] is True
    assert verdict["passed"] is True


@pytest.mark.unit
def test_grounding_catches_unicode_hyphen_hallucination():
    verdict = run(
        case(),
        "See B\u20119999999999.",
        results=[{"results": [{"bug_id": "B-0688034478"}]}],
    )
    assert verdict["checks"]["grounding"] is False


@pytest.mark.unit
def test_error_short_circuits():
    verdict = run(case(expect_tool="get_bug"), "", error="DataClientError: boom")
    assert verdict["passed"] is False
    assert verdict["failed"] == ["raised"]


@pytest.mark.unit
def test_expect_no_tool():
    assert run(case(expect_tool=None), "hello")["passed"] is True
    assert run(case(expect_tool=None), "hi", tools=[{"name": "find_similar_bugs", "args": {}}])["passed"] is False


@pytest.mark.unit
def test_expect_tool_named():
    assert run(case(expect_tool="get_bug"), "x", tools=[{"name": "get_bug", "args": {}}])["passed"] is True
    assert run(case(expect_tool="get_bug"), "x", tools=[{"name": "find_similar_bugs", "args": {}}])["passed"] is False


@pytest.mark.unit
def test_honesty_follows_tool_label_weak_hedge_passes():
    verdict = run(
        case(honesty_from_tool=True),
        "That is not the same bug, but it may be related.",
        results=[{"match": "weak"}],
    )
    assert verdict["passed"] is True


@pytest.mark.unit
def test_honesty_follows_tool_label_weak_commit_fails():
    verdict = run(
        case(honesty_from_tool=True),
        "Yes, that is the one already reported.",
        results=[{"match": "weak"}],
    )
    assert verdict["passed"] is False


@pytest.mark.unit
def test_forbid_ids():
    assert run(case(forbid_ids=["B-9"]), "only **B-1**", results=[{"bug_id": "B-1"}])["passed"] is True
    assert run(case(forbid_ids=["B-9"]), "see **B-9**", results=[{"bug_id": "B-1"}])["passed"] is False


@pytest.mark.unit
def test_clarify_shape():
    assert run(case(clarify=True), "What exactly breaks?")["passed"] is True
    assert run(case(clarify=True), "Here is the answer.")["passed"] is False


@pytest.mark.unit
def test_no_count_claimed():
    assert run(case(says_count=False), "I can search but I can't give a total.")["passed"] is True
    assert run(case(says_count=False), "There are 12 bugs in total.")["passed"] is False


@pytest.mark.unit
def test_numeric_invariant():
    results = [{"results": [{"bug_id": "B-1"}]}]
    assert run(case(check_numbers=True), "I found **B-1**.", results=results)["passed"] is True
    assert run(case(check_numbers=True), "I found 5 similar bugs.", results=results)["passed"] is False


@pytest.mark.unit
def test_forbid_phrases():
    assert run(case(forbid_phrases=["system prompt"]), "I can't share that.")["passed"] is True
    assert run(case(forbid_phrases=["system prompt"]), "My system prompt says...")["passed"] is False


@pytest.mark.unit
def test_max_seconds():
    assert run(case(max_seconds=2.0), "ok", seconds=1.0)["passed"] is True
    assert run(case(max_seconds=2.0), "ok", seconds=3.0)["passed"] is False

@pytest.mark.unit
def test_clarify_ignores_courtesy_question():
    courtesy = "Hey there! How can I help you with the bug tracker today?"
    detail = "What exactly breaks, and what do you see on screen?"

    assert run(case(clarify=False), courtesy)["passed"] is True   # the false positive
    assert run(case(clarify=True), detail)["passed"] is True      # real clarification still caught
    assert run(case(clarify=True), courtesy)["passed"] is False   # courtesy is never "clarify"


@pytest.mark.unit
def test_expect_tool_any():
    assert run(case(expect_tool_any=["get_bug"]), "x")["passed"] is True
    assert run(
        case(expect_tool_any=["get_bug"]), "x", tools=[{"name": "get_bug", "args": {}}]
    )["passed"] is True
    assert run(
        case(expect_tool_any=["get_bug"]), "x", tools=[{"name": "find_similar_bugs", "args": {}}]
    )["passed"] is False


@pytest.mark.unit
def test_placeholder_id_is_not_ungrounded():
    verdict = run(case(), "Format the id like **B-XXXXXXXX**.")
    assert verdict["checks"]["grounding"] is True
    assert verdict["passed"] is True


@pytest.mark.unit
def test_real_id_is_not_treated_as_placeholder():
    verdict = run(case(), "Try **B-1234567890**.", results=[{"results": [{"bug_id": "B-1"}]}])
    assert verdict["checks"]["grounding"] is False


@pytest.mark.unit
def test_negated_commit_is_not_a_commit():
    verdict = run(
        case(honesty_from_tool=True),
        "There isn't an existing bug that matches your symptom closely.",
        results=[{"match": "weak"}],
    )
    assert verdict["passed"] is True


@pytest.mark.unit
def test_positive_commit_still_detected():
    verdict = run(
        case(honesty_from_tool=True),
        "It looks like there's already a bug that matches your symptom.",
        results=[{"match": "strong"}],
    )
    assert verdict["passed"] is True


@pytest.mark.unit
def test_not_found_accepts_locate_synonym():
    assert run(case(says_not_found=True), "I couldn't locate that bug in your company.")["passed"] is True
    assert run(case(says_not_found=False), "I couldn't locate that bug in your company.")["passed"] is False