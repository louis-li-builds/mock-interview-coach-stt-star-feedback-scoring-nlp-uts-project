# Architecture / 系統架構

## Overview
This project implements a mock interview practice loop:
1. A user selects a prompt and records an audio answer in the web UI.
2. The backend transcribes audio via open-source STT.
3. The NLP pipeline scores the transcript and generates interpretable feedback.
4. The UI presents scores, highlights, and suggestions.

## Components
### Frontend (Web GUI)
- Responsibilities:
  - prompt selection
  - audio recording (MediaRecorder/Web Audio API)
  - results visualization (overall score + breakdown + feedback)

### Backend API
- Responsibilities:
  - accept audio + prompt metadata
  - orchestrate STT + NLP scoring
  - optionally persist sessions (transcripts, scores)

### STT (Open-source)
- Candidates:
  - Whisper / faster-whisper
  - Vosk (lighter)

### NLP scoring pipeline
- Pre-processing:
  - segmentation & normalization
  - measurable evidence detection (numbers, durations)
- Scoring signals:
  - STAR evidence & coverage
  - prompt relevance (embeddings)
  - keyword/competency coverage
- Output:
  - overall score
  - sub-scores
  - feedback text + evidence highlights

## Diagram
See the Mermaid diagram in `README.md`.

