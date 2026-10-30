import { activity, signed } from '../lib/mood'
import type { Insights, TagImpact } from '../types'

export function DrainsSwaps({ swaps, drains, boosts }: Pick<Insights, 'swaps' | 'drains' | 'boosts'>) {
  if (!drains.length && !boosts.length) {
    return <p className="text-sm text-ink-3">Tag your activities on a few more days to see what drains and boosts you.</p>
  }

  const swapped = new Set(swaps.map((s) => s.drain.tag))
  const otherDrains = drains.filter((d) => !swapped.has(d.tag))

  return (
    <div className="space-y-5">
      <div className="hidden grid-cols-[1fr_auto_1fr] gap-3 text-sm font-semibold sm:grid">
        <p className="text-bad">🪫 What drains you</p>
        <span />
        <p className="text-good">⚡ Try this instead</p>
      </div>

      <ul className="space-y-3">
        {swaps.slice(0, 6).map(({ drain, instead }) => (
          <li key={drain.tag} className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
            <Chip impact={drain} tone="drain" />
            <span className="text-center text-xl text-ink-3" aria-label="try instead">
              <span className="hidden sm:inline">→</span>
              <span className="sm:hidden">↓</span>
            </span>
            <div className="flex flex-col gap-2">
              {instead.map((b) => (
                <Chip key={b.tag} impact={b} tone="boost" />
              ))}
            </div>
          </li>
        ))}
      </ul>

      {otherDrains.length > 0 && (
        <p className="text-sm text-ink-3">
          Also draining:{' '}
          {otherDrains.map((d) => `${activity(d.tag).icon} ${activity(d.tag).label} (${signed(d.delta)})`).join(' · ')}
        </p>
      )}

      {boosts.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink-2">Your biggest boosts overall</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {boosts.slice(0, 6).map((b) => (
              <span key={b.tag} className="rounded-full bg-good/10 px-3 py-1.5 text-sm">
                {activity(b.tag).icon} {activity(b.tag).label} <span className="font-semibold text-good">{signed(b.delta)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ impact, tone }: { impact: TagImpact; tone: 'drain' | 'boost' }) {
  const a = activity(impact.tag)
  const drain = tone === 'drain'
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${drain ? 'bg-bad/10' : 'bg-good/10'}`}>
      <span className="text-2xl" aria-hidden>{a.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{a.label}</p>
        <p className="text-xs text-ink-3">
          {impact.count} days · mood {impact.withAvg} vs {impact.withoutAvg}
        </p>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-sm font-bold tabular-nums ${drain ? 'bg-bad/15 text-bad' : 'bg-good/15 text-good'}`}>
        {signed(impact.delta)}
      </span>
    </div>
  )
}
