import { formatDate } from '../lib/api'
import { ENERGY, level, MOODS, moodFace } from '../lib/mood'
import type { Insights } from '../types'

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

export function MoodHero({ summary, trend }: { summary: Insights['summary']; trend: Insights['trend'] }) {
  const counts = MOODS.map((m) => ({ ...m, count: trend.filter((d) => moodFace(d.mood).value === m.value).length }))
  const total = trend.length
  const top = counts.reduce((a, b) => (b.count > a.count ? b : a))
  const face = moodFace(summary.avgMood)

  // Compare the latest two weeks with the two weeks before.
  const recent = trend.slice(-14).map((d) => d.mood)
  const before = trend.slice(-28, -14).map((d) => d.mood)
  const change = before.length >= 7 ? Math.round((avg(recent) - avg(before)) * 10) / 10 : null

  return (
    <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-accent-soft text-6xl">{face.emoji}</div>
          <div>
            <p className="text-sm text-ink-3">Your mood lately</p>
            <p className="text-2xl font-semibold">Mostly {top.label.toLowerCase()}</p>
            <p className="text-ink-2">
              Average <span className="font-semibold text-ink tabular-nums">{summary.avgMood}/10</span>
            </p>
            {change !== null && (
              <p className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-medium ${change >= 0 ? 'bg-good/15 text-good' : 'bg-bad/15 text-bad'}`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)} vs the 2 weeks before
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink-2">Your mood mix</p>
          <div className="mt-2 flex h-4 gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Share of days at each mood level">
            {counts
              .filter((c) => c.count)
              .map((c) => (
                <div key={c.value} style={{ flexGrow: c.count, background: c.color }} title={`${c.label}: ${c.count} days`} />
              ))}
          </div>
          <ul className="mt-3 grid grid-cols-5 gap-1 text-center">
            {counts.map((c) => (
              <li key={c.value} className={`rounded-xl py-1.5 ${c.value === top.value ? 'bg-bg' : ''}`}>
                <p className="text-2xl">{c.emoji}</p>
                <p className="text-xs text-ink-2">{c.label}</p>
                <p className="text-sm font-semibold tabular-nums">{c.count}</p>
                <p className="text-[11px] text-ink-3 tabular-nums">{total ? Math.round((c.count / total) * 100) : 0}%</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-4">
        <Stat icon="📅" label="Days journaled" value={`${summary.count}`} />
        <Stat icon="🌙" label="Avg sleep" value={`${summary.avgSleep}h`} />
        <Stat icon={level(ENERGY, summary.avgEnergy).emoji} label="Avg energy" value={`${summary.avgEnergy}/10`} />
        <Stat icon="🏆" label="Best day" value={summary.best ? formatDate(summary.best.date) : '—'} />
      </dl>
    </section>
  )
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-bg px-3 py-2">
      <span className="text-xl" aria-hidden>{icon}</span>
      <div>
        <dt className="text-xs text-ink-3">{label}</dt>
        <dd className="font-semibold tabular-nums">{value}</dd>
      </div>
    </div>
  )
}
