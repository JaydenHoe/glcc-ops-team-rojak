import { loadInventory, stockStatus } from '@/lib/inventory'
import { money } from '@/lib/procurement'
import Empty from '@/app/_components/Empty'
import InventoryUse from './InventoryUse'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = { ok: 'In stock', low: 'Low', out: 'Out' }

export default async function Inventory() {
  const db = await loadInventory()
  if (!db.ok) return (
    <><h1 className="ph">Inventory</h1><p className="cap">Live site stock by project</p><Empty /></>
  )

  const rows = db.rows
  const lowCount = rows.filter(r => stockStatus(r) === 'low').length
  const outCount = rows.filter(r => stockStatus(r) === 'out').length
  const value = rows.reduce((s, r) => s + Number(r.quantity) * (r.material_id ? (db.cost[r.material_id] ?? 0) : 0), 0)
  const byProject = db.projects
    .map(p => ({ id: p.id, name: p.name, items: rows.filter(r => r.project_id === p.id) }))
    .filter(g => g.items.length > 0)

  return (
    <>
      <h1 className="ph">Inventory</h1>
      <p className="cap">Live site stock by project · auto-updates when materials are delivered</p>

      <div className="grid">
        <div className="stat"><p className="l">Items tracked</p><p className="v">{rows.length}</p><p className="sub">across {byProject.length} project(s)</p></div>
        <div className={`stat${lowCount ? ' warn' : ''}`}><p className="l">Low stock</p><p className="v">{lowCount}</p><p className="sub">at/below reorder</p></div>
        <div className={`stat${outCount ? ' danger' : ''}`}><p className="l">Out of stock</p><p className="v">{outCount}</p><p className="sub">need reorder</p></div>
        <div className="stat"><p className="l">Stock value</p><p className="v">{money(value)}</p><p className="sub">on hand</p></div>
      </div>

      {byProject.length === 0 ? (
        <p className="empty">No stock yet — it fills up automatically when you log a delivery on the Approvals tab.</p>
      ) : byProject.map(g => (
        <section key={g.id}>
          <h2 className="sub-h">{g.name} · {g.items.length} item(s)</h2>
          <table className="tbl">
            <thead><tr><th>Item</th><th>Unit</th><th className="num">Qty</th><th className="num">Reorder</th><th>Status</th><th>Use on site</th></tr></thead>
            <tbody>
              {g.items.map(r => {
                const st = stockStatus(r)
                return (
                  <tr key={r.id}>
                    <td data-label="Item">{r.item_name}</td>
                    <td data-label="Unit">{r.unit ?? '—'}</td>
                    <td data-label="Qty" className="num">{Number(r.quantity).toLocaleString('en-SG')}</td>
                    <td data-label="Reorder" className="num">{Number(r.reorder_level).toLocaleString('en-SG')}</td>
                    <td data-label="Status"><span className={`pill ${st}`}>{STATUS_LABEL[st]}</span></td>
                    <td data-label="Use on site"><InventoryUse id={r.id} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      ))}
    </>
  )
}
