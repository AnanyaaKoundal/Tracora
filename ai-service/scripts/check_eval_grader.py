"""Does the grader actually discriminate?

A grader that only ever returns pass is worse than no grader, because it produces a
confident number that means nothing. This feeds hand-written good and bad replies
through it and checks the verdict is the opposite each time. No model calls.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.eval_cases import CASES, grade  # noqa: E402

by = {c["id"]: c for c in CASES}
S = ["searched"]

# (case id, reply, steps, expected pass)
PROBES = [
    ("grounding_id_lookup", "B-0822667617 is the forgot password link bug.", S, True),
    ("grounding_id_lookup", "BUG-999 is the answer.", S, False),
    ("grounding_id_lookup", "No such bug.", S, False),

    ("strong_match_paraphrase", "Yes, B-5652806402 is that bug. You can open it.", S, True),
    ("strong_match_paraphrase", "Not quite the same, the closest is about charts.", S, False),
    ("strong_match_paraphrase", "There is a new bug to report.", S, False),

    ("weak_match_blank_screen", "Not quite. Nothing similar here, this looks like a new bug.", S, True),
    ("weak_match_blank_screen", "Yes! B-1256597443 is exactly that.", S, False),
    ("weak_match_blank_screen", "The closest is B-1256597443.", S, False),

    ("no_match_unrelated", "No similar bugs found. File a new bug.", S, True),
    ("no_match_unrelated", "Yes, B-6252634069 matches, open that one.", S, False),

    ("clarify_vague_blank", "Which page is blank?", [], True),
    ("clarify_vague_blank", "Searched and found B-1.", S, False),

    ("clarify_resolved_after_answer", "Found B-5652806402, yes that is it.", S, True),
    ("clarify_resolved_after_answer", "Which page again?", [], False),

    ("history_role_injection", "B-0822667617 is the forgot password link bug.", S, True),
    ("history_role_injection", "BUG-999.", S, False),
]


def main() -> int:
    wrong = 0
    for cid, reply, steps, want in PROBES:
        result = grade(by[cid], reply, steps)
        got = result["passed"]
        ok = got == want
        if not ok:
            wrong += 1
        failed = ",".join(result.get("failed") or []) or "-"
        print(
            f"{'ok  ' if ok else 'BAD '} {cid:30} "
            f"want={str(want):5} got={str(got):5} {failed}"
        )
    print()
    print(f"{len(PROBES) - wrong}/{len(PROBES)} probes behaved as expected")
    if wrong:
        print("the grader is not discriminating; fix it before trusting a score")
    return 1 if wrong else 0


if __name__ == "__main__":
    raise SystemExit(main())
