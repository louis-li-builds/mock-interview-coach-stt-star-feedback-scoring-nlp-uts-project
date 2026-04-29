import { useEffect, useMemo } from 'react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'

type Props = {
  onDemo: () => void
  onSubmitRecording: (blob: Blob) => void
}

export function RecordingPanel({ onDemo, onSubmitRecording }: Props) {
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
    <section className="panel" aria-labelledby="rec-title">
      <h1 id="rec-title">Recording</h1>
      <p className="panel__lead">
        Start the microphone, answer in roughly 60–90 seconds, then stop. You can
        preview or re-record before analysis.
      </p>

      {recorder.error && (
        <p className="panel__error" role="alert">
          {recorder.error}
        </p>
      )}

      <div className="panel__recControls">
        {recorder.status === 'idle' || recorder.status === 'error' ? (
          <button type="button" className="btn btn--primary" onClick={() => void recorder.start()}>
            Start microphone
          </button>
        ) : null}

        {recorder.isRecording ? (
          <>
            <div className="panel__recBox" aria-live="polite">
              <span className="panel__recDot panel__recDot--pulse" />
              <span>Recording…</span>
            </div>
            <button type="button" className="btn btn--danger" onClick={recorder.stop}>
              Stop
            </button>
          </>
        ) : null}

        {recorder.status === 'stopped' ? (
          <div className="panel__afterRecord">
            {previewUrl ? (
              <div className="panel__preview">
                <span className="panel__muted">Preview</span>
                <audio controls src={previewUrl} className="panel__audio" />
              </div>
            ) : null}
            <button type="button" className="btn" onClick={recorder.reset}>
              Re-record
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canAnalyze}
              onClick={() => {
                if (recorder.blob) onSubmitRecording(recorder.blob)
              }}
            >
              Analyze recording
            </button>
          </div>
        ) : null}
      </div>

      <p className="panel__divider">or</p>
      <button type="button" className="btn btn--ghost" onClick={onDemo}>
        Run demo pipeline (no microphone)
      </button>
      <p className="panel__muted panel__fineprint">
        Demo uses canned transcript and scores. Use “Analyze recording” with the
        backend running for real STT + LLM.
      </p>
    </section>
  )
}
