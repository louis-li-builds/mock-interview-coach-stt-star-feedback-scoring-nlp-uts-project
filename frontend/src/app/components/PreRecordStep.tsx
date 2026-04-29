import { useEffect, useRef, useState } from 'react'

export function PreRecordStep() {
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!showCamera) {
      if (videoRef.current) videoRef.current.srcObject = null
      return
    }

    let mediaStream: MediaStream | null = null
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((s) => {
        mediaStream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
        }
      })
      .catch(() => {
        setShowCamera(false)
      })

    return () => {
      mediaStream?.getTracks().forEach((t) => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [showCamera])

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-6 max-w-3xl mx-auto">
      <h2 className="mb-8">Before you record</h2>

      <div className="w-full bg-card border border-border rounded-lg p-8 mb-6">
        <h3 className="mb-4">Recording checklist</h3>
        <ul className="space-y-3">
          <li className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full border-2 border-primary mt-0.5 shrink-0" />
            <span className="text-foreground/90">Find a quiet space with minimal background noise</span>
          </li>
          <li className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full border-2 border-primary mt-0.5 shrink-0" />
            <span className="text-foreground/90">Speak clearly for about 60–90 seconds</span>
          </li>
          <li className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full border-2 border-primary mt-0.5 shrink-0" />
            <span className="text-foreground/90">Recording uses microphone only (smaller upload for STT)</span>
          </li>
          <li className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full border-2 border-primary mt-0.5 shrink-0" />
            <span className="text-foreground/90">Optional: turn on camera preview below (not sent to STT)</span>
          </li>
        </ul>
      </div>

      <div className="w-full bg-card border border-border rounded-lg p-6 mb-8">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showCamera}
            onChange={(e) => setShowCamera(e.target.checked)}
            className="w-4 h-4 rounded accent-primary"
          />
          <span>Show camera preview (optional)</span>
        </label>
        <p className="text-muted-foreground mt-2 ml-7">
          Your camera will only be used for preview. No video will be recorded.
        </p>

        {showCamera ? (
          <div className="mt-6 bg-black rounded-lg overflow-hidden aspect-[4/3] max-w-md">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>
        ) : null}
      </div>

      <p className="text-muted-foreground text-sm text-center">
        When you are ready, tap <strong>Continue</strong> below to open the microphone screen.
      </p>
    </div>
  )
}
