import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { formatDate } from '../lib/api'
import { activity, moodFace } from '../lib/mood'
import type { Insights } from '../types'

type Point = Insights['trend'][number]

const HEIGHT = 260
const PAD = { top: 24, right: 16, bottom: 28, left: 40 }
const RANGES = [
  { id: '14', label: '2 weeks', days: 14 },
  { id: '30', label: '30 days', days: 30 },
  { id: 'all', label: 'All', days: Infinity },
] as const

// Callback ref so the observer follows the element even if it mounts after the first render.
function useWidth() {
  const observer = useRef<ResizeObserver | null>(null)
  const [width, setWidth] = useState(0)
  const ref = useCallback((el: HTMLDivElement | null) => {
    observer.current?.disconnect()
    if (!el) return
    observer.current = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    observer.current.observe(el)
  }, [])
  useEffect(() => () => observer.current?.disconnect(), [])
  return [ref, width] as const
}

/** Monotone cubic (Fritsch–Carlson) path: smooth, and never overshoots the data. */
function smoothPath(pts: [number, number][]) {
  const n = pts.length
  if (n < 2) return ''
  const m = pts.slice(0, -1).map(([x, y], i) => (pts[i + 1][1] - y) / (pts[i + 1][0] - x))
  const t = pts.map((_, i) => (i === 0 ? m[0] : i === n - 1 ? m[n - 2] : m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2))
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = t[i + 1] = 0
      continue
    }
    const a = t[i] / m[i]
    const b = t[i + 1] / m[i]
    const s = a * a + b * b
    if (s > 9) {
      const tau = 3 / Math.sqrt(s)
      t[i] = tau * a * m[i]
      t[i + 1] = tau * b * m[i]
    }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const dx = (x1 - x0) / 3
    d += ` C${x0 + dx},${y0 + t[i] * dx} ${x1 - dx},${y1 - t[i + 1] * dx} ${x1},${y1}`
  }
  return d
}

export function MoodChart({ trend }: { trend: Insights['trend'] }) {
  const [ref, width] = useWidth()
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('30')

  if (trend.length < 2) return <p className="text-sm text-ink-3">Add at least two entries to see your mood trend.</p>

  const days = RANGES.find((r) => r.id === range)!.days
  const shown = trend.slice(-Math.min(days, trend.length))
  const avgMood = Math.round((shown.reduce((s, d) => s + d.mood, 0) / shown.length) * 10) / 10

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-2">
          Average over this period:{' '}
          <span className="font-semibold text-ink">
            {moodFace(avgMood).emoji} {avgMood}/10
          </span>
        </p>
        <div className="flex gap-1 rounded-xl bg-bg p-1" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              aria-pressed={range === r.id}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition ${range === r.id ? 'bg-surface text-ink shadow-sm' : 'text-ink-3 hover:text-ink'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} className="relative" style={{ minHeight: HEIGHT }}>
        {width > 0 && <Plot key={range} points={shown} avgMood={avgMood} width={width} />}
      </div>
    </div>
  )
}

function Plot({ points, avgMood, width }: { points: Point[]; avgMood: number; width: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const gradientId = useId()

  const innerW = width - PAD.left - PAD.right
  const innerH = HEIGHT - PAD.top - PAD.bottom
  const step = innerW / (points.length - 1)
  const x = (i: number) => PAD.left + i * step
  const y = (mood: number) => PAD.top + innerH - ((mood - 1) / 9) * innerH
  const xy = points.map((d, i) => [x(i), y(d.mood)] as [number, number])
  const line = smoothPath(xy)
  const area = `${line} L${x(points.length - 1)},${PAD.top + innerH} L${x(0)},${PAD.top + innerH} Z`

  const labelEvery = Math.ceil(points.length / Math.max(2, Math.floor(innerW / 64)))
  const bestIdx = points.reduce((b, d, i) => (d.mood > points[b].mood ? i : b), 0)
  const worstIdx = points.reduce((w, d, i) => (d.mood < points[w].mood ? i : w), 0)
  const showDots = step >= 10
  const h = hover !== null ? points[hover] : null

  return (
    <>
      <svg width={width} height={HEIGHT} role="img" aria-label={`Daily mood over ${points.length} days`}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {[2, 4, 6, 8, 10].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 10} y={y(v)} dy="0.35em" textAnchor="end" fontSize={16}>
              {moodFace(v).emoji}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradientId})`} className="animate-fade" />
        <line x1={PAD.left} x2={width - PAD.right} y1={y(avgMood)} y2={y(avgMood)} stroke="var(--ink-3)" strokeDasharray="4 4" />
        <text x={width - PAD.right} y={y(avgMood) - 6} textAnchor="end" fontSize={11} fill="var(--ink-2)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
          avg {avgMood}
        </text>
        <path d={line} pathLength={1} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" className="animate-draw" />

        {showDots &&
          xy.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={3} fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.5} className="animate-fade" />
          ))}

        {[
          { i: bestIdx, label: 'Best', dy: -14 },
          { i: worstIdx, label: 'Lowest', dy: 22 },
        ].map((p) => (
          <text key={p.label} x={x(p.i)} y={y(points[p.i].mood) + p.dy} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink-2)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke" className="animate-fade">
            {p.label}
          </text>
        ))}

        {points.map((d, i) =>
          (points.length - 1 - i) % labelEvery === 0 ? (
            <text key={d.date} x={x(i)} y={HEIGHT - 8} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} fontSize={11} fill="var(--ink-3)">
              {formatDate(d.date)}
            </text>
          ) : null,
        )}

        {h && hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--ink-3)" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(h.mood)} r={6} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2.5} />
          </>
        )}
        {points.map((d, i) => (
          <rect
            key={d.date}
            x={x(i) - step / 2}
            y={PAD.top}
            width={step}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs shadow-lg"
          style={{ left: Math.min(Math.max(x(hover) - 90, 0), width - 180), width: 180 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{moodFace(h.mood).emoji}</span>
            <div>
              <p className="font-semibold">{formatDate(h.date, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              <p className="text-ink-2">
                {moodFace(h.mood).label} · {h.mood}/10
              </p>
            </div>
          </div>
          <p className="mt-1.5 text-ink-2 tabular-nums">⚡ {h.energy}/10 · 🌙 {h.sleepHours}h</p>
          {h.tags.length > 0 && <p className="mt-1 text-base leading-snug">{h.tags.map((t) => activity(t).icon).join(' ')}</p>}
        </div>
      )}
    </>
  )
}
