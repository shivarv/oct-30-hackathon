import { useState } from 'react'
import { Card } from '../components/Card'
import { EntryDetail } from '../components/EntryDetail'
import { EntryForm } from '../components/EntryForm'
import { formatDate } from '../lib/api'
import { monthGrid, monthKey, monthLabel, shiftMonth, todayIso } from '../lib/dates'
import { activity, moodFace } from '../lib/mood'
import type { Entry } from '../types'
import { MoodFace } from '../components/MoodFace'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function JournalPage({ entries }: { entries: Entry[] }) {
  const today = todayIso()
  const latest = entries.at(-1)?.date ?? today
  const [month, setMonth] = useState(monthKey(today))
  const [selected, setSelected] = useState(latest)
  const [editing, setEditing] = useState(false)

  const byDate = new Map(entries.map((e) => [e.date, e]))
  const inMonth = entries.filter((e) => monthKey(e.date) === month)
  const first = entries[0] ? monthKey(entries[0].date) : month
  const selectedEntry = byDate.get(selected)

  const select = (date: string) => {
    setSelected(date)
    setEditing(false)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMonth(shiftMonth(month, -1))}
            disabled={month <= first}
            aria-label="Previous month"
            className="h-9 w-9 rounded-lg border border-border text-lg disabled:opacity-30"
          >
            ‹
          </button>
          <h2 className="text-lg font-semibold">{monthLabel(month)}</h2>
          <button
            onClick={() => setMonth(shiftMonth(month, 1))}
            disabled={month >= monthKey(today)}
            aria-label="Next month"
            className="h-9 w-9 rounded-lg border border-border text-lg disabled:opacity-30"
          >
            ›
          </button>
        </div>

        <MonthSummary entries={inMonth} />

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-ink-3">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthGrid(month).map((date, i) => {
            if (!date) return <span key={i} />
            const e = byDate.get(date)
            const future = date > today
            const isSel = date === selected
            return (
              <button
                key={date}
                disabled={future}
                onClick={() => select(date)}
                aria-pressed={isSel}
                aria-label={`${formatDate(date)}${e ? `, mood ${e.mood} of 10` : ', no entry'}`}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl border-2 transition disabled:opacity-30 ${
                  isSel ? 'border-accent bg-accent-soft' : e ? 'border-transparent bg-bg hover:border-border' : 'border-dashed border-border'
                }`}
              >
                <span className={`text-[11px] ${date === today ? 'font-bold text-accent' : 'text-ink-3'}`}>{Number(date.slice(8))}</span>
                {e && <MoodFace mood={e.mood} size={26} />}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-center text-xs text-ink-3">Tap a day to read it. Dashed days have no entry yet.</p>
      </Card>

      <Card>
        {editing ? (
          <EntryForm
            key={selected}
            initial={selectedEntry}
            defaultDate={selected}
            onSaved={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        ) : selectedEntry ? (
          <>
            <div className="mb-3 flex justify-end">
              <button onClick={() => setEditing(true)} className="rounded-xl border border-border px-3 py-1.5 text-sm font-medium hover:bg-bg">
                ✏️ Edit
              </button>
            </div>
            <EntryDetail entry={selectedEntry} />
          </>
        ) : (
          <EmptyDay date={selected} onAdd={() => setEditing(true)} />
        )}
      </Card>
    </div>
  )
}

function EmptyDay({ date, onAdd }: { date: string; onAdd: () => void }) {
  return (
    <div className="py-10 text-center">
      <p className="text-4xl">📝</p>
      <p className="mt-2 font-medium">No entry for {formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      <button onClick={onAdd} className="mt-4 rounded-xl bg-accent px-4 py-2 font-medium text-white">
        + Write about this day
      </button>
    </div>
  )
}

function MonthSummary({ entries }: { entries: Entry[] }) {
  if (!entries.length) return <p className="mt-3 text-center text-sm text-ink-3">No entries this month.</p>

  const avg = entries.reduce((s, e) => s + e.mood, 0) / entries.length
  const best = entries.reduce((a, b) => (b.mood > a.mood ? b : a))
  const counts = new Map<string, number>()
  entries.forEach((e) => e.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)))
  const top = [...counts].sort((a, b) => b[1] - a[1])[0]

  const items = [
    { label: 'Entries', value: `${entries.length}` },
    { label: 'Avg mood', value: `${moodFace(avg).emoji} ${avg.toFixed(1)}` },
    { label: 'Best day', value: formatDate(best.date) },
    ...(top ? [{ label: 'Most often', value: `${activity(top[0]).icon} ${activity(top[0]).label}` }] : []),
  ]
  return (
    <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl bg-bg px-3 py-2">
          <dt className="text-xs text-ink-3">{i.label}</dt>
          <dd className="truncate text-sm font-semibold">{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}
