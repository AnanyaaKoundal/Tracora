import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.llm.chat import chat, parse_json
from app.domains.bugs.suggest_title import (
    MAX_TITLE_LENGTH,
    SYSTEM_PROMPT,
    TITLE_SCHEMA,
)

CASES = [
    ("login button", "when i click the login button nothing happens, the page just stays there. i have to refresh and try again"),
    ("slow checkout", "the checkout page takes like 30 seconds to load and customers are leaving the site. need this fixed asap its blocking revenue"),
    ("avatar upload", "i uploaded a profile picture but it still shows the old one. no error message either"),
]

MODELS = ["llama3.2:latest", "phi3:latest"]


def validate(data: object) -> str | None:
    """Return None if valid, otherwise a short reason."""
    if not isinstance(data, dict):
        return f"expected object, got {type(data).__name__}"

    if list(data) != ["title"]:
        return f"expected only a 'title' key, got {list(data)}"

    title = data["title"]
    if not isinstance(title, str) or not title.strip():
        return "title is empty or not a string"
    if len(title) > MAX_TITLE_LENGTH:
        return f"title is {len(title)} chars, over {MAX_TITLE_LENGTH}"
    if len(title.split()) > 20:
        return f"title is {len(title.split())} words, too long"

    return None


def run_model(model: str) -> tuple[int, int, float]:
    passed = 0
    total_seconds = 0.0

    for label, description in CASES:
        start = time.perf_counter()
        try:
            raw = chat(
                [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": description},
                ],
                model=model,
                json_schema=TITLE_SCHEMA,
            )
            data = parse_json(raw)
            reason = validate(data)
        except Exception as exc:
            reason = f"{type(exc).__name__}: {exc}"
            data = None

        elapsed = time.perf_counter() - start
        total_seconds += elapsed

        if reason is None:
            passed += 1
            print(f"  [PASS] {elapsed:5.1f}s  {label}")
            print(f"         {data}")
        else:
            print(f"  [FAIL] {elapsed:5.1f}s  {label}")
            print(f"         {reason}")

    return passed, len(CASES), total_seconds


def main() -> None:
    results = {}

    for model in MODELS:
        print(f"\n=== {model} ===")
        results[model] = run_model(model)

    print("\n--- summary ---")
    print(f"{'model':22} {'valid':>8} {'avg time':>10}")
    for model, (passed, total, seconds) in results.items():
        avg = seconds / total
        print(f"{model:22} {passed}/{total:<6} {avg:9.1f}s")

    best = max(results, key=lambda m: results[m][0])
    if results[best][0] == results[next(iter(results))][1]:
        print(f"\nTie. Both fully valid, pick the smaller/faster one.")
    else:
        print(f"\nVerdict: {best} ({results[best][0]}/{results[best][1]} valid)")


if __name__ == "__main__":
    main()
