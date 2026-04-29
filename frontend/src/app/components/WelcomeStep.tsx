export function WelcomeStep() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-6 text-center max-w-2xl mx-auto">
      <p className="text-muted-foreground text-sm mb-2">NLP A3</p>
      <h1 className="mb-4">Mock Interview Coach</h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Practice behavioural interview answers with AI-assisted feedback. You will see a
        STAR-style question, record with your microphone, get a transcript, then scores
        and suggestions. Run the backend for real Whisper + scoring, or use the demo path
        without a mic.
      </p>

      <div className="bg-accent/50 rounded-lg p-6 w-full">
        <h3 className="mb-3">What happens next</h3>
        <ol className="text-left space-y-2 text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-primary min-w-[1.5rem]">1.</span>
            <span>Behavioural interview question</span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary min-w-[1.5rem]">2.</span>
            <span>Prepare your STAR answer (Situation, Task, Action, Result)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary min-w-[1.5rem]">3.</span>
            <span>Record your response (optional camera preview before recording)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary min-w-[1.5rem]">4.</span>
            <span>Transcription, scoring, and structured feedback</span>
          </li>
        </ol>
      </div>

      <p className="text-muted-foreground text-sm mt-8">Use <strong>Continue</strong> in the bar below.</p>
    </div>
  )
}
