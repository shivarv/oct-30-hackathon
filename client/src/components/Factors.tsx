import { FACTOR_ICONS } from '../lib/mood'
import type { Factor } from '../types'

const EFFECT = {
  lifts: { icon: '▲', label: 'Lifts your mood', className: 'text-good' },
  drags: { icon: '▼', label: 'Drags your mood', className: 'text-bad' },
  neutral: { icon: '●', label: 'Little effect', className: 'text-ink-3' },
}

export function Factors({ factors }: { factors: Factor[] }) {
  if (!factors.length) return <p className="text-sm text-ink-3">Add tags and sleep hours to your entries to see what affects your mood.</p>

  const sorted = [...factors].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  return (
    <ul className="space-y-4">
      {sorted.map((f) => {
        const e = EFFECT[f.effect]
        return (
          <li key={f.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="font-medium">
                <span className="mr-1.5" aria-hidden>{FACTOR_ICONS[f.id]}</span>
                {f.label}
              </p>
              <p className={`text-sm font-medium ${e.className}`}>
                {e.icon} {e.label} ({f.delta > 0 ? '+' : ''}{f.delta})
              </p>
            </div>
            <p className="text-sm text-ink-3">{f.description} · {f.withCount} days</p>
            <div className="mt-2 space-y-1 text-xs text-ink-2">
              <Bar label="With" value={f.withAvg} color="var(--accent)" />
              <Bar label="Without" value={f.withoutAvg} color="var(--muted-mark)" />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-bg">
        <div className="h-2 rounded-full" style={{ width: `${value * 10}%`, background: color }} />
      </div>
      <span className="w-9 text-right tabular-nums text-ink">{value}</span>
    </div>
  )
}
