# The Tracora assistant

Depth behind the [README](../README.md)'s assistant section: what the contract is, what
the loop does with it, which rules are enforced in code rather than hoped for in a
prompt, and how the behaviour is measured.

> Companion to my working notes on this build (phase plans, open questions, session
> recaps), which I keep outside the repo rather than ship in it.

---

## 1. Scope

| | |
|---|---|
| **What it does** | Answers questions about your company's bugs and projects, in-app, with citations |
| **Write path** | None: search and explain only, so a prompt injection has nothing to mutate |
| **Data boundary** | One agent for the whole tenant; the hard boundary (tenant) is enforced in code, role-level scoping layers on top |
| **PII** | The two data tools return bug and project fields only (ids, titles, descriptions, status, priority, project, timestamps). No employee record, email or contact field is ever fetched on the model's behalf |
| **Progress** | Visible steps while it works; the answer lands as one complete, grounded message |

Next up: feedback capture, cost/latency readouts, tool-call and prompt-version
telemetry, acting tools behind an explicit confirmation step.

---

## 2. Request contract

```
browser ── POST /ai/chat ──▶ Express ── POST /agent/turn ──▶ ai-service
             { message,          Authorization: Bearer <JWT>      { message,
               context?,           + service key (internal)         company_id,
               conversation_id? }                                   history?,
                                                                     context?,
                                                                     context_changed }
```

