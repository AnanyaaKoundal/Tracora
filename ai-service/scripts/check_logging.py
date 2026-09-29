"""Verify the fallback chain is logged correctly, without calling any real model.

Stubs the dispatcher so a failing primary and a succeeding secondary can be
observed in the log output.

    python scripts/check_logging.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.logging import request_id
from app.core.llm import providers

request_id.set("demo01")

attempted: list[str] = []


def fake_invoke(backend, *args, **kwargs):
    attempted.append(backend.name)
    if backend.name == "groq":
        raise providers.BackendUnavailable("groq returned 401: invalid api key")
    return '{"title": "stubbed response, no model was called"}', {"total_tokens": 0}


providers.invoke = fake_invoke

import app.core.llm.chat as chat_module  # noqa: E402

chat_module.invoke = fake_invoke
chat_module.registry = providers.registry
chat_module.resolve_order = providers.resolve_order

print("--- attempting a turn where the primary backend fails ---")
result = chat_module.chat(
    [{"role": "user", "content": "anything"}],
    json_schema={"type": "object", "properties": {}},
    num_predict=10,
)
print("result:", result)
print("attempted backends:", attempted)

