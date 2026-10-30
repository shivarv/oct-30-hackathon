import type { ReactNode } from 'react'

export function Card({ title, subtitle, children, className = '' }: { title?: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-border bg-surface p-5 ${className}`}>
      {title && <h2 className="text-base font-semibold">{title}</h2>}
      {subtitle && <p className="mt-0.5 text-sm text-ink-3">{subtitle}</p>}
      <div className={title ? 'mt-4' : ''}>{children}</div>
    </section>
  )
}
