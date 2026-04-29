import { useEffect, useRef, type RefObject } from 'react'

/**
 * Optional camera preview (video only). Stops tracks when `active` becomes false or on unmount.
 */
export function useCameraPreview(
  active: boolean,
  videoRef: RefObject<HTMLVideoElement | null>,
) {
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!active) {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      const el = videoRef.current
      if (el) el.srcObject = null
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const el = videoRef.current
        if (el) {
          el.srcObject = stream
          await el.play().catch(() => {})
        }
      } catch {
        streamRef.current = null
      }
    })()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      const el = videoRef.current
      if (el) el.srcObject = null
    }
  }, [active, videoRef])
}
