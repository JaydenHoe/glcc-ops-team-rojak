import { supabase, supabaseConfigured } from './supabase'

// ============================================================
// Construction Procurement data layer.
// One loadAll() fetch per page, then PURE selectors below derive every view.
// Server-only (uses the service_role client). Never import into a client component.
// Phase 2 adds CRUD on top of these same tables.
// ============================================================

// ---- Row types (mirror supabase/procurement.sql) ----
export type Project = {
  id: number; name: string; site_location: string | null; client_name: string | null
  budget_amount: number; start_date: string | null; end_date: string | null; status: string
}
export type Supplier = {
  id: number; company_name: string; trade_category: string | null; contact_person: string | null
  email: string | null; phone: string | null; payment_terms: string | null; rating: number; status: string
}
export type Material = {
  id: number; name: string; category: string | null; unit: string | null
  estimated_unit_cost: number; preferred_supplier_id: number | null
}
export type PR = {
  id: number; pr_number: string; project_id: number | null; requested_by: string | null
  required_date: string | null; status: string; priority: string; description: string | null; estimated_total: number
}
export type RFQ = {
  id: number; rfq_number: string; pr_id: number | null; supplier_id: number | null
  status: string; sent_date: string | null; due_date: string | null; quoted_amount: number | null
}
export type PO = {
  id: number; po_number: string; project_id: number | null; supplier_id: number | null; pr_id: number | null
  po_date: string | null; delivery_due_date: string | null; status: string; approval_status: string
  approved_by: string | null; total_amount: number
}
export type Delivery = {
  id: number; po_id: number | null; delivery_order_number: string | null; received_date: string | null
  status: string; received_by: string | null; remarks: string | null
}
export type Invoice = {
  id: number; invoice_number: string; po_id: number | null; supplier_id: number | null
  invoice_date: string | null; due_date: string | null; amount: number; status: string; paid_date: string | null
}
export type Task = {
  id: number; title: string; description: string | null; related_type: string | null; related_id: number | null
  assigned_to: string | null; due_date: string | null; priority: string; status: string
}

export type DB = {
  projects: Project[]; suppliers: Supplier[]; materials: Material[]
  prs: PR[]; rfqs: RFQ[]; pos: PO[]; deliveries: Delivery[]; invoices: Invoice[]; tasks: Task[]
  ok: boolean        // false when Supabase isn't wired or the procurement tables aren't created yet
}

const EMPTY: DB = { projects: [], suppliers: [], materials: [], prs: [], rfqs: [], pos: [], deliveries: [], invoices: [], tasks: [], ok: false }

// Fetch every table once. Resilient: if the procurement tables don't exist yet
// (user hasn't run procurement.sql), we degrade to empty instead of throwing.
export async function loadAll(): Promise<DB> {
  if (!supabaseConfigured) return EMPTY
  const q = (t: string) => supabase.from(t).select('*')
  try {
    const [projects, suppliers, materials, prs, rfqs, pos, deliveries, invoices, tasks] = await Promise.all([
      q('projects'), q('suppliers'), q('materials'), q('purchase_requisitions'),
      q('rfqs'), q('purchase_orders'), q('deliveries'), q('invoices'), q('procurement_tasks'),
    ])
    const anyErr = [projects, suppliers, materials, prs, rfqs, pos, deliveries, invoices, tasks].find(r => r.error)
    if (anyErr?.error) {
      console.warn('[procurement] read failed (did you run supabase/procurement.sql?):', anyErr.error.message)
      return EMPTY
    }
    return {
      projects: projects.data ?? [], suppliers: suppliers.data ?? [], materials: materials.data ?? [],
      prs: prs.data ?? [], rfqs: rfqs.data ?? [], pos: pos.data ?? [],
      deliveries: deliveries.data ?? [], invoices: invoices.data ?? [], tasks: tasks.data ?? [],
      ok: true,
    }
  } catch (e) {
    console.warn('[procurement] loadAll error:', (e as Error).message)
    return EMPTY
  }
}

