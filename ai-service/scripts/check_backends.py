"""Report which chat backends are configured, then smoke-test the active one.

    python scripts/check_backends.py          # inventory only, no model calls
    python scripts/check_backends.py --probe  # also send one small real request

Never prints credential values, only whether each key is present.
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings
from app.core.llm.chat import active_backend, backend_inventory, chat
from app.core.llm.providers import BackendUnavailable, resolve_order

PROBE_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string", "description": "A short bug report title."},
    },
    "required": ["title"],
}

PROBE_PROMPT = "when i click the login button nothing happens, the page just stays there"


def show_inventory() -> None:
    print(f"LLM_BACKEND = {settings.llm_backend}")
    print(f"LLM_FALLBACK_ORDER = {settings.llm_fallback_order}")
    print(f"LLM_ALLOW_PAID = {settings.llm_allow_paid}")
    print(f"LLM_STRICT_SCHEMA = {settings.llm_strict_schema}")
    print(f"active = {active_backend()}")
    print()

    order = [b.name for b in resolve_order()]
    print(f"{'backend':10} {'configured':11} {'paid':6} {'in order':10} model")
    for row in backend_inventory():
        in_order = "yes" if row["backend"] in order else "-"
        print(
            f"{row['backend']:10} {str(row['configured']):11} "
            f"{str(row['paid']):6} {in_order:10} {row['model']}"
        )

    if settings.hf_provider:
        print(f"\nHF pinned to provider: {settings.hf_provider}")


def probe() -> None:
    print(f"\n--- probing {active_backend()} ---")
    start = time.perf_counter()
    try:
        raw = chat(
            [
                {"role": "system", "content": "You write short bug report titles. Respond with JSON only."},
                {"role": "user", "content": PROBE_PROMPT},
            ],
            json_schema=PROBE_SCHEMA,
            num_predict=120,
        )
    except BackendUnavailable as exc:
        print(f"[FAIL] {exc}")
        return

    elapsed = time.perf_counter() - start
    print(f"[PASS] {elapsed:.1f}s")
    print(raw.strip()[:400])


def main() -> None:
    show_inventory()
    if "--probe" in sys.argv:
        probe()


if __name__ == "__main__":
    main()
