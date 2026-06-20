import { loadAll, pipeline, money } from '@/lib/procurement'
import Empty from '@/app/_components/Empty'
import Actions from '@/app/_components/Actions'

export const dynamic = 'force-dynamic'

// Class hint so each stage card picks up a sensible status colour.
const STAGE_CLASS: Record<string, string> = {
  'Draft PR': 'draft', 'Submitted PR': 'submitted', 'RFQ Sent': 'sent', 'Quote Received': 'quote_received',
  'PO Pending Approval': 'pending', 'PO Approved': 'approved', 'Partially Delivered': 'partially_delivered',
  'Delivered': 'delivered', 'Invoiced': 'invoiced', 'Paid': 'paid',
}

export default async function Pipeline() {
  const db = await loadAll()
  if (!db.ok) return (
    <><h1 className="ph">Procurement Pipeline</h1><p className="cap">PR → RFQ → PO → Delivery → Invoice → Paid</p><Empty /></>
  )

  const stages = pipeline(db)

  return (
    <>
      <h1 className="ph">Procurement Pipeline</h1>
      <p className="cap">PR → RFQ → PO → Delivery → Invoice → Paid</p>

      <Actions items={[{ label: '+ Create PR', href: '/requisitions/new' }, 'Request Quote', 'Create PO']} />

      {stages.map(({ stage, items }) => (
        <section key={stage}>
          <h2 className="sub-h">
            <span className={`pill ${STAGE_CLASS[stage] ?? ''}`}>{stage}</span> · {items.length}
          </h2>
          {items.length === 0 ? (
            <p className="soon-note">Nothing at this stage.</p>
          ) : (
            <div className="grid">
              {items.map(it => (
                <div className="kc" key={it.ref}>
                  <p className="t"><strong>{it.ref}</strong>{it.amount ? ` · ${money(it.amount)}` : ''}</p>
                  <p className="s">{it.title}</p>
                  <p className="s">{it.sub}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </>
  )
}
