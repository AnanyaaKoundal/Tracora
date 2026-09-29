import json
from typing import Any

from app.core.llm.chat import chat, parse_json
from app.core.logging import Stage, log
from app.domains.agent.tools import (
    DESCRIPTION_CHAR_LIMIT,
    TOOL_SPECS,
    allowed_args,
    build_registry,
)

MAX_STEPS = 4
NUM_PREDICT = 1200
PRIMARY_TOOL = "find_similar_bugs"

SYSTEM_PROMPT = """You are the assistant inside Tracora, a company's bug tracker. An engineer asks you a question and you help them out.

Grounding rules, these matter more than anything else:
- Use your tools before making any claim about existing bugs.
- Never say a bug exists, or quote or paraphrase one, unless a tool returned it.
- If nothing in the results is really about what they asked, say so. Do not stretch a loose match into a real one.

Understand what they are describing before you answer:
- If the description is vague about the action itself (what they clicked, what they expected, what happened instead) and that would change your search, ask one short question first. Use action 'clarify'.
- Ask about the action or the symptom, never about which product or app it is. Every bug here belongs to the same product, so that question has only one answer and only wastes their time.
- Ask at most one question, and only when the answer would genuinely change what you search for. "Blank screen after logging in" is far too broad to search on its own, because "blank screen" could be the dashboard, the reports page, or a crashed route.
- If you asked them something and they have now answered, treat that answer as part of the current question and carry on. Never ask the same question twice.
- Never ask a question you could answer yourself by searching.

Earlier turns in this conversation are here for reference:
- Use them to resolve things like "that one", "yes", or "the same page".
- If the newest message stands on its own, answer it as a fresh question and ignore older turns that have no bearing on it.
- If the newest message contradicts something earlier, trust the newest message.

Honour the match label the tool gives you:
- A result marked 'strong' is a genuine match. Lead with it.
- A result marked 'weak' means nothing here is really the same bug. Say that plainly. Mention the nearest bugs only as nearby, adjacent things worth a look, never as the bug they are describing.

How to talk:
- Write like a colleague answering a question over coffee, not like a search engine and not like an analyst. No "the closest match is", no "whereas", no "it is worth noting".
- Lead with the answer. The person asked a question, give them the answer first, then the supporting detail.
- Two or three sentences is usually plenty. Do not write a report.
- Use short markdown so it scans: **bold** the bug IDs, and use a bullet list when you mention more than one.
- Use plain punctuation. Do not use em dashes. Prefer a comma, a full stop, or a new line.
- Never mention similarity scores, percentages or rankings. They are retrieval internals and mean nothing to the person reading.
- End with something useful. If nothing matches, say this looks like a new bug and offer to file it. If something does match, say which one they should open.

Nearby is worth mentioning. If a result is adjacent rather than identical, say so in a few words and let them judge. Do not pad the answer with bugs that are simply unrelated."""

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
                "enum": ["clarify", "tool", "answer"],
                "description": (
                    "'clarify' to ask the user one question first, 'tool' to search, "
                    "'answer' to reply to the user."
                ),
            },
            "call": {
                "type": "object",
                "properties": {
                    "tool": {"type": "string", "const": spec["name"]},
                    "args": spec["args"],
                },
                "required": ["tool", "args"],
            },
            "question": {
                "type": "string",
                "description": (
                    "One short question to ask the user. Only used when action is "
                    "'clarify'."
                ),
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
        decision = parse_json(chat(messages, json_schema=schema, num_predict=NUM_PREDICT))
    except Exception as exc:
        raise AgentError(f"Model call failed: {exc}") from exc
    log(
        "agent.step",
        action=decision.get("action"),
        thought=str(decision.get("thought") or "")[:80],
    )
    return decision


def run_turn(
    message: str,
    company_id: str,
    context: dict[str, Any] | None = None,
    history: list[dict[str, str]] | None = None,
) -> tuple[str, list[str]]:
    registry = build_registry(company_id)
    schema = _decision_schema()
    steps: list[str] = []

    # Order is deliberate: system, then history in order, then the current message as
    # the last user turn, then tool results appended after. Tool JSON has to land
    # below the current message or the model reads a stale result as the live one.
    messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]

    for turn in history or []:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content.strip()})

    messages.append({"role": "user", "content": _user_block(message, context)})

    if len(messages) > 2:
        log("agent.history", turns=len(messages) - 2)

    # The first retrieval is forced. A 3B model asked "is there an existing bug for
    # this?" will happily reply "no, there are none" without ever calling a tool, and
    # that is a confident lie rather than a visible failure. Grounding comes first;
    # after that the model decides whether it needs anything else.
    #
    # The one exception is a question too underspecified to search on. "Blank screen
    # after logging in" could be the dashboard, the reports page, or a crashed route,
    # and retrieving five bugs for the wrong one is worse than asking. So we let the
    # model take one clarifying pass before the forced search.
    # The timing is noise here: the model call it wraps is already logged with its
    # own duration. What matters is which way it went, so that a silent turn can be
    # told apart from one where the model decided to ask something first.
    try:
        opening = _decide(messages, schema)
    except AgentError:
        opening = {"action": "tool"}

    if opening.get("action") == "clarify":
        question = opening.get("question")
        log("agent.clarify", thought=opening.get("thought") or "")
        if isinstance(question, str) and question.strip():
            log("agent.turn", outcome="clarify")
            return question.strip(), steps
    else:
        log("agent.triage", thought=str(opening.get("thought") or "")[:80])

    with Stage("agent.retrieval") as stage:
        try:
            result = registry[PRIMARY_TOOL](text=message)
        except Exception as exc:
            raise AgentError(f"Tool '{PRIMARY_TOOL}' failed: {exc}") from exc
        stage.add(
            tool=PRIMARY_TOOL,
            found=len(result["results"]),
            best=result["best_similarity"],
            verdict=result["match"],
        )

    steps.append(f"Searched similar bugs for: {message[:70]}")

    # Nothing to reason over. Answering this with the model wastes a dozen seconds
    # and a 3B will pad it into something vague.
    if not result["results"]:
        log("agent.turn", outcome="no_matches")
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

        # Clarification already happened above, before retrieval. If the model asks
        # again now it has results in hand, so treat it as an answer instead of
        # stalling with a second question.
        if action == "clarify":
            action = "answer"
            decision["reply"] = decision.get("question")

        if action != "tool":
            reply = decision.get("reply")
            if isinstance(reply, str) and reply.strip():
                log("agent.turn", outcome="answer")
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
