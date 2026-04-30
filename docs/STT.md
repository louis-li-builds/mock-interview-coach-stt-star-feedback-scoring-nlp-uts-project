# Speech-to-text (STT) module — design and behaviour

Canonical description of how **audio becomes transcript** in NLP A3. Implementation: **`backend/app/stt.py`**; HTTP entry: **`POST /v1/transcribe`** in **`backend/app/main.py`**.

---

## Library and model

- **Engine:** [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (CTranslate2 backend) wrapping **OpenAI Whisper** weights.
- **Load:** `WhisperModel` is constructed once per process (`lru_cache` on `_get_model()`).
- **Inference:** `model.transcribe(path, beam_size=5, …)`; optional fixed **`language`** from env (ISO code) to skip language detection.

Decoded **segment** texts are stripped, concatenated with spaces, and returned as a single string.

---

## Async behaviour

`transcribe_file()` runs the blocking Whisper call in a **thread pool** (`asyncio.to_thread`) so FastAPI stays responsive.

---

## Environment variables

| Variable | Default | Notes |
|----------|---------|--------|
| `WHISPER_MODEL` | `tiny` | e.g. `base` for better quality (larger download, slower). |
| `WHISPER_DEVICE` | `cpu` | `cuda` if GPU build available. |
| `WHISPER_COMPUTE_TYPE` | `int8` | e.g. `float16` on GPU. |
| `WHISPER_LANGUAGE` | _(empty)_ | If set (e.g. `en`), passed to `transcribe` as `language`. |

First transcription triggers **model download** (Hugging Face Hub); you may see a notice about `HF_TOKEN` for rate limits — optional for local dev.

---

## HTTP API

- **`POST /v1/transcribe`**: multipart field **`audio`** (e.g. browser `webm`).
- Server writes to a temp file, calls `transcribe_file`, deletes the temp file, returns `{ "transcript": "<text>" }`.
- Empty upload → **400**; other errors → **500** with message.

---

## Relationship to scoring

STT output is **only** the transcript string. **Scoring** is a separate step (`POST /v1/score`); see **[SCORING.md](SCORING.md)**.

---

## Related files

| File | Purpose |
|------|---------|
| `backend/app/stt.py` | Model load + transcribe |
| `backend/app/main.py` | `/v1/transcribe` |
| `backend/README.md` | Run instructions and env table |
