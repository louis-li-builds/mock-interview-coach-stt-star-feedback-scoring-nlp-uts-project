# Scoring module — design and behaviour

This document is the **canonical technical description** of how interview answers are scored in NLP A3. Path B (LLM) lives in **`backend/app/llm.py`**; Path A (mock) is orchestrated by **`backend/app/nlp/mock_engine.py`** (with **`backend/app/nlp/types.py`** for shared dataclasses). API contract in **`backend/app/schemas.py`**.

---

## Role in the pipeline

1. The frontend sends **transcript**, **question** metadata, and optional **`force_mock`** after STT (or demo text).
2. FastAPI **`POST /v1/score`** (`backend/app/main.py`) builds a `ScoreRequest` and calls **`score_answer()`** in `llm.py`.
3. The response includes **`source`**: `"mock"` or `"llm"` so the UI and experiments can tell which path ran.

---

## API contract

**Request** (`ScoreRequest`):

| Field | Type | Notes |
|-------|------|--------|
| `transcript` | string | Non-empty after trim (empty → HTTP 400). |
| `question_title` | string | min length 1 |
| `question_body` | string | min length 1 |
| `force_mock` | boolean | Optional, default `false`. If `true`, always use the mock scorer even when `OPENAI_API_KEY` is set (UI “Mock only” / experiments). |

**Response** (`ScoreResponse`):

| Field | Type | Notes |
|-------|------|--------|
| `overall_score` | int | 0–100 |
| `breakdown` | array | Four rows: fixed labels (see below), each `score` / `max` (max 25). |
| `suggestions` | array of strings | Short actionable items. |
| `source` | `"mock"` \| `"llm"` | Which scorer produced the result. |

**Breakdown labels** (stable for UI and experiments):

1. `STAR coverage`
2. `Prompt relevance`
3. `Measurable evidence`
4. `Clarity & structure`

---

## Decision logic (high level)

```
force_mock == true?
  yes → deterministic mock scorer (_mock_score)
  no  → OPENAI_API_KEY unset or empty?
          yes → mock
          no  → OpenAI Chat Completions (JSON mode)
                  success and valid JSON with ≥4 breakdown rows → llm
                  any failure / parse error / incomplete breakdown → mock (fallback)
```

The backend loads `backend/.env` via **python-dotenv** for local development (without overriding existing env vars). You can also set env vars in your shell / IDE.

---

## Path A — Mock (lightweight NLP) scorer

Used when:

- `OPENAI_API_KEY` is not set, or  
- LLM call fails for any reason (network, quota, invalid JSON, fewer than four breakdown rows).

Path A runs a **deterministic NLP stack** (no LLM): transcript normalization → keyword relevance → (optional) semantic relevance via embeddings → structure cues → fluency (fillers) → confidence heuristic → weighted overall → rule-based suggestions.

### Package layout (`backend/app/nlp/`)

```
types.py           — KeywordScoreResult, StructureResult, FluencyResult, ConfidenceResult, FeedbackInput, …
preprocess/        — `normalize.py`: clean STT text, lowercase, tokenize, `light_stem`
analyzers/         — `keywords`, `structure`, `fluency`, `evidence`, `confidence`
scoring/           — `aggregate.py` (weighted overall), `breakdown.py` (four rubric rows)
feedback/          — `templates.py` (rule-based suggestion strings)
mock_engine.py     — `evaluate_mock_nlp()` wires all stages → `ScoreResponse`
```

| Stage | Role |
|--------|------|
| **preprocess** | Clean STT text; lowercase; tokenize; optional light suffix normalization |
| **analyzers.keywords** | Expected keywords from question text + STAR anchors; coverage → score 0–100 |
| **analyzers.semantic** | *(optional; gated by env)* Sentence-transformers embedding similarity → score 0–100 |
| **analyzers.structure** | Intro / body / conclusion-style cues → `structure_score` 0–100 |
| **analyzers.fluency** | Filler counting + optional pace adjustment if duration were supplied |
| **analyzers.evidence** | Heuristic for numbers and KPI-style language → score 0–100 |
| **analyzers.confidence** | Length, filler density, positive diction → `confidence_score` 0–100 |
| **scoring.aggregate** | default: `overall = 0.4·keyword + 0.2·structure + 0.2·fluency + 0.2·confidence`; embeddings enabled: `overall = 0.3·keyword + 0.2·structure + 0.2·fluency + 0.3·semantic` |
| **feedback.templates** | Template + rule bullets from the signals above |

