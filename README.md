# NLP A3 — Mock Interview Coach (Speech-to-Text + STAR Feedback)

> **EN**: Course project repo for NLP Assessment 3 (Project Development).  
> **中文**：NLP 作業三（專題開發）專案倉庫，主題為「模擬面試練習與回饋系統」。

---

## Table of Contents / 目錄
- [Project Overview / 專案簡介](#project-overview--專案簡介)
- [System Workflow Diagram](#system-workflow-diagram)
- [Repository Structure / 專案結構](#repository-structure--專案結構)
- [Tech Stack / 技術選型](#tech-stack--技術選型)
- [Development Workflow / 協作流程](#development-workflow--協作流程)
- [Docs / 文件](#docs--文件)
- [Internal Docs (ignored) / 內部文件（不進版控）](#internal-docs-ignored--內部文件不進版控)

---

## Project Overview / 專案簡介
### English
Interview self-practice often lacks immediate, actionable feedback. This project builds a **mock interview coaching system** where users answer questions via speech in a web UI. The system uses an **open-source STT** model to transcribe speech into text, then applies lightweight NLP methods to evaluate:
- STAR structure coverage (Situation / Task / Action / Result)
- prompt relevance (semantic similarity)
- keyword / competency coverage
- measurable evidence (numbers, percentages, duration)

It outputs an interpretable **score breakdown** and **actionable feedback** to help users iterate and improve.

### 中文
面試練習最常見的痛點是「缺少即時、具體、可量化的回饋」。本專案打造一個 **mock interview 練習系統**：使用者在網頁上用語音回答題目，系統透過 **開源 STT** 轉寫成文字，再用 NLP 分析回答的結構（STAR）、離題程度、關鍵字覆蓋、以及是否有量化成果，最後輸出可解釋的分數與改進建議。

---

## System Workflow Diagram
> GitHub supports Mermaid rendering in Markdown.

```mermaid
flowchart TD
  U[User] -->|Open web app| FE[Frontend GUI]
  FE -->|Select question & record audio| FE
  FE -->|Upload audio + prompt_id| API[Backend API]

  API --> STT[Open-source STT]
  STT -->|Transcript| API

  API --> NLP[NLP scoring pipeline]
  NLP --> PRE[Pre-processing]
  PRE --> STAR[STAR evidence & coverage scoring]
  PRE --> REL[Prompt relevance (embeddings)]
  PRE --> KW[Keyword/competency coverage]
  PRE --> EVID[Measurable evidence detection]

  STAR --> AGG[Score aggregation]
  REL --> AGG
  KW --> AGG
  EVID --> AGG
  AGG --> FB[Feedback generation]

  API -->|Optional persist| DB[(Storage: SQLite/JSON)]
  FB --> API
  API -->|Scores + feedback + highlights| FE
  FE -->|Display results| U
```

---

## Repository Structure / 專案結構
```text
NLP-A3/
  README.md
  CONTRIBUTING.md
  .gitignore
  docs/
    ARCHITECTURE.md
    DEVELOPMENT.md
  scripts/
    (optional utilities)
  internal-docs/   # ignored by git (team-only)
```

---

## Tech Stack / 技術選型
> This is a *planned* stack; we will pin exact versions when implementation starts.

- **Frontend**: React + Vite (audio recording via MediaRecorder/Web Audio API)
- **Backend**: FastAPI (Python) or Express (Node.js)
- **STT (open-source)**: Whisper / faster-whisper (preferred) or Vosk
- **NLP**:
  - preprocessing: regex + lightweight tokenization/sentence split
  - embeddings: Sentence-Transformers (small model)
- **Storage (optional)**: SQLite / JSON
- **Compute**: Google Colab (free tier) for experiments

---

## Development Workflow / 協作流程
### Branching (suggested)
- `main`: stable, demoable
- `feature/<name>`: feature branches
- `fix/<name>`: bug fixes

### Pull requests
- Small PRs preferred (easy review).
- Include a short summary + test notes.
- Link to relevant issues (if you use GitHub Issues).

### Commit message (suggested)
- Use concise, present tense messages, e.g.:
  - `add STAR scoring module`
  - `refine report methodology section`

---

## Docs / 文件
- `docs/ARCHITECTURE.md`: system components and interfaces
- `docs/DEVELOPMENT.md`: how to collaborate and keep the project consistent

---

## Internal Docs (ignored) / 內部文件（不進版控）
Team-only working documents are stored under `internal-docs/` and are intentionally **ignored by git**.