// ---- formatting & small helpers ----
export const money = (n: number | null | undefined) => 'S$' + Number(n || 0).toLocaleString('en-SG')
export const moneyK = (n: number | null | undefined) => {
  const v = Number(n || 0)
  return v >= 1000 ? 'S$' + (v / 1000).toLocaleString('en-SG', { maximumFractionDigits: 1 }) + 'k' : money(v)
}
export const fmtDate = (d: string | null | undefined) => d ?? '—'
export const todayISO = () => new Date().toISOString().slice(0, 10)
export const isOverdue = (d: string | null | undefined) => !!d && d < todayISO()
export const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

const supplierName = (db: DB, id: number | null) => db.suppliers.find(s => s.id === id)?.company_name ?? '—'
const projectName = (db: DB, id: number | null) => db.projects.find(p => p.id === id)?.name ?? '—'

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }

// Open / outstanding rules reused across views.
const PR_OPEN = ['draft', 'submitted']
const PO_NOT_COMPLETE = ['approved', 'partially_delivered', 'delivered', 'invoiced']  // not 'paid'
const INV_OUTSTANDING = ['pending', 'overdue']

// ---- Dashboard ----
export function dashboard(db: DB) {
  const openPRs = db.prs.filter(p => PR_OPEN.includes(p.status))
  const posAwaitingApproval = db.pos.filter(p => p.approval_status === 'pending')
  const outstanding = db.invoices.filter(i => INV_OUTSTANDING.includes(i.status))
  const outstandingTotal = outstanding.reduce((s, i) => s + Number(i.amount), 0)
  const totalBudget = db.projects.reduce((s, p) => s + Number(p.budget_amount), 0)
  const committed = db.pos.filter(p => p.approval_status === 'approved').reduce((s, p) => s + Number(p.total_amount), 0)
  const overdueDeliveries = db.pos.filter(p =>
    ['approved', 'partially_delivered'].includes(p.status) && isOverdue(p.delivery_due_date))

  // Recent activity — merge the latest events across the workflow.
  const activity: { when: string; label: string; tag: string }[] = [
    ...db.pos.map(p => ({ when: p.po_date ?? '', label: `${p.po_number} → ${supplierName(db, p.supplier_id)}`, tag: 'PO' })),
    ...db.prs.map(p => ({ when: p.required_date ?? '', label: `${p.pr_number} — ${p.description ?? ''}`, tag: 'PR' })),
    ...db.deliveries.map(d => ({ when: d.received_date ?? '', label: `${d.delivery_order_number} received`, tag: 'Delivery' })),
    ...db.invoices.map(i => ({ when: i.invoice_date ?? '', label: `${i.invoice_number} — ${money(i.amount)}`, tag: 'Invoice' })),
  ].filter(a => a.when).sort((a, b) => (a.when < b.when ? 1 : -1)).slice(0, 8)

  return {
    openPRs: openPRs.length,
    posAwaitingApproval: posAwaitingApproval.length,
    outstandingTotal,
    totalBudget,
    committed,
    budgetPct: pct(committed, totalBudget),
    overdueDeliveries: overdueDeliveries.length,
    activity,
  }
}

// ---- Pipeline (PR → RFQ → PO → … → Paid) ----
export const STAGES = [
  'Draft PR', 'Submitted PR', 'RFQ Sent', 'Quote Received',
  'PO Pending Approval', 'PO Approved', 'Partially Delivered', 'Delivered', 'Invoiced', 'Paid',
] as const

function poStage(po: PO): string {
  if (po.approval_status === 'pending') return 'PO Pending Approval'
  switch (po.status) {
    case 'approved': return 'PO Approved'
    case 'partially_delivered': return 'Partially Delivered'
    case 'delivered': return 'Delivered'
    case 'invoiced': return 'Invoiced'
    case 'paid': return 'Paid'
    default: return 'PO Approved'
  }
}

export type PipelineItem = { ref: string; title: string; sub: string; amount: number; stage: string }

