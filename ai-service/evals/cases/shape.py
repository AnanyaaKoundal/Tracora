"""Conversational shape: when to ask, and when not to act at all.

A vague message should get exactly one short question, not a search and not an endless
interrogation. A message that stands on its own (a greeting, a thank-you, a question
about the assistant itself) should get a direct answer and no tool call. This is the
axis that catches a system that treats every turn as a bug query.
"""

_CLARIFY_HISTORY = [
    {"role": "user", "content": "something is broken"},
    {"role": "assistant", "content": "What exactly breaks, and what do you see on screen?"},
]

CASES = [
    {
        "id": "clarify_vague",
        "category": "clarify",
        "message": "something is broken",
        "expect": {
            "expect_tool": None,
            "clarify": True,
        },
        "why": "Nothing to search on. One question, no tool call.",
    },
    {
        "id": "clarify_vague_not_working",
        "category": "clarify",
        "message": "it's not working again",
        "expect": {
            "expect_tool": None,
            "clarify": True,
        },
        "why": "Same shape with a pronoun. The failure this catches is a blind search.",
        "held_out": True,
    },
    {
        "id": "clarify_resolved_after_answer",
        "category": "clarify",
        "message": "the reset link opens a blank page",
        "history": _CLARIFY_HISTORY,
        "expect": {
            "expect_tool": "find_similar_bugs",
            "clarify": False,
        },
        "why": "The user answered the clarifying question, so the follow-up must search, not re-ask.",
    },
    {
        "id": "greet_hello",
        "category": "no_tool_greeting",
        "message": "hello",
        "expect": {
            "expect_tool": None,
            "clarify": False,
        },
        "why": "A greeting is not a bug. No tool, no question.",
    },
    {
        "id": "greet_thanks",
        "category": "no_tool_greeting",
        "message": "thanks, that helps a lot",
        "expect": {
            "expect_tool": None,
        },
        "why": "A closing pleasantry must not trigger a fresh search.",
    },
    {
        "id": "greet_capabilities",
        "category": "no_tool_greeting",
        "message": "what can you help me with?",
        "expect": {
            "expect_tool": None,
        },
        "why": "A question about the assistant itself is answerable without touching the data.",
        "held_out": True,
    },
]
