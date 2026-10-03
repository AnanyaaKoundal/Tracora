"""Context and multi-turn subject cases.

The client sends the bug the user is looking at, and whether the page changed since the
last turn. Those two signals, plus the conversation, decide what a bare "it" means. The
reproduced bug was that an open page hijacked a mid-thread pronoun, so these cases pin
the precedence: an id named in the message wins, then the just-opened page, then the
recent conversation, then the page.
"""

from tests.fixtures.seed import (
    MOBILE_LAYOUT,
    MOBILE_SAVE_CRASH,
    NOTIFICATIONS_CRASH,
)

_PAGE = {
    "kind": "bug",
    "label": MOBILE_LAYOUT,
    "data": {
        "title": "Mobile View layout breaks on smaller screens",
        "description": "The layout overlaps and text is cut off on a 1366px laptop screen.",
    },
}

_HISTORY = [
    {"role": "user", "content": "is the notifications crash still open?"},
    {
        "role": "assistant",
        "content": "**B-3464386513** is the Notifications crash: clicking Save blanks the page.",
    },
]

CASES = [
    {
        "id": "context_whats_this",
        "category": "context",
        "message": "what's this about?",
        "context": _PAGE,
        "expect": {
            "expect_tool_any": ["get_bug"],
            "expect_ids": [MOBILE_LAYOUT],
            "clarify": False,
        },
        "why": "A fresh chat on a bug page: the page is the subject and its fields answer it.",
    },
    {
        "id": "context_summarize_page",
        "category": "context",
        "message": "summarize this page",
        "context": _PAGE,
        "expect": {
            "expect_tool_any": ["get_bug"],
            "expect_ids": [MOBILE_LAYOUT],
        },
        "why": "'this page' points at the screen explicitly, so the page is the referent.",
        "held_out": True,
    },
    {
        "id": "context_greeting_ignores_page",
        "category": "context",
        "message": "hey there",
        "context": _PAGE,
        "expect": {
            "expect_tool": None,
            "forbid_ids": [MOBILE_LAYOUT],
        },
        "why": "A greeting stands on its own; the open page is background, not the question.",
    },
    {
        "id": "context_explicit_id_beats_page",
        "category": "context",
        "message": "what about B-5918235077?",
        "context": _PAGE,
        "expect": {
            "expect_tool": "get_bug",
            "expect_ids": [MOBILE_SAVE_CRASH],
        },
        "requires": "data",
        "why": "An id named in the message outranks the open page.",
    },
    {
        "id": "multiturn_elaborate_keeps_subject",
        "category": "multi_turn_subject",
        "message": "can you elaborate on that one?",
        "context": _PAGE,
        "history": _HISTORY,
        "expect": {
            "expect_ids": [NOTIFICATIONS_CRASH],
            "forbid_ids": [MOBILE_LAYOUT],
        },
        "requires": "data",
        "why": "The reproduced bug. The open page must not hijack a pronoun mid-conversation.",
    },
    {
        "id": "multiturn_navigation_switches_subject",
        "category": "multi_turn_subject",
        "message": "summarize it",
        "context": _PAGE,
        "context_changed": True,
        "history": _HISTORY,
        "expect": {
            "expect_tool_any": ["get_bug"],
            "expect_ids": [MOBILE_LAYOUT],
            "forbid_ids": [NOTIFICATIONS_CRASH],
        },
        "why": "Navigating to a page makes it the subject even mid-thread.",
        "held_out": True,
    },
]
