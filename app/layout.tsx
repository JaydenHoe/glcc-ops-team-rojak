import './globals.css'
import Shell from './_components/Shell'
import ConnStatus from './_components/ConnStatus'

export const metadata = {
  title: 'Evermount Construction Pte Ltd — Procurement Portal',
  description: 'Construction procurement management — PRs, POs, deliveries, invoices & spend',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* ConnStatus is an async server component — passed through as a prop so the
            client Shell (drawer state) can render it inside <main>. */}
        <Shell conn={<ConnStatus />}>{children}</Shell>
      </body>
    </html>
  )
}
