# NLP A3 — Mock Interview Coach

**[Full guide (English)](docs/en/README.md)** · **[完整說明（繁體中文）](docs/zh-TW/README.md)** · [Documentation hub](docs/README.md)

**NLP A3** is a course project for **NLP Assessment 3 (Project Development)**.  
It builds a **mock interview coaching prototype**: phased **GUI** → speech (mic; optional camera) → **open-source STT** → transcript → **LLM** scoring and suggestions → final feedback stage back to the user.

This file is the **overview** only. Architecture, tech stack, repo layout, and collaboration notes live in the language-specific guides.

---

## At-a-glance workflow

High-level path: **User → GUI (staged flow) → STT → LLM (score + advice) → feedback GUI → User.**

```mermaid
flowchart LR
  U[User]
  G[GUI phases]
  STT[STT]
  LLM[LLM score and advice]
  FB[Feedback stage]

  U <--> G
  G --> STT
  STT --> LLM
  LLM --> FB
  FB --> G
```

Optional: a backend API orchestrates STT and LLM, and may persist sessions (`DB`).

---

## Run locally

**Frontend** (Vite dev server; proxies `/api` → port 8000):

```bash
cd frontend && npm install && npm run dev
```

**Backend** (FastAPI + faster-whisper + optional OpenAI for scoring):

```bash
cd backend && python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

With both running, use **Analyze recording** in the UI for real STT. Without `OPENAI_API_KEY`, scoring uses a deterministic mock. **Run demo pipeline** works with the frontend alone. See [docs/MANUAL_TEST.md](docs/MANUAL_TEST.md) for a full checklist.

---

## Documentation

| | |
|--|--|
| **English** | [docs/en/README.md](docs/en/README.md) — overview, workflow, repo layout, stack, dev workflow |
| **繁體中文** | [docs/zh-TW/README.md](docs/zh-TW/README.md) — 同上完整說明 |

