"""What a bare "it" points to.

Pure logic, so it runs in CI with no model or services. These cases mirror the
reproduced bug: mid-thread, "who fixed it?" followed the open page instead of the bug
under discussion.
"""

import pytest

from app.domains.agent.loop import _current_subject
from tests.fixtures.seed import NOTIFICATIONS_CRASH

OTHER_PAGE = "B-8580110575"

PAGE_CONTEXT = {"kind": "bug", "label": OTHER_PAGE, "data": {"title": "Other bug"}}
HISTORY = [
    {"role": "user", "content": "search for recent crashes"},
    {"role": "assistant", "content": "- **B-3464386513** notifications crash"},
    {"role": "user", "content": "elaborate on the notification crash"},
    {"role": "assistant", "content": "**B-3464386513** is the notifications crash"},
]

# (message, context, history, context_changed, expected subject)
SCENARIOS = [
    ("fresh page, bare it", "summarize it", PAGE_CONTEXT, [], False, OTHER_PAGE),
    ("mid-thread pronoun keeps the discussed bug", "who fixed it?", PAGE_CONTEXT, HISTORY, False, NOTIFICATIONS_CRASH),
    ("explicit id wins", "what about B-9999?", PAGE_CONTEXT, HISTORY, False, "B-9999"),
    ("points at the page", "summarize this page", PAGE_CONTEXT, HISTORY, False, OTHER_PAGE),
    ("navigated to a new page", "summarize it", PAGE_CONTEXT, HISTORY, True, OTHER_PAGE),
    ("no page, history only", "who fixed it?", None, HISTORY, False, NOTIFICATIONS_CRASH),
    ("nothing anywhere", "hello", None, [], False, None),
]


@pytest.mark.unit
@pytest.mark.parametrize(
    ("_label", "message", "context", "history", "changed", "expected"),
    SCENARIOS,
    ids=[s[0] for s in SCENARIOS],
)
def test_subject_precedence(_label, message, context, history, changed, expected):
    subject, _source = _current_subject(message, context, history, changed)
    assert subject == expected
