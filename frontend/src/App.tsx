import { useCallback, useEffect, useRef, useState } from 'react'
import {
  runClientMockPipeline,
  scoreAnswer,
  shouldUseClientMock,
  transcribeAudio,
} from './api'
import { FeedbackStep } from './app/components/FeedbackStep'
import { PreRecordStep } from './app/components/PreRecordStep'
import { ProcessingStep } from './app/components/ProcessingStep'
import { ProgressIndicator } from './app/components/ProgressIndicator'
import { QuestionStep } from './app/components/QuestionStep'
import { RecordingStep } from './app/components/RecordingStep'
import { WelcomeStep } from './app/components/WelcomeStep'
import {
  MOCK_QUESTION,
  STEP_LABELS,
  STEP_ORDER,
  type InterviewStep,
  type SessionResult,
} from './interviewFlow'

const INITIAL_STEP: InterviewStep = 'welcome'

const DISPLAY_STEP: Record<InterviewStep, number> = {
  welcome: 1,
  prompt: 2,
  recordPrep: 3,
  recording: 4,
  processing: 5,
  feedback: 6,
}

export default function App() {
  const [step, setStep] = useState<InterviewStep>(INITIAL_STEP)
  const [result, setResult] = useState<SessionResult | null>(null)
  const [sessionKey, setSessionKey] = useState(0)
  const [runKind, setRunKind] = useState<'none' | 'demo' | 'live'>('none')
  const [processingAttempt, setProcessingAttempt] = useState(0)
  const [processingPhase, setProcessingPhase] = useState<
    'idle' | 'transcribing' | 'scoring'
  >('idle')
  const [processingError, setProcessingError] = useState<string | null>(null)
  const liveBlobRef = useRef<Blob | null>(null)

  const currentIndex = STEP_ORDER.indexOf(step)
  const totalSteps = STEP_ORDER.length

  const goTo = useCallback((s: InterviewStep) => {
    setStep(s)
  }, [])

  const goNext = useCallback(() => {
    const i = STEP_ORDER.indexOf(step)
    if (i < totalSteps - 1) goTo(STEP_ORDER[i + 1]!)
  }, [goTo, step, totalSteps])

  const goPrev = useCallback(() => {
    const i = STEP_ORDER.indexOf(step)
    if (i <= 0) return
    const prev = STEP_ORDER[i - 1]!
    if (prev === 'processing') return
    goTo(prev)
  }, [goTo, step])

  const restart = useCallback(() => {
    setResult(null)
    setRunKind('none')
    setProcessingError(null)
    liveBlobRef.current = null
    setSessionKey((k) => k + 1)
    goTo(INITIAL_STEP)
  }, [goTo])

  const startProcessingDemo = useCallback(() => {
    liveBlobRef.current = null
    setRunKind('demo')
    setProcessingError(null)
    goTo('processing')
  }, [goTo])

  const startProcessingLive = useCallback((blob: Blob) => {
    liveBlobRef.current = blob
    setRunKind('live')
    setProcessingError(null)
    goTo('processing')
  }, [goTo])

  useEffect(() => {
    if (step !== 'processing') return
    if (runKind === 'none') return

    let cancelled = false

    ;(async () => {
      setProcessingError(null)
      try {
        if (shouldUseClientMock() || runKind === 'demo') {
          setProcessingPhase('scoring')
          const r = await runClientMockPipeline()
          if (cancelled) return
          setResult(r)
          goTo('feedback')
          return
        }

        const blob = liveBlobRef.current
        if (!blob?.size) {
          throw new Error('No audio recording was found. Go back and record again.')
        }
        setProcessingPhase('transcribing')
        const transcript = await transcribeAudio(blob)
        if (cancelled) return
        setProcessingPhase('scoring')
        const scored = await scoreAnswer(transcript)
        if (cancelled) return
        setResult({
          transcript,
          overallScore: scored.overallScore,
          breakdown: scored.breakdown,
          suggestions: scored.suggestions,
          scoreSource: scored.scoreSource,
        })
        goTo('feedback')
      } catch (e) {
        if (cancelled) return
        setProcessingError(e instanceof Error ? e.message : 'Processing failed')
      } finally {
        if (!cancelled) setProcessingPhase('idle')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [goTo, processingAttempt, runKind, step])

  const retryProcessing = useCallback(() => {
    setProcessingError(null)
    setProcessingAttempt((a) => a + 1)
  }, [])

  const backFromProcessingError = useCallback(() => {
    setProcessingError(null)
    setRunKind('none')
    goTo('recording')
  }, [goTo])

  const canShowContinue =
    step === 'welcome' || step === 'prompt' || step === 'recordPrep'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col px-4">
        <header className="pt-4 pb-2 border-b border-border flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground font-medium">NLP A3 — Mock Interview Coach</p>
        </header>

        <ProgressIndicator currentStep={DISPLAY_STEP[step]} totalSteps={totalSteps} />

        <div className="py-6 flex-1">
          {step === 'welcome' ? <WelcomeStep onContinue={() => goTo('prompt')} /> : null}
          {step === 'prompt' ? (
            <QuestionStep
              title={MOCK_QUESTION.title}
              body={MOCK_QUESTION.body}
              onContinue={() => goTo('recordPrep')}
            />
          ) : null}
          {step === 'recordPrep' ? <PreRecordStep onContinue={() => goTo('recording')} /> : null}
          {step === 'recording' ? (
            <RecordingStep
              key={sessionKey}
              onDemo={startProcessingDemo}
              onSubmitRecording={startProcessingLive}
            />
          ) : null}
          {step === 'processing' ? (
            <ProcessingStep
              error={processingError}
              phase={processingPhase}
              onRetry={retryProcessing}
              onBackToRecording={backFromProcessingError}
            />
          ) : null}
          {step === 'feedback' && result ? <FeedbackStep result={result} onRestart={restart} /> : null}
        </div>
      </div>

      <footer className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {STEP_LABELS[step]} ({currentIndex + 1}/{totalSteps})
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={
                step === 'welcome' ||
                (step === 'processing' && !processingError) ||
                step === 'feedback'
              }
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Back
            </button>
            {step === 'feedback' ? (
              <button
                type="button"
                onClick={restart}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                Start over
              </button>
            ) : canShowContinue ? (
              <button
                type="button"
                onClick={goNext}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  )
}
