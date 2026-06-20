import Link from 'next/link'

// Action buttons. A plain string renders a disabled Phase-2 placeholder; an
// object with an href renders a real, enabled link button (live workflow).
type Item = string | { label: string; href: string }

export default function Actions({ items, note = true }: { items: Item[]; note?: boolean }) {
  const anyLive = items.some(it => typeof it === 'object')
  return (
    <>
      <div className="actions">
        {items.map(it => {
          if (typeof it === 'object') {
            return <Link key={it.label} href={it.href} className="btn sm">{it.label}</Link>
          }
          return (
            <button key={it} className="btn sm ghost" disabled title="Coming in a later Phase 2 step">
              {it}
            </button>
          )
        })}
      </div>
      {note && (
        <p className="soon-note">
          {anyLive ? 'Highlighted actions are live; greyed ones arrive in later Phase 2 steps.' : 'These actions arrive in later Phase 2 steps.'}
        </p>
      )}
    </>
  )
}
