import { useQuery } from '@tanstack/react-query'
import { api, formatDate } from '../lib/api'
import { activity, moodFace } from '../lib/mood'
import type { Entry, Feedback } from '../types'
import { FeedbackView } from './FeedbackView'
import { MoodFace } from './MoodFace'

export function EntryDetail({ entry }: { entry: Entry }) {
  const face = moodFace(entry.mood)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span title={`${face.label} (${entry.mood}/10)`}><MoodFace mood={entry.mood} size={56} /></span>
        <div>
          <p className="text-lg font-semibold">{formatDate(entry.date, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <p className="text-sm text-ink-2 tabular-nums">
            {face.label} · Mood {entry.mood}/10 · ⚡ {entry.energy}/10 · 🌙 {entry.sleepHours}h
          </p>
        </div>
      </div>
      <p className="text-ink-2">{entry.entry}</p>
      {entry.tags.length > 0 && <TagChips tags={entry.tags} />}
      <EntryFeedback date={entry.date} />
    </div>
  )
}

export function TagChips({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => {
        const a = activity(t)
        return (
          <span key={t} className="rounded-full bg-bg px-2.5 py-1 text-sm text-ink-2">
            {a.icon} {a.label}
          </span>
        )
      })}
    </div>
  )
}

function EntryFeedback({ date }: { date: string }) {
  const q = useQuery({ queryKey: ['feedback', date], queryFn: () => api<Feedback>(`/entries/${date}/feedback`) })
  return (
    <div className="rounded-xl border border-border p-4">
      {q.isPending && <p className="text-sm text-ink-3">Looking at your patterns…</p>}
      {q.error && <p className="text-sm text-bad">{q.error.message}</p>}
      {q.data && <FeedbackView feedback={q.data} compact />}
    </div>
  )
}
