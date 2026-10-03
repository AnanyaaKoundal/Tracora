"""Reading tool calls from the two wire shapes.

OpenAI sends arguments as a JSON string and includes an id; Ollama sends a ready
object and no id. The reader must normalize both and survive malformed JSON.
"""

import pytest

from app.core.llm.providers import (
    ToolCall,
    _ollama_messages,
    _parse_arguments,
    _parse_tool_calls,
)


@pytest.mark.unit
def test_parse_arguments_from_json_string():
    assert _parse_arguments('{"bug_id": "B-1"}') == {"bug_id": "B-1"}


@pytest.mark.unit
def test_parse_arguments_from_dict():
    assert _parse_arguments({"bug_id": "B-1"}) == {"bug_id": "B-1"}


@pytest.mark.unit
@pytest.mark.parametrize("raw", ["not json", "", None, 12, ["a"], "[1, 2]"])
def test_parse_arguments_bad_input_is_empty(raw):
    assert _parse_arguments(raw) == {}


@pytest.mark.unit
def test_parse_tool_calls_openai_shape():
    raw = [
        {
            "id": "call_1",
            "type": "function",
            "function": {"name": "get_bug", "arguments": '{"bug_id": "B-1"}'},
        }
    ]
    assert _parse_tool_calls(raw) == [
        ToolCall(id="call_1", name="get_bug", arguments={"bug_id": "B-1"})
    ]


@pytest.mark.unit
def test_parse_tool_calls_ollama_shape_synthesizes_id():
    raw = [{"function": {"name": "get_bug", "arguments": {"bug_id": "B-1"}}}]
    calls = _parse_tool_calls(raw)
    assert calls[0].name == "get_bug"
    assert calls[0].arguments == {"bug_id": "B-1"}
    assert calls[0].id == "call_0"


@pytest.mark.unit
def test_tool_call_round_trips_through_openai_message():
    call = ToolCall(id="call_1", name="get_bug", arguments={"bug_id": "B-1"})
    assert _parse_tool_calls([call.as_openai_message()]) == [call]


@pytest.mark.unit
def test_ollama_messages_translates_a_tool_result():
    messages = [
        {"role": "user", "content": "hi"},
        {
            "role": "assistant",
            "content": "",
            "tool_calls": [
                {
                    "id": "call_0",
                    "function": {"name": "get_bug", "arguments": '{"bug_id": "B-1"}'},
                }
            ],
        },
        {"role": "tool", "tool_call_id": "call_0", "content": "ok"},
    ]
    out = _ollama_messages(messages)
    assert out[1]["tool_calls"][0]["function"]["arguments"] == {"bug_id": "B-1"}
    assert out[2] == {"role": "tool", "tool_name": "get_bug", "content": "ok"}
