import { loadAll, dashboard, money, moneyK } from '@/lib/procurement'
import Empty from '@/app/_components/Empty'
import Actions from '@/app/_components/Actions'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const db = await loadAll()
  if (!db.ok) return (
    <>
      <h1 className="ph">Procurement Dashboard</h1>
      <p className="cap">Construction procurement at a glance</p>
      <Empty />
    </>
  )

  const d = dashboard(db)
  const overBudget = d.budgetPct > 100
  const nearBudget = d.budgetPct > 80

  return (
    <>
      <h1 className="ph">Procurement Dashboard</h1>
      <p className="cap">Construction procurement at a glance</p>

      <Actions items={[{ label: '+ Create PR', href: '/requisitions/new' }, 'Create PO']} note={false} />

      <div className="grid">
        <div className="stat">
          <p className="l">Open PRs</p>
          <p className="v">{d.openPRs}</p>
          <p className="sub">draft &amp; submitted</p>
        </div>
        <div className={`stat${d.posAwaitingApproval ? ' warn' : ''}`}>
          <p className="l">POs awaiting approval</p>
          <p className="v">{d.posAwaitingApproval}</p>
          <p className="sub">need a PM sign-off</p>
        </div>
        <div className={`stat${d.outstandingTotal ? ' warn' : ''}`}>
          <p className="l">Outstanding payments</p>
          <p className="v">{moneyK(d.outstandingTotal)}</p>
          <p className="sub">unpaid invoices</p>
        </div>
        <div className={`stat${d.overdueDeliveries ? ' danger' : ''}`}>
          <p className="l">Overdue deliveries</p>
          <p className="v">{d.overdueDeliveries}</p>
          <p className="sub">past delivery date</p>
        </div>
        <div className={`stat${overBudget ? ' danger' : nearBudget ? ' warn' : ''}`}>
          <p className="l">Spend vs budget</p>
          <p className="v">{d.budgetPct}%</p>
          <p className="sub">{money(d.committed)} of {moneyK(d.totalBudget)}</p>
          <div className={`bar${overBudget ? ' danger' : nearBudget ? ' warn' : ''}`}>
            <span style={{ width: `${Math.min(d.budgetPct, 100)}%` }} />
          </div>
        </div>
      </div>

      <h2 className="sub-h">Recent procurement activity</h2>
      {d.activity.length === 0 ? (
        <p className="empty">No activity yet.</p>
      ) : (
        <table className="tbl">
          <thead><tr><th>Date</th><th>Activity</th><th>Type</th></tr></thead>
          <tbody>
            {d.activity.map((a, i) => (
              <tr key={i}>
                <td data-label="Date">{a.when}</td>
                <td data-label="Activity">{a.label}</td>
                <td data-label="Type"><span className="pill">{a.tag}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
