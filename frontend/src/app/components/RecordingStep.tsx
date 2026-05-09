import { useEffect, useMemo } from 'react'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'

interface RecordingStepProps {
  scoringMode: 'ai' | 'mock' | 'demo'
  onScoringModeChange: (value: 'ai' | 'mock' | 'demo') => void
  onDemo: () => void
  onSubmitRecording: (blob: Blob) => void
}

export function RecordingStep({
  scoringMode,
  onScoringModeChange,
  onDemo,
  onSubmitRecording,
}: RecordingStepProps) {
  const recorder = useAudioRecorder()

  const previewUrl = useMemo(() => {
    if (!recorder.blob) return null
    return URL.createObjectURL(recorder.blob)
  }, [recorder.blob])

  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const canAnalyze =
    recorder.status === 'stopped' && recorder.blob && recorder.blob.size > 0

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-6 max-w-3xl mx-auto">
      <h2 className="mb-6">Record your answer</h2>

      <fieldset className="mb-6 w-full max-w-xl mx-auto border border-border rounded-lg p-4 bg-card">
        <legend className="text-sm font-medium px-1">Scoring mode</legend>
        <p className="text-xs text-muted-foreground mb-3">
          Choose before <strong>Analyze</strong>. Demo runs offline sample feedback; Mock and AI use
          the backend (STT + scoring). AI uses the server LLM when configured (otherwise you still
          get mock).
        </p>
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="scoring-mode"
              className="mt-1"
              checked={scoringMode === 'demo'}
              onChange={() => onScoringModeChange('demo')}
            />
            <span>
              <span className="font-medium">Demo (offline)</span>
              <span className="text-muted-foreground"> — no mic, no API; uses sample data.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="scoring-mode"
              className="mt-1"
              checked={scoringMode === 'ai'}
              onChange={() => onScoringModeChange('ai')}
            />
            <span>
              <span className="font-medium">AI (if available)</span>
              <span className="text-muted-foreground"> — server uses OpenAI when configured.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="scoring-mode"
              className="mt-1"
              checked={scoringMode === 'mock'}
              onChange={() => onScoringModeChange('mock')}
            />
            <span>
              <span className="font-medium">Mock only</span>
              <span className="text-muted-foreground"> — fast, deterministic heuristic on the server.</span>
            </span>
          </label>
        </div>
      </fieldset>

      {recorder.error ? (
        <p className="text-destructive mb-4 max-w-lg text-center" role="alert">
          {recorder.error}
        </p>
      ) : null}

      <div className="w-full bg-card border border-border rounded-lg p-12 mb-8 flex flex-col items-center">
        {(recorder.status === 'idle' || recorder.status === 'error') && !recorder.blob ? (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
              <div className="w-12 h-12 rounded-full bg-primary" />
            </div>
            <button
              type="button"
              onClick={() => void recorder.start()}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Start microphone
            </button>
          </div>
        ) : null}

        {recorder.isRecording ? (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 mx-auto animate-pulse">
              <div className="w-12 h-12 rounded-full bg-destructive" />
            </div>
            <div className="text-destructive mb-6">Recording in progress…</div>
            <button
              type="button"
              onClick={recorder.stop}
              className="bg-destructive text-destructive-foreground px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Stop recording
            </button>
          </div>
        ) : null}

        {recorder.status === 'stopped' && recorder.blob ? (
          <div className="w-full text-center">
            <div className="mb-6">
              {previewUrl ? (
                <audio src={previewUrl} controls className="w-full max-w-md mx-auto" />
              ) : null}
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                type="button"
                onClick={recorder.reset}
                className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                Re-record
              </button>
              <button
                type="button"
                onClick={() => {
                  if (scoringMode === 'demo') {
                    onDemo()
                    return
                  }
                  if (recorder.blob && canAnalyze) onSubmitRecording(recorder.blob)
                }}
                disabled={scoringMode !== 'demo' && !canAnalyze}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Analyze
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <p className="text-muted-foreground mt-1 text-center max-w-md">
        Tip: If the backend is offline, switch to <strong>Demo (offline)</strong>.
      </p>
    </div>
  )
}
