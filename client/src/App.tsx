import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, formatDate } from './lib/api'
import type { Entry, Insights } from './types'
import { TodayPage } from './pages/TodayPage'
import { JournalPage } from './pages/JournalPage'
import { InsightsPage } from './pages/InsightsPage'

const TABS = [
  { id: 'today', icon: '📝', label: 'Today' },
  { id: 'journal', icon: '📅', label: 'Journal' },
  { id: 'insights', icon: '📊', label: 'Insights' },
] as const

type TabId = (typeof TABS)[number]['id']

const tabFromHash = (): TabId => TABS.find((t) => `#${t.id}` === window.location.hash)?.id ?? 'today'

export default function App() {
  const insights = useQuery({ queryKey: ['insights'], queryFn: () => api<Insights>('/insights') })
  const entries = useQuery({ queryKey: ['entries'], queryFn: () => api<Entry[]>('/entries') })
  const [tab, setTab] = useState<TabId>(tabFromHash)

  // Keep the tab in the URL so refresh and back/forward work.
  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (insights.isPending || entries.isPending) return <p className="p-8 text-ink-3">Loading your journal…</p>
  if (insights.error || entries.error) {
    return (
      <p className="p-8 text-bad">
        Couldn't reach the server ({(insights.error ?? entries.error)?.message}). Is it running on port 3000?
      </p>
    )
  }

  const { summary } = insights.data

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Journal Insights</h1>
          <p className="text-ink-2">
            {summary.count
              ? `${summary.count} entries · ${formatDate(summary.from!)} – ${formatDate(summary.to!)}`
              : 'Start journaling to see insights'}
          </p>
        </div>
        <nav aria-label="Sections" className="flex w-full gap-1 rounded-2xl border border-border bg-surface p-1 sm:w-auto">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`flex-1 rounded-xl px-4 py-2 text-center text-sm font-medium transition sm:flex-none ${
                tab === t.id ? 'bg-accent text-white shadow-sm' : 'text-ink-2 hover:bg-bg'
              }`}
            >
              <span className="mr-1.5" aria-hidden>{t.icon}</span>
              {t.label}
            </a>
          ))}
        </nav>
      </header>

      {insights.data.caution && (
        <div role="alert" className="rounded-2xl bg-warn-bg p-4 text-sm">{insights.data.caution}</div>
      )}

      {tab === 'today' && <TodayPage entries={entries.data} />}
      {tab === 'journal' && <JournalPage entries={entries.data} />}
      {tab === 'insights' && <InsightsPage insights={insights.data} />}

      <p className="pb-4 text-center text-xs text-ink-3">
        Patterns are based on your own entries and get more reliable the more you write. This isn't medical advice.
      </p>
    </main>
  )
}
