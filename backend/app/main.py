import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .llm import score_answer
from .schemas import ScoreRequest, ScoreResponse, TranscribeResponse
from .stt import transcribe_file

app = FastAPI(title="Mock Interview Coach API", version="0.1.0")

_origins = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/transcribe", response_model=TranscribeResponse)
async def transcribe(audio: UploadFile = File(...)) -> TranscribeResponse:
    suffix = Path(audio.filename or "recording").suffix or ".webm"
    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await audio.read()
            if not content:
                raise HTTPException(status_code=400, detail="Empty audio upload")
            tmp.write(content)
            tmp_path = tmp.name
        lang = os.getenv("WHISPER_LANGUAGE") or None
        text = await transcribe_file(tmp_path, language=lang)
        return TranscribeResponse(transcript=text or "")
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500, detail=f"Transcription failed: {exc}"
        ) from exc
    finally:
        if tmp_path:
            Path(tmp_path).unlink(missing_ok=True)


@app.post("/v1/score", response_model=ScoreResponse)
async def score(
    body: ScoreRequest,
    x_openai_api_key: str | None = Header(default=None),
) -> ScoreResponse:
    if not body.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is empty")
    # Optional: allow the client to provide an API key via header.
    # This keeps local demos self-contained without requiring server env vars.
    return await score_answer(body, api_key_override=x_openai_api_key)
