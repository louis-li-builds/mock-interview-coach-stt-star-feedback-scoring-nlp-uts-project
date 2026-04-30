# Mock Interview Coach — API

FastAPI service for **STT** (faster-whisper) and **scoring** (OpenAI JSON when `OPENAI_API_KEY` is set; otherwise deterministic mock).

## Setup (virtualenv in `backend/.venv`)

Always install into **`backend/.venv`**, not the system Python, so the project stays isolated and reproducible.

From the **monorepo root** (`NLP-A3/`), go into `backend` (quote the path if any folder name contains a **space**):

```bash
cd "/path/to/NLP-A3/backend"
```

Or from inside `NLP-A3` already:

```bash
cd backend
```

Create the venv (prefer **Python 3.11** as documented; if `python3.11` is missing, use `python3`):

```bash
python3.11 -m venv .venv
# fallback: python3 -m venv .venv
```

Activate and install:

```bash
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

Check that `pip` belongs to the venv (optional):

```bash
which pip    # should end with .../backend/.venv/bin/pip
```

To **start over**, remove the old env and repeat the steps above:

```bash
rm -rf .venv
```

The first transcription downloads the Whisper weights (see `WHISPER_MODEL`, default `tiny`).

### Paths with spaces (zsh / bash)

If your clone lives under a path like `.../side project/...`, **quote** the argument to `cd`, and quote any absolute path to `.venv/bin/python`:

```bash
cd "/Users/you/.../side project/.../NLP-A3/backend"
```

Otherwise the shell may split on the space and fail with `no such file or directory` pointing at a truncated path.

### If you already ran `pip install` without a venv

You do not have to uninstall from the system Python to continue: create `backend/.venv` as above and install again; the venv does not use your global site-packages unless you enabled `--system-site-packages`.

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
| `SCORE_PROMPT_VARIANT` | `full` | `full` (default STAR-heavy prompt) or `minimal` (shorter prompt; same JSON schema). See `docs/SCORING.md` and `docs/ABLATION.md`. |
| `CORS_ALLOW_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated list. |

## Endpoints

- `POST /v1/transcribe` — multipart field `audio` (e.g. `webm` from the browser).
- `POST /v1/score` — JSON body: `transcript`, `question_title`, `question_body`, optional `force_mock` (boolean; when true, always mock even if `OPENAI_API_KEY` is set).
  - Optional header: `x-openai-api-key` — use this key for LLM scoring without server env vars (ignored when `force_mock=true`).

The Vite dev server proxies `/api` → this service (see `frontend/vite.config.ts`).

## Technical reference (docs)

- **STT pipeline (Whisper / faster-whisper):** [`../docs/STT.md`](../docs/STT.md)
- **Scoring (mock heuristics + OpenAI LLM, fallbacks, prompts):** [`../docs/SCORING.md`](../docs/SCORING.md)
- **Experiments / ablations:** [`../docs/ABLATION.md`](../docs/ABLATION.md)
