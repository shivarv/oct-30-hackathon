import { FACTOR_ICONS } from '../lib/mood'
import { formatDate } from '../lib/api'
import type { Feedback, FeedbackItem } from '../types'
import { MoodFace } from './MoodFace'

export function FeedbackView({ feedback, compact = false }: { feedback: Feedback; compact?: boolean }) {
  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center gap-3">
          <MoodFace mood={feedback.mood} size={56} />
          <div>
            <p className="text-xs font-medium tracking-wide text-accent uppercase">
              Feedback for {formatDate(feedback.date, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-lg font-semibold">{feedback.headline}</p>
          </div>
        </div>
      )}
      {compact && <p className="font-medium">{feedback.headline}</p>}

      {feedback.wentWell.length > 0 && (
        <Group title="🌟 What went well" items={feedback.wentWell} tone="good" compact={compact} />
      )}
      {feedback.tryInstead.length > 0 && (
        <Group title="💡 Next time, try this instead" items={feedback.tryInstead} tone="try" compact={compact} />
      )}
    </div>
  )
}

function Group({ title, items, tone, compact }: { title: string; items: FeedbackItem[]; tone: 'good' | 'try'; compact: boolean }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-2">{title}</h3>
      <ul className={`mt-2 grid gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
        {items.map((i) => (
          <li key={i.factorId} className="flex gap-3 rounded-xl bg-bg p-3">
            <span className="text-2xl" aria-hidden>{FACTOR_ICONS[i.factorId] ?? '✨'}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="font-medium">{i.title}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    tone === 'good' ? 'bg-good/15 text-good' : 'bg-accent-soft text-accent'
                  }`}
                >
                  {tone === 'good' ? `helped +${i.boost}` : `+${i.boost} mood`}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-ink-3">{i.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
