# Contributing / 協作規範

## English
### Goals
- Keep the repo easy to navigate for teammates and markers.
- Prefer small, reviewable changes.
- Keep documentation and code consistent with the report.

### Workflow
1. Create a branch from `main`: `feature/<short-name>` or `fix/<short-name>`
2. Make changes with clear commit messages
3. Open a Pull Request (PR) with:
   - Summary (what/why)
   - Test notes (how you verified)
   - Screenshots or demo notes if UI changes
4. Get at least one review before merging (recommended)

### Code style (lightweight)
- Keep functions small and single-purpose.
- Prefer explicit names over cleverness.
- Avoid committing secrets (API keys, tokens, `.env`).

## 中文（台灣）
### 目標
- Repo 結構清楚，組員與助教一眼看懂。
- 小步提交、好 review。
- 文件、程式、report 內容一致。

### 協作流程
1. 從 `main` 開分支：`feature/<name>` 或 `fix/<name>`
2. 以清楚的 commit message 提交
3. 開 PR 並附上：
   - 變更摘要（做了什麼/為什麼）
   - 測試方式（怎麼驗證）
   - 若有 UI 變更請附截圖或 demo 說明
4. 建議至少 1 位組員 review 後再合併

### 注意事項
- 不要把機密資訊（API keys / tokens / `.env`）推上 GitHub

