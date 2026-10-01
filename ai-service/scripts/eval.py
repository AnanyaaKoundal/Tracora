"""Run the assistant eval and print a per-axis scoreboard.

Deliberately does not make a model call unless you pass --live. The default dry run
prints the cases and the grader logic so you can confirm the expectations are sane
before spending anything, which is the whole point of building the harness before
changing prompts.

    python scripts/eval.py                    # dry run, no network, no tokens
    python scripts/eval.py --live             # real model, uses your LLM_BACKEND
    python scripts/eval.py --live --axis honest
    python scripts/eval.py --live --case weak_match_blank_screen -v
    python scripts/eval.py --live --json out.json

The company is an argument, not a default, because scoring an empty tenant produces
a perfect 100% on the honesty axis for entirely the wrong reason.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.eval_cases import CASES, SEED_COMPANY, grade  # noqa: E402

GREEN, RED, YELLOW, DIM, RESET = "\033[32m", "\033[31m", "\033[33m", "\033[2m", "\033[0m"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--live", action="store_true", help="call the model (spends tokens)")
    p.add_argument("--company", default=SEED_COMPANY, help="company_id holding the seeded bugs")
    p.add_argument("--case", action="append", help="run only this case id; repeatable")
    p.add_argument("--axis", choices=["ground", "honest", "shape"], help="run only one axis")
    p.add_argument("-v", "--verbose", action="store_true", help="print each reply")
    p.add_argument("--json", type=Path, help="write full results to this file")
    return p.parse_args()


def selected(args: argparse.Namespace) -> list[dict]:
    cases = CASES
    if args.case:
        wanted = set(args.case)
        cases = [c for c in cases if c["id"] in wanted]
        missing = wanted - {c["id"] for c in CASES}
        if missing:
            raise SystemExit(f"unknown case id(s): {', '.join(sorted(missing))}")
    if args.axis:
        cases = [c for c in cases if c["axis"] == args.axis]
    return cases


def dry_run(cases: list[dict]) -> None:
    print(f"{DIM}{len(cases)} case(s). No model called, nothing spent.{RESET}\n")
    for case in cases:
        print(f"{YELLOW}{case['id']}{RESET}  {DIM}[{case['axis']}]{RESET}")
        print(f"  ask     {case['message']!r}")
        for turn in case.get("history") or []:
            print(f"  prior   {turn['role']}: {turn['content']!r}")
        print(f"  expect  {json.dumps(case['expect'])}")
        print(f"  {DIM}{case['why']}{RESET}\n")


def live(args: argparse.Namespace, cases: list[dict]) -> dict:
    from app.domains.agent.loop import run_turn

    results = []
    for i, case in enumerate(cases, 1):
        print(f"{DIM}[{i}/{len(cases)}] {case['id']} ...{RESET}", end=" ", flush=True)
        started = time.perf_counter()
        try:
            reply, steps = run_turn(
                message=case["message"],
                company_id=args.company,
                history=case.get("history"),
            )
            error = None
        except Exception as exc:
            reply, steps, error = "", [], f"{type(exc).__name__}: {exc}"
        elapsed = time.perf_counter() - started

        if error:
            verdict = {"checks": {}, "passed": False, "failed": ["raised"], "error": error}
        else:
            verdict = grade(case, reply, steps)

        mark = f"{GREEN}pass{RESET}" if verdict["passed"] else f"{RED}FAIL{RESET}"
        print(f"{mark} {DIM}{elapsed:.1f}s{RESET}")
        if not verdict["passed"]:
            print(f"     {RED}failed: {', '.join(verdict.get('failed') or ['?'])}{RESET}")
            print(f"     {DIM}{verdict.get('error', '')}{RESET}")
        if args.verbose or not verdict["passed"]:
            print(f"     reply: {reply[:300]}")
            print(f"     {DIM}steps: {steps}{RESET}")

        results.append(
            {
                "id": case["id"],
                "axis": case["axis"],
                "seconds": round(elapsed, 2),
                "reply": reply,
                "steps": steps,
                **verdict,
            }
        )

    axes: dict[str, list[bool]] = {}
    for r in results:
        axes.setdefault(r["axis"], []).append(r["passed"])
    print()
    for axis, oks in sorted(axes.items()):
        got, total = sum(oks), len(oks)
        pct = 100 * got / total
        colour = GREEN if pct == 100 else (YELLOW if pct >= 60 else RED)
        print(f"  {colour}{pct:5.1f}%{RESET}  {axis}  ({got}/{total})")
    overall = 100 * sum(r["passed"] for r in results) / len(results) if results else 0.0
    print(f"  {overall:5.1f}%  overall  ({sum(r['passed'] for r in results)}/{len(results)})")

    return {"company": args.company, "results": results, "overall_pct": round(overall, 1)}


def main() -> None:
    args = parse_args()
    cases = selected(args)
    if not cases:
        raise SystemExit("no cases matched")

    if not args.live:
        dry_run(cases)
        return

    payload = live(args, cases)
    if args.json:
        args.json.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\n{DIM}wrote {args.json}{RESET}")


if __name__ == "__main__":
    main()