### Mapping to API breakdown (each row max 25)

| Breakdown label | Source (0–100 domain scaled ×25) |
|-----------------|-----------------------------------|
| STAR coverage | `structure_score` |
| Prompt relevance | keyword score; if embeddings enabled, blended with semantic score |
| Measurable evidence | measurable heuristic |
| Clarity & structure | `fluency_score` |

**Suggestions:** generated from keyword gap, missing structure sections, filler density, weak metrics, and low-confidence heuristics (deduped, max five).

**Embeddings (optional):** set `USE_EMBEDDINGS=true` and install `sentence-transformers`; model defaults to `all-MiniLM-L6-v2` (override with `EMBEDDING_MODEL`). If the dependency is missing or model load fails, Path A falls back to lexical / rule-based scoring.

**Limitations:** structure cues are pattern-based; fluency has no audio timestamps unless extended later. Embedding similarity uses prompt-derived reference text (no curated reference answers), so treat it as a baseline semantic signal, not ground-truth judging.

---

## Path B — LLM scorer (OpenAI)

When `OPENAI_API_KEY` is set:

| Setting | Default | Role |
|---------|---------|------|
| `OPENAI_MODEL` | `gpt-4o-mini` | Chat model name |
| `OPENAI_TIMEOUT_SECONDS` | `90` | Client timeout (seconds) |
| `SCORE_PROMPT_VARIANT` | `full` | `full` or `minimal` (see below) |

**Call shape:**

- **System** message: `_system_prompt()` — either the long STAR rubric prompt or the minimal variant (`SCORE_PROMPT_VARIANT`).
- **User** message: a single JSON string (UTF-8, `ensure_ascii=False`) with keys `question_title`, `question_body`, `transcript`.
- **`response_format`**: `{ "type": "json_object" }` so the model returns parseable JSON.
- **`temperature`**: `0.2` for relatively stable scores.

The model must return JSON matching the shape in the system prompt: `overall_score`, `breakdown` (four rows with the labels above), `suggestions`.

**Prompt variants**

- **`full`** (default): detailed STAR-oriented instructions and JSON shape description (`SYSTEM_PROMPT` in `llm.py`).
- **`minimal`**: shorter system text; same required JSON keys (`SYSTEM_PROMPT_MINIMAL`).

After parsing, if `breakdown` has fewer than four entries, the code raises and **falls back to mock**.

---

## Frontend

On **Record your answer**, users pick **Scoring mode** (radio): **AI (if available)** (`force_mock: false`) or **Mock only** (`force_mock: true`) before **Analyze recording**. The feedback step shows **Scoring source** from `result.scoreSource` (mapped from API `source`). See `RecordingStep.tsx` and `FeedbackStep.tsx`.

---

## Experiments and reproducibility

- **Ablation design:** [ABLATION.md](ABLATION.md)  
- **Batch CSV over fixed transcripts:** sibling project [`NLP-A3-exp`](../NLP-A3-exp/README.md) (if present in your workspace).

---

## Related files

| File | Purpose |
|------|---------|
| `backend/app/llm.py` | LLM path + `_mock_score` entry |
| `backend/app/nlp/mock_engine.py` | Mock NLP orchestration (`evaluate_mock_nlp`) |
| `backend/app/nlp/types.py` | Shared NLP result dataclasses |
| `backend/app/nlp/preprocess/`, `analyzers/`, `scoring/`, `feedback/` | Stages as above |
| `backend/app/schemas.py` | `ScoreRequest`, `ScoreResponse`, `BreakdownRow` |
| `backend/app/main.py` | HTTP `/v1/score` |
| `backend/README.md` | Env vars and run instructions |
