# NLP A3 — Mock Interview Coach

**[Full guide (English)](docs/en/README.md)** · **[完整說明（繁體中文）](docs/zh-TW/README.md)** · [Documentation hub](docs/README.md)

**NLP A3** is a course project for **NLP Assessment 3 (Project Development)**.  
It builds a **mock interview coaching prototype**: phased **GUI** → speech (mic; optional camera) → **open-source STT** → transcript → **scoring** (OpenAI LLM when configured, else a **lightweight NLP mock** layer: keywords, structure, fluency, evidence heuristics) → final feedback stage back to the user.

This file is the **overview** only. Architecture, tech stack, repo layout, and collaboration notes live in the language-specific guides.

---

## At-a-glance workflow

High-level path: **Speech → STT → transcript processing → `/v1/score` routing (LLM vs mock hybrid) → feedback + badge.**

```mermaid
flowchart TB
  U((User))
  BR[Browser: Vite, wizard, feedback]
  STT[Transcribe: POST /v1/transcribe]
  PRE[Preprocess transcript]
  R{score_answer}
  PB[LLM: OpenAI JSON]
  PA[Mock: rules, optional embeddings]

  U <--> BR
  BR --> STT --> PRE --> R
  R -->|LLM| PB
  R -->|mock| PA
  PB --> BR
  PA --> BR
  PB -.->|fallback| PA
```

- **Edges**: **LLM** = Smart Coach when the backend has a key and accepts the LLM route; **mock** = Rules Engine, missing key, `force_mock`, or chosen mock mode; **fallback** = LLM error or invalid JSON → same mock stack.
- **Feedback engine** (recording step): **Smart Coach · LLM** · **Rules Engine · Mock** · **Sample Preview · Offline** — see `RecordingStep.tsx`.
- **Mock badges**: **Mock (hybrid)** = embeddings ran successfully; **Mock (rule)** = rules-only. Canonical detail: [docs/SCORING.md](docs/SCORING.md).

Persistence (`DB`) is not in the current MVP.

---

## Run locally

**Frontend** (Vite dev server; proxies `/api` → port 8000):

```bash
cd frontend && npm install && npm run dev
```

**Backend** (FastAPI + faster-whisper + optional OpenAI for scoring):

From `NLP-A3`, with paths that contain **spaces** quoted:

```bash
cd backend && python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Full setup (venv reset, `python3` fallback, space-in-path notes) is in **[backend/README.md](backend/README.md)**.

With **both** frontend and backend running, use **Analyze recording** for real STT plus server-side scoring. Without `OPENAI_API_KEY`, scoring uses the **NLP mock** path (`backend/app/nlp/`). **Run demo pipeline** (or `VITE_USE_MOCK=true`) exercises the UI **without** the API. See [docs/MANUAL_TEST.md](docs/MANUAL_TEST.md). **STT and scoring design:** [docs/STT.md](docs/STT.md), [docs/SCORING.md](docs/SCORING.md).

---

## Documentation

| | |
|--|--|
| **English** | [docs/en/README.md](docs/en/README.md) — overview, workflow, repo layout, stack, dev workflow |
| **繁體中文** | [docs/zh-TW/README.md](docs/zh-TW/README.md) — 同上完整說明 |
| **STT** | [docs/STT.md](docs/STT.md) — faster-whisper pipeline, env, API |
| **Scoring** | [docs/SCORING.md](docs/SCORING.md) — mock vs LLM, formulas, prompts, fallbacks |

