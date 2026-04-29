import { useCallback, useEffect, useState } from 'react'
import {
  MOCK_QUESTION,
  MOCK_SESSION_RESULT,
  STEP_LABELS,
  STEP_ORDER,
  type InterviewStep,
  type SessionResult,
} from './interviewFlow'
import './App.css'

const INITIAL_STEP: InterviewStep = 'welcome'

function App() {
  const [step, setStep] = useState<InterviewStep>(INITIAL_STEP)
  const [result, setResult] = useState<SessionResult | null>(null)

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
    goTo(INITIAL_STEP)
  }, [goTo])

  useEffect(() => {
    if (step !== 'processing') return
    const id = window.setTimeout(() => {
      setResult(MOCK_SESSION_RESULT)
      goTo('feedback')
    }, 1400)
    return () => window.clearTimeout(id)
  }, [goTo, step])

  const finishRecordingMock = useCallback(() => {
    goTo('processing')
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
              This prototype walks you through a short mock interview: question →
              record (real mic in Phase 2) → speech-to-text → LLM scoring →
              feedback.
            </p>
            <p className="panel__muted">
              Phase 1 uses mock audio processing so you can test the full UI flow
              without a backend.
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
              <li>Find a quiet place; speak clearly for about 60–90 seconds.</li>
              <li>
                Optional camera preview will be added when the product brief
                requires it.
              </li>
              <li>Phase 2 will capture real microphone audio here.</li>
            </ul>
          </section>
        )}

        {step === 'recording' && (
          <section className="panel" aria-labelledby="rec-title">
            <h1 id="rec-title">Recording</h1>
            <p className="panel__lead">
              Placeholder for MediaRecorder. Use the button below to simulate
              finishing a take and running STT + LLM.
            </p>
            <div className="panel__recBox" aria-hidden>
              <span className="panel__recDot" />
              <span>Mock recorder idle</span>
            </div>
            <button
              type="button"
              className="btn btn--primary"
              onClick={finishRecordingMock}
            >
              Finish with mock answer (Phase 1)
            </button>
          </section>
        )}

        {step === 'processing' && (
          <section className="panel panel--center" aria-live="polite">
            <h1>Processing</h1>
            <p className="panel__lead">Running STT and LLM scoring…</p>
            <div className="spinner" role="status" aria-label="Loading" />
          </section>
        )}

        {step === 'feedback' && result && (
          <section className="panel panel--feedback" aria-labelledby="fb-title">
            <h1 id="fb-title">Your feedback</h1>
            <p className="panel__score">
              Overall <strong>{result.overallScore}</strong>
              <span className="panel__muted"> / 100 (mock)</span>
            </p>

            <h2 className="panel__h2">Score breakdown</h2>
            <ul className="panel__breakdown">
              {result.breakdown.map((row) => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  <span>
                    {row.score}/{row.max}
                  </span>
                </li>
              ))}
            </ul>

            <h2 className="panel__h2">Transcript (mock STT)</h2>
            <blockquote className="panel__quote">{result.transcript}</blockquote>

            <h2 className="panel__h2">Suggestions (mock LLM)</h2>
            <ol className="panel__suggestions">
              {result.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
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
                step === 'processing' ||
                step === 'feedback'
              }
            >
              Back
            </button>
            {step === 'feedback' ? (
              <button type="button" className="btn btn--primary" onClick={restart}>
                Start over
              </button>
            ) : step === 'recording' || step === 'processing' ? null : (
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

export default App
