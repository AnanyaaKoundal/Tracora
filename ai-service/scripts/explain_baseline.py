"""Why did no_match_unrelated fail? Is the grader wrong, or the model?

The reply was:
    "I couldn't find an existing bug that matches a zero-byte payroll export
     file. This looks like a new issue, let me know if you'd like me to file a
     bug report for you."

That is a correct answer. It searched, found nothing relevant, said so, and
offered to file a bug. If the grader fails it, the grader is the bug.

No model calls. Reads the saved baseline and re-grades with the phrase lists.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.eval_cases import _COMMIT, _HEDGE, _any  # noqa: E402

BASELINE = Path(__file__).resolve().parent.parent / "baseline-groq.json"

data = json.loads(BASELINE.read_text(encoding="utf-8"))

for r in data["results"]:
    if r["id"] != "no_match_unrelated":
        continue
    low = r["reply"].lower()
    print("reply:", r["reply"][:200])
    print()
    print("commit phrases present:", [p for p in _COMMIT if p in low])
    print("hedge  phrases present:", [p for p in _HEDGE if p in low])
    print()
    commit = _any(low, _COMMIT) and not _any(low, _HEDGE)
    print("grader computed says_match =", commit)
    print("case expects says_match    = False")
    print()
    print("the word 'matches' appears inside a negation:")
    print("  \"I couldn't find an existing bug that MATCHES ...\"")
    print("so the grader reads a denial as a claim.")
