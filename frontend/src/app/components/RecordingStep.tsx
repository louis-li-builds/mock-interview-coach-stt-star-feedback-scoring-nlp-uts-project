import { useEffect, useMemo } from 'react'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'

interface RecordingStepProps {
  onDemo: () => void
  onSubmitRecording: (blob: Blob) => void
}

export function RecordingStep({ onDemo, onSubmitRecording }: RecordingStepProps) {
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
      <h2 className="mb-8">Record your answer</h2>

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
                disabled={!canAnalyze}
                onClick={() => {
                  if (recorder.blob) onSubmitRecording(recorder.blob)
                }}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Analyze recording
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onDemo}
        className="border-2 border-dashed border-border bg-transparent text-foreground px-6 py-3 rounded-lg hover:bg-accent transition-colors"
      >
        Run demo pipeline (no microphone)
      </button>
      <p className="text-muted-foreground mt-3 text-center max-w-md">
        Use this to test the feedback UI with sample data, or when the API is offline.
      </p>
    </div>
  )
}
