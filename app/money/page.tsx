import { loadAll, spend, money, moneyK, isOverdue } from '@/lib/procurement'
import Empty from '@/app/_components/Empty'
import Actions from '@/app/_components/Actions'

export const dynamic = 'force-dynamic'

export default async function Spend() {
  const db = await loadAll()
  if (!db.ok) return (
    <><h1 className="ph">Spend &amp; Payments</h1><p className="cap">Committed vs actual, invoices &amp; budgets</p><Empty /></>
  )

  const s = spend(db)
  const invoices = db.invoices
    .map(i => ({ ...i, supplier: db.suppliers.find(x => x.id === i.supplier_id)?.company_name ?? '—' }))
    .sort((a, b) => (a.due_date ?? '') < (b.due_date ?? '') ? -1 : 1)

  return (
    <>
      <h1 className="ph">Spend &amp; Payments</h1>
      <p className="cap">Committed vs actual, invoices &amp; budgets</p>

      <Actions items={['Upload Invoice', 'Mark as Paid']} />

      <div className="grid">
        <div className="stat"><p className="l">Committed spend</p><p className="v">{moneyK(s.committed)}</p><p className="sub">approved POs</p></div>
        <div className="stat"><p className="l">Actual (billed)</p><p className="v">{moneyK(s.actual)}</p><p className="sub">invoiced to date</p></div>
        <div className={`stat${s.outstanding ? ' warn' : ''}`}><p className="l">Outstanding invoices</p><p className="v">{moneyK(s.outstanding)}</p><p className="sub">pending + overdue</p></div>
        <div className="stat"><p className="l">Paid invoices</p><p className="v">{moneyK(s.paid)}</p><p className="sub">settled</p></div>
        <div className={`stat${s.overdue ? ' danger' : ''}`}><p className="l">Overdue payments</p><p className="v">{moneyK(s.overdue)}</p><p className="sub">past due date</p></div>
      </div>

      <h2 className="sub-h">Budget vs actual by project</h2>
      <table className="tbl">
        <thead><tr><th>Project</th><th className="num">Budget</th><th className="num">Committed</th><th className="num">Remaining</th><th>Used</th></tr></thead>
        <tbody>
          {s.byProject.map(p => {
            const over = p.usedPct > 100, near = p.usedPct > 80
            return (
              <tr key={p.id}>
                <td data-label="Project">{p.name}</td>
                <td data-label="Budget" className="num">{money(p.budget)}</td>
                <td data-label="Committed" className="num">{money(p.committed)}</td>
                <td data-label="Remaining" className="num" style={p.remaining < 0 ? { color: '#ff9b9b' } : undefined}>{money(p.remaining)}</td>
                <td data-label="Used">
                  {p.usedPct}%
                  <div className={`bar${over ? ' danger' : near ? ' warn' : ''}`}><span style={{ width: `${Math.min(p.usedPct, 100)}%` }} /></div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <h2 className="sub-h">Invoices</h2>
      <table className="tbl">
        <thead><tr><th>Invoice</th><th>Supplier</th><th className="num">Amount</th><th>Due</th><th>Status</th></tr></thead>
        <tbody>
          {invoices.map(i => {
            const od = i.status === 'overdue' || (i.status === 'pending' && isOverdue(i.due_date))
            return (
              <tr key={i.id}>
                <td data-label="Invoice">{i.invoice_number}</td>
                <td data-label="Supplier">{i.supplier}</td>
                <td data-label="Amount" className="num">{money(i.amount)}</td>
                <td data-label="Due" style={od ? { color: '#ff9b9b' } : undefined}>{i.due_date ?? '—'}</td>
                <td data-label="Status"><span className={`pill ${od ? 'overdue' : i.status}`}>{od ? 'overdue' : i.status}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
