"""Tool schema contract.

The prompt renders tool names and argument names from TOOL_SPECS, and the provider
layer sends function_schemas() to the model. If those two drift, the model guesses
argument names and calls fail. These tests pin the contract.
"""

import pytest

from app.domains.agent.tools import (
    TOOL_SPECS,
    allowed_args,
    function_schemas,
    required_args,
)


@pytest.mark.unit
def test_function_schemas_mirror_tool_specs():
    schemas = function_schemas()
    assert [s["function"]["name"] for s in schemas] == [t["name"] for t in TOOL_SPECS]
    assert all(s["type"] == "function" for s in schemas)


@pytest.mark.unit
def test_known_argument_sets():
    assert allowed_args("find_similar_bugs") == {"text", "limit", "project"}
    assert required_args("find_similar_bugs") == {"text"}
    assert required_args("get_bug") == {"bug_id"}
    assert required_args("find_projects") == set()


@pytest.mark.unit
def test_unknown_tool_has_no_args():
    assert allowed_args("does_not_exist") == set()
    assert required_args("does_not_exist") == set()
