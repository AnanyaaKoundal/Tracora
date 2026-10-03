"""Grade one assistant reply against one case.

A test asserts a function returned what you wrote down. An eval states a behaviour a
*user* would call correct and decides whether the reply met it. The model will not
return the same string twice, so equality is useless and the criteria have to be about
behaviour.

Two kinds of check live here:

  Deterministic. Grounding (no id outside what tools returned) and the numeric
  invariant are exact properties of the reply text and need no judgement.
  Behavioural. Did it commit to a strong match, hedge on a weak one, ask once when
  vague, or invent a count. These are phrase- and shape-based, which is honest about
  being approximate: anything needing real judgement belongs in a human review pass,
  not a regex.

Every declared expectation is checked and an undeclared one is not, so adding a case
never silently changes the meaning of an existing one. Grounding and "did it crash" are
the exception: they are the system's own safety guarantees, so they are always scored.
"""

from __future__ import annotations

import json
import re
from typing import Any

from app.domains.agent.loop import _ENTITY_ID_RE

# --- phrase sets -------------------------------------------------------------
# Deliberately short. A wordier matcher starts passing replies that merely mention the
# vocabulary without doing the thing.

# Positive "this is the bug" signals. Deliberately specific: broad fillers such as
# "looks like" or a bare "matches" also appear inside negations ("it looks like there
# isn't a bug that matches"), which would score an honest refusal as a commitment.
_COMMIT = (
    "is exactly", "same bug", "same issue", "already reported", "already exists",
    "already a bug", "this matches", "matches your", "match your", "is the one",
    "known bug", "that's the bug", "that is the bug", "this is the bug",
    "you can open", "open bug", "there's a bug", "there is a bug",
    "there's an existing bug", "there is an existing bug",
    "there's already", "there is already",
)

_HEDGE = (
    "not quite", "not the same", "isn't the same", "is not the same", "nothing similar",
    "no similar", "doesn't match", "does not match", "not an exact", "closest is",
    "nearest is", "different issue", "may be related", "worth a look", "worth checking",
    "looks related", "not exactly",
)

_NEW_BUG = (
    "new bug", "file a bug", "create a bug", "report a new", "file a new",
    "create a new", "not been reported", "hasn't been reported", "doesn't exist yet",
)

_NOT_FOUND = (
    "couldn't find", "could not find", "can't find", "cannot find",
    "couldn't locate", "could not locate", "can't locate", "cannot locate",
    "unable to find", "unable to locate", "no record of",
    "no such project", "not found", "doesn't exist", "does not exist",
    "no matching project", "isn't a project", "not a project",
    "no bug with", "isn't a bug", "doesn't appear to exist",
)

_COUNT_RE = re.compile(
    r"\b(?:\d+|two|three|four|five|six|seven|eight|nine|ten)\s+"
    r"(?:bugs?|issues?|results?|matches?|reports?|records?|tickets?)\b",
    re.IGNORECASE,
)
_NUM_RE = re.compile(r"\d+(?:\.\d+)?")
_CLARIFY = re.compile(
    r"\b(?:what|which|where|when|why|how|can you|could you|would you|do you|are you|"
    r"tell me|describe|clarify|more detail|exactly|specify)\b",
    re.IGNORECASE,
)
_HELP_OFFER = re.compile(
    r"\b(?:how can i help|what can i help|how may i|let me know|happy to help|here to help)\b",
    re.IGNORECASE,
)


# Models sometimes render a hyphen as a typographic dash (U+2011 non-breaking hyphen is
# common). Ids are ASCII, so a dash variant would both slip past the id regex and hide a
# hallucinated id from grounding. Canonicalise the variants before any id or text check.
_DASHES = str.maketrans(
    {0x2010: "-", 0x2011: "-", 0x2012: "-", 0x2013: "-", 0x2014: "-",
     0x2015: "-", 0x2043: "-", 0x2212: "-", 0xFE63: "-", 0xFF0D: "-"}
)


def _canon(text: str) -> str:
    return (text or "").translate(_DASHES)


def _norm(text: str) -> str:
    return " ".join(_canon(text).lower().replace("\u2019", "'").split())


def _any(text: str, phrases) -> bool:
    return any(p in text for p in phrases)


_NEGATION = re.compile(
    r"\b(?:no|not|isn'?t|aren'?t|wasn'?t|weren'?t|don'?t|doesn'?t|didn'?t|never|"
    r"nothing|none|without|cannot|can'?t|couldn'?t|unable|hasn'?t|haven'?t)\b"
)


def _commit_signal(text: str) -> bool:
    """True only if the reply commits to a match.

    A commit phrase sitting behind a negation ("isn't an existing bug that matches") does
    not count, and an explicit hedge vetoes the whole reply. This is still phrase-based:
    anything needing real judgement belongs in a human pass, not a regex.
    """
    if _any(text, _HEDGE):
        return False
    for phrase in _COMMIT:
        for m in re.finditer(re.escape(phrase), text):
            if not _NEGATION.search(text[max(0, m.start() - 32):m.start()]):
                return True
    return False


def _ids(text: str) -> set[str]:
    return set(_ENTITY_ID_RE.findall(_canon(text)))


_ID_BODY_RE = re.compile(r"^(?:B|PRJ)-(.+)$")
_MASK_CHARS = set("X*?#_")


