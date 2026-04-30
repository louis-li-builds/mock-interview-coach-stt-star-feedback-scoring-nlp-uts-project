# Scoring module — design and behaviour

This document is the **canonical technical description** of how interview answers are scored in NLP A3. Implementation lives in **`backend/app/llm.py`**; API contract in **`backend/app/schemas.py`**.

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

There is **no** `python-dotenv` load in this repo: the key must come from the **process environment** (shell, IDE, or host).

---

## Path A — Mock (heuristic) scorer

Used when:

- `OPENAI_API_KEY` is not set, or  
- LLM call fails for any reason (network, quota, invalid JSON, fewer than four breakdown rows).

Let `t` = `transcript.strip()`, `n` = `max(len(t), 1)`.

| Output | Formula / rule |
|--------|----------------|
| `overall_score` | `min(88, 36 + n // 10)` (integer) |
| STAR coverage | `min(25, 10 + n // 25)` |
| Prompt relevance | `min(25, 12 + 5)` if `"?"` **not** in `t`, else `min(25, 12)` |
| Measurable evidence | `min(25, 8 + 6)` if any ASCII digit in `t`, else `min(25, 8)` |
| Clarity & structure | `min(25, 10 + n // 40)` |

**Suggestions:** three fixed STAR-style bullets; if `t` has **no** digit (`\d`), a fourth bullet is prepended asking for a measurable outcome.

**Limitations (important for reports):** mock scores depend mainly on **length** and **presence of digits**, not on semantic match to the question or true STAR structure. Use it as a **reproducible offline baseline**, not as a ground-truth judge.

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
| `backend/app/llm.py` | All scoring logic |
| `backend/app/schemas.py` | `ScoreRequest`, `ScoreResponse`, `BreakdownRow` |
| `backend/app/main.py` | HTTP `/v1/score` |
| `backend/README.md` | Env vars and run instructions |
