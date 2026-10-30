const BASE = import.meta.env.VITE_API_URL ?? ''

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error?.message ?? res.statusText)
  return res.json()
}

export const formatDate = (date: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, opts)
