import type { Insights, Note } from '../types'

export function Persona({ persona }: { persona: Insights['persona'] }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-accent uppercase">Your persona</p>
      <h2 className="mt-1 text-2xl font-semibold">{persona.title}</h2>
      <p className="mt-2 text-ink-2">{persona.summary}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <NoteList title="Strengths" icon="✓" iconClass="text-good" notes={persona.strengths} />
        <NoteList title="Challenges" icon="!" iconClass="text-bad" notes={persona.challenges} />
      </div>
    </div>
  )
}

function NoteList({ title, icon, iconClass, notes }: { title: string; icon: string; iconClass: string; notes: Note[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-2">{title}</h3>
      {notes.length ? (
        <ul className="mt-2 space-y-3">
          {notes.map((n) => (
            <li key={n.title} className="flex gap-2">
              <span className={`font-bold ${iconClass}`} aria-hidden>{icon}</span>
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-ink-2">{n.evidence}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink-3">Not enough entries yet.</p>
      )}
    </div>
  )
}
