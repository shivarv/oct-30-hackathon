import { moodFace } from '../lib/mood'
import { EMOTIONS, mainEmotion, type Concern, type Sentiment } from '../lib/sense'
import { MoodFace } from './MoodFace'

const CONCERN_COPY: Record<Concern, { title: string; body: string }> = {
  'self-harm': {
    title: "You matter, and you don't have to carry this alone.",
    body: "If you're thinking about ending your life or hurting yourself, please reach out right now. In the US, call or text 988 (Suicide & Crisis Lifeline). Elsewhere, call your local emergency number. Talking to someone you trust can help too.",
  },
  'harm-others': {
    title: 'That sounds like a lot of anger.',
    body: "Writing it down is a good first step. If you feel you might act on it, step away to somewhere safe and reach out: in the US, call or text 988, or call your local emergency number. A friend or counselor can help you work through what's behind it.",
  },
}

export function SentimentIndicator({ sentiment, analysing, hasText }: { sentiment: Sentiment | null; analysing: boolean; hasText: boolean }) {
  if (!hasText) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-3">
        <MoodFace mood={6} size={36} dimmed />
        <p className="text-sm text-ink-3">Start writing and I'll read the mood of your words and fill in the rest for you ✨</p>
      </div>
    )
  }

  const face = sentiment ? moodFace(sentiment.mood) : null
  const position = sentiment ? ((sentiment.mood - 1) / 9) * 100 : 50
  const top = sentiment?.emotions.slice(0, 4) ?? []
  const main = sentiment ? mainEmotion(sentiment) : null

  return (
    <div className="space-y-3">
      {sentiment?.concern && !analysing && (
        <div role="alert" className="rounded-2xl border border-accent/40 bg-accent-soft p-4">
          <p className="font-semibold">💙 {CONCERN_COPY[sentiment.concern].title}</p>
          <p className="mt-1 text-sm text-ink-2">{CONCERN_COPY[sentiment.concern].body}</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-bg p-3" aria-live="polite">
        <div className="flex items-center gap-3">
          <div className={analysing ? 'animate-pulse' : ''}>
            {/* Re-key on level so the face pops each time the mood changes. */}
            <MoodFace key={face?.value ?? 'none'} mood={sentiment?.mood ?? 6} size={60} dimmed={!sentiment} pop={!!sentiment} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {analysing ? (
                <span className="text-ink-3">Analysing your words…</span>
              ) : sentiment ? (
                <>
                  Sounds like you're feeling <span className="text-accent">{face!.label.toLowerCase()}</span>
                  {main && (
                    <span className="font-normal text-ink-2">
                      {' '}
                      · {sentiment.severity === 'critical' ? 'intense' : sentiment.severity === 'strong' ? 'strong' : 'mostly'}{' '}
                      {EMOTIONS[main].label.toLowerCase()}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-ink-3">No clear feelings yet. Try describing how the day felt.</span>
              )}
            </p>
            {sentiment && !analysing && (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-2 tabular-nums">
                {sentiment.severity === 'critical' && (
                  <span className="rounded-full bg-bad px-2 py-0.5 text-xs font-bold tracking-wide text-white uppercase">⚠️ Critical</span>
                )}
                <span>
                  Sentiment: {sentiment.label} ({sentiment.score > 0 ? '+' : ''}
                  {sentiment.score}) · {sentiment.words.length} signal{sentiment.words.length === 1 ? '' : 's'}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="relative mt-5 h-2 rounded-full bg-border">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--sunny)] transition-all duration-500"
            style={{ width: `${position}%`, opacity: sentiment ? 1 : 0 }}
          />
          <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500" style={{ left: `${position}%` }}>
            <MoodFace mood={sentiment?.mood ?? 6} size={28} dimmed={!sentiment} />
          </span>
        </div>
        <div className="mt-2.5 flex justify-between text-[11px] text-ink-3">
          <span>Negative</span>
          <span>Neutral</span>
          <span>Positive</span>
        </div>

        {top.length > 0 && !analysing && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-ink-2">Emotions detected</p>
            <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
              {top.map(({ emotion, strength }) => (
                <li key={emotion} className="flex items-center gap-2 rounded-xl bg-surface px-2.5 py-1.5">
                  <span className="text-lg" aria-hidden>{EMOTIONS[emotion].emoji}</span>
                  <span className="w-24 shrink-0 text-sm font-medium">{EMOTIONS[emotion].label}</span>
                  <span className="h-1.5 flex-1 rounded-full bg-border">
                    <span className="block h-1.5 rounded-full bg-[var(--sunny)]" style={{ width: `${Math.max(10, strength * 100)}%` }} />
                  </span>
                  <span className="w-9 text-right text-xs text-ink-3 tabular-nums">{Math.round(strength * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sentiment && sentiment.words.length > 0 && !analysing && (
          <details className="mt-3 group">
            <summary className="cursor-pointer text-xs font-semibold text-ink-2 select-none">
              Why? <span className="font-normal text-ink-3">({sentiment.words.map((w) => w.word).join(', ')})</span>
            </summary>
            <ul className="mt-2 space-y-1">
              {sentiment.words.map((w, i) => (
                <li key={`${w.word}-${i}`} className="flex flex-wrap items-center gap-x-2 text-xs">
                  <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-medium text-ink-2">
                    {w.weight > 0 ? '▲' : '▼'} {w.word}
                  </span>
                  <span className="text-ink-3">
                    {EMOTIONS[w.emotion].emoji} {EMOTIONS[w.emotion].label} · {w.weight > 0 ? '+' : ''}
                    {w.weight}
                    {w.note && ` · ${w.note}`}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  )
}
