import type { SessionResult } from '../../interviewFlow'

interface FeedbackStepProps {
  result: SessionResult
  onRestart: () => void
}

function scoreColor(score: number, max: number): string {
  const pct = max > 0 ? (score / max) * 100 : 0
  if (pct >= 72) return 'text-green-600 dark:text-green-500'
  if (pct >= 48) return 'text-amber-600 dark:text-amber-500'
  return 'text-destructive'
}

function overallColor(score: number): string {
  if (score >= 75) return 'text-green-600 dark:text-green-500'
  if (score >= 55) return 'text-amber-600 dark:text-amber-500'
  return 'text-destructive'
}

export function FeedbackStep({ result, onRestart }: FeedbackStepProps) {
  const sourceLabel =
    result.scoreSource === 'llm'
      ? 'LLM'
      : result.scoreSource === 'mock'
        ? 'Mock / offline'
        : '—'

  return (
    <div className="flex flex-col items-center px-6 py-8 max-w-4xl mx-auto">
      <h2 className="mb-8">Your feedback</h2>

      <div className="w-full bg-card border border-border rounded-lg p-8 mb-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="text-muted-foreground mb-2">Overall score</div>
            <div className={overallColor(result.overallScore)}>
              <span className="text-5xl font-medium">{result.overallScore}</span>
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="bg-accent px-4 py-2 rounded-lg">
            <span className="text-muted-foreground mr-2">Scoring source:</span>
            <span className="text-foreground">{sourceLabel}</span>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="mb-4">Score breakdown</h3>
          <div className="space-y-4">
            {result.breakdown.map((row) => (
              <div key={row.label} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <h4>{row.label}</h4>
                  <span className={scoreColor(row.score, row.max)}>
                    {Math.round(row.score)}/{row.max}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full bg-accent/50 border border-border rounded-lg p-6 mb-6">
        <h3 className="mb-3">Transcript</h3>
        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{result.transcript}</p>
      </div>

      <details className="w-full bg-card border border-border rounded-lg p-6 mb-8 open">
        <summary className="cursor-pointer font-medium text-foreground mb-2">
          Suggestions ({result.suggestions.length})
        </summary>
        <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
          {result.suggestions.map((s) => (
            <li key={s} className="leading-relaxed">
              {s}
            </li>
          ))}
        </ol>
      </details>

      <button
        type="button"
        onClick={onRestart}
        className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
      >
        Start over
      </button>
    </div>
  )
}
