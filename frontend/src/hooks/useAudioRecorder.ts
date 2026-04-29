import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderStatus = 'idle' | 'recording' | 'stopped' | 'error'

function pickMimeType(): string | undefined {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ]
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
      return t
    }
  }
  return undefined
}

function humanizeMicError(err: unknown): string {
  if (!(err instanceof Error)) return 'Could not access the microphone.'
  const name = (err as DOMException).name
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Microphone permission was denied. Allow access in the browser bar or site settings, then try again.'
  }
  if (name === 'NotFoundError') {
    return 'No microphone was found. Connect a mic and try again.'
  }
  if (name === 'NotReadableError') {
    return 'The microphone is in use by another app. Close it and try again.'
  }
  return err.message || 'Could not access the microphone.'
}

export function useAudioRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const reset = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop()
    }
    recorderRef.current = null
    releaseStream()
    chunksRef.current = []
    setBlob(null)
    setError(null)
    setStatus('idle')
  }, [releaseStream])

  const start = useCallback(async () => {
    setError(null)
    setBlob(null)
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })
      streamRef.current = stream
      const mimeType = pickMimeType()
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      )
      recorderRef.current = recorder
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data)
      }
      recorder.onstop = () => {
        const type =
          mimeType || recorder.mimeType || 'audio/webm'
        setBlob(new Blob(chunksRef.current, { type }))
        setStatus('stopped')
        releaseStream()
        recorderRef.current = null
      }
      recorder.start()
      setStatus('recording')
    } catch (e) {
      releaseStream()
      recorderRef.current = null
      setStatus('error')
      setError(humanizeMicError(e))
    }
  }, [releaseStream])

  const stop = useCallback(() => {
    const rec = recorderRef.current
    if (rec && rec.state === 'recording') {
      rec.stop()
    }
  }, [])

  useEffect(() => () => reset(), [reset])

  return {
    status,
    blob,
    error,
    isRecording: status === 'recording',
    start,
    stop,
    reset,
  }
}
