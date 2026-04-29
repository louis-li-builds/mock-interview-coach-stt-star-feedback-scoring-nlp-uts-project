# Mock Interview Coach — API

FastAPI service for **STT** (faster-whisper) and **scoring** (OpenAI JSON when `OPENAI_API_KEY` is set; otherwise deterministic mock).

## Setup

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

The first transcription downloads the Whisper weights (see `WHISPER_MODEL`, default `tiny`).

## Run

From the `backend` directory (with the virtualenv active):

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check: `GET http://127.0.0.1:8000/v1/health`

## Environment

| Variable | Default | Notes |
|----------|---------|--------|
| `WHISPER_MODEL` | `tiny` | e.g. `base` for better quality (slower, larger download). |
| `WHISPER_DEVICE` | `cpu` | Set `cuda` if you have a GPU build of ctranslate2. |
| `WHISPER_COMPUTE_TYPE` | `int8` | e.g. `float16` on GPU. |
| `WHISPER_LANGUAGE` | _(empty)_ | ISO code like `en` to hint the model. |
| `OPENAI_API_KEY` | _(empty)_ | If unset, `/v1/score` uses built-in mock scoring. |
| `OPENAI_MODEL` | `gpt-4o-mini` | Chat model for JSON scoring. |
| `OPENAI_TIMEOUT_SECONDS` | `90` | Client timeout for OpenAI requests. |
| `SCORE_PROMPT_VARIANT` | `full` | `full` (default STAR-heavy prompt) or `minimal` (shorter prompt; same JSON schema). For ablations see `docs/ABLATION.md`. |
| `CORS_ALLOW_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated list. |

## Endpoints

- `POST /v1/transcribe` — multipart field `audio` (e.g. `webm` from the browser).
- `POST /v1/score` — JSON body: `transcript`, `question_title`, `question_body`.

The Vite dev server proxies `/api` → this service (see `frontend/vite.config.ts`).
