// Self-contained category thumbnails for the materials catalog. Pure inline SVG
// (no external requests, no third-party images) — every material gets a clean
// line illustration based on its category. Swap for real product photos in
// Phase 2 (image_url column + Supabase Storage upload).
import type { JSX } from 'react'

const STYLES: Record<string, { bg: string; fg: string }> = {
  Pipes:    { bg: 'rgba(55,138,221,0.16)',  fg: '#8ec5ff' },
  Fittings: { bg: 'rgba(239,159,39,0.16)',  fg: '#ffcf80' },
  Traps:    { bg: 'rgba(29,158,117,0.16)',  fg: '#86e0b8' },
  Valves:   { bg: 'rgba(226,75,74,0.16)',   fg: '#ff9b9b' },
  Pumps:    { bg: 'rgba(124,108,231,0.18)', fg: '#b9aef5' },
  Sanitary: { bg: 'rgba(56,189,200,0.16)',  fg: '#7fd6dd' },
}
const DEFAULT = { bg: 'var(--surface2)', fg: 'var(--muted)' }

function glyph(category: string | null): JSX.Element {
  switch (category) {
    case 'Pipes':
      return <><rect x="2" y="7" width="20" height="9" rx="2.5" /><line x1="7" y1="7" x2="7" y2="16" /><line x1="17" y1="7" x2="17" y2="16" /></>
    case 'Fittings':
      return <path d="M4 3 V12 a8 8 0 0 0 8 8 H21" />
    case 'Traps':
      return <path d="M6 3 V11 a6 6 0 0 0 12 0 V3" />
    case 'Valves':
      return <><path d="M3 6 L12 12 L3 18 Z" /><path d="M21 6 L12 12 L21 18 Z" /><line x1="12" y1="12" x2="12" y2="4" /><line x1="8.5" y1="3" x2="15.5" y2="3" /></>
    case 'Pumps':
      return <><circle cx="12" cy="12" r="8.5" /><path d="M9.5 8 L16 12 L9.5 16 Z" /></>
    case 'Sanitary':
      return <><path d="M3 9 H21 V11 a9 7 0 0 1 -18 0 Z" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="9.5" y1="6" x2="14.5" y2="6" /></>
    default:
      return <><rect x="3" y="6" width="18" height="15" rx="2.5" /><line x1="3" y1="11" x2="21" y2="11" /></>
  }
}

export default function MaterialThumb({ category, size = 40 }: { category: string | null; size?: number }) {
  const s = (category && STYLES[category]) || DEFAULT
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" role="img" aria-label={`${category ?? 'material'} thumbnail`} style={{ flexShrink: 0 }}>
      <rect width="44" height="44" rx="10" fill={s.bg} />
      <g transform="translate(10,10)" fill="none" stroke={s.fg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {glyph(category)}
      </g>
    </svg>
  )
}
