"""Verify the clarify branch and the weak-match branch without calling a model.

Monkeypatches the model call so the loop's control flow can be checked in isolation.

    python scripts/check_clarify.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import importlib

from app.core.logging import request_id

agent_loop = importlib.import_module("app.domains.agent.loop")

request_id.set("clar01")

# A deliberately underspecified question, the kind that should be clarified.
VAGUE = "I am getting a blank screen after logging in"

# Case 1: the model asks a clarifying question instead of guessing.
agent_loop._decide = lambda messages, schema: {
    "thought": "Which app and page? Too broad to search.",
    "action": "clarify",
    "question": "Which page is blank, and are you on desktop or mobile?",
}

reply, steps = agent_loop.run_turn(message=VAGUE, company_id="CMP-N4E701V5B0")
print("--- case 1: clarify ---")
print("reply:", reply)
print("steps:", steps)
print("returned a question:", reply.strip().endswith("?"))
print()

# Case 2: the model searches, gets a weak match, and must not overclaim.
agent_loop._decide = lambda messages, schema: {
    "thought": "All hits are weak, so say so.",
    "action": "answer",
    "reply": "Nothing here is really that bug. The nearest is about blank charts.",
}

reply, steps = agent_loop.run_turn(message=VAGUE, company_id="CMP-N4E701V5B0")
print("--- case 2: weak match answered honestly ---")
print("reply:", reply)
print("steps:", steps)
print()

# Case 3: a strong match is still led with, not hidden.
agent_loop._decide = lambda messages, schema: {
    "thought": "Strong hit, lead with it.",
    "action": "answer",
    "reply": "Yes, BUG-0822667617 is exactly that.",
}

reply, steps = agent_loop.run_turn(
    message="the reset link goes to a blank page",
    company_id="CMP-N4E701V5B0",
)
print("--- case 3: strong match ---")
print("reply:", reply)

