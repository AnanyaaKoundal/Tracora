# Evals

Behavioural checks for the bug assistant. Deterministic tests live in `tests/`; this
directory is the only layer that calls a real model, so it runs on demand and spends
tokens.

## Why a separate layer

A pretrained model is a dependency we cannot unit-test: it does not return the same
string twice, so equality is useless. A **test** asserts a function returned what we
wrote down. An **eval** states a behaviour a user would call correct and grades whether
the reply met it. Tests cover the code we wrote; evals cover the behaviour we prompt.

The full reasoning, including the grading dimensions and the case schema, is in
[`docs/ai-assistant-architecture.md`](../docs/ai-assistant-architecture.md) under
"Phase 1 in detail" and "Testing layout".

## Run it

```bash
python evals/runner.py                 # dry run: prints cases, calls nothing
python evals/runner.py --live          # real model, recorded data, no Mongo needed
python evals/runner.py --live --backend groq
python evals/runner.py --live --backend groq --category honesty --verbose
python evals/runner.py --live --backend openai --json evals/baselines/baseline-openai.json
python evals/runner.py --live --runs 3  # consistency: pass if a majority pass
```

Every live run is saved to `evals/baselines/` automatically, as
`<backend>-<model>-<utc>.json`. `--json` overrides the path, and the model slug is
appended if the name does not already contain it (so `--json .../baseline-groq.json`
becomes `baseline-groq-openai-gpt-oss-120b.json`). A "baseline" is just the run you
choose to keep and commit.

Free tiers rate-limit. `--backend groq` defaults to `--pace 6 --retries 8`: at least six
seconds between model calls, and a 429/overload is retried with exponential backoff
instead of being scored as a failure. Override with `--pace`/`--retries`/`--retry-base`.
A paced run is slow; a paid or local backend needs no pacing.

Data modes:

- `--data recorded` (default) serves `get_bug` and `find_projects` from
  `fixtures/corpus.json`. No Mongo, Express or token is needed. Semantic search still
  goes to Qdrant and Ollama, so the strong/weak label is real.
- `--data live` goes through Express and needs `--authorization "Bearer <jwt>"`. Cases
  that require a data read are skipped, not failed, when no token is given.

Regenerate the snapshot with `python scripts/dump_corpus.py`.

## Layout

```
evals/
  runner.py          # CLI: dry run, live run, JSON baseline
  graders.py         # turns a reply + tool trace into a verdict
  suite.py           # loads and validates the cases
  recorded_data.py   # fixture-backed get_bug / list_projects
  throttle.py        # pacing + 429 retry for rate-limited free tiers
  cases/             # one module per theme; each exports CASES
  fixtures/
    corpus.json      # recorded tenant snapshot
  baselines/         # committed runs to diff against
```

## Adding a case

Add a dict to the relevant `cases/*.py`. Required keys: `id`, `category`, `message`,
`expect`, `why`. Optional: `history`, `context`, `context_changed`, `company`,
`requires: "data"`, `held_out`, `runs`.

Declared expectations are the only ones scored (plus grounding and "did it crash"),
so a new case never changes the meaning of an old one. Keep honesty graded against the
tool's own label with `honesty_from_tool: True` rather than a hardcoded threshold.
