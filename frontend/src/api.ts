import { MOCK_QUESTION, MOCK_SESSION_RESULT, type SessionResult } from './interviewFlow'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '/api'

const FORCE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

type ScoreApiResponse = {
  overall_score: number
  breakdown: { label: string; score: number; max: number }[]
  suggestions: string[]
  source: 'llm' | 'mock'
}

type TranscribeApiResponse = { transcript: string }

function mapScore(data: ScoreApiResponse): Pick<
  SessionResult,
  'overallScore' | 'breakdown' | 'suggestions' | 'scoreSource'
> {
  return {
    overallScore: data.overall_score,
    breakdown: data.breakdown,
    suggestions: data.suggestions,
    scoreSource: data.source,
  }
}

export function shouldUseClientMock(): boolean {
  return FORCE_MOCK
}

export async function runClientMockPipeline(): Promise<SessionResult> {
  await delay(900)
  return { ...MOCK_SESSION_RESULT, scoreSource: 'mock' }
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const fd = new FormData()
  fd.append('audio', blob, 'recording.webm')
  const res = await fetch(`${API_BASE}/v1/transcribe`, {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Transcribe failed (${res.status})`)
  }
  const data = (await res.json()) as TranscribeApiResponse
  return data.transcript?.trim() || ''
}

export async function scoreAnswer(
  transcript: string,
  question = MOCK_QUESTION,
  opts?: { forceMock?: boolean },
): Promise<Pick<SessionResult, 'overallScore' | 'breakdown' | 'suggestions' | 'scoreSource'>> {
  const res = await fetch(`${API_BASE}/v1/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript,
      question_title: question.title,
      question_body: question.body,
      force_mock: opts?.forceMock === true,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Score failed (${res.status})`)
  }
  const data = (await res.json()) as ScoreApiResponse
  return mapScore(data)
}
