# 打分模組更新說明（給組員） / Scoring update (team brief)

> 可整份轉傳；技術細節以 [SCORING.md](SCORING.md) 為準。

---

## 中文摘要

**這次更新在做什麼**  
我們把 **Path A（mock / 無 LLM 金鑰時）的打分** 從舊的「幾乎只看**字長**與有沒有**數字**」的啟發式，升級成 **輕量 NLP 評估層（lightweight NLP layer）**，讓沒有 OpenAI 金鑰或要強制離線實驗時，分數與建議仍與「內容相關度、敘述結構、表達品質」比較一致。

**技術與實作**  
- **後端框架**：既有的 **FastAPI**、**Pydantic** 不變；新邏輯在 `backend/app/nlp/`。  
- **處理方式**：以 **正則與規則** 為主（**無**額外 embedding / 神經模型依賴，利於本機重現與作業報告說明）。  
- **管線分層**：  
  - `preprocess/`：逐字稿清理、小寫、分詞、輕量詞幹。  
  - `analyzers/`：關鍵字與題幹關聯、粗結構（開頭/中段/收尾）、流暢度（filler）、可量化證據、信心度啟發式。  
  - `scoring/`：加權總分 + 對應四維 rubric 分數。  
  - `feedback/`：依規則產生建議句。  
- **LLM 路徑（Path B）**：有設定 `OPENAI_API_KEY` 且非 `force_mock` 時，仍走 **OpenAI Chat JSON** 打分，**與本次 mock 重構獨立**；失敗時照舊 **fallback** 到上述 NLP mock。

**加權概覽（整體分）**  
整體分 = 0.4×關鍵字相關 + 0.2×結構 + 0.2×流暢 + 0.2×信心（細節見 [SCORING.md](SCORING.md)）。

**解決了什麼問題**  
- **舊 mock** 難以宣稱「有 NLP」：幾乎等於長度計數器。  
- **新 mock** 能在**不呼叫 LLM** 的情況下，仍產出可解釋的 **四維 breakdown** 與 **具體建議**，方便 demo、abluation、與沒有 API 金鑰的環境。  
- **架構** 分資料夾職責，之後要加（例如：語速要接錄音秒數、或語意相似度）有清楚擴充點。

**前端注意**  
「**Mock only**」只影響 **後端是否強制用 mock 打分**；**錄音 → 轉文字** 仍須本機啟 **FastAPI**（Whisper），除非用 **Demo** 或 `VITE_USE_MOCK=true` 做純前端假資料。詳見 [MANUAL_TEST.md](MANUAL_TEST.md)。

---

## English summary

**What changed**  
We upgraded **Path A (mock scoring when no LLM key or `force_mock`)** from a **length- and digit-heavy heuristic** to a **lightweight NLP evaluation layer** under `backend/app/nlp/`, so offline / keyless runs still reflect **relevance, coarse structure, and delivery quality** more meaningfully.

**Stack & approach**  
- **FastAPI** + **Pydantic** unchanged.  
- **Rule- and regex-based** signals ( **no** extra embedding model in the MVP path — easy to reproduce and document).  
- **Layered package**: `preprocess/` → `analyzers/` (keywords, structure, fluency, evidence, confidence) → `scoring/` (weighted overall + four rubric rows) → `feedback/` (templated suggestions).  
- **Path B (LLM)** remains **OpenAI JSON scoring** when a key is set; on failure, **fallback** to the same NLP mock.

**Weights (overall score)**  
Overall ≈ **0.4** keyword + **0.2** structure + **0.2** fluency + **0.2** confidence (see [SCORING.md](SCORING.md) for the exact mapping to API fields).

**Problems addressed**  
- The old mock was hard to justify as an “NLP” layer (mostly transcript length).  
- The new mock provides **interpretable breakdowns** and **actionable tips** without LLM cost, useful for demos, ablations, and local development.  
- **Clear module boundaries** for future extensions (e.g. real WPM from audio duration, semantic similarity).

**Frontend note**  
**“Mock only”** only forces **mock scoring** on the server. **STT** still needs the **backend** for real recordings unless you use the **Demo** path or `VITE_USE_MOCK=true`. See [MANUAL_TEST.md](MANUAL_TEST.md).

---

*Last updated with the lightweight NLP mock release; canonical behaviour: [SCORING.md](SCORING.md).*
