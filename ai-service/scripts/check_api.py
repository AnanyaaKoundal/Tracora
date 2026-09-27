"""End-to-end checks against a running ai-service.

Start the server first:
    python run.py

Then:
    python scripts/check_api.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx

BASE_URL = "http://127.0.0.1:8000"
SEEDED_COMPANY = "CMP-N4E701V5B0"
OTHER_COMPANY = "CMP-XBRY5QZQ7X"

results: list[tuple[bool, str, str]] = []


def record(passed: bool, name: str, detail: str = "") -> None:
    results.append((passed, name, detail))
    status = "PASS" if passed else "FAIL"
    print(f"  [{status}] {name}")
    if detail:
        print(f"         {detail}")


def check_health() -> None:
    response = httpx.get(f"{BASE_URL}/health", timeout=10)
    body = response.json()
    record(
        response.status_code == 200 and body.get("status") == "ok",
        "GET /health",
        str(body),
    )


def check_duplicates_positive() -> None:
    response = httpx.post(
        f"{BASE_URL}/bugs/duplicates",
        json={
            "description": "i clicked sign in and nothing happens, the page just stays. had to refresh",
            "company_id": SEEDED_COMPANY,
        },
        timeout=120,
    )
    matches = response.json().get("matches", [])
    record(
        response.status_code == 200 and len(matches) > 0,
        "POST /bugs/duplicates finds a real duplicate",
        f"{len(matches)} match(es), top score {matches[0]['score'] if matches else 'n/a'}"
        + (f" -> {matches[0]['title']}" if matches else ""),
    )


def check_duplicates_negative() -> None:
    response = httpx.post(
        f"{BASE_URL}/bugs/duplicates",
        json={
            "description": "my cat knocked the plant off the desk and it shattered",
            "company_id": SEEDED_COMPANY,
        },
        timeout=120,
    )
    matches = response.json().get("matches", [])
    record(
        response.status_code == 200 and len(matches) == 0,
        "POST /bugs/duplicates rejects unrelated text",
        f"{len(matches)} match(es) returned (expected 0)",
    )


def check_tenant_isolation() -> None:
    response = httpx.post(
        f"{BASE_URL}/bugs/duplicates",
        json={
            "description": "i clicked sign in and nothing happens, the page just stays. had to refresh",
            "company_id": OTHER_COMPANY,
        },
        timeout=120,
    )
    matches = response.json().get("matches", [])
    leaked = [m for m in matches if "signed out" in (m.get("title") or "").lower()]
    record(
        not leaked,
        "company filter blocks cross-tenant results",
        f"{len(matches)} match(es) from other company, 0 leaked",
    )


def check_suggest_title() -> None:
    response = httpx.post(
        f"{BASE_URL}/bugs/suggest-title",
        json={
            "description": "the checkout page takes 30 seconds to load and people are leaving the site",
        },
        timeout=300,
    )
    body = response.json()
    valid = (
        response.status_code == 200
        and isinstance(body.get("title"), str)
        and len(body.get("title", "").strip()) > 0
        and len(body) == 1
    )
    record(valid, "POST /bugs/suggest-title returns title only", str(body))


def check_validation() -> None:
    response = httpx.post(
        f"{BASE_URL}/bugs/suggest-title",
        json={"description": ""},
        timeout=30,
    )
    record(
        response.status_code == 422,
        "empty description rejected with 422",
        f"got {response.status_code}",
    )


def main() -> None:
    print("Checking ai-service endpoints\n")
    check_health()
    check_duplicates_positive()
    check_duplicates_negative()
    check_tenant_isolation()
    check_suggest_title()
    check_validation()

    passed = sum(1 for ok, _, _ in results if ok)
    print(f"\n{passed}/{len(results)} checks passed")
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