- **Client → Express**: `message`, optional `context` (`{kind: draft|bug|page, label,
  data}` (what's on screen), optional `conversation_id`. The context pill in the UI is
  this object; "without context" just omits it.
- **Express → ai-service**: the user's JWT is forwarded (so every tool call carries the
  tenant), `company_id` is required, `history` is capped at 4 turns, and
  `context_changed` tells the loop the on-screen record changed mid-conversation.
- **Response**: `{ reply, steps, citations }`. `steps` drives the visible progress
  chips; `citations` are persisted with the message so a reloaded conversation keeps
  its links.

Nothing else is trusted: the service key authenticates the *service*, the forwarded JWT
proves the *user*, and the tenant filter is applied by Express on every read.

---

## 3. The turn

```
resolve providers → loop (≤ 4 steps, one 120s budget) → grounding → citations → reply
```

- **Steps**: the model either calls a tool or returns its final answer, up to
  `MAX_STEPS = 4`. Each step's tool result goes back into the conversation as a tool
  message.
- **Deadline**: one `time.monotonic()` budget for the whole turn
  (`agent_turn_budget_seconds = 120`). A step that would start after the deadline is
  not attempted, and the LLM call itself is passed the same deadline so a hanging
  provider can't outlive the turn.
- **Budget vs. Express**: Express times out at 210s (the 120s turn budget plus one
  60s call plus margin), so the client sees *our* failure message rather than a raw
  gateway error.
- **Failure language**: if a provider fails mid-turn (or the budget runs out) the reply
  is a single plain sentence (*"Sorry, I'm having trouble reaching my tools right now.
  Please try again in a moment."*) with the cause logged server-side only. The user
  is not told which provider broke or why.
- **Fallback**: if grounding fails rather than the network, the model is given one
  forced retry with an explicit list of what it may cite; if that also fails, a plain
  fallback reply is sent instead of an ungrounded answer.

---

## 4. Tools

Three, and only three. Each is scoped to the caller's company.

| Tool | Hits | Used when |
|---|---|---|
| `find_similar_bugs` | Qdrant + embedder (`nomic-embed-text`) | The user describes a problem, or asks whether it was reported before |
| `get_bug` | Express → Mongo | The user pastes a bug id, or the screen already shows one |
| `find_projects` | Express → Mongo | The user asks about a project, or a project must be resolved first |

Details that matter:

- `find_similar_bugs` takes the project in the **user's own words**, not an id. The
  resolver maps it to a project; if it matches more than one, the tool returns
  `status: "ambiguous"` and the model must ask which one rather than guess. If it
  matches none, `project_not_found`.
- Similarity is reported to the model as **strong / weak**, not as a raw score, so the
  model reasons about a label instead of inventing meaning for `0.73`.
- `get_bug` and `find_projects` go through Express (`/agent/bugs/:id`,
  `/agent/projects`), which re-applies `company_id` from the forwarded JWT. The
  assistant service holds no Mongo connection for a live request.
- Argument schemas travel with the call (OpenAI wire format where the backend supports
  native tool calling; plain JSON-in-prompt otherwise), which is what stops the model
  from guessing parameter names.

---

## 5. Grounding and citations

The rule: **an id in the reply must be an id a tool returned for this turn.**

1. Every tool result's records are collected as *candidates*, including the bug the
   user is currently looking at (page context counts as a source the model saw).
2. After the final reply is produced, every id in it is matched against the candidates.
3. An id that isn't a candidate triggers one forced retry with the allowed list spelled
   out.
4. **Citations** = candidates whose id appears in the reply, deduplicated, each carrying
   the type (`bug` / `project`) so the client can link `/bugs/{id}` or `/projects`.

What follows from that:

- The model can't cite a record it never fetched, which is what step 4 enforces.
- A reply with no fetched records legitimately has no Sources section.
- Grounding runs on the **reply text**, not on a provider's `tool_calls` field, so it
  behaves identically on Ollama, Groq, Hugging Face and OpenAI, including backends
  with no structured tool-calling at all.

---

## 6. Failure handling

Transient-only, deadline-aware, one sentence to the user.

| Situation | Behaviour |
|---|---|
| HTTP 408/409/425/429/500/502/503/504, timeouts, connection errors | Retried up to `llm_max_attempts = 3` with exponential backoff + jitter, capped at `llm_retry_max_seconds` |
| `Retry-After` header present | Honoured as the next delay, within the cap |
| HTTP 400/401/403/404/422 | Terminal, never retried: a bad request will not become good |
| Turn deadline expired | No further attempts; the loop stops and returns the failure message |
| Whole provider stack down | `Outcome: upstream_unavailable` logged; user sees a single plain sentence |

No circuit breaker: transient retry with jitter plus a hard turn deadline already cover
the failure modes this architecture has, and breaker state would be a second mechanism
with no caller. The client-facing rule is the same everywhere: one plain sentence, no
provider name, no error code.

---

## 7. Configuration

Defaults live in `ai-service/app/config.py`; everything is overridable by env.

| Key | Default | Meaning |
|---|---|---|
| `llm_backend` | `ollama` | `auto` walks `llm_fallback_order` |
| `llm_fallback_order` | `groq,hf,ollama` | Order tried when `auto` |
| `llm_allow_paid` | `false` | Hard gate: paid providers are unreachable unless flipped |
| `llm_timeout_seconds` | `60` | One call |
| `llm_max_attempts` | `3` | Transient retries per call |
| `agent_turn_budget_seconds` | `120` | Whole turn |
| `llm_temperature` | `0.2` | Low: retrieval-grounded answering, not brainstorming |
| `similar_strong_threshold` | `0.70` | Where "weak" becomes "strong" |
| `project_match_min_score` | `0.60` | Below this a project reference is treated as not found |
| `express_base_url` / `internal_api_key` | `127.0.0.1:5000` / `dev-internal-key` | The internal data API |
| `qdrant_url` / `qdrant_collection` | `localhost:6333` / `tracora_entities` | Vector store |

With `llm_backend=auto` the gate is unconditional: a paid provider cannot be selected
while `llm_allow_paid=false`. Naming a backend explicitly (`--backend groq`) is read as
an explicit request for that provider.

---

## 8. Why the provider layer looks like this

Ollama, Groq, Hugging Face and OpenAI differ in authentication, tool-calling support and
rate limits, and free tiers change. The adapter normalises them behind `invoke()`, so:

- swapping providers is a config change, not a rewrite;
- a free tier hitting its limit is a *retryable* condition, not a crash;
- `resolve_order()` picks one pinned backend or walks the fallback list;
- the eval suite can grade the same behaviour on any of them
  (`--backend groq|hf|openai|ollama`).

---

## 9. Evals

Tests and evals answer different questions. **A test** asserts a function returned what
we wrote down. **An eval** states a behaviour a user would call correct, and grades
whether the model's reply met it, because a model doesn't return the same string twice.

```bash
python evals/runner.py                 # dry run: prints cases, calls nothing
python evals/runner.py --live --backend groq
python evals/runner.py --live --backend groq --category honesty --verbose
python evals/runner.py --live --runs 3 # consistency: majority must pass
```

- **41 cases across 10 categories** (honesty, scoping, ambiguity, tool use, citations,
  refusals, ...). Fixtures cover two companies, so every scoping case has a
  cross-tenant record to fail against.
- Graders are structural, not string-equality: `_is_placeholder` / `_MASK_CHARS` catch
  a model that answers with `[BUG-...]`, `_NOT_FOUND` catches invented ids, `_NEGATION`
  catches a reply that names a forbidden record while denying it, `_commit_signal` reads
  "I'll search…" as a commitment.
- Free tiers rate-limit, so runs are **paced** (`--pace 6`) with backoff on 429: a
  rate-limited call is retried, not scored as a failure.
- Every live run lands in `evals/baselines/` as `<backend>-<model>-<utc>.json` with the
  prompt hash. A "baseline" is just the run you chose to commit; quoted pass rates come
  from one of these, never from memory.
- Unit tests (104) mock the model entirely: grounding, citations, retry/deadline logic,
  config and graders all run without a network.

---

## 10. First-person notes

- The prompt is the smallest part of this. Grounding, scoping, retry classification,
  deadline budgeting and citation derivation are enforced in code, where a test can
  reach them; the prompt only decides *what to say*.
- The eval layer is what I would keep from this project: it turns "the assistant feels
  wrong" into a named case with a grade, so the complaint gets resolved instead of
  re-argued.
- Next: capture thumbs-down as an eval case, add field-level role filtering, then a
  per-turn cost/latency readout, in that order.
