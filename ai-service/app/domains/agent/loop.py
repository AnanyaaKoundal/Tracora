import json
from typing import Any

from app.core.llm.chat import chat, parse_json
from app.domains.agent.tools import (
    DESCRIPTION_CHAR_LIMIT,
    TOOL_SPECS,
    allowed_args,
    build_registry,
)

MAX_STEPS = 4
NUM_PREDICT = 1200
PRIMARY_TOOL = "find_similar_bugs"

SYSTEM_PROMPT = """You are the Tracora assistant. You help engineers understand this company's bug tracker.

You have tools. Use them before making any claim about existing bugs.
Never say a bug exists, or quote or paraphrase one, unless a tool returned it.
If a search returns nothing relevant, say so plainly instead of guessing.

When you do get results, do not just list them. Compare them to what the user described and say how each one actually differs or matches. Lead with the closest. Cite bugs as BUG-<id>.

Write for an engineer. Be direct and concrete. Use short markdown. No preamble, no restating the question."""

FALLBACK_REPLY = (
    "I couldn't work that out in the number of steps I take per question. "
    "Try describing the problem more concretely."
)

NO_MATCHES_REPLY = (
    "No similar bugs found in this company's tracker. That means nothing close has been "
    "reported before, not that nothing is relevant to you. If you create the bug, it "
    "becomes the first record of this shape."
)


class AgentError(RuntimeError):
    pass


def _user_block(message: str, context: dict[str, Any] | None) -> str:
    if not context:
        return message

    data = context.get("data") or {}
    lines = [f"[Shared context: {context.get('label') or 'current page'}]"]
    for key in ("title", "description"):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            lines.append(f"{key}: {value.strip()[:DESCRIPTION_CHAR_LIMIT]}")

    if len(lines) == 1:
        return message
    return "\n".join(lines) + f"\n\n---\nUser message: {message}"


def _decision_schema() -> dict[str, Any]:
    """Schema for one loop step.

    Built from TOOL_SPECS so a tool's arguments are grammar-enforced. Written for the
    current single-tool case: when a second tool is registered this needs to become a
    `oneOf` over the tool variants, and that has to be tested before it is relied on.
    """
    spec = TOOL_SPECS[0]
    return {
        "type": "object",
        "properties": {
            "thought": {
                "type": "string",
                "description": "One short line of reasoning. Not shown to the user.",
            },
            "action": {
                "type": "string",
                "enum": ["tool", "answer"],
                "description": "'tool' to search first, 'answer' to reply to the user.",
            },
            "call": {
                "type": "object",
                "properties": {
                    "tool": {"type": "string", "const": spec["name"]},
                    "args": spec["args"],
                },
                "required": ["tool", "args"],
            },
            "reply": {
                "type": "string",
                "description": "The answer for the user. Only used when action is 'answer'.",
            },
        },
        "required": ["action"],
    }


def _decide(messages: list[dict[str, str]], schema: dict[str, Any]) -> dict[str, Any]:
    try:
        return parse_json(chat(messages, json_schema=schema, num_predict=NUM_PREDICT))
    except Exception as exc:
        raise AgentError(f"Model call failed: {exc}") from exc


def run_turn(
    message: str,
    company_id: str,
    context: dict[str, Any] | None = None,
) -> tuple[str, list[str]]:
    registry = build_registry(company_id)
    schema = _decision_schema()
    steps: list[str] = []

    messages: list[dict[str, str]] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _user_block(message, context)},
    ]

    # The first retrieval is forced. A 3B model asked "is there an existing bug for
    # this?" will happily reply "no, there are none" without ever calling a tool, and
    # that is a confident lie rather than a visible failure. Grounding comes first;
    # after that the model decides whether it needs anything else.
    try:
        result = registry[PRIMARY_TOOL](text=message)
    except Exception as exc:
        raise AgentError(f"Tool '{PRIMARY_TOOL}' failed: {exc}") from exc

    steps.append(f"Searched similar bugs for: {message[:70]}")

    # Nothing to reason over. Answering this with the model wastes a dozen seconds
    # and a 3B will pad it into something vague.
    if not result:
        return NO_MATCHES_REPLY, steps

    messages.append(
        {
            "role": "user",
            "content": f"Tool `{PRIMARY_TOOL}` returned:\n{json.dumps(result, ensure_ascii=False)}",
        }
    )

    for _ in range(MAX_STEPS):
        decision = _decide(messages, schema)
        action = decision.get("action")

        if action != "tool":
            reply = decision.get("reply")
            if isinstance(reply, str) and reply.strip():
                return reply.strip(), steps
            return FALLBACK_REPLY, steps

        call = decision.get("call") or {}
        name = call.get("tool")
        tool = registry.get(name)

        messages.append({"role": "assistant", "content": json.dumps(decision, ensure_ascii=False)})

        if tool is None:
            messages.append(
                {"role": "user", "content": f"Tool '{name}' does not exist. Use an available tool, or answer."}
            )
            continue

        raw_args = call.get("args") or {}
        args = {k: v for k, v in raw_args.items() if k in allowed_args(name)}
        if not isinstance(args.get("text"), str) or not args["text"].strip():
            messages.append(
                {"role": "user", "content": "That call was missing a 'text' argument. Retry or answer."}
            )
            continue

        try:
            result = tool(**args)
        except Exception as exc:
            raise AgentError(f"Tool '{name}' failed: {exc}") from exc

        steps.append(f"Searched similar bugs for: {args['text'][:70]}")
        messages.append(
            {
                "role": "user",
                "content": f"Tool `{name}` returned:\n{json.dumps(result, ensure_ascii=False)}",
            }
        )

    return FALLBACK_REPLY, steps
