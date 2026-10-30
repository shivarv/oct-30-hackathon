import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { ACTIVITY_GROUPS, ENERGY, level, MOODS, moodFace } from '../lib/mood'
import { analyseSentiment, guessEnergy, guessSleep, guessTags } from '../lib/sense'
import { todayIso as today } from '../lib/dates'
import type { Entry, Feedback } from '../types'
import { MoodFace } from './MoodFace'
import { SentimentIndicator } from './SentimentIndicator'

const KNOWN_TAGS = new Set(ACTIVITY_GROUPS.flatMap((g) => g.items.map((i) => i.tag)))
const ANALYSE_DELAY_MS = 350

interface Props {
  initial?: Entry
  /** Date for a new entry; defaults to today. */
  defaultDate?: string
  onSaved: (f: Feedback) => void
  onCancel?: () => void
}

// Values typed into the journal pre-fill the form; anything the user taps themselves wins.
export function EntryForm({ initial, defaultDate, onSaved, onCancel }: Props) {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? today())
  const [entry, setEntry] = useState(initial?.entry ?? '')
  const [analysed, setAnalysed] = useState(entry)
  const [mood, setMood] = useState<number | null>(initial?.mood ?? null)
  const [energy, setEnergy] = useState<number | null>(initial?.energy ?? null)
  const [sleepHours, setSleepHours] = useState<number | null>(initial?.sleepHours ?? null)
  const [manualTags, setManualTags] = useState<string[]>(initial?.tags.filter((t) => KNOWN_TAGS.has(t)) ?? [])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [customTags, setCustomTags] = useState(initial?.tags.filter((t) => !KNOWN_TAGS.has(t)).join(', ') ?? '')

  // Debounce analysis so the indicator settles once the user pauses typing.
  useEffect(() => {
    const id = setTimeout(() => setAnalysed(entry), ANALYSE_DELAY_MS)
    return () => clearTimeout(id)
  }, [entry])

  const analysing = entry !== analysed
  const sentiment = analyseSentiment(analysed)
  const detected = guessTags(analysed).filter((t) => !dismissed.includes(t))
  const energyGuess = guessEnergy(analysed)
  const sleepGuess = guessSleep(analysed)

  const effectiveMood = mood ?? sentiment?.mood ?? null
  const effectiveEnergy = energy ?? energyGuess ?? 6
  const effectiveSleep = sleepHours ?? sleepGuess ?? 7
  const tags = [...new Set([...manualTags, ...detected])]
  const isAuto = (tag: string) => detected.includes(tag) && !manualTags.includes(tag)

  const save = useMutation({
    mutationFn: (body: Entry) =>
      api<{ entry: Entry; feedback: Feedback }>('/entries', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: ({ feedback }) => {
      queryClient.invalidateQueries()
      onSaved(feedback)
    },
  })

  const toggle = (tag: string) => {
    if (tags.includes(tag)) {
      setManualTags((t) => t.filter((x) => x !== tag))
      setDismissed((d) => [...d, tag])
    } else {
      setManualTags((t) => [...t, tag])
      setDismissed((d) => d.filter((x) => x !== tag))
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (effectiveMood === null) return
    const extra = customTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
    save.mutate({
      date,
      mood: effectiveMood,
      energy: effectiveEnergy,
      sleepHours: effectiveSleep,
      tags: [...new Set([...tags, ...extra])],
      entry: entry.trim() || 'No notes.',
    })
  }

  // Older entries use the full 1–10 scale, so highlight the nearest face.
  const picked = effectiveMood === null ? null : moodFace(effectiveMood)
  const moodIsAuto = mood === null && sentiment !== null
  const suggestedFace = sentiment ? moodFace(sentiment.mood) : null
  const pickedEnergy = level(ENERGY, effectiveEnergy)

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{date === today() ? 'How was your day?' : 'How was that day?'}</h2>
        <input
          type="date"
          aria-label="Date"
          required
          value={date}
          max={today()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm"
        />
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="sr-only">Journal entry</span>
          <textarea
            rows={4}
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Write freely… e.g. “Slept 6 hours, went to the gym and grabbed coffee with a friend. Felt really productive and happy.”"
            className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-base leading-relaxed focus:border-accent focus:outline-none"
          />
        </label>
        <SentimentIndicator sentiment={sentiment} analysing={analysing} hasText={entry.trim().length > 0} />
      </div>

      <fieldset>
        <legend className="flex w-full flex-wrap items-center justify-between gap-2 text-sm font-semibold">
          <span>Your mood</span>
          {moodIsAuto && <AutoBadge />}
        </legend>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {MOODS.map((m) => {
            const active = picked?.value === m.value
            return (
              <button
                key={m.value}
                type="button"
                aria-pressed={active}
                aria-label={m.label}
                onClick={() => setMood(m.value)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 transition ${
                  active ? 'scale-105 border-accent bg-accent-soft' : 'border-transparent bg-bg hover:-translate-y-0.5'
                } ${active && moodIsAuto ? 'border-dashed' : ''}`}
              >
                <MoodFace key={active ? 'on' : 'off'} mood={m.value} size={52} dimmed={picked !== null && !active} pop={active} />
                <span className={`text-xs font-medium sm:text-sm ${active ? 'text-accent' : 'text-ink-2'}`}>{m.label}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 min-h-5 text-center text-sm text-ink-2">
          {mood !== null && suggestedFace && suggestedFace.value !== picked?.value ? (
            <>
              Your words sound more <b>{suggestedFace.label.toLowerCase()}</b>.{' '}
              <button type="button" onClick={() => setMood(null)} className="font-medium text-accent underline">
                Use that
              </button>
            </>
          ) : picked ? (
            `Feeling ${picked.label.toLowerCase()}. Thanks for checking in.`
          ) : (
            'Write above or tap a face to pick your mood.'
          )}
        </p>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <fieldset>
          <legend className="flex w-full items-center justify-between text-sm font-semibold">
            <span>Energy</span>
            {energy === null && energyGuess !== null && <AutoBadge />}
          </legend>
          <div className="mt-2 flex gap-1.5">
            {ENERGY.map((l) => (
              <button
                key={l.value}
                type="button"
                title={l.label}
                aria-label={l.label}
                aria-pressed={pickedEnergy.value === l.value}
                onClick={() => setEnergy(l.value)}
                className={`flex-1 rounded-xl border-2 py-2 text-2xl transition ${
                  pickedEnergy.value === l.value ? 'border-accent bg-accent-soft' : 'border-transparent bg-bg'
                }`}
              >
                {l.emoji}
              </button>
            ))}
          </div>
          <p className="mt-1 text-center text-xs text-ink-3">{pickedEnergy.label}</p>
        </fieldset>

        <fieldset>
          <legend className="flex w-full items-center justify-between text-sm font-semibold">
            <span>Sleep last night</span>
            {sleepHours === null && sleepGuess !== null && <AutoBadge />}
          </legend>
          <div className="mt-2 flex items-center justify-between rounded-xl bg-bg p-1.5">
            <Stepper label="Less sleep" onClick={() => setSleepHours(Math.max(0, effectiveSleep - 0.5))}>−</Stepper>
            <span className="text-lg font-semibold tabular-nums">🌙 {effectiveSleep}h</span>
            <Stepper label="More sleep" onClick={() => setSleepHours(Math.min(14, effectiveSleep + 0.5))}>+</Stepper>
          </div>
          <p className="mt-1 text-center text-xs text-ink-3">{effectiveSleep >= 7 ? 'Well rested' : 'A bit short'}</p>
        </fieldset>
      </div>

      <div>
        <h3 className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
          <span>What did you do?</span>
          {detected.some(isAuto) && <span className="text-xs font-normal text-ink-3">✨ = picked up from your writing, tap to remove</span>}
        </h3>
        <div className="mt-2 space-y-3">
          {ACTIVITY_GROUPS.map((g) => (
            <div key={g.name}>
              <p className="mb-1.5 text-xs text-ink-3">{g.name}</p>
              <div className="flex flex-wrap gap-2">
                {g.items.map((a) => {
                  const on = tags.includes(a.tag)
                  const auto = on && isAuto(a.tag)
                  return (
                    <button
                      key={a.tag}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(a.tag)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        on ? 'border-accent bg-accent-soft font-medium text-accent' : 'border-border bg-surface hover:bg-bg'
                      } ${auto ? 'border-dashed' : ''}`}
                    >
                      <span className="mr-1">{a.icon}</span>
                      {a.label}
                      {auto && <span className="ml-1" aria-label="suggested">✨</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <input
          value={customTags}
          onChange={(e) => setCustomTags(e.target.value)}
          placeholder="Something else? Add tags, comma separated"
          className="mt-3 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
        />
      </div>

      {save.error && <p className="text-sm text-bad">{save.error.message}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={effectiveMood === null || save.isPending}
          className="rounded-xl bg-accent px-5 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save & get feedback ✨'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-xl border border-border px-4 py-2.5 font-medium">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

function AutoBadge() {
  return <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">✨ from your writing</span>
}

function Stepper({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="h-9 w-9 rounded-lg bg-surface text-lg font-semibold shadow-sm">
      {children}
    </button>
  )
}
