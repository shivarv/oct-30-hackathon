export const MOODS = [
  { value: 2, emoji: '😞', label: 'Awful', color: 'var(--mood-1)' },
  { value: 4, emoji: '😕', label: 'Low', color: 'var(--mood-2)' },
  { value: 6, emoji: '😐', label: 'Okay', color: 'var(--mood-3)' },
  { value: 8, emoji: '🙂', label: 'Good', color: 'var(--mood-4)' },
  { value: 10, emoji: '😄', label: 'Great', color: 'var(--mood-5)' },
]

export const ENERGY = [
  { value: 2, emoji: '🪫', label: 'Drained' },
  { value: 4, emoji: '🥱', label: 'Tired' },
  { value: 6, emoji: '😌', label: 'Steady' },
  { value: 8, emoji: '💪', label: 'Strong' },
  { value: 10, emoji: '⚡', label: 'Buzzing' },
]

// Maps a 1–10 score to the nearest of the five levels.
export const level = <T,>(levels: T[], score: number) =>
  levels[Math.min(levels.length - 1, Math.max(0, Math.round(score / 2) - 1))]

export const moodFace = (score: number) => level(MOODS, score)

export const ACTIVITY_GROUPS = [
  {
    name: 'Body & outdoors',
    items: [
      { tag: 'exercise', label: 'Exercise', icon: '🏋️' },
      { tag: 'walk', label: 'Walk', icon: '🚶' },
      { tag: 'nature', label: 'Outdoors', icon: '🌳' },
      { tag: 'cooking', label: 'Cooked', icon: '🍳' },
    ],
  },
  {
    name: 'People',
    items: [
      { tag: 'friends', label: 'Friends', icon: '👯' },
      { tag: 'family', label: 'Family', icon: '🏡' },
    ],
  },
  {
    name: 'Work & study',
    items: [
      { tag: 'productivity', label: 'Deep work', icon: '🎯' },
      { tag: 'planning', label: 'Planned', icon: '🗓️' },
      { tag: 'flow', label: 'In flow', icon: '🌊' },
      { tag: 'work', label: 'Study / work', icon: '📚' },
      { tag: 'job-search', label: 'Job search', icon: '💼' },
      { tag: 'interview', label: 'Interview', icon: '🎤' },
      { tag: 'hackathon', label: 'Hackathon', icon: '💻' },
      { tag: 'deadline', label: 'Deadline', icon: '⏰' },
    ],
  },
  {
    name: 'Habits & feelings',
    items: [
      { tag: 'phone', label: 'Scrolling', icon: '📱' },
      { tag: 'procrastination', label: 'Procrastinated', icon: '🐢' },
      { tag: 'caffeine', label: 'Lots of coffee', icon: '☕' },
      { tag: 'skipped-meal', label: 'Skipped a meal', icon: '🍽️' },
      { tag: 'overcommit', label: 'Overcommitted', icon: '🙋' },
      { tag: 'anxiety', label: 'Anxious', icon: '😰' },
      { tag: 'rejection', label: 'Rejection', icon: '💔' },
      { tag: 'comparison', label: 'Comparing myself', icon: '🪞' },
      { tag: 'tired', label: 'Tired', icon: '🥱' },
    ],
  },
]

const ACTIVITY_BY_TAG = new Map(ACTIVITY_GROUPS.flatMap((g) => g.items).map((a) => [a.tag, a]))

export const activity = (tag: string) =>
  ACTIVITY_BY_TAG.get(tag) ?? { tag, label: tag.replace(/-/g, ' '), icon: '🏷️' }

export const SUGGESTION_ICONS: Record<string, string> = {
  sleep: '😴',
  phone: '📵',
  movement: '🏃',
  social: '👯',
  'job-search': '💼',
  focus: '🎯',
  weekday: '🗓️',
  boundaries: '🙅',
  basics: '🥗',
}

export const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`

export const FACTOR_ICONS: Record<string, string> = {
  sleep: '😴',
  movement: '🏃',
  social: '👯',
  phone: '📱',
  'job-search': '💼',
  focus: '🎯',
}
