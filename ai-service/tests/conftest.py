"""Shared pytest fixtures.

Markers are declared in pytest.ini. This file is intentionally small: fixtures that
stub external services (model, Mongo, Qdrant) get added here as the layers are built,
so there is one obvious home for them.
"""

import pytest

from tests.fixtures.seed import NOTIFICATIONS_CRASH


@pytest.fixture
def bug_page_context() -> dict:
    """A bug page context as the client sends it (subject resolver input)."""
    return {
        "kind": "bug",
        "label": NOTIFICATIONS_CRASH,
        "data": {"title": "Notifications crash", "description": "Crash on open."},
    }
