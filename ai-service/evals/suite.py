"""Load and validate the eval case set.

Cases live in separate modules by theme; this assembles them and checks the shape so a
typo (a duplicate id, an unknown category, an expectation key the grader ignores) fails
fast instead of quietly scoring nothing.
"""

from __future__ import annotations

from typing import Any

from evals.cases import context as context_cases
from evals.cases import honesty as honesty_cases
from evals.cases import safety as safety_cases
from evals.cases import search as search_cases
from evals.cases import shape as shape_cases
from tests.fixtures.seed import ABC_COMPANY, DEMO_COMPANY

CASES: list[dict[str, Any]] = [
    *search_cases.CASES,
    *context_cases.CASES,
    *shape_cases.CASES,
    *honesty_cases.CASES,
    *safety_cases.CASES,
]

COMPANIES = {"ABC": ABC_COMPANY, "DEMO": DEMO_COMPANY}

CATEGORIES = {
    "search",
    "exact_id",
    "context",
    "multi_turn_subject",
    "clarify",
    "no_tool_greeting",
    "honesty",
    "negative_refusal",
    "injection",
    "robustness",
}

# Expectation keys the grader understands. An unknown key is almost always a typo that
# would otherwise go unchecked.
_KNOWN_EXPECT = {
    "expect_tool",
    "expect_tool_any",
    "expect_ids",
    "expect_any_ids",
    "forbid_ids",
    "says_match",
    "says_not_found",
    "suggests_new_bug",
    "clarify",
    "says_count",
    "check_numbers",
    "forbid_phrases",
    "max_seconds",
    "honesty_from_tool",
}


def company_for(case: dict[str, Any]) -> str:
    selector = case.get("company", "ABC")
    return COMPANIES.get(selector, ABC_COMPANY)


def validate(cases: list[dict[str, Any]] | None = None) -> list[str]:
    cases = cases if cases is not None else CASES
    problems: list[str] = []
    seen: set[str] = set()

    for case in cases:
        cid = case.get("id")
        if not cid:
            problems.append("a case has no id")
            continue
        if cid in seen:
            problems.append(f"duplicate case id: {cid}")
        seen.add(cid)

        if case.get("category") not in CATEGORIES:
            problems.append(f"{cid}: unknown category {case.get('category')!r}")
        if not case.get("message"):
            problems.append(f"{cid}: missing message")
        if not case.get("why"):
            problems.append(f"{cid}: missing 'why'")

        unknown = set(case.get("expect", {})) - _KNOWN_EXPECT
        if unknown:
            problems.append(f"{cid}: unknown expectation key(s) {sorted(unknown)}")

        if case.get("company") and case["company"] not in COMPANIES:
            problems.append(f"{cid}: unknown company selector {case['company']!r}")

    return problems


def select(
    cases: list[dict[str, Any]] | None = None,
    *,
    ids: list[str] | None = None,
    categories: list[str] | None = None,
    include_held_out: bool = True,
) -> list[dict[str, Any]]:
    cases = list(cases if cases is not None else CASES)
    if ids:
        wanted = set(ids)
        known = {c["id"] for c in cases}
        missing = wanted - known
        if missing:
            raise SystemExit(f"unknown case id(s): {', '.join(sorted(missing))}")
        cases = [c for c in cases if c["id"] in wanted]
    if categories:
        wanted = set(categories)
        cases = [c for c in cases if c.get("category") in wanted]
    if not include_held_out:
        cases = [c for c in cases if not c.get("held_out")]
    return cases
