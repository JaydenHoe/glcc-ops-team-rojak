'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Nav from './Nav'

// App shell: static sidebar on desktop, slide-in drawer on mobile.
// All the drawer behaviour lives here; desktop layout is untouched by CSS
// (the topbar/overlay are display:none until the mobile media query).
export default function Shell({
  children,
  conn,
}: {
  children: React.ReactNode
  conn: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the drawer whenever the route changes (covers nav taps + back/forward).
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll while the drawer is open so the page behind doesn't scroll.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="hamburger"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
        <span className="topbar-brand">
          <span className="logo" aria-hidden="true" />
          <span className="brand-stack"><strong>Evermount Construction</strong><small>Procurement Portal</small></span>
        </span>
      </header>

      <div
        className={`overlay${open ? ' show' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside className={`side${open ? ' open' : ''}`}>
        <div className="brand">
          <span className="logo" aria-hidden="true" />
          <span className="brand-stack"><strong>Evermount Construction</strong><small>Pte Ltd · Procurement Portal</small></span>
        </div>
        <Nav onNavigate={() => setOpen(false)} />
        <p className="hint">
          Construction procurement — PR → RFQ → PO → Delivery → Invoice → Paid.
        </p>
      </aside>

      <main className="main">
        {conn}
        {children}
      </main>
    </div>
  )
}
