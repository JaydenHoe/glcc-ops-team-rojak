import { loadAll, projectsView, money, moneyK } from '@/lib/procurement'
import Empty from '@/app/_components/Empty'

export const dynamic = 'force-dynamic'

export default async function Projects() {
  const db = await loadAll()
  if (!db.ok) return (
    <><h1 className="ph">Projects / Sites</h1><p className="cap">Construction projects &amp; their procurement spend</p><Empty /></>
  )

  const rows = projectsView(db)
  const activeCount = rows.filter(p => p.status === 'active').length
  const totalBudget = rows.reduce((s, p) => s + Number(p.budget_amount), 0)
  const totalCommitted = rows.reduce((s, p) => s + p.committed, 0)

  return (
    <>
      <h1 className="ph">Projects / Sites</h1>
      <p className="cap">Construction projects &amp; their procurement spend</p>

      <div className="grid">
        <div className="stat"><p className="l">Active projects</p><p className="v">{activeCount}</p><p className="sub">of {rows.length} total</p></div>
        <div className="stat"><p className="l">Total budget</p><p className="v">{moneyK(totalBudget)}</p><p className="sub">across all sites</p></div>
        <div className="stat"><p className="l">Committed spend</p><p className="v">{moneyK(totalCommitted)}</p><p className="sub">approved POs</p></div>
        <div className="stat"><p className="l">Remaining</p><p className="v">{moneyK(totalBudget - totalCommitted)}</p><p className="sub">budget left</p></div>
      </div>

      {rows.length === 0 ? <Empty /> : (
        <table className="tbl">
          <thead><tr>
            <th>Project</th><th>Site</th><th>Client</th><th className="num">Budget</th>
            <th className="num">Committed</th><th className="num">Remaining</th><th>Used</th><th className="num">Active PR/PO</th><th>Status</th>
          </tr></thead>
          <tbody>
            {rows.map(p => {
              const over = p.usedPct > 100, near = p.usedPct > 80
              return (
                <tr key={p.id}>
                  <td data-label="Project">{p.name}</td>
                  <td data-label="Site">{p.site_location ?? '—'}</td>
                  <td data-label="Client">{p.client_name ?? '—'}</td>
                  <td data-label="Budget" className="num">{money(p.budget_amount)}</td>
                  <td data-label="Committed" className="num">{money(p.committed)}</td>
                  <td data-label="Remaining" className="num" style={p.remaining < 0 ? { color: '#ff9b9b' } : undefined}>{money(p.remaining)}</td>
                  <td data-label="Used">
                    {p.usedPct}%
                    <div className={`bar${over ? ' danger' : near ? ' warn' : ''}`}><span style={{ width: `${Math.min(p.usedPct, 100)}%` }} /></div>
                  </td>
                  <td data-label="Active PR/PO" className="num">{p.activePRs} / {p.activePOs}</td>
                  <td data-label="Status"><span className={`pill ${p.status}`}>{p.status.replace('_', ' ')}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </>
  )
}