export function pipeline(db: DB): { stage: string; items: PipelineItem[] }[] {
  const prWithPo = new Set(db.pos.map(p => p.pr_id).filter(Boolean))
  const prWithRfq = new Set(db.rfqs.map(r => r.pr_id).filter(Boolean))
  const items: PipelineItem[] = []

  // PRs that haven't moved to RFQ or PO yet.
  for (const pr of db.prs) {
    if (!PR_OPEN.includes(pr.status)) continue
    if (prWithPo.has(pr.id) || prWithRfq.has(pr.id)) continue
    items.push({
      ref: pr.pr_number, title: pr.description ?? 'Requisition', sub: projectName(db, pr.project_id),
      amount: Number(pr.estimated_total), stage: pr.status === 'draft' ? 'Draft PR' : 'Submitted PR',
    })
  }
  // RFQs for PRs that don't have a PO yet.
  for (const rfq of db.rfqs) {
    if (rfq.pr_id && prWithPo.has(rfq.pr_id)) continue
    items.push({
      ref: rfq.rfq_number, title: `Quote — ${supplierName(db, rfq.supplier_id)}`,
      sub: db.prs.find(p => p.id === rfq.pr_id)?.pr_number ?? '—',
      amount: Number(rfq.quoted_amount ?? 0), stage: rfq.status === 'quote_received' ? 'Quote Received' : 'RFQ Sent',
    })
  }
  // Every PO at its derived stage.
  for (const po of db.pos) {
    items.push({
      ref: po.po_number, title: supplierName(db, po.supplier_id), sub: projectName(db, po.project_id),
      amount: Number(po.total_amount), stage: poStage(po),
    })
  }
  return STAGES.map(stage => ({ stage, items: items.filter(i => i.stage === stage) }))
}

// ---- Spend & Payments ----
export function spend(db: DB) {
  const approvedPOs = db.pos.filter(p => p.approval_status === 'approved')
  const committed = approvedPOs.reduce((s, p) => s + Number(p.total_amount), 0)
  const actual = db.invoices.reduce((s, i) => s + Number(i.amount), 0)            // billed (invoiced + paid)
  const outstanding = db.invoices.filter(i => INV_OUTSTANDING.includes(i.status)).reduce((s, i) => s + Number(i.amount), 0)
  const paid = db.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const overdue = db.invoices.filter(i => i.status === 'overdue' || (i.status === 'pending' && isOverdue(i.due_date)))
    .reduce((s, i) => s + Number(i.amount), 0)

  const byProject = db.projects.map(p => {
    const committedP = approvedPOs.filter(po => po.project_id === p.id).reduce((s, po) => s + Number(po.total_amount), 0)
    return {
      id: p.id, name: p.name, budget: Number(p.budget_amount), committed: committedP,
      remaining: Number(p.budget_amount) - committedP, usedPct: pct(committedP, Number(p.budget_amount)),
    }
  })
  return { committed, actual, outstanding, paid, overdue, byProject }
}

// ---- Approvals & Actions (procurement_tasks, prioritised) ----
export function approvals(db: DB) {
  const rows = [...db.tasks].filter(t => t.status !== 'done').sort((a, b) => {
    const pr = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9)
    if (pr !== 0) return pr
    return (a.due_date ?? '9999') < (b.due_date ?? '9999') ? -1 : 1
  })
  return rows
}

// ---- Projects / Sites ----
export function projectsView(db: DB) {
  return db.projects.map(p => {
    const pos = db.pos.filter(po => po.project_id === p.id)
    const committed = pos.filter(po => po.approval_status === 'approved').reduce((s, po) => s + Number(po.total_amount), 0)
    const activePRs = db.prs.filter(pr => pr.project_id === p.id && PR_OPEN.includes(pr.status)).length
    const activePOs = pos.filter(po => PO_NOT_COMPLETE.includes(po.status)).length
    return {
      ...p, committed, remaining: Number(p.budget_amount) - committed,
      usedPct: pct(committed, Number(p.budget_amount)), activePRs, activePOs,
    }
  })
}

// ---- Suppliers ----
export function suppliersView(db: DB) {
  return db.suppliers.map(s => {
    const activePOs = db.pos.filter(po => po.supplier_id === s.id && PO_NOT_COMPLETE.includes(po.status)).length
    const outstanding = db.invoices.filter(i => i.supplier_id === s.id && INV_OUTSTANDING.includes(i.status))
      .reduce((sum, i) => sum + Number(i.amount), 0)
    return { ...s, activePOs, outstanding }
  })
}

// ---- Materials + documents ----
export function materialsView(db: DB) {
  return db.materials.map(m => ({ ...m, preferred: supplierName(db, m.preferred_supplier_id) }))
}

