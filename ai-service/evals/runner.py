"""Run the assistant eval and print a per-category scoreboard.

This does not call a model unless you pass --live. The default dry run prints the cases
and their expectations so you can confirm they are sane before spending anything, which
is the point of building the harness before touching prompts.

    python evals/runner.py                       # dry run, no network, no tokens
    python evals/runner.py --live                # live model, recorded data (no Mongo)
    python evals/runner.py --live --backend groq
    python evals/runner.py --live --category honesty
    python evals/runner.py --live --case id_mobile_save_crash -v
    python evals/runner.py --live --data live --authorization "Bearer <jwt>"
    python evals/runner.py --live --json evals/baselines/baseline-groq.json

Data mode. "recorded" (the default) serves get_bug and find_projects from
evals/fixtures/corpus.json, so no Mongo, Express or token is needed. Semantic search
still goes to Qdrant and Ollama. "live" goes through Express and needs a token; cases
that require a data read are skipped, not failed, when one is missing.

Deterministic tests live in tests/. This is the only layer that spends tokens.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from evals import graders, recorded_data, suite  # noqa: E402

GREEN, RED, YELLOW, DIM, RESET = "\033[32m", "\033[31m", "\033[33m", "\033[2m", "\033[0m"

# Every live run is saved here, so results live in one predictable place. A committed
# baseline is just the file worth keeping.
BASELINE_DIR = ROOT / "evals" / "baselines"


class RegistryRecorder:
    """Record the tool calls a turn makes, without touching production code.

    The agent calls build_registry once per turn. Wrapping it here captures each tool's
    name, arguments and result, which the grader needs for grounding and the numeric
    invariant. Restored on exit.
    """

    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []
        self._real: Any = None

    def _wrap(self, name: str, fn: Any) -> Any:
        def inner(*args: Any, **kwargs: Any) -> Any:
            result = fn(*args, **kwargs)
            self.calls.append(
                {"name": name, "args": kwargs or (args[0] if args else {}), "result": result}
            )
            return result

        return inner

    def __enter__(self) -> "RegistryRecorder":
        import app.domains.agent.loop as loop

        self._real = loop.build_registry

        def build(company_id: str, authorization: str | None) -> dict[str, Any]:
            registry = self._real(company_id, authorization)
            return {name: self._wrap(name, fn) for name, fn in registry.items()}

        loop.build_registry = build  # type: ignore[assignment]
        return self

    def __exit__(self, *exc: Any) -> None:
        import app.domains.agent.loop as loop

        loop.build_registry = self._real  # type: ignore[assignment]


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    p.add_argument("--live", action="store_true", help="call the model (spends tokens)")
    p.add_argument("--data", choices=["recorded", "live"], default="recorded",
                   help="where get_bug/find_projects read from")
    p.add_argument("--authorization", help="Bearer token for --data live")
    p.add_argument("--backend", help="override LLM backend (ollama|groq|hf|openai|auto)")
    p.add_argument("--model", help="override the model for the chosen backend")
    p.add_argument("--company", help="override the tenant for every case (ABC|DEMO|id)")
    p.add_argument("--case", action="append", help="run only this case id; repeatable")
    p.add_argument("--category", action="append", help="run only this category; repeatable")
    p.add_argument("--runs", type=int, help="override runs per case (consistency check)")
    p.add_argument("--exclude-held-out", action="store_true",
                   help="drop held-out cases (the compressed headline number)")
    p.add_argument("--pace", type=float, default=None,
                   help="min seconds between model calls (RPM). Default 6 for groq")
    p.add_argument("--retries", type=int, default=None,
                   help="retries on a rate-limit response. Default 8 for groq")
    p.add_argument("--retry-base", type=float, default=2.0,
                   help="base seconds for exponential backoff on rate limits")
    p.add_argument("-v", "--verbose", action="store_true", help="print each reply")
    p.add_argument("--json", type=Path,
                   help="results path; the model slug is appended if absent "
                        "(default: evals/baselines/<backend>-<model>-<utc>.json)")
    return p.parse_args()


def apply_backend(backend: str | None, model: str | None) -> None:
    from app.config import settings

    if backend:
        settings.llm_backend = backend
    chosen = backend or settings.llm_backend
    if model:
        attr = {
            "ollama": "ollama_chat_model",
            "groq": "groq_model",
            "hf": "hf_model",
            "openai": "openai_model",
        }.get(chosen)
        if attr:
            setattr(settings, attr, model)


def resolve_company(case: dict[str, Any], override: str | None) -> str:
    if override:
        return suite.COMPANIES.get(override, override)
    return suite.company_for(case)


def run_once(
    case: dict[str, Any],
    *,
    company_id: str,
    authorization: str | None,
    data_mode: str,
) -> dict[str, Any]:
    from app.domains.agent.loop import run_turn

    recorder = RegistryRecorder()
    started = time.perf_counter()
    reply, steps, error = "", [], None
    try:
        if data_mode == "recorded":
            with recorded_data.patched(company_id):
                with recorder:
                    reply, steps, _ = run_turn(
                        message=case["message"],
                        company_id=company_id,
                        context=case.get("context"),
                        history=case.get("history"),
                        context_changed=case.get("context_changed", False),
                        authorization=authorization,
                    )
        else:
            with recorder:
                reply, steps, _ = run_turn(
                    message=case["message"],
                    company_id=company_id,
                    context=case.get("context"),
                    history=case.get("history"),
                    context_changed=case.get("context_changed", False),
                    authorization=authorization,
                )
    except Exception as exc:  # noqa: BLE001 - a crash is a data point, not an abort
        error = f"{type(exc).__name__}: {exc}"
    seconds = time.perf_counter() - started

    tools = [{"name": c["name"], "args": c["args"]} for c in recorder.calls]
    results = [c["result"] for c in recorder.calls]
    verdict = graders.grade(
        case,
        reply=reply,
        steps=steps,
        tools=tools,
        results=results,
        error=error,
        seconds=seconds,
    )
    return {
        "reply": reply,
        "steps": steps,
        "tools": tools,
        "results": results,
        "error": error,
        "seconds": seconds,
        "verdict": verdict,
    }


def evaluate(case: dict[str, Any], args: argparse.Namespace) -> dict[str, Any]:
    company_id = resolve_company(case, args.company)

    if args.data == "live" and case.get("requires") == "data" and not args.authorization:
        return {
            "id": case["id"],
            "category": case["category"],
            "held_out": bool(case.get("held_out")),
            "skipped": True,
            "reason": "needs --authorization for a live data read",
        }

    runs = args.runs or case.get("runs", 1)
    attempts = [
        run_once(
            case,
            company_id=company_id,
            authorization=args.authorization,
            data_mode=args.data,
        )
        for _ in range(runs)
    ]
    passes = sum(a["verdict"]["passed"] for a in attempts)
    passed = passes >= (runs // 2) + 1
    first = attempts[0]

    return {
        "id": case["id"],
        "category": case["category"],
        "held_out": bool(case.get("held_out")),
        "company": company_id,
        "runs": runs,
        "passes": passes,
        "passed": passed,
        "seconds": round(first["seconds"], 2),
        "reply": first["reply"],
        "steps": first["steps"],
        "tools": [t["name"] for t in first["tools"]],
        "tools_detail": first["tools"],
        "error": first["error"],
        "checks": first["verdict"]["checks"],
        "failed": first["verdict"]["failed"],
        "notes": first["verdict"].get("notes"),
    }


def dry_run(cases: list[dict[str, Any]]) -> None:
    print(f"{DIM}{len(cases)} case(s). No model called, nothing spent.{RESET}\n")
    for case in cases:
        tags = case.get("category", "?")
        if case.get("held_out"):
            tags += ", held-out"
        if case.get("requires") == "data":
            tags += ", needs data"
        print(f"{YELLOW}{case['id']}{RESET}  {DIM}[{tags}]{RESET}")
        print(f"  ask     {case['message']!r}")
        for turn in case.get("history") or []:
            print(f"  prior   {turn['role']}: {turn['content']!r}")
        print(f"  expect  {json.dumps(case['expect'])}")
        print(f"  {DIM}{case['why']}{RESET}\n")


def format_result(result: dict[str, Any], *, verbose: bool) -> None:
    if result.get("skipped"):
        print(f"{YELLOW}skip{RESET} {DIM}{result['reason']}{RESET}")
        return
    mark = f"{GREEN}pass{RESET}" if result["passed"] else f"{RED}FAIL{RESET}"
    suffix = f" {DIM}{result['seconds']}s{RESET}"
    if result["runs"] > 1:
        suffix += f" {DIM}({result['passes']}/{result['runs']}){RESET}"
    print(f"{mark}{suffix}")
    if not result["passed"]:
        print(f"     {RED}failed: {', '.join(result.get('failed') or ['?'])}{RESET}")
        if result.get("error"):
            print(f"     {DIM}{result['error']}{RESET}")
        if result.get("notes"):
            print(f"     {DIM}{json.dumps(result['notes'])}{RESET}")
    if verbose or not result["passed"]:
        print(f"     reply: {result['reply'][:300]}")
        print(f"     {DIM}tools: {result['tools']} steps: {result['steps']}{RESET}")


def summarize(results: list[dict[str, Any]]) -> dict[str, Any]:
    scored = [r for r in results if not r.get("skipped")]
    by_category: dict[str, list[bool]] = {}
    for r in scored:
        by_category.setdefault(r["category"], []).append(r["passed"])

    def bucket(rows: list[dict[str, Any]]) -> dict[str, Any]:
        if not rows:
            return {"passed": 0, "total": 0, "pct": 0.0}
        got = sum(r["passed"] for r in rows)
        return {"passed": got, "total": len(rows), "pct": round(100 * got / len(rows), 1)}

    print()
    for category, oks in sorted(by_category.items()):
        got, total = sum(oks), len(oks)
        pct = 100 * got / total
        colour = GREEN if pct == 100 else (YELLOW if pct >= 60 else RED)
        print(f"  {colour}{pct:5.1f}%{RESET}  {category:<18} ({got}/{total})")

    tuned = [r for r in scored if not r.get("held_out")]
    held = [r for r in scored if r.get("held_out")]
    overall = bucket(scored)
    print()
    print(f"  {DIM}tuned{RESET}      {bucket(tuned)['pct']:5.1f}%  ({bucket(tuned)['passed']}/{bucket(tuned)['total']})")
    print(f"  {DIM}held-out{RESET}   {bucket(held)['pct']:5.1f}%  ({bucket(held)['passed']}/{bucket(held)['total']})")
    print(f"  {GREEN if overall['pct'] == 100 else YELLOW}{overall['pct']:5.1f}%{RESET}  overall    ({overall['passed']}/{overall['total']})")
    if any(r.get("skipped") for r in results):
        skipped = sum(1 for r in results if r.get("skipped"))
        print(f"  {YELLOW}{skipped} skipped{RESET} (needs --authorization)")

    return {
        "by_category": {k: bucket([{"passed": p} for p in v]) for k, v in by_category.items()},
        "tuned": bucket(tuned),
        "held_out": bucket(held),
        "overall": overall,
    }


def model_slug(model: str | None) -> str:
    return (model or "model").replace("/", "-").replace(":", "-")


def default_results_path(backend: str, model: str | None) -> Path:
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return BASELINE_DIR / f"{backend}-{model_slug(model)}-{stamp}.json"


def resolve_results_path(explicit: Path | None, backend: str, model: str | None) -> Path:
    """Where to save a run. A baseline is only comparable if it names the model, so an
    explicit `--json` path gets the model slug appended unless it already contains it."""
    if explicit is None:
        return default_results_path(backend, model)
    slug = model_slug(model)
    if slug in explicit.name:
        return explicit
    return explicit.with_name(f"{explicit.stem}-{slug}{explicit.suffix}")


def _force_utf8() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass


def main() -> None:
    _force_utf8()
    args = parse_args()
    cases = suite.select(
        ids=args.case,
        categories=args.category,
        include_held_out=not args.exclude_held_out,
    )
    if not cases:
        raise SystemExit("no cases matched")

    problems = suite.validate(cases)
    if problems:
        raise SystemExit("invalid case set:\n  " + "\n  ".join(problems))

    if not args.live:
        dry_run(cases)
        return

    apply_backend(args.backend, args.model)
    from app.config import settings
    from app.domains.agent.loop import SYSTEM_PROMPT
    from evals import throttle

    prompt_hash = hashlib.sha256(SYSTEM_PROMPT.encode("utf-8")).hexdigest()[:12]
    backend = settings.llm_backend
    model = {
        "ollama": settings.ollama_chat_model,
        "groq": settings.groq_model,
        "hf": settings.hf_model,
        "openai": settings.openai_model,
    }.get(backend)

    # A free tier needs spacing and retry, or a 429 gets recorded as a FAIL. Default the
    # pace/retries for groq; paid and local backends stay at zero unless asked.
    if backend == "groq":
        pace = 6.0 if args.pace is None else args.pace
        retries = 8 if args.retries is None else args.retries
    else:
        pace = 0.0 if args.pace is None else args.pace
        retries = 0 if args.retries is None else args.retries

    print(
        f"{DIM}backend={backend} model={model} data={args.data} cases={len(cases)} "
        f"prompt={prompt_hash} pace={pace}s retries={retries} "
        f"held-out={'included' if not args.exclude_held_out else 'excluded'}{RESET}\n"
    )

    results = []
    pacer = throttle.Pacer(pace=pace, retries=retries, base_delay=args.retry_base)
    with throttle.paced(pacer):
        for i, case in enumerate(cases, 1):
            print(f"{DIM}[{i}/{len(cases)}] {case['id']} ...{RESET}", end=" ", flush=True)
            result = evaluate(case, args)
            results.append(result)
            format_result(result, verbose=args.verbose)

    summary = summarize(results)
    if pacer.retried:
        print(f"\n{DIM}paced through {pacer.retried} rate-limit retry(ies){RESET}")

    out_path = resolve_results_path(args.json, backend, model)
    payload = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "backend": backend,
        "model": model,
        "prompt_hash": prompt_hash,
        "data_mode": args.data,
        "pace": pace,
        "retries": retries,
        "summary": summary,
        "results": results,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n{DIM}wrote {out_path}{RESET}")


if __name__ == "__main__":
    main()
