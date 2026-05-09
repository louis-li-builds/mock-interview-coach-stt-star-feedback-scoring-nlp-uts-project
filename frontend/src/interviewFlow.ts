export type InterviewStep =
  | 'welcome'
  | 'prompt'
  | 'recordPrep'
  | 'recording'
  | 'processing'
  | 'feedback'

export const STEP_ORDER: InterviewStep[] = [
  'welcome',
  'prompt',
  'recordPrep',
  'recording',
  'processing',
  'feedback',
]

export const STEP_LABELS: Record<InterviewStep, string> = {
  welcome: 'Welcome',
  prompt: 'Question',
  recordPrep: 'Before you record',
  recording: 'Recording',
  processing: 'Processing',
  feedback: 'Feedback',
}

export const MOCK_QUESTION = {
  title: 'Behavioural (STAR)',
  body: 'Tell me about a time you had to deliver a project under a tight deadline. What was the situation, what did you do, and what was the outcome?',
}

export type ScoreBreakdown = { label: string; score: number; max: number }

export type SessionResult = {
  transcript: string
  overallScore: number
  breakdown: ScoreBreakdown[]
  suggestions: string[]
  /** Set when response comes from backend scoring. */
  scoreSource?: 'llm' | 'mock'
  /** Only meaningful when scoreSource === 'mock'. */
  mockVariant?: 'rule' | 'hybrid'
}

/** Simulates STT + LLM output for Phase 1 (no backend). */
export const MOCK_SESSION_RESULT: SessionResult = {
  scoreSource: 'mock',
  mockVariant: 'rule',
  transcript:
    'In my last internship we had two weeks left and the API integration was still failing. I listed the blockers daily, paired with a senior for two afternoons, and we shipped on time with only minor bugs. The team said communication improved after that.',
  overallScore: 72,
  breakdown: [
    { label: 'STAR coverage', score: 16, max: 25 },
    { label: 'Prompt relevance', score: 18, max: 25 },
    { label: 'Measurable evidence', score: 12, max: 25 },
    { label: 'Clarity & structure', score: 14, max: 25 },
  ],
  suggestions: [
    'Name one or two concrete metrics (dates, hours saved, error rate) to strengthen the Result.',
    'Separate Situation / Task / Action / Result in speech so reviewers can map STAR quickly.',
    'Add what you learned or would do differently; it rounds out the story.',
  ],
}

export function stepIndex(step: InterviewStep): number {
  return STEP_ORDER.indexOf(step)
}
