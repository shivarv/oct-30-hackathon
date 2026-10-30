import { useState } from 'react'
import { SUGGESTION_ICONS } from '../lib/mood'
import type { Suggestion } from '../types'

const STORAGE_KEY = 'journal-insights:tried'

// Checked actions are a per-viewer convenience, so browser storage is fine; it may be unavailable.
function loadTried(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveTried(tried: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tried))
  } catch {
    /* ignore */
  }
}

export function Suggestions({ suggestions }: { suggestions: Suggestion[] }) {
  const [tried, setTried] = useState(loadTried)
  if (!suggestions.length) return <p className="text-sm text-ink-3">Keep journaling. Suggestions appear once patterns show up.</p>

  const max = Math.max(...suggestions.map((s) => s.impact))
  const toggle = (key: string) => {
    const next = tried.includes(key) ? tried.filter((k) => k !== key) : [...tried, key]
    setTried(next)
    saveTried(next)
  }

  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-bg px-3 py-2 text-sm text-ink-2">
        <span className="font-semibold text-ink">Impact</span> = how many points higher your mood was (out of 10) on days you
        did this. Tick the steps you're trying this week.
      </p>
      <ul className="grid gap-3 md:grid-cols-2">
        {suggestions.map((s, i) => {
          const keys = s.actions.map((_, j) => `${s.id}:${j}`)
          const done = keys.filter((k) => tried.includes(k)).length
          return (
            <li key={s.id} className={`relative rounded-2xl border p-4 ${i === 0 ? 'border-accent bg-accent-soft/40' : 'border-border bg-surface'}`}>
              {i === 0 && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">⭐ Start here</span>
              )}
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bg text-2xl" aria-hidden>
                  {SUGGESTION_ICONS[s.id] ?? '✨'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{s.title}</p>
                  <ImpactMeter impact={s.impact} max={max} />
                </div>
              </div>
              <p className="mt-2 text-sm text-ink-3">{s.why}</p>
              <ul className="mt-3 space-y-1.5">
                {s.actions.map((a, j) => {
                  const key = keys[j]
                  const checked = tried.includes(key)
                  return (
                    <li key={key}>
                      <label className="flex cursor-pointer items-start gap-2 text-sm">
                        <input type="checkbox" checked={checked} onChange={() => toggle(key)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
                        <span className={checked ? 'text-ink-3 line-through' : 'text-ink-2'}>{a}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
              {done === keys.length && <p className="mt-2 text-sm font-medium text-good">🎉 You're trying all of these. Nice!</p>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ImpactMeter({ impact, max }: { impact: number; max: number }) {
  const filled = Math.max(1, Math.round((impact / max) * 5))
  const strength = filled >= 4 ? 'Big impact' : filled >= 2 ? 'Medium impact' : 'Small impact'
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-good/15 px-2 py-0.5 text-sm font-semibold text-good tabular-nums">+{impact} mood</span>
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, k) => (
          <span key={k} className={`h-2 w-4 rounded-full ${k < filled ? 'bg-good' : 'bg-border'}`} />
        ))}
      </span>
      <span className="text-xs text-ink-3">{strength}</span>
    </div>
  )
}
