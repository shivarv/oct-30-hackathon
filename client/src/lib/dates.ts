export const todayIso = () => new Date().toLocaleDateString('en-CA')

export const toIso = (d: Date) => d.toLocaleDateString('en-CA')

export const monthKey = (iso: string) => iso.slice(0, 7)

export function shiftMonth(key: string, by: number) {
  const [y, m] = key.split('-').map(Number)
  return toIso(new Date(y, m - 1 + by, 1)).slice(0, 7)
}

/** Calendar cells for a month, Monday first, padded with nulls. */
export function monthGrid(key: string): (string | null)[] {
  const [y, m] = key.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const days = new Date(y, m, 0).getDate()
  const lead = (first.getDay() + 6) % 7
  const cells: (string | null)[] = Array(lead).fill(null)
  for (let d = 1; d <= days; d++) cells.push(toIso(new Date(y, m - 1, d)))
  while (cells.length % 7) cells.push(null)
  return cells
}

export const monthLabel = (key: string) =>
  new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
