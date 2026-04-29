interface ProcessingStepProps {
  error: string | null
  phase: 'idle' | 'transcribing' | 'scoring'
  onRetry: () => void
  onBackToRecording: () => void
}

export function ProcessingStep({
  error,
  phase,
  onRetry,
  onBackToRecording,
}: ProcessingStepProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] px-6 max-w-xl mx-auto text-center">
        <h2 className="mb-3">Could not finish processing</h2>
        <p className="text-destructive mb-4" role="alert">
          {error}
        </p>
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          Is the API on port 8000? From repo root:{' '}
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
            cd backend && uvicorn app.main:app --reload
          </code>
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            type="button"
            onClick={onBackToRecording}
            className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to recording
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const title =
    phase === 'transcribing'
      ? 'Transcribing audio…'
      : phase === 'scoring'
        ? 'Scoring answer…'
        : 'Preparing…'

  const subtitle =
    phase === 'transcribing'
      ? 'Converting your speech to text (Whisper).'
      : phase === 'scoring'
        ? 'Analyzing your response (LLM or mock scorer).'
        : 'Starting pipeline…'

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-6">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8" />

      <div className="text-center" role="status" aria-live="polite">
        <h2 className="mb-3">{title}</h2>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}
