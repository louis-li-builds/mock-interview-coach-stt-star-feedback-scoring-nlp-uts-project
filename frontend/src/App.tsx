import { useCallback, useEffect, useRef, useState } from 'react'
import {
  runClientMockPipeline,
  scoreAnswer,
  shouldUseClientMock,
  transcribeAudio,
} from './api'
import { RecordingPanel } from './components/RecordingPanel'
import { useCameraPreview } from './hooks/useCameraPreview'
import {
  MOCK_QUESTION,
  STEP_LABELS,
  STEP_ORDER,
  type InterviewStep,
  type SessionResult,
} from './interviewFlow'
import './App.css'

const INITIAL_STEP: InterviewStep = 'welcome'

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
  const [cameraWanted, setCameraWanted] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
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

  useCameraPreview(step === 'recordPrep' && cameraWanted, videoRef)

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

  return (
    <div className="coach">
      <header className="coach__header">
        <p className="coach__brand">NLP A3 — Mock Interview Coach</p>
        <nav className="coach__steps" aria-label="Interview progress">
          {STEP_ORDER.map((s, idx) => (
            <span
              key={s}
              className={
                'coach__stepDot' +
                (idx === currentIndex ? ' coach__stepDot--active' : '') +
                (idx < currentIndex ? ' coach__stepDot--done' : '')
              }
              title={STEP_LABELS[s]}
            />
          ))}
        </nav>
      </header>

      <main className="coach__main">
        {step === 'welcome' && (
          <section className="panel" aria-labelledby="welcome-title">
            <h1 id="welcome-title">Welcome</h1>
            <p className="panel__lead">
              Walk through a short mock interview: question → microphone (optional
              camera preview) → speech-to-text → LLM scoring → structured feedback.
            </p>
            <p className="panel__muted">
              Use <strong>Analyze recording</strong> with the Python API running for
              real Whisper + scoring. <strong>Run demo pipeline</strong> works
              offline. Set <code>VITE_USE_MOCK=true</code> to force the demo path.
            </p>
          </section>
        )}

        {step === 'prompt' && (
          <section className="panel" aria-labelledby="prompt-title">
            <h1 id="prompt-title">{MOCK_QUESTION.title}</h1>
            <p className="panel__question">{MOCK_QUESTION.body}</p>
          </section>
        )}

        {step === 'recordPrep' && (
          <section className="panel" aria-labelledby="prep-title">
            <h1 id="prep-title">Before you record</h1>
            <ul className="panel__list">
              <li>Find a quiet place; aim for about 60–90 seconds of clear speech.</li>
              <li>
                Recording uses the <strong>microphone only</strong> (smaller uploads
                for STT). Camera is preview-only.
              </li>
            </ul>
            <label className="panel__check">
              <input
                type="checkbox"
                checked={cameraWanted}
                onChange={(e) => setCameraWanted(e.target.checked)}
              />
              Show optional camera preview
            </label>
            {cameraWanted ? (
              <div className="panel__videoWrap">
                <video
                  ref={videoRef}
                  className="panel__video"
                  playsInline
                  muted
                  aria-label="Camera preview"
                />
              </div>
            ) : null}
          </section>
        )}

        {step === 'recording' ? (
          <RecordingPanel
            key={sessionKey}
            onDemo={startProcessingDemo}
            onSubmitRecording={startProcessingLive}
          />
        ) : null}

        {step === 'processing' && (
          <section className="panel panel--center" aria-live="polite">
            {processingError ? (
              <>
                <h1>Could not finish processing</h1>
                <p className="panel__error" role="alert">
                  {processingError}
                </p>
                <p className="panel__muted">
                  Is the API running on port 8000? Try{' '}
                  <code>cd backend && uvicorn app.main:app --reload</code> from the
                  repo root (with dependencies installed).
                </p>
                <div className="panel__row">
                  <button type="button" className="btn" onClick={backFromProcessingError}>
                    Back to recording
                  </button>
                  <button type="button" className="btn btn--primary" onClick={retryProcessing}>
                    Retry
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1>Processing</h1>
                <p className="panel__lead">
                  {processingPhase === 'transcribing'
                    ? 'Transcribing audio (Whisper)…'
                    : processingPhase === 'scoring'
                      ? 'Scoring answer (LLM or mock)…'
                      : 'Preparing…'}
                </p>
                <div className="spinner" role="status" aria-label="Loading" />
              </>
            )}
          </section>
        )}

        {step === 'feedback' && result && (
          <section className="panel panel--feedback" aria-labelledby="fb-title">
            <h1 id="fb-title">Your feedback</h1>
            <p className="panel__badges">
              <span className="badge">
                Scoring:{' '}
                {result.scoreSource === 'llm'
                  ? 'LLM'
                  : result.scoreSource === 'mock'
                    ? 'Mock / offline'
                    : '—'}
              </span>
            </p>
            <p className="panel__score">
              Overall <strong>{result.overallScore}</strong>
              <span className="panel__muted"> / 100</span>
            </p>

            <h2 className="panel__h2">Score breakdown</h2>
            <ul className="panel__breakdown">
              {result.breakdown.map((row) => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  <span>
                    {Math.round(row.score)}/{row.max}
                  </span>
                </li>
              ))}
            </ul>

            <h2 className="panel__h2">Transcript</h2>
            <blockquote className="panel__quote">{result.transcript}</blockquote>

            <details className="panel__details" open>
              <summary className="panel__detailsSummary">
                Suggestions ({result.suggestions.length})
              </summary>
              <ol className="panel__suggestions">
                {result.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </details>
          </section>
        )}
      </main>

      <footer className="coach__footer">
        <div className="coach__footerInner">
          <span className="coach__stepLabel">
            {STEP_LABELS[step]} ({currentIndex + 1}/{totalSteps})
          </span>
          <div className="coach__actions">
            <button
              type="button"
              className="btn"
              onClick={goPrev}
              disabled={
                step === 'welcome' ||
                (step === 'processing' && !processingError) ||
                step === 'feedback'
              }
            >
              Back
            </button>
            {step === 'feedback' ? (
              <button type="button" className="btn btn--primary" onClick={restart}>
                Start over
              </button>
            ) : step === 'recording' || (step === 'processing' && !processingError) ? null : (
              <button type="button" className="btn btn--primary" onClick={goNext}>
                Continue
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
