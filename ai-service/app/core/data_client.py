from typing import Any

import httpx

from app.config import settings

# The agent's window onto tenant data. Express owns the data and enforces tenant and
# role scoping; this client just carries the caller's identity there and brings back
# what that caller is allowed to see. No Mongo, no tenant logic here.


class DataClientError(Exception):
    """Express could not answer a data read."""


def _headers(authorization: str | None) -> dict[str, str]:
    headers = {"x-internal-key": settings.internal_api_key}
    if authorization:
        headers["Authorization"] = authorization
    return headers


def _get(path: str, authorization: str | None) -> httpx.Response:
    try:
        return httpx.get(
            f"{settings.express_base_url}{path}",
            headers=_headers(authorization),
            timeout=15.0,
        )
    except httpx.HTTPError as exc:
        raise DataClientError(f"Express unreachable: {exc}") from exc


def get_bug(bug_id: str, authorization: str | None) -> dict[str, Any] | None:
    """One bug by id, or None when it is missing *or* not visible to this user."""
    response = _get(f"/agent/bugs/{bug_id}", authorization)
    if response.status_code == 404:
        return None
    if response.status_code != 200:
        raise DataClientError(
            f"Express returned {response.status_code} for bug {bug_id}"
        )
    return response.json().get("data")


def list_projects(authorization: str | None) -> list[dict[str, Any]]:
    """The projects this user is allowed to see, in their company."""
    response = _get("/agent/projects", authorization)
    if response.status_code != 200:
        raise DataClientError(
            f"Express returned {response.status_code} for projects"
        )
    return response.json().get("data") or []
