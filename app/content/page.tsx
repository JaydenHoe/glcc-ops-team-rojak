import { loadAll, materialsView, documents, money } from '@/lib/procurement'
import Empty from '@/app/_components/Empty'
import Actions from '@/app/_components/Actions'
import MaterialThumb from '@/app/_components/MaterialThumb'

export const dynamic = 'force-dynamic'

const DOC_CLASS: Record<string, string> = { Quotation: 'sent', PO: 'approved', 'Delivery Order': 'delivered', Invoice: 'invoiced' }

export default async function Materials() {
  const db = await loadAll()
  if (!db.ok) return (
    <><h1 className="ph">Materials / Documents</h1><p className="cap">Material catalog &amp; procurement documents</p><Empty /></>
  )

  const mats = materialsView(db)
  const docs = documents(db)

  return (
    <>
      <h1 className="ph">Materials / Documents</h1>
      <p className="cap">Material catalog &amp; procurement documents</p>

      <Actions items={['Add Material', 'Upload Document']} />

      <h2 className="sub-h">Material catalog · {mats.length}</h2>
      {mats.length === 0 ? <Empty /> : (
        <table className="tbl">
          <thead><tr><th>Material</th><th>Category</th><th>Unit</th><th className="num">Est. unit cost</th><th>Preferred supplier</th></tr></thead>
          <tbody>
            {mats.map(m => (
              <tr key={m.id}>
                <td data-label="Material"><span className="mat"><MaterialThumb category={m.category} /><span>{m.name}</span></span></td>
                <td data-label="Category"><span className="pill">{m.category ?? '—'}</span></td>
                <td data-label="Unit">{m.unit ?? '—'}</td>
                <td data-label="Est. unit cost" className="num">{money(m.estimated_unit_cost)}</td>
                <td data-label="Preferred supplier">{m.preferred}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="sub-h">Documents · {docs.length}</h2>
      <p className="soon-note">File uploads (quotation / PO / DO / invoice PDFs) arrive in Phase 2 — these are the document references the workflow has produced so far.</p>
      <table className="tbl">
        <thead><tr><th>Type</th><th>Reference</th><th>Party</th><th>Date</th></tr></thead>
        <tbody>
          {docs.map((d, i) => (
            <tr key={i}>
              <td data-label="Type"><span className={`pill ${DOC_CLASS[d.kind] ?? ''}`}>{d.kind}</span></td>
              <td data-label="Reference">{d.ref}</td>
              <td data-label="Party">{d.party}</td>
              <td data-label="Date">{d.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
