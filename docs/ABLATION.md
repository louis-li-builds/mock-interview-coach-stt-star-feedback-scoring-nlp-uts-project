# Ablation & comparison notes (NLP A3)

Use this for the **course report / methodology** section: what to compare, how to reproduce, and what to record.

## 1. Mock scorer vs LLM (`/v1/score`)

| Condition | Setup | Expected |
|-----------|--------|----------|
| **A** | Unset `OPENAI_API_KEY`, restart API | `source` in JSON is `mock`; lightweight NLP pipeline (layout + formulas: [SCORING.md](SCORING.md)) |
| **B** | Set `OPENAI_API_KEY`, same transcript body | `source` is `llm`; scores follow chat JSON |

**Reproduce (curl example):** save the same JSON body to `payload.json` (adjust strings):

```json
{
  "transcript": "We had two weeks left. I paired with a senior and we reduced errors by 20%.",
  "question_title": "Behavioural (STAR)",
  "question_body": "Tell me about a deadline.",
  "force_mock": false
}
```

Omit `force_mock` or set `false` for normal behaviour; set `"force_mock": true` to force the heuristic scorer even when the server has `OPENAI_API_KEY` (same as the UI **Mock only** option).

```bash
curl -sS -X POST http://127.0.0.1:8000/v1/score \
  -H 'Content-Type: application/json' \
  -d @payload.json | jq .
```

Run twice: once without API key (mock), once with key (LLM). Log **overall_score**, each **breakdown** row, and first **suggestion** for the report.

## 2. Prompt variant (LLM only)

| Variant | Env | Role |
|---------|-----|------|
| **Full rubric** | `SCORE_PROMPT_VARIANT=full` (default) | Long STAR-aligned system prompt |
| **Minimal** | `SCORE_PROMPT_VARIANT=minimal` | Shorter system prompt, same JSON schema |

Restart the API between runs. Compare variance in `overall_score` and suggestion wording on **3–5 fixed transcripts** (short, medium, long; with/without numbers).

## 3. STT model size (optional)

| Model | Env | Trade-off |
|-------|-----|-----------|
| `tiny` | `WHISPER_MODEL=tiny` (default) | Fast, lower WER on noisy audio |
| `base` | `WHISPER_MODEL=base` | Slower download & inference, often better text |

Same audio file → two configs → compare transcript length / obvious word errors (qualitative table in report).

## 4. UI “evidence highlight” (frontend only)

The feedback screen **highlights digits and `%`** in the transcript as a lightweight cue for “measurable evidence”; it does **not** align spans to individual LLM suggestions. State that limitation explicitly in the report if you cite it as an NLP feature.

## 5. What is *not* automated here

- **Final report + slides** — human deliverable.  
- **Statistical significance** — with few runs, report **qualitative** comparison or simple tables, not p-values unless you run a larger study.

---

**Suggested report table:** rows = transcript id; columns = mock overall, LLM-full overall, LLM-minimal overall, + one-line note on suggestions.

### Reproducible batch scoring (fixed transcripts → CSV)

The sibling folder **`NLP-A3-exp/`** (repo root, next to `NLP-A3/`) contains **`data/samples.jsonl`** and **`scripts/run_score_batch.py`** to call `POST /v1/score` for every sample and write **`results/score_run.csv`**. Use it for report tables under mock vs LLM conditions (restart API between runs). See [`NLP-A3-exp/README.md`](../../NLP-A3-exp/README.md) from the monorepo root or open that path in the workspace.
