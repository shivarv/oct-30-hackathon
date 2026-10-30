// Mirrors server/src/db/journal.ts and server/src/services/insights.ts
export interface Entry {
  date: string
  mood: number
  energy: number
  sleepHours: number
  tags: string[]
  entry: string
}

export interface Factor {
  id: string
  label: string
  description: string
  withCount: number
  withAvg: number
  withoutAvg: number
  delta: number
  effect: 'lifts' | 'drags' | 'neutral'
}

export interface Note {
  title: string
  evidence: string
}

export interface Suggestion {
  id: string
  title: string
  why: string
  actions: string[]
  impact: number
}

export interface FeedbackItem {
  factorId: string
  title: string
  detail: string
  boost: number
}

export interface Feedback {
  date: string
  mood: number
  headline: string
  wentWell: FeedbackItem[]
  tryInstead: FeedbackItem[]
}

export interface Insights {
  summary: {
    count: number
    from: string | null
    to: string | null
    avgMood: number
    avgSleep: number
    avgEnergy: number
    best: Entry | null
    worst: Entry | null
  }
  trend: { date: string; mood: number; energy: number; sleepHours: number; tags: string[] }[]
  factors: Factor[]
  weekdays: { day: string; avgMood: number; count: number }[]
  topTags: { tag: string; count: number; avgMood: number }[]
  persona: { title: string; summary: string; strengths: Note[]; challenges: Note[] }
  suggestions: Suggestion[]
  drains: TagImpact[]
  boosts: TagImpact[]
  swaps: { drain: TagImpact; instead: TagImpact[] }[]
  caution: string | null
}

export interface TagImpact {
  tag: string
  count: number
  withAvg: number
  withoutAvg: number
  delta: number
}
