# NLP A3 — Mock Interview Coach

**[Full guide (English)](docs/en/README.md)** · **[完整說明（繁體中文）](docs/zh-TW/README.md)** · [Documentation hub](docs/README.md)

**NLP A3** is a course project for **NLP Assessment 3 (Project Development)**.  
It builds a **mock interview coaching prototype**: speech → **open-source STT** → lightweight NLP scoring → interpretable feedback.

This file is the **overview** only. Architecture, tech stack, repo layout, and collaboration notes live in the language-specific guides.

---

## At-a-glance workflow

> GitHub supports Mermaid rendering in Markdown.

```mermaid
flowchart LR
  U[User]
  FE[Frontend GUI]
  API[Backend API]
  STT[STT]
  NLP[NLP scoring]
  OUT[Score and feedback]
  DB[(Storage optional)]

  U --> FE --> API --> STT --> API --> NLP --> OUT --> FE --> U
  API --> DB
```

---

## Documentation

| | |
|--|--|
| **English** | [docs/en/README.md](docs/en/README.md) — overview, workflow, repo layout, stack, dev workflow |
| **繁體中文** | [docs/zh-TW/README.md](docs/zh-TW/README.md) — 同上完整說明 |

