import { loadAll, suppliersView, money, moneyK } from '@/lib/procurement'
import Empty from '@/app/_components/Empty'
import Actions from '@/app/_components/Actions'

export const dynamic = 'force-dynamic'

export default async function Suppliers() {
  const db = await loadAll()
  if (!db.ok) return (
    <><h1 className="ph">Suppliers</h1><p className="cap">Vendor directory &amp; account standing</p><Empty /></>
  )

  const rows = suppliersView(db)
  const totalOutstanding = rows.reduce((s, x) => s + x.outstanding, 0)
  const activePOs = rows.reduce((s, x) => s + x.activePOs, 0)

  return (
    <>
      <h1 className="ph">Suppliers</h1>
      <p className="cap">Vendor directory &amp; account standing · {rows.length} suppliers</p>

      <Actions items={['Add Supplier', 'Request Quote']} />

      <div className="grid">
        <div className="stat"><p className="l">Suppliers</p><p className="v">{rows.length}</p><p className="sub">in directory</p></div>
        <div className="stat"><p className="l">Active POs</p><p className="v">{activePOs}</p><p className="sub">open orders</p></div>
        <div className={`stat${totalOutstanding ? ' warn' : ''}`}><p className="l">Outstanding</p><p className="v">{moneyK(totalOutstanding)}</p><p className="sub">payable to suppliers</p></div>
      </div>

      {rows.length === 0 ? <Empty /> : (
        <table className="tbl">
          <thead><tr>
            <th>Supplier</th><th>Trade</th><th>Contact</th><th>Phone</th><th>Terms</th>
            <th className="num">Rating</th><th className="num">Active POs</th><th className="num">Outstanding</th>
          </tr></thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.id}>
                <td data-label="Supplier"><strong>{s.company_name}</strong></td>
                <td data-label="Trade">{s.trade_category ?? '—'}</td>
                <td data-label="Contact">{s.contact_person ?? '—'}{s.email ? <><br /><span style={{ color: 'var(--dim)', fontSize: 12 }}>{s.email}</span></> : null}</td>
                <td data-label="Phone">{s.phone ?? '—'}</td>
                <td data-label="Terms">{s.payment_terms ?? '—'}</td>
                <td data-label="Rating" className="num">{Number(s.rating).toFixed(1)} ★</td>
                <td data-label="Active POs" className="num">{s.activePOs}</td>
                <td data-label="Outstanding" className="num" style={s.outstanding ? { color: '#ffcf80' } : undefined}>{money(s.outstanding)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
