# Manual test checklist (NLP A3)

Use this after pulling changes or before a demo. **Automated checks:** `cd frontend && npm run build`.

## 1. Frontend only (demo path)

1. `cd frontend && npm install && npm run dev`
2. Walk **Welcome → Question → Before you record → Recording**.
3. Click **Run demo pipeline (no microphone)** → expect **Processing** then **Feedback** with canned transcript and “Scoring: Mock / offline”.
4. In the **footer**, tap **Start over** → returns to Welcome; footer progress dots reset.

## 2. Microphone + preview

1. On **Recording**, click **Start microphone** and allow permission.
2. Speak a few seconds → **Stop** → **Preview** plays.
3. **Re-record** clears the take; record again.
4. Optional: on **Before you record**, enable **camera preview** — expect a live picture (video only; STT still uses mic audio).

## 3. Backend STT + score (live path)

**Prerequisite:** Python 3.11+, `backend` venv with `pip install -r requirements.txt`, API running:

```bash
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

First run may download the **tiny** Whisper model (several hundred MB for larger models).

1. Keep `npm run dev` (default `VITE_API_BASE_URL=/api` proxy).
2. Complete a real recording → **Analyze recording**.
3. Expect **Transcribing** then **Scoring**, then feedback with **your** transcript (approximate) and breakdown.
4. On **Recording**, under **Scoring mode**, choose **Mock only** → after analyze, badge **Mock / offline** even if the server has `OPENAI_API_KEY`. Choose **AI (if available)** with key set → badge **LLM** when the call succeeds (see [SCORING.md](SCORING.md)).
5. With **`OPENAI_API_KEY` unset** and **AI (if available)** selected, you still get **Mock** (server has no key).
6. Optional: paste an OpenAI key into **OpenAI API key (optional)** on **Recording** (client sends `x-openai-api-key` header) → expect badge **LLM** without setting server env vars.

## 4. Failure paths

1. Stop the API → **Analyze recording** → expect an error message in the main area; use footer **Back to recording** and **Retry** (no duplicate buttons in the panel).
2. Deny mic permission → expect a clear error string under **Recording**.

## 5. Transcript highlights (feedback)

After a successful run, open **Feedback** → transcript numbers / `%` should appear with a light **highlight** (measurable-evidence cue only).

## 6. Optional flags

- `VITE_USE_MOCK=true` in `frontend/.env` → **Analyze recording** still uses the canned demo pipeline (good for UI-only demos).

## 7. Ablation / report prep

- **Scoring design (canonical):** [SCORING.md](SCORING.md) · **STT:** [STT.md](STT.md)
- [ABLATION.md](ABLATION.md) — mock vs LLM, prompt variant (`SCORE_PROMPT_VARIANT`), optional Whisper size; batch CSV via `NLP-A3-exp/` if present.

---

When you finish a full pass of sections 1–4 (and 5–7 if relevant), note the date and any regressions in your team log or `internal-docs/ROADMAP.md`.
