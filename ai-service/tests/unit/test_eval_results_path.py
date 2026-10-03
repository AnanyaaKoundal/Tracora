"""Result filenames must name the model, or two runs are not comparable.

A baseline that says only "baseline-groq" hides which model produced it. The runner
appends the model slug to an explicit `--json` path unless it is already there.
"""

from pathlib import Path

import pytest

from evals import runner

pytestmark = pytest.mark.unit


def test_model_slug_replaces_separators():
    assert runner.model_slug("openai/gpt-oss-120b") == "openai-gpt-oss-120b"
    assert runner.model_slug("phi3:latest") == "phi3-latest"
    assert runner.model_slug(None) == "model"


def test_explicit_path_gets_model_appended():
    got = runner.resolve_results_path(
        Path("evals/baselines/baseline-groq.json"), "groq", "openai/gpt-oss-120b"
    )
    assert got.name == "baseline-groq-openai-gpt-oss-120b.json"


def test_explicit_path_with_model_is_unchanged():
    path = Path("evals/baselines/baseline-groq-openai-gpt-oss-120b.json")
    assert runner.resolve_results_path(path, "groq", "openai/gpt-oss-120b") == path


def test_default_path_names_backend_and_model():
    got = runner.default_results_path("openai", "gpt-4.1-nano")
    assert got.parent.name == "baselines"
    assert got.name.startswith("openai-gpt-4.1-nano-")
    assert got.suffix == ".json"
