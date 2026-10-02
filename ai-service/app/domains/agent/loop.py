import json
import re
from typing import Any

from app.core.llm.chat import complete
from app.core.logging import Stage, log
from app.domains.agent.tools import (
    DESCRIPTION_CHAR_LIMIT,
    TOOL_SPECS,
    allowed_args,
    build_registry,
    function_schemas,
    required_args,
)

MAX_STEPS = 4
NUM_PREDICT = 1200

_BASE_PROMPT = """You are the assistant inside Tracora, a company's bug tracker. An engineer asks you a question and you help them out.

Grounding rules, these matter more than anything else:
- Use your tools before making any claim about existing bugs or projects.
- Never say a bug or project exists, or quote one, unless a tool returned it or the user shared it as page context.
- If the user pastes a bug id, or asks about a bug by id, read it with get_bug before describing it.
- Shared page context is background about the screen the user is on, not automatically the question. A bare "it", "that" or "this one" normally refers to the current subject from the conversation, not the page. If a "Current subject" line is given above the message, that is what such pronouns point to. Treat the page as the subject only when the user points at it ("this page", "this bug", "on screen", "here", "what's this about") or when no subject is given (a fresh chat opened on a page). If the message stands on its own, such as a greeting, answer it and leave the page alone.
- When you do use the page as the subject, treat it as true and answer only from the fields it actually contains. Do not add a project, priority, assignee or severity it does not show.
- Never open the bug with get_bug just because a bug id is in the page background. Read it only when the user asks about that bug or asks for details the page does not include.
- If nothing in the results is really about what they asked, say so. Do not stretch a loose match into a real one.
- You can search and look things up. You cannot count. Never present the number of results you received as a total, and never guess a count. If they ask "how many", say you can search but not tally.

Projects:
- Bugs belong to projects. A user may name a project, or refer to one loosely ("the redesign one"). Put their wording in the project argument exactly as they said it. Never invent a project id or pick a project yourself.
- If a tool result has status 'ambiguous', it matched more than one project. Ask which one, listing the candidate names, and do not answer about bugs yet.
- If a tool result has status 'project_not_found', say you could not find that project for this company, and offer to search the whole company instead.
- Use find_projects when the user asks about a project itself, or when you need to confirm a project exists.
- Never ask a clarifying question when the user names a project or asks about projects. Look it up. "Tell me about the Mobile App project" and "what projects do we have" are not vague.

Understand what they are describing before you answer:
- If the description is vague about the action itself (what they clicked, what they expected, what happened instead) and that would change your search, ask one short question first. To do that, just reply with the question and do not call a tool that turn.
- Only clarify when the message gives you nothing concrete to search on. If it already describes a symptom, a page, or a feature, search with it instead of asking. Err towards searching.
- Ask about the action or the symptom, never about which product or app it is. Every bug here belongs to the same product, so that question has only one answer and only wastes their time.
- Ask at most one question, and only when the answer would genuinely change what you search for. "Blank screen after logging in" is far too broad to search on its own, because "blank screen" could be the dashboard, the reports page, or a crashed route.
- If you asked them something and they have now answered, treat that answer as part of the current question and carry on. Never ask the same question twice.
- Never ask a question you could answer yourself by searching.

Earlier turns in this conversation are here for reference:
- A pronoun with no other clue ("it", "that one") refers to the bug or project you were just discussing. Keep the same subject across turns until the user names something else or points at the page.
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


def _tool_instructions() -> str:
    """Render the tool contract into the prompt.

    The specs in tools.py were previously used only to build the tool-name enum, so
    the model had to guess argument names: it called find_similar_bugs with "query"
    instead of "text" and the search failed. Deriving this block from the same specs
    keeps the prompt and the registry from drifting apart.
    """
    lines = ["Tools you can call. Use these exact names and argument names:"]
    for spec in TOOL_SPECS:
        args = spec["args"]
        required = set(args.get("required", []))
        parts = [
            f"{name}: {meta.get('type', 'value')}{', required' if name in required else ''}"
            for name, meta in args.get("properties", {}).items()
        ]
        lines.append(f"- {spec['name']}({', '.join(parts)}). {spec['description']}")
    return "\n".join(lines)


SYSTEM_PROMPT = _BASE_PROMPT + "\n\n" + _tool_instructions()


FALLBACK_REPLY = (
    "I couldn't work that out in the number of steps I take per question. "
    "Try describing the problem more concretely."
)

GROUNDING_REPLY = (
    "I shouldn't describe bugs or projects I have not actually looked up. "
    "Tell me what to search for and I will pull the real records."
)

# Entity ids the assistant is allowed to quote: the page context, what the user just
# referenced, and anything a tool returned this turn. Anything else in a reply is a
# fabricated reference. Checking the text, not the backend, keeps this guarantee
# provider-agnostic: a reply either matches the grounded facts or it does not.
_ENTITY_ID_RE = re.compile(r"\b(?:B|PRJ)-[A-Z0-9]+\b")


def _ids_in(value: Any) -> set[str]:
    """Every entity id mentioned anywhere inside a result, context or message."""
    try:
        text = json.dumps(value, ensure_ascii=False)
    except (TypeError, ValueError):
        text = str(value)
    return set(_ENTITY_ID_RE.findall(text))


def _ungrounded_ids(reply: str, grounded: set[str]) -> list[str]:
    """Ids the reply cites that nothing grounded this turn actually contains."""
    return sorted({found for found in _ENTITY_ID_RE.findall(reply) if found not in grounded})


# Words that point at the screen rather than at the conversation. When one of these is
# present, the open page is the referent even mid-conversation.
_PAGE_POINT_RE = re.compile(
    r"\b(this\s+(?:page|bug|screen)|current\s+page|on\s+(?:this\s+)?screen|here|what'?s\s+this)\b",
    re.IGNORECASE,
)


def _page_id(context: dict[str, Any] | None) -> str | None:
    """The entity id carried by a bug page context, if any."""
    if not context or context.get("kind") != "bug":
        return None
    label = context.get("label")
    ids = sorted(_ids_in(label)) if isinstance(label, str) else []
    return ids[0] if ids else None


def _history_id(history: list[dict[str, str]] | None) -> str | None:
    """The most recently discussed entity id, from the newest turn back.

    Tool calls are not stored, so the conversation's subject is whatever the last
    message that named an entity said. The first id in that message is its subject.
    """
    for turn in reversed(history or []):
        content = turn.get("content")
        if not isinstance(content, str):
            continue
        ids = _ENTITY_ID_RE.findall(content)
        if ids:
            return ids[0]
    return None


def _current_subject(
    message: str,
    context: dict[str, Any] | None,
    history: list[dict[str, str]] | None,
    context_changed: bool,
) -> tuple[str | None, str]:
    """What a bare "it"/"that" points to this turn.

    Precedence mirrors how a person tracks a topic: an id the user named wins; the
    page wins if they just opened it (context changed) or pointed at it, or if the
    conversation has no subject yet; otherwise the recent conversation subject wins.
    """
    message_ids = _ENTITY_ID_RE.findall(message)
    if message_ids:
        return message_ids[0], "message"

    page = _page_id(context)
    history_id = _history_id(history)

    if page and _PAGE_POINT_RE.search(message):
        return page, "page"
    if page and (context_changed or not history_id):
        return page, "page"
    if history_id:
        return history_id, "history"
    if page:
        return page, "page"
    return None, "none"


class AgentError(RuntimeError):
    pass


def _user_block(
    message: str,
    context: dict[str, Any] | None,
    subject_id: str | None,
) -> str:
    lines: list[str] = []
    if subject_id:
        lines.append(
            f'[Current subject: {subject_id} (a bare "it"/"that" refers to this)]'
        )

    raw_data = context.get("data") if context else None
    data = raw_data if isinstance(raw_data, dict) else {}
    label = context.get("label") if context else None
    if isinstance(label, str) and label.strip():
        lines.append(f"[Open page, background only: {label.strip()}]")
    for key in ("title", "description"):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            lines.append(f"{key}: {value.strip()[:DESCRIPTION_CHAR_LIMIT]}")

    if not lines:
        return message
    return "\n".join(lines) + f"\n\n---\nUser message: {message}"


def _tool_result(tool_call_id: str, content: str) -> dict[str, str]:
    """A tool result message, in the OpenAI shape the provider layer translates.

    The loop keeps one canonical message format; `_ollama_messages` converts it for
    Ollama, so there is no per-backend branch here.
    """
    return {"role": "tool", "tool_call_id": tool_call_id, "content": content}


def _forced_answer(messages: list[dict[str, Any]], grounded: set[str]) -> str | None:
    """One last model call with no tools, used only when the step budget ran out.

    The alternative is a generic "I couldn't work that out" even though every tool
    result the model needs is already sitting in the conversation. Asking once more,
    with tools off the table, recovers most of those turns. Omitting tools is the
    provider-agnostic way to say "answer, do not call anything" (Ollama has no
    tool_choice).
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
        completion = complete(forced, num_predict=NUM_PREDICT)
    except Exception:
        return None
    reply = completion.content
    if isinstance(reply, str) and reply.strip() and not _is_placeholder(reply):
        if _ungrounded_ids(reply, grounded):
            return None
        return reply.strip()
    return None