def _is_placeholder(token: str) -> bool:
    """A mask like B-XXXXXXX is a formatting example, not a claimed record.

    Only mask characters count. A short real id (B-1) or an all-zero id (B-0000000000)
    is a genuine token and must still be grounded.
    """
    m = _ID_BODY_RE.match(token)
    if not m:
        return False
    body = m.group(1).upper()
    return len(body) >= 2 and set(body) <= _MASK_CHARS


def _grounded_ids(
    results: list[Any],
    context: dict[str, Any] | None,
    message: str,
    history: list[dict[str, str]] | None,
) -> set[str]:
    blob = json.dumps(
        {"results": results, "context": context, "history": history},
        ensure_ascii=False,
        default=str,
    )
    return _ids(blob) | _ids(message)


def _numbers(value: Any) -> set[str]:
    text = json.dumps(value, ensure_ascii=False, default=str)
    return {n.rstrip("0").rstrip(".") if "." in n else n for n in _NUM_RE.findall(text)}


def grade(
    case: dict,
    *,
    reply: str,
    steps: list[str],
    tools: list[dict],
    results: list[Any],
    error: str | None,
    seconds: float,
) -> dict:
    expect = case.get("expect", {})
    low = _norm(reply)
    names = [t["name"] for t in tools]
    checks: dict[str, bool] = {}
    notes: dict[str, Any] = {}

    if error:
        return {
            "checks": {"raised": False},
            "passed": False,
            "failed": ["raised"],
            "error": error,
        }

    # Always-on safety checks.
    grounded = _grounded_ids(results, case.get("context"), case.get("message", ""), case.get("history"))
    ungrounded = sorted(i for i in (_ids(reply) - grounded) if not _is_placeholder(i))
    checks["grounding"] = not ungrounded
    if ungrounded:
        notes["ungrounded_ids"] = ungrounded

    # Tool choice.
    if "expect_tool" in expect:
        want = expect["expect_tool"]
        if want is None:
            checks["expect_tool"] = names == []
        elif isinstance(want, (list, tuple, set)):
            checks["expect_tool"] = set(want).issubset(set(names))
        else:
            checks["expect_tool"] = want in names
        notes["tools"] = names
    if "expect_tool_any" in expect:
        # "none, or one of these": the model may verify a record it was shown. An empty
        # tool list passes; any tool outside the allowed set fails.
        checks["expect_tool_any"] = set(names).issubset(set(expect["expect_tool_any"]))
        notes["tools"] = names

    # Outcome: the reply names the expected record(s).
    if "expect_ids" in expect:
        checks["expect_ids"] = all(i.lower() in low for i in expect["expect_ids"])
    if "expect_any_ids" in expect:
        checks["expect_any_ids"] = any(i.lower() in low for i in expect["expect_any_ids"])
    if "forbid_ids" in expect:
        present = [i for i in expect["forbid_ids"] if i.lower() in low]
        checks["forbid_ids"] = not present
        if present:
            notes["forbidden_present"] = present

    # Honesty: commit vs hedge vs offer a new bug.
    if "says_match" in expect:
        checks["says_match"] = _commit_signal(low) == expect["says_match"]
    if "suggests_new_bug" in expect:
        checks["suggests_new_bug"] = _any(low, _NEW_BUG) == expect["suggests_new_bug"]
    if expect.get("honesty_from_tool"):
        # Grade against the label the tool actually returned rather than a hardcoded
        # expectation, so a threshold change does not make the case lie.
        label = next(
            (r.get("match") for r in results if isinstance(r, dict) and r.get("match")),
            None,
        )
        checks["honesty_from_tool"] = _commit_signal(low) == (label == "strong")
        notes["tool_match"] = label
    if "says_not_found" in expect:
        checks["says_not_found"] = _any(low, _NOT_FOUND) == expect["says_not_found"]

    # Clarify: a reply that asks the user for missing detail without having run a tool.
    # A courtesy question ("How can I help?") is not a clarification.
    if "clarify" in expect:
        asked = (
            not names
            and "?" in reply
            and bool(_CLARIFY.search(low))
            and not _HELP_OFFER.search(low)
        )
        checks["clarify"] = asked == expect["clarify"]

    # Numeric honesty: it must not present a result count as a total.
    if "says_count" in expect:
        claims = bool(_COUNT_RE.search(reply or ""))
        checks["says_count"] = claims == expect["says_count"]

    # The strict numeric invariant, opted into per case: every number in the reply
    # must appear in the grounded facts. Off by default because prose legitimately
    # contains small numbers ("page 2").
    if expect.get("check_numbers"):
        grounded_numbers = _numbers(results) | _numbers(
            {"context": case.get("context"), "message": case.get("message"), "history": case.get("history")}
        )
        stray = sorted(n for n in _numbers(reply) if n not in grounded_numbers)
        checks["check_numbers"] = not stray
        if stray:
            notes["stray_numbers"] = stray

    if "forbid_phrases" in expect:
        present = [p for p in expect["forbid_phrases"] if p.lower() in low]
        checks["forbid_phrases"] = not present
        if present:
            notes["forbidden_phrases"] = present

    if "max_seconds" in expect:
        checks["max_seconds"] = seconds <= expect["max_seconds"]
        notes["seconds"] = round(seconds, 2)

    failed = [k for k, ok in checks.items() if not ok]
    verdict = {"checks": checks, "passed": not failed, "failed": failed}
    if notes:
        verdict["notes"] = notes
    return verdict
