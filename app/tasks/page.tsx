import Link from 'next/link'
import { loadAll, approvals, isOverdue, money } from '@/lib/procurement'
import Empty from '@/app/_components/Empty'
import RowActions from '@/app/_components/RowActions'

export const dynamic = 'force-dynamic'

const RELATED_LABEL: Record<string, string> = { pr: 'PR', po: 'PO', rfq: 'RFQ', delivery: 'Delivery', invoice: 'Invoice' }

export default async function Approvals() {
  const db = await loadAll()
  if (!db.ok) return (
    <><h1 className="ph">Approvals &amp; Actions</h1><p className="cap">What needs reviewing, approving &amp; chasing</p><Empty /></>
  )

  const projectName = (id: number | null) => db.projects.find(p => p.id === id)?.name ?? '—'
  const supplierName = (id: number | null) => db.suppliers.find(s => s.id === id)?.company_name ?? '—'

  const submittedPRs = db.prs.filter(p => p.status === 'submitted')
  const poPrIds = new Set(db.pos.map(p => p.pr_id).filter(Boolean))
  const approvedPRs = db.prs.filter(p => p.status === 'approved' && !poPrIds.has(p.id))
  const pendingPOs = db.pos.filter(p => p.approval_status === 'pending')
  const tasks = approvals(db)
  const overdue = tasks.filter(t => isOverdue(t.due_date)).length

  return (
    <>
      <h1 className="ph">Approvals &amp; Actions</h1>
      <p className="cap">Review, approve &amp; convert · {overdue} task(s) overdue</p>

      <div className="actions">
        <Link href="/requisitions/new" className="btn sm">+ Create PR</Link>
      </div>

      <h2 className="sub-h">PRs awaiting approval · {submittedPRs.length}</h2>
      {submittedPRs.length === 0 ? (
        <p className="soon-note">No requisitions waiting on approval.</p>
      ) : (
        <table className="tbl">
          <thead><tr><th>PR</th><th>Project</th><th>Requested by</th><th>Priority</th><th className="num">Est. total</th><th>Action</th></tr></thead>
          <tbody>
            {submittedPRs.map(pr => (
              <tr key={pr.id}>
                <td data-label="PR"><strong>{pr.pr_number}</strong>{pr.description ? <><br /><span style={{ color: 'var(--dim)', fontSize: 13 }}>{pr.description}</span></> : null}</td>
                <td data-label="Project">{projectName(pr.project_id)}</td>
                <td data-label="Requested by">{pr.requested_by ?? '—'}</td>
                <td data-label="Priority"><span className={`pri ${pr.priority}`}>{pr.priority}</span></td>
                <td data-label="Est. total" className="num">{money(pr.estimated_total)}</td>
                <td data-label="Action"><RowActions kind="pr" id={pr.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="sub-h">Approved PRs — ready to order · {approvedPRs.length}</h2>
      {approvedPRs.length === 0 ? (
        <p className="soon-note">Nothing approved and waiting to become a PO.</p>
      ) : (
        <table className="tbl">
          <thead><tr><th>PR</th><th>Project</th><th>Requested by</th><th className="num">Est. total</th><th>Action</th></tr></thead>
          <tbody>
            {approvedPRs.map(pr => (
              <tr key={pr.id}>
                <td data-label="PR"><strong>{pr.pr_number}</strong></td>
                <td data-label="Project">{projectName(pr.project_id)}</td>
                <td data-label="Requested by">{pr.requested_by ?? '—'}</td>
                <td data-label="Est. total" className="num">{money(pr.estimated_total)}</td>
                <td data-label="Action"><RowActions kind="topo" id={pr.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="sub-h">POs awaiting approval · {pendingPOs.length}</h2>
      {pendingPOs.length === 0 ? (
        <p className="soon-note">No purchase orders pending approval.</p>
      ) : (
        <table className="tbl">
          <thead><tr><th>PO</th><th>Supplier</th><th>Project</th><th className="num">Total</th><th>Action</th></tr></thead>
          <tbody>
            {pendingPOs.map(po => (
              <tr key={po.id}>
                <td data-label="PO"><strong>{po.po_number}</strong></td>
                <td data-label="Supplier">{supplierName(po.supplier_id)}</td>
                <td data-label="Project">{projectName(po.project_id)}</td>
                <td data-label="Total" className="num">{money(po.total_amount)}</td>
                <td data-label="Action"><RowActions kind="po" id={po.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="sub-h">Other actions · {tasks.length}</h2>
      {tasks.length === 0 ? <p className="soon-note">No other open actions.</p> : (
        <table className="tbl">
          <thead><tr><th>Action</th><th>Related</th><th>Assigned to</th><th>Due</th><th>Priority</th></tr></thead>
          <tbody>
            {tasks.map(t => {
              const od = isOverdue(t.due_date)
              return (
                <tr key={t.id}>
                  <td data-label="Action"><strong>{t.title}</strong>{t.description ? <><br /><span style={{ color: 'var(--dim)', fontSize: 13 }}>{t.description}</span></> : null}</td>
                  <td data-label="Related">{t.related_type ? <span className="pill">{RELATED_LABEL[t.related_type] ?? t.related_type}</span> : '—'}</td>
                  <td data-label="Assigned to">{t.assigned_to ?? '—'}</td>
                  <td data-label="Due" style={od ? { color: '#ff9b9b' } : undefined}>{t.due_date ?? '—'}{od ? ' (overdue)' : ''}</td>
                  <td data-label="Priority"><span className={`pri ${t.priority}`}>{t.priority}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </>
  )
}