def _sanitize_args(name: str, raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        return {}
    return {key: value for key, value in raw.items() if key in allowed_args(name)}


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
    if name == "find_similar_bugs":
        text = args.get("text")
        if not isinstance(text, str) or not text.strip():
            return None
    if name == "find_projects":
        query = args.get("query")
        if query is not None and not isinstance(query, str):
            return None
    if name == "get_bug":
        bug_id = args.get("bug_id")
        if not isinstance(bug_id, str) or not bug_id.strip():
            return None

    try:
        result = tool(**args)
    except Exception as exc:
        raise AgentError(f"Tool '{name}' failed: {exc}") from exc

    if name == "find_similar_bugs":
        steps.append(f"Searched for: {args.get('text', '')[:70]}")
    elif name == "find_projects":
        steps.append("Looked up projects")
    elif name == "get_bug":
        steps.append(f"Opened bug: {args.get('bug_id', '')}")
    return result


def run_turn(
    message: str,
    company_id: str,
    context: dict[str, Any] | None = None,
    history: list[dict[str, str]] | None = None,
    context_changed: bool = False,
) -> tuple[str, list[str]]:
    registry = build_registry(company_id)
    tools = function_schemas()
    steps: list[str] = []

    # Resolve what a bare "it"/"that" points to before the model sees the turn. The
    # client flags a page change, which lets a freshly opened bug take over mid-thread.
    subject_id, subject_source = _current_subject(
        message, context, history, context_changed
    )
    if subject_id:
        log("agent.subject", id=subject_id, source=subject_source)

    # Order is deliberate: system, then history in order, then the current message as
    # the last user turn, then tool results appended after. Tool results have to land
    # below the current message or the model reads a stale result as the live one.
    messages: list[dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]

    for turn in history or []:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content.strip()})

    messages.append(
        {"role": "user", "content": _user_block(message, context, subject_id)}
    )

    if len(messages) > 2:
        log("agent.history", turns=len(messages) - 2)

    # No forced retrieval. The model decides per turn: a greeting gets a direct answer,
    # a bug question becomes a native tool call, and an underspecified one becomes a
    # single clarifying question in plain text. Any id in the final reply is validated
    # against what tools actually returned, so a fabricated bug cannot be shown. See
    # docs/ai-assistant-architecture.md.
    used: set[str] = set()
    repairs = 0
    # Ids the user can legitimately see this turn: the page they are on, what they just
    # typed, and earlier turns. Tool results widen this as the loop runs.
    grounded: set[str] = _ids_in(context) | _ids_in(message) | _ids_in(history)

    for _ in range(MAX_STEPS):
        try:
            completion = complete(messages, tools=tools, num_predict=NUM_PREDICT)
        except Exception as exc:
            # A failed step should not end the turn: the results already gathered are
            # still usable, and _forced_answer gets one tool-free call.
            log("agent.step", action="error", thought=str(exc)[:60])
            break

        log(
            "agent.step",
            action="tool" if completion.tool_calls else "answer",
            tools=",".join(call.name for call in completion.tool_calls) or None,
            tool_calls=len(completion.tool_calls),
            reply_chars=len(completion.content or ""),
            finish_reason=completion.finish_reason,
        )

        if not completion.tool_calls:
            reply = completion.content
            if isinstance(reply, str) and reply.strip() and not _is_placeholder(reply):
                bad = _ungrounded_ids(reply, grounded)
                if bad and repairs == 0:
                    # The reply quoted an id nothing returned. Give the model one chance
                    # to look it up or drop it. A fabricated bug must never reach the user.
                    repairs += 1
                    messages.append({"role": "assistant", "content": reply})
                    messages.append(
                        {
                            "role": "user",
                            "content": (
                                "You mentioned "
                                + ", ".join(bad)
                                + ", but no tool returned those ids. Call the right tool to "
                                "look them up, or answer without them."
                            ),
                        }
                    )
                    continue
                if bad:
                    log("agent.grounding", action="rejected", ids=",".join(bad))
                    return GROUNDING_REPLY, steps
                log("agent.turn", outcome="answer")
                return reply.strip(), steps
            # No usable text and no tool call. Ask once more rather than dropping the
            # whole turn on a formatting slip.
            messages.append({"role": "assistant", "content": reply or ""})
            messages.append(
                {
                    "role": "user",
                    "content": "Give the user your answer now, in plain language.",
                }
            )
            continue

        # Echo the assistant tool-call turn, then one tool message per call. The whole
        # batch goes back in one reply, which is the shape both providers expect.
        messages.append(
            {
                "role": "assistant",
                "content": completion.content,
                "tool_calls": [call.as_openai_message() for call in completion.tool_calls],
            }
        )

        for call in completion.tool_calls:
            name = call.name
            if name not in registry:
                messages.append(
                    _tool_result(
                        call.id,
                        "That tool does not exist. Use one of the available tools, or answer.",
                    )
                )
                continue

            signature = _call_signature(name, _sanitize_args(name, call.arguments))
            if signature in used:
                messages.append(
                    _tool_result(
                        call.id,
                        "You already ran that exact lookup. Answer the user with what you have.",
                    )
                )
                continue

            with Stage("agent.tool"):
                result = _call_tool(registry, name, call.arguments, steps)
            if result is None:
                messages.append(
                    _tool_result(
                        call.id,
                        "That call was missing or had a wrong argument. Retry or answer.",
                    )
                )
                continue

            used.add(signature)
            grounded |= _ids_in(result)
            messages.append(_tool_result(call.id, json.dumps(result, ensure_ascii=False)))

    final = _forced_answer(messages, grounded)
    if final:
        log("agent.turn", outcome="forced_answer")
        return final, steps

    log("agent.turn", outcome="fallback")
    return FALLBACK_REPLY, steps
