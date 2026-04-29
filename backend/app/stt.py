import asyncio
import os
from functools import lru_cache

from faster_whisper import WhisperModel

_model_name: str = os.getenv("WHISPER_MODEL", "tiny")


@lru_cache(maxsize=1)
def _get_model() -> WhisperModel:
    """Load once (CPU int8 keeps deps simple for laptops)."""
    compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
    device = os.getenv("WHISPER_DEVICE", "cpu")
    return WhisperModel(_model_name, device=device, compute_type=compute_type)


def _transcribe_sync(path: str, language: str | None) -> str:
    model = _get_model()
    kwargs: dict = {"beam_size": 5}
    if language:
        kwargs["language"] = language
    segments, _info = model.transcribe(path, **kwargs)
    parts: list[str] = []
    for seg in segments:
        t = (seg.text or "").strip()
        if t:
            parts.append(t)
    return " ".join(parts).strip()


async def transcribe_file(path: str, language: str | None = None) -> str:
    return await asyncio.to_thread(_transcribe_sync, path, language)
