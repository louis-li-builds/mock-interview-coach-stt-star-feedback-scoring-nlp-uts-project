/** Highlights digits / percentages as weak evidence of “measurable” content (UI only). */
const NUMERIC_CHUNK = /^(\d+(?:\.\d+)?%?)$/

export function HighlightedTranscript({ text }: { text: string }) {
  const parts = text.split(/(\d+(?:\.\d+)?%?)/g)

  return (
    <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (NUMERIC_CHUNK.test(part)) {
          return (
            <mark
              key={i}
              className="bg-amber-200/70 text-foreground dark:bg-amber-900/40 rounded px-0.5"
              title="Numeric / measurable fragment"
            >
              {part}
            </mark>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}
