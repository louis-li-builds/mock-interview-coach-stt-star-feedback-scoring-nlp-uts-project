# Manual test checklist (NLP A3)

Use this after pulling changes or before a demo. **Automated checks:** `cd frontend && npm run build`.

## 1. Frontend only (demo path)

1. `cd frontend && npm install && npm run dev`
2. Walk **Welcome → Question → Before you record → Recording**.
3. Click **Run demo pipeline (no microphone)** → expect **Processing** then **Feedback** with canned transcript and “Scoring: Mock / offline”.
4. **Start over** returns to Welcome; step dots reset.

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
4. With **`OPENAI_API_KEY` unset**, scoring badge stays **Mock / offline** (heuristic scorer).
5. With **`OPENAI_API_KEY` set** (and network), badge **LLM** and suggestions should match the transcript more closely.

## 4. Failure paths

1. Stop the API → **Analyze recording** → expect an error panel with **Retry** / **Back to recording**.
2. Deny mic permission → expect a clear error string under **Recording**.

## 5. Optional flags

- `VITE_USE_MOCK=true` in `frontend/.env` → **Analyze recording** still uses the canned demo pipeline (good for UI-only demos).

---

When you finish a full pass of sections 1–4, note the date and any regressions in your team log or `internal-docs/ROADMAP.md`.
