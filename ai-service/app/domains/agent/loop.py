import json
from typing import Any

from app.core.llm.chat import chat, parse_json
from app.core.logging import Stage, log
from app.domains.agent.tools import (
    DESCRIPTION_CHAR_LIMIT,
    TOOL_SPECS,
    allowed_args,
    build_registry,
    required_args,
)

MAX_STEPS = 4
NUM_PREDICT = 1200
PRIMARY_TOOL = "find_similar_bugs"

SYSTEM_PROMPT = """You are the assistant inside Tracora, a company's bug tracker. An engineer asks you a question and you help them out.

Grounding rules, these matter more than anything else:
- Use your tools before making any claim about existing bugs or projects.
- Never say a bug or project exists, or quote or paraphrase one, unless a tool returned it.
- If nothing in the results is really about what they asked, say so. Do not stretch a loose match into a real one.
- You can search and look things up. You cannot count. Never present the number of results you received as a total, and never guess a count. If they ask "how many", say you can search but not tally.

Projects:
- Bugs belong to projects. A user may name a project, or refer to one loosely ("the redesign one"). Put their wording in the project argument exactly as they said it. Never invent a project id or pick a project yourself.
- If a tool result has status 'ambiguous', it matched more than one project. Ask which one, listing the candidate names, and do not answer about bugs yet.
- If a tool result has status 'project_not_found', say you could not find that project for this company, and offer to search the whole company instead.
- Use find_projects when the user asks about a project itself, or when you need to confirm a project exists.
- Never ask a clarifying question when the user names a project or asks about projects. Look it up. "Tell me about the Mobile App project" and "what projects do we have" are not vague.

Understand what they are describing before you answer:
- If the description is vague about the action itself (what they clicked, what they expected, what happened instead) and that would change your search, ask one short question first. Use action 'clarify' and put the question in 'reply'.
- Only clarify when the message gives you nothing concrete to search on. If it already describes a symptom, a page, or a feature, search with it instead of asking. Err towards searching.
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
    "Nothing similar has been reported in your workspace yet. That means nothing close "
    "has come up before, not that nothing is relevant to you. If you log it, it becomes "
    "the first record of its shape."
)


class AgentError(RuntimeError):
    pass


def _user_block(message: str, context: dict[str, Any] | None) -> str:
    if not context:
        return message

    data = context.get("data") or {}
    lines: list[str] = []
    label = context.get("label")
    if isinstance(label, str) and label.strip():
        lines.append(f"[Shared context: {label.strip()}]")
    for key in ("title", "description"):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            lines.append(f"{key}: {value.strip()[:DESCRIPTION_CHAR_LIMIT]}")

    if not lines:
        return message
    return "\n".join(lines) + f"\n\n---\nUser message: {message}"


def _decision_schema() -> dict[str, Any]:
    """Schema for one loop step, as a discriminated union over the three actions.

    A flat object with an optional 'reply' let the model answer with no text at all;
    making 'reply' globally required made it pad a tool call with junk like "None".
    Neither works, because the required fields genuinely differ per action. The union
    states that directly: clarify and answer must carry 'reply', tool must carry
    'call'. llama.cpp compiles this to a grammar alternation, and the OpenAI-shaped
    backends accept it too, so one schema works across all of them.
    """
    thought = {
        "type": "string",
        "description": "One short line of reasoning. Not shown to the user.",
    }
    return {
        "oneOf": [
            {
                "type": "object",
                "properties": {
                    "action": {"const": "clarify"},
                    "thought": thought,
                    "reply": {
                        "type": "string",
                        "description": "The single question to ask the user.",
                    },
                },
                "required": ["action", "reply"],
            },
            {
                "type": "object",
                "properties": {
                    "action": {"const": "tool"},
                    "thought": thought,
                    "call": {
                        "type": "object",
                        "properties": {
                            "tool": {
                                "type": "string",
                                "enum": [spec["name"] for spec in TOOL_SPECS],
                            },
                            "args": {"type": "object"},
                        },
                        "required": ["tool", "args"],
                    },
                },
                "required": ["action", "call"],
            },
            {
                "type": "object",
                "properties": {
                    "action": {"const": "answer"},
                    "thought": thought,
                    "reply": {
                        "type": "string",
                        "description": "The answer for the user.",
                    },
                },
                "required": ["action", "reply"],
            },
        ]
    }


def _answer_only_schema() -> dict[str, Any]:
    """A final call stripped down to a plain answer.

    When the budget runs out it is almost always because the model kept reaching for
    tools instead of talking. Given the union it would do that again, so the last call
    offers it no tool branch at all and only a reply to fill.
    """
    return {
        "type": "object",
        "properties": {
            "reply": {"type": "string", "description": "The answer for the user."},
        },
        "required": ["reply"],
    }


def _decide(messages: list[dict[str, str]], schema: dict[str, Any]) -> dict[str, Any]:
    try:
        decision = parse_json(chat(messages, json_schema=schema, num_predict=NUM_PREDICT))
    except Exception as exc:
        raise AgentError(f"Model call failed: {exc}") from exc
    # Log the shape of the decision, never its text: action + which tool + which
    # argument keys + whether a reply was actually supplied. That is what tells a
    # stuck loop apart from a model that simply answered badly.
    call = decision.get("call") if isinstance(decision.get("call"), dict) else {}
    args = call.get("args") if isinstance(call.get("args"), dict) else {}
    reply = decision.get("reply")
    log(
        "agent.step",
        action=decision.get("action"),
        tool=call.get("tool"),
        args=",".join(sorted(args)) or None,
        reply_chars=len(reply) if isinstance(reply, str) else 0,
        thought=str(decision.get("thought") or "")[:60],
    )
    return decision


def _forced_answer(messages: list[dict[str, str]]) -> str | None:
    """One last model call with no tool branch, used only when the budget ran out.

    The alternative is a generic "I couldn't work that out" even though every tool
    result the model needs is already sitting in the conversation. Asking once more,
    with tools taken off the table, recovers most of those turns.
    """
    forced = messages + [
        {
            "role": "user",
            "content": (
                "Answer the user now, in plain language, using the results above. "
                "Do not call any tool."
            ),
        }
    ]
    try:
        decision = parse_json(chat(forced, json_schema=_answer_only_schema(), num_predict=NUM_PREDICT))
    except Exception:
        return None
    reply = decision.get("reply")
    if isinstance(reply, str) and reply.strip() and not _is_placeholder(reply):
        return reply.strip()
    return None


def _sanitize_args(name: str, raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        return {}
    return {key: value for key, value in raw.items() if key in allowed_args(name)}


def _next_hint(name: str) -> str:
    """A one-line nudge appended to each tool result.

    Models that are strong at a single tool call are often bad at the second step:
    after find_projects returns, they sit on the list instead of following through to
    a bug search, and the turn times out. Naming the next move explicitly is a cheaper
    fix than adding steps and latency.
    """
    if name == PRIMARY_TOOL:
        return "Use these results now. Answer the user."
    if name == "find_projects":
        return (
            "If the user asked about bugs, call find_similar_bugs now with the relevant "
            "project from this list. If they asked about a project itself, answer now."
        )
    return "Answer the user now."


def _call_signature(name: str, args: dict[str, Any]) -> str:
    return f"{name}:{json.dumps(args, sort_keys=True)}"


# Some models emit a JSON-null-equivalent as literal text when a required string field
# has nothing meaningful to hold. Treating "None" as a real reply showed it to the
# user, so obvious placeholders are treated as "no reply" and retried once.
_PLACEHOLDER_REPLIES = {"none", "null", "n/a", "na", "nil", "empty", "{}", "[]", "no reply"}


def _is_placeholder(text: str) -> bool:
    return text.strip().lower() in _PLACEHOLDER_REPLIES


def _call_tool(
    registry: dict[str, Any], name: str, raw_args: Any, steps: list[str]
) -> dict[str, Any] | None:
    """Run a tool by name, returning its result or None if the call was malformed.

    Returning None lets the caller feed a corrective message back to the model rather
    than crashing the turn on a bad argument.
    """
    tool = registry.get(name)
    if tool is None:
        return None

    args = _sanitize_args(name, raw_args)
    if not required_args(name).issubset(args):
        return None

    # A tool can be called with the right keys and the wrong types. Reject those the
    # same way as a missing argument so the model gets a correction instead of a
    # traceback from deep inside the embedder.
    if name == PRIMARY_TOOL:
        text = args.get("text")
        if not isinstance(text, str) or not text.strip():
            return None
    if name == "find_projects":
        query = args.get("query")
        if query is not None and not isinstance(query, str):
            return None

    try:
        result = tool(**args)
    except Exception as exc:
        raise AgentError(f"Tool '{name}' failed: {exc}") from exc

    if name == PRIMARY_TOOL:
        steps.append(f"Searched for: {args.get('text', '')[:70]}")
    elif name == "find_projects":
        steps.append("Looked up projects")
    return result


def run_turn(
    message: str,
    company_id: str,
    project_id: str | None = None,
    context: dict[str, Any] | None = None,
    history: list[dict[str, str]] | None = None,
) -> tuple[str, list[str]]:
    registry = build_registry(company_id, project_id)
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
        question = opening.get("reply") or opening.get("question")
        log("agent.clarify", thought=opening.get("thought") or "")
        if isinstance(question, str) and question.strip() and not _is_placeholder(question):
            log("agent.turn", outcome="clarify")
            return question.strip(), steps

    # If the model chose a specific lookup (find_projects, or a scoped bug search), run
    # it here so the first grounding step matches what it wanted to do. Otherwise fall
    # back to the forced whole-company bug search.
    call = opening.get("call") if opening.get("action") == "tool" else None
    call = call if isinstance(call, dict) else {}
    first_name = call.get("tool") if call.get("tool") in registry else PRIMARY_TOOL
    first_args = (
        call.get("args")
        if call.get("tool") in registry
        else {"text": message}
    )
    log("agent.triage", thought=str(opening.get("thought") or "")[:80])

    with Stage("agent.retrieval") as stage:
        result = _call_tool(registry, first_name, first_args, steps)
        if result is None:
            # Malformed opening call. Fall back to the forced search rather than
            # failing the turn over a detail the model can get right on step two.
            first_name = PRIMARY_TOOL
            first_args = {"text": message}
            result = _call_tool(registry, first_name, {"text": message}, steps)
        if result is None:
            raise AgentError("Primary retrieval failed")

        if first_name == PRIMARY_TOOL and result.get("status") == "ok":
            stage.add(
                tool=first_name,
                found=len(result["results"]),
                best=result["best_similarity"],
                verdict=result["match"],
            )
        else:
            stage.add(tool=first_name, found=len(result.get("results", [])))

    # Nothing to reason over. Answering this with the model wastes a dozen seconds
    # and a 3B will pad it into something vague. This shortcut is only safe for a plain
    # bug search: for a project reference that came back ambiguous or unknown, the model
    # still has a question to ask or a clarification to give.
    if (
        first_name == PRIMARY_TOOL
        and result.get("status") == "ok"
        and not result["results"]
    ):
        log("agent.turn", outcome="no_matches")
        return NO_MATCHES_REPLY, steps

    messages.append(
        {
            "role": "user",
            "content": (
                f"Tool `{first_name}` returned:\n{json.dumps(result, ensure_ascii=False)}"
                f"\n\n{_next_hint(first_name)}"
            ),
        }
    )

    # Seed the repeat guard with whatever the opening step already ran, so the model
    # cannot spend the reasoning budget re-running the exact same lookup.
    used: set[str] = {_call_signature(first_name, _sanitize_args(first_name, first_args))}

    for _ in range(MAX_STEPS):
        decision = _decide(messages, schema)
        action = decision.get("action")

        # Clarification already happened above, before retrieval. If the model asks
        # again now it has results in hand, so treat it as an answer instead of
        # stalling with a second question.
        if action == "clarify":
            action = "answer"
            decision["reply"] = decision.get("reply") or decision.get("question")

        if action != "tool":
            reply = decision.get("reply")
            if isinstance(reply, str) and reply.strip() and not _is_placeholder(reply):
                log("agent.turn", outcome="answer")
                return reply.strip(), steps
            # The model said it was answering but gave no text. Ask once more rather
            # than dropping the whole turn on a formatting slip.
            messages.append(
                {"role": "assistant", "content": json.dumps(decision, ensure_ascii=False)}
            )
            messages.append(
                {"role": "user", "content": "You did not include a reply. Give the user your answer now."}
            )
            continue

        call = decision.get("call") or {}
        name = call.get("tool")

        messages.append(
            {"role": "assistant", "content": json.dumps(decision, ensure_ascii=False)}
        )

        if not isinstance(name, str) or name not in registry:
            messages.append(
                {
                    "role": "user",
                    "content": (
                        "That tool does not exist. Use one of the available tools, "
                        "or answer."
                    ),
                }
            )
            continue

        signature = _call_signature(name, _sanitize_args(name, call.get("args")))
        if signature in used:
            messages.append(
                {
                    "role": "user",
                    "content": (
                        "You already ran that exact lookup. Answer the user with what "
                        "you have."
                    ),
                }
            )
            continue

        result = _call_tool(registry, name, call.get("args"), steps)
        if result is None:
            messages.append(
                {
                    "role": "user",
                    "content": "That call was missing a required argument. Retry or answer.",
                }
            )
            continue

        used.add(signature)
        messages.append(
            {
                "role": "user",
                "content": (
                    f"Tool `{name}` returned:\n{json.dumps(result, ensure_ascii=False)}"
                    f"\n\n{_next_hint(name)}"
                ),
            }
        )

    final = _forced_answer(messages)
    if final:
        log("agent.turn", outcome="forced_answer")
        return final, steps

    log("agent.turn", outcome="fallback")
    return FALLBACK_REPLY, steps