// "Documents" — until Phase-2 file upload, surface the document references the
// workflow already produces (quotes, PO files, delivery orders, invoices).
export function documents(db: DB) {
  const docs: { kind: string; ref: string; party: string; date: string }[] = [
    ...db.rfqs.map(r => ({ kind: 'Quotation', ref: r.rfq_number, party: supplierName(db, r.supplier_id), date: r.sent_date ?? '—' })),
    ...db.pos.map(p => ({ kind: 'PO', ref: p.po_number, party: supplierName(db, p.supplier_id), date: p.po_date ?? '—' })),
    ...db.deliveries.map(d => ({ kind: 'Delivery Order', ref: d.delivery_order_number ?? '—', party: '—', date: d.received_date ?? '—' })),
    ...db.invoices.map(i => ({ kind: 'Invoice', ref: i.invoice_number, party: supplierName(db, i.supplier_id), date: i.invoice_date ?? '—' })),
  ]
  return docs.sort((a, b) => (a.date < b.date ? 1 : -1))
}

// ---- AI Procurement Agent (mock answers from seeded data) ----
export function agentAnswers(db: DB): Record<string, string> {
  const d = dashboard(db)
  const sp = spend(db)

  const overdueDel = db.pos.filter(p => ['approved', 'partially_delivered'].includes(p.status) && isOverdue(p.delivery_due_date))
    .map(p => `• ${p.po_number} (${supplierName(db, p.supplier_id)}) — due ${p.delivery_due_date}, ${p.status.replace('_', ' ')}`)

  const supplierOutstanding = db.suppliers.map(s => ({
    name: s.company_name,
    amt: db.invoices.filter(i => i.supplier_id === s.id && INV_OUTSTANDING.includes(i.status)).reduce((x, i) => x + Number(i.amount), 0),
  })).filter(s => s.amt > 0).sort((a, b) => b.amt - a.amt)

  const pendingPOs = db.pos.filter(p => p.approval_status === 'pending')
    .map(p => `• ${p.po_number} — ${supplierName(db, p.supplier_id)} for ${projectName(db, p.project_id)}: ${money(p.total_amount)}`)

  const projSpend = sp.byProject.map(p => `• ${p.name}: ${money(p.committed)} committed of ${money(p.budget)} (${p.usedPct}% used)`)

  const big = db.invoices.filter(i => INV_OUTSTANDING.includes(i.status) && Number(i.amount) > 5000)
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .map(i => `• ${i.invoice_number} — ${supplierName(db, i.supplier_id)}: ${money(i.amount)} (${i.status}, due ${i.due_date})`)

  const worst = supplierOutstanding[0]
  const followUp = worst
    ? `Subject: Payment update — ${worst.name}\n\nDear ${db.suppliers.find(s => s.company_name === worst.name)?.contact_person ?? 'Sir/Madam'},\n\nThank you for your continued support on our projects. This is a courtesy note regarding the outstanding balance of ${money(worst.amt)} on your account. Our finance team is processing payment per the agreed terms and will update you shortly.\n\nKindly share the latest statement of account and confirm any pending delivery orders so we can reconcile promptly.\n\nBest regards,\nProcurement Department`
    : 'No suppliers with outstanding balances right now.'

  return {
    digest: `Procurement digest (${todayISO()}):\n• ${d.openPRs} open PR(s)\n• ${d.posAwaitingApproval} PO(s) awaiting approval\n• ${d.overdueDeliveries} overdue delivery(ies)\n• ${money(d.outstandingTotal)} outstanding payments\n• Committed spend ${money(d.committed)} of ${money(d.totalBudget)} budget (${d.budgetPct}%)`,
    overdue_deliveries: overdueDel.length ? `Overdue deliveries this week:\n${overdueDel.join('\n')}` : 'No overdue deliveries 🎉',
    supplier_payments: supplierOutstanding.length
      ? `Outstanding payments by supplier:\n${supplierOutstanding.map(s => `• ${s.name}: ${money(s.amt)}`).join('\n')}\n\nMost outstanding: ${worst.name} (${money(worst.amt)}).`
      : 'No outstanding supplier payments.',
    po_approvals: pendingPOs.length ? `POs pending approval:\n${pendingPOs.join('\n')}` : 'No POs pending approval.',
    project_spend: `Project spend summary:\n${projSpend.join('\n')}`,
    follow_up: followUp,
    unpaid_over_5k: big.length ? `Unpaid invoices above S$5,000:\n${big.join('\n')}` : 'No unpaid invoices above S$5,000.',
  }
}
