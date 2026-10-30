import { useId, type ReactNode } from 'react'

const INK = '#5b3a1a'

/**
 * A glossy yellow face with a distinct expression per mood level (1 awful … 5 great).
 * `dimmed` greys it out for unselected options.
 */
export function MoodFace({ mood, size = 40, dimmed = false, pop = false }: { mood: number; size?: number; dimmed?: boolean; pop?: boolean }) {
  const lvl = Math.min(5, Math.max(1, Math.round(mood / 2)))
  const id = useId()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden
      className={`${pop ? 'animate-pop' : ''} transition duration-300`}
      style={dimmed ? { filter: 'grayscale(1)', opacity: 0.45 } : undefined}
    >
      <defs>
        <radialGradient id={`${id}-skin`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#fff3a8" />
          <stop offset="45%" stopColor="#ffd84a" />
          <stop offset="100%" stopColor="#f5a524" />
        </radialGradient>
        <linearGradient id={`${id}-tear`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#bfe6ff" />
          <stop offset="100%" stopColor="#4aa8f0" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="52" r="44" fill="#000" opacity="0.08" />
      <circle cx="50" cy="50" r="44" fill={`url(#${id}-skin)`} stroke="#e39a1c" strokeWidth="2" />
      <ellipse cx="36" cy="24" rx="14" ry="7" fill="#fff" opacity="0.45" transform="rotate(-20 36 24)" />

      {EXPRESSIONS[lvl](id)}
    </svg>
  )
}

const cheeks = (opacity: number) => (
  <>
    <ellipse cx="24" cy="62" rx="8" ry="5" fill="#ff7a7a" opacity={opacity} />
    <ellipse cx="76" cy="62" rx="8" ry="5" fill="#ff7a7a" opacity={opacity} />
  </>
)

const EXPRESSIONS: Record<number, (id: string) => ReactNode> = {
  // Awful: angry brows, squeezed eyes, deep frown, a tear
  1: (id) => (
    <g stroke={INK} strokeLinecap="round" fill="none">
      <path d="M24 30 L42 38" strokeWidth="5" />
      <path d="M76 30 L58 38" strokeWidth="5" />
      <path d="M28 46 Q35 41 42 46" strokeWidth="4.5" />
      <path d="M58 46 Q65 41 72 46" strokeWidth="4.5" />
      <path d="M32 76 Q50 58 68 76" strokeWidth="5.5" />
      <path d="M70 52 C66 60 66 66 70 68 C74 66 74 60 70 52 Z" fill={`url(#${id}-tear)`} stroke="none" />
    </g>
  ),
  // Low: worried brows, downcast eyes, small frown
  2: () => (
    <g stroke={INK} strokeLinecap="round" fill="none">
      <path d="M26 36 Q33 30 41 33" strokeWidth="4" />
      <path d="M74 36 Q67 30 59 33" strokeWidth="4" />
      <ellipse cx="35" cy="47" rx="4.5" ry="5.5" fill={INK} stroke="none" />
      <ellipse cx="65" cy="47" rx="4.5" ry="5.5" fill={INK} stroke="none" />
      <path d="M36 72 Q50 63 64 72" strokeWidth="5" />
    </g>
  ),
  // Okay: calm eyes, flat mouth
  3: () => (
    <g stroke={INK} strokeLinecap="round" fill="none">
      <ellipse cx="35" cy="45" rx="5" ry="6.5" fill={INK} stroke="none" />
      <ellipse cx="65" cy="45" rx="5" ry="6.5" fill={INK} stroke="none" />
      <circle cx="36.5" cy="43" r="1.6" fill="#fff" stroke="none" />
      <circle cx="66.5" cy="43" r="1.6" fill="#fff" stroke="none" />
      <path d="M36 68 L64 68" strokeWidth="5" />
    </g>
  ),
  // Good: happy eyes, warm smile, rosy cheeks
  4: () => (
    <>
      {cheeks(0.35)}
      <g stroke={INK} strokeLinecap="round" fill="none">
        <ellipse cx="35" cy="44" rx="5" ry="6.5" fill={INK} stroke="none" />
        <ellipse cx="65" cy="44" rx="5" ry="6.5" fill={INK} stroke="none" />
        <circle cx="36.5" cy="42" r="1.8" fill="#fff" stroke="none" />
        <circle cx="66.5" cy="42" r="1.8" fill="#fff" stroke="none" />
        <path d="M32 62 Q50 80 68 62" strokeWidth="5.5" />
      </g>
    </>
  ),
  // Great: ^^ eyes, big open grin with tongue, blush, sparkles
  5: () => (
    <>
      {cheeks(0.5)}
      <g stroke={INK} strokeLinecap="round" fill="none">
        <path d="M26 46 Q34 36 42 46" strokeWidth="5" />
        <path d="M58 46 Q66 36 74 46" strokeWidth="5" />
      </g>
      <path d="M28 58 Q50 92 72 58 Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M38 74 Q50 68 62 74 Q56 84 50 84 Q44 84 38 74 Z" fill="#ff6b81" />
      <path d="M33 60 L67 60" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      <path d="M86 18 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z" fill="#fff" stroke="#f5a524" strokeWidth="1" />
      <path d="M12 26 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 Z" fill="#fff" stroke="#f5a524" strokeWidth="1" />
    </>
  ),
}
