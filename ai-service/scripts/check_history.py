"""Reproduce the clarify loop the user hit, and prove history fixes it.

The model is stubbed, so this makes no API calls. What is under test is the loop's
message construction and the routing between clarify and answer, not the model's
judgement.

    python scripts/check_history.py
"""

import importlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.logging import request_id

agent_loop = importlib.import_module("app.domains.agent.loop")

request_id.set("hist01")

COMPANY = "CMP-N4E701V5B0"
Q1 = "I am getting a blank screen after logging in, is there any existing bug?"
Q2 = "after logging in it shows the blank page itself, no page is shown at all"
QUESTION = "Which app or page are you seeing the blank screen on after logging in?"

seen: list[str] = []


def model_that_asks_again(messages, schema):
    """Ignores history, so it re-asks. This is the broken behaviour."""
    seen.append(messages[-1]["content"])
    return {"thought": "still vague", "action": "clarify", "question": QUESTION}


print("=== without history (the bug you hit) ===")
agent_loop._decide = model_that_asks_again
for i in range(1, 3):
    reply, _ = agent_loop.run_turn(message=Q2 if i == 2 else Q1, company_id=COMPANY)
    print(f"  turn {i}: {reply}")
    print(f"          repeated question: {reply == QUESTION}")


def model_that_reads_history(messages, schema):
    """Uses history to see its own question was already asked and answered."""
    seen.append(messages[-1]["content"])
    # The clarifying question is in history as an assistant turn; the answer to it is
    # the current user turn. Both must be visible for this to fire.
    assistant_turns = [m["content"] for m in messages if m["role"] == "assistant"]
    if any(QUESTION in t for t in assistant_turns):
        return {
            "thought": "they already told me, and the hits are weak",
            "action": "answer",
            "reply": "Nothing in the tracker matches that. The nearest is B-1256597443, about blank charts on the dashboard, which is a different thing.",
        }
    return {"thought": "too vague to search", "action": "clarify", "question": QUESTION}


print("\n=== with history (the fix) ===")
agent_loop._decide = model_that_reads_history

reply, _ = agent_loop.run_turn(message=Q1, company_id=COMPANY)
print(f"  turn 1: {reply}")

reply, steps = agent_loop.run_turn(
    message=Q2,
    company_id=COMPANY,
    history=[
        {"role": "user", "content": Q1},
        {"role": "assistant", "content": QUESTION},
    ],
)
print(f"  turn 2: {reply}")
print(f"  asked again: {reply == QUESTION}")
print(f"  searched:    {bool(steps)}")

print("\n=== message order the model actually receives ===")
seen_order: list[str] = []


def model_that_reports_order(messages, schema):
    if not seen_order:  # the triage call, before retrieval appends anything
        seen_order.extend(m["role"] for m in messages)
    return {"action": "answer", "reply": "ok"}

agent_loop._decide = model_that_reports_order
agent_loop.run_turn(
    message=Q2,
    company_id=COMPANY,
    history=[
        {"role": "user", "content": Q1},
        {"role": "assistant", "content": QUESTION},
    ],
)
print("  " + " -> ".join(seen_order))
print(f"  system first:  {seen_order[0] == 'system'}")
print(f"  current last:  {seen_order[-1] == 'user'}")
print(f"  question visible to model: {seen_order.count('assistant') >= 1}")

