import { useState } from 'react'
import { Card } from '../components/Card'
import { EntryDetail } from '../components/EntryDetail'
import { EntryForm } from '../components/EntryForm'
import { formatDate } from '../lib/api'
import { toIso, todayIso } from '../lib/dates'
import { moodFace } from '../lib/mood'
import type { Entry } from '../types'
import { MoodFace } from '../components/MoodFace'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

/** Consecutive days with an entry, ending today (or yesterday if today isn't logged yet). */
function streak(byDate: Map<string, Entry>) {
  const d = new Date()
  if (!byDate.has(toIso(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (byDate.has(toIso(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function TodayPage({ entries }: { entries: Entry[] }) {
  const [editing, setEditing] = useState(false)
  const byDate = new Map(entries.map((e) => [e.date, e]))
  const today = todayIso()
  const todayEntry = byDate.get(today)
  const days = streak(byDate)

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return toIso(d)
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{greeting()} 👋</h2>
          <p className="text-ink-2">{formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        {days > 0 && (
          <p className="rounded-full bg-surface px-3 py-1.5 text-sm font-medium shadow-sm">
            🔥 {days}-day streak
          </p>
        )}
      </div>

      {!todayEntry || editing ? (
        <Card>
          <EntryForm
            key={todayEntry ? 'edit' : 'new'}
            initial={todayEntry}
            onSaved={() => setEditing(false)}
            onCancel={editing ? () => setEditing(false) : undefined}
          />
        </Card>
      ) : (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-good">✓ You checked in today. Nice work!</p>
            <button onClick={() => setEditing(true)} className="rounded-xl border border-border px-3 py-1.5 text-sm font-medium hover:bg-bg">
              ✏️ Edit check-in
            </button>
          </div>
          <EntryDetail entry={todayEntry} />
        </Card>
      )}

      <Card title="Your last 7 days">
        <ol className="grid grid-cols-7 gap-1.5 text-center">
          {week.map((date) => {
            const e = byDate.get(date)
            return (
              <li key={date} className={`rounded-xl py-2 ${date === today ? 'bg-accent-soft' : 'bg-bg'}`}>
                <p className="text-xs text-ink-3">{formatDate(date, { weekday: 'short' })}</p>
                <p className="mt-1 text-2xl" title={e ? `${moodFace(e.mood).label} (${e.mood}/10)` : 'No entry'}>
                  {e ? <span className="inline-block"><MoodFace mood={e.mood} size={32} /></span> : <span className="text-ink-3">·</span>}
                </p>
              </li>
            )
          })}
        </ol>
      </Card>
    </div>
  )
}
