interface QuestionStepProps {
  title: string
  body: string
}

export function QuestionStep({ title, body }: QuestionStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-6 max-w-3xl mx-auto">
      <div className="w-full bg-card border border-border rounded-lg p-8">
        <div className="text-muted-foreground mb-3">Behavioural question</div>
        <h2 className="mb-6">{title}</h2>
        <div className="bg-accent/30 rounded-lg p-6 leading-relaxed text-foreground/90">
          <p className="mb-4">{body}</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Structure your answer using STAR when you record:
          </p>
          <ul className="space-y-2 ml-6">
            <li className="list-disc">
              <strong>Situation:</strong> context
            </li>
            <li className="list-disc">
              <strong>Task:</strong> your responsibility or goal
            </li>
            <li className="list-disc">
              <strong>Action:</strong> what you did
            </li>
            <li className="list-disc">
              <strong>Result:</strong> outcome and learning
            </li>
          </ul>
        </div>
      </div>

      <p className="text-muted-foreground text-sm mt-8">Use <strong>Continue</strong> below when you are ready.</p>
    </div>
  )
}
