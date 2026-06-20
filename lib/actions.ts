'use server'
import { supabase } from './supabase'
import { revalidatePath } from 'next/cache'

// ============================================================
// Phase-2 workflow actions (writes). Server-only — they run with the
// service_role client, so the browser never touches the database directly.
// Flow: createPR → approvePR → createPOFromPR → approvePO.
// ============================================================

const today = () => new Date().toISOString().slice(0, 10)

function revalidateAll() {
  for (const p of ['/', '/tasks', '/pipeline', '/money', '/projects', '/contacts']) revalidatePath(p)
}

export type PRItemInput = {
  material_id: number | null
  description: string
  quantity: number
  unit: string
  estimated_unit_cost: number
}
export type PRInput = {
  project_id: number | null
  requested_by: string
  required_date: string | null
  priority: string
  description: string
  items: PRItemInput[]
}

// 1) Create a Purchase Requisition (lands as `submitted`, awaiting approval).
export async function createPR(input: PRInput): Promise<{ ok: boolean; error?: string; pr_number?: string }> {
  try {
    if (!input.requested_by) return { ok: false, error: 'Please choose who is requesting.' }
    const items = input.items.filter(it => Number(it.quantity) > 0)
    if (items.length === 0) return { ok: false, error: 'Add at least one line item with a quantity.' }

    const estimated_total = items.reduce((s, it) => s + Number(it.quantity) * Number(it.estimated_unit_cost), 0)
    const { data: last } = await supabase.from('purchase_requisitions').select('id').order('id', { ascending: false }).limit(1).maybeSingle()
    const pr_number = `PR-2026-${String((last?.id ?? 0) + 1).padStart(3, '0')}`

    const { data: pr, error } = await supabase.from('purchase_requisitions').insert({
      pr_number,
      project_id: input.project_id,
      requested_by: input.requested_by,
      required_date: input.required_date || null,
      status: 'submitted',
      priority: input.priority || 'normal',
      description: input.description || null,
      estimated_total,
    }).select('id').single()
    if (error) return { ok: false, error: error.message }

    const rows = items.map(it => ({
      pr_id: pr.id,
      material_id: it.material_id,
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      estimated_unit_cost: it.estimated_unit_cost,
      estimated_total: Number(it.quantity) * Number(it.estimated_unit_cost),
    }))
    const { error: e2 } = await supabase.from('purchase_requisition_items').insert(rows)
    if (e2) return { ok: false, error: e2.message }

    revalidateAll()
    return { ok: true, pr_number }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// 2) Approve / reject a PR (the Managing Director step).
export async function approvePR(id: number): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('purchase_requisitions').update({ status: 'approved' }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidateAll()
  return { ok: true }
}
export async function rejectPR(id: number): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('purchase_requisitions').update({ status: 'rejected' }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidateAll()
  return { ok: true }
}

// 3) Turn an approved PR into a Purchase Order (one click — items + supplier
//    carried over; supplier defaults to the first item's preferred supplier).
export async function createPOFromPR(prId: number): Promise<{ ok: boolean; error?: string; po_number?: string }> {
  try {
    const { data: pr, error: e0 } = await supabase.from('purchase_requisitions').select('*').eq('id', prId).single()
    if (e0 || !pr) return { ok: false, error: e0?.message ?? 'PR not found' }

    const { data: items } = await supabase.from('purchase_requisition_items').select('*').eq('pr_id', prId)
    const its = items ?? []

    let supplierId: number | null = null
    if (its[0]?.material_id) {
      const { data: mat } = await supabase.from('materials').select('preferred_supplier_id').eq('id', its[0].material_id).maybeSingle()
      supplierId = mat?.preferred_supplier_id ?? null
    }
    if (!supplierId) {
      const { data: s } = await supabase.from('suppliers').select('id').order('id').limit(1).maybeSingle()
      supplierId = s?.id ?? null
    }

    const total = its.reduce((s, it) => s + Number(it.estimated_total || 0), 0)
    const { data: last } = await supabase.from('purchase_orders').select('id').order('id', { ascending: false }).limit(1).maybeSingle()
    const po_number = `PO-2026-${String((last?.id ?? 0) + 1).padStart(3, '0')}`

    const { data: po, error } = await supabase.from('purchase_orders').insert({
      po_number,
      project_id: pr.project_id,
      supplier_id: supplierId,
      pr_id: prId,
      po_date: today(),
      delivery_due_date: pr.required_date ?? null,
      status: 'approved',
      approval_status: 'pending',
      total_amount: total,
    }).select('id').single()
    if (error) return { ok: false, error: error.message }

    if (its.length) {
      const rows = its.map(it => ({
        po_id: po.id,
        material_id: it.material_id,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.estimated_unit_cost,
        line_total: it.estimated_total,
      }))
      await supabase.from('purchase_order_items').insert(rows)
    }

    revalidateAll()
    return { ok: true, po_number }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// 4) Approve / reject a PO (the PO's own sign-off).
export async function approvePO(id: number): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('purchase_orders').update({ approval_status: 'approved', approved_by: 'Managing Director' }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidateAll()
  return { ok: true }
}
export async function rejectPO(id: number): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('purchase_orders').update({ approval_status: 'rejected' }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidateAll()
  return { ok: true }
}

// 5) Add a supplier.
export type SupplierInput = { company_name: string; trade_category: string; contact_person: string; email: string; phone: string; payment_terms: string; rating: number }
export async function createSupplier(input: SupplierInput): Promise<{ ok: boolean; error?: string }> {
  if (!input.company_name.trim()) return { ok: false, error: 'Company name is required.' }
  const { error } = await supabase.from('suppliers').insert({ ...input, rating: Number(input.rating) || 0, status: 'active' })
  if (error) return { ok: false, error: error.message }
  revalidateAll()
  return { ok: true }
}

// 6) Add a material to the catalog.
export type MaterialInput = { name: string; category: string; unit: string; estimated_unit_cost: number; preferred_supplier_id: number | null }
export async function createMaterial(input: MaterialInput): Promise<{ ok: boolean; error?: string }> {
  if (!input.name.trim()) return { ok: false, error: 'Material name is required.' }
  const { error } = await supabase.from('materials').insert({ ...input, estimated_unit_cost: Number(input.estimated_unit_cost) || 0 })
  if (error) return { ok: false, error: error.message }
  revalidateAll()
  return { ok: true }
}

// 7) Request a quote (RFQ) from a supplier for a PR.
export async function createRFQ(prId: number, supplierId: number, dueDate: string | null): Promise<{ ok: boolean; error?: string; rfq_number?: string }> {
  if (!prId || !supplierId) return { ok: false, error: 'Pick a PR and a supplier.' }
  const { data: last } = await supabase.from('rfqs').select('id').order('id', { ascending: false }).limit(1).maybeSingle()
  const rfq_number = `RFQ-2026-${String((last?.id ?? 0) + 1).padStart(3, '0')}`
  const { error } = await supabase.from('rfqs').insert({ rfq_number, pr_id: prId, supplier_id: supplierId, status: 'sent', sent_date: today(), due_date: dueDate || null })
  if (error) return { ok: false, error: error.message }
  revalidateAll()
  return { ok: true, rfq_number }
}

// 8) Create a PO directly (not from a PR).
export type POItemInput = { material_id: number | null; description: string; quantity: number; unit: string; unit_price: number }
export type POInput = { project_id: number | null; supplier_id: number | null; delivery_due_date: string | null; items: POItemInput[] }
export async function createPO(input: POInput): Promise<{ ok: boolean; error?: string; po_number?: string }> {
  if (!input.supplier_id) return { ok: false, error: 'Choose a supplier.' }
  const items = input.items.filter(it => Number(it.quantity) > 0)
  if (items.length === 0) return { ok: false, error: 'Add at least one line item.' }
  const total = items.reduce((s, it) => s + Number(it.quantity) * Number(it.unit_price), 0)
  const { data: last } = await supabase.from('purchase_orders').select('id').order('id', { ascending: false }).limit(1).maybeSingle()
  const po_number = `PO-2026-${String((last?.id ?? 0) + 1).padStart(3, '0')}`
  const { data: po, error } = await supabase.from('purchase_orders').insert({
    po_number, project_id: input.project_id, supplier_id: input.supplier_id, po_date: today(),
    delivery_due_date: input.delivery_due_date || null, status: 'approved', approval_status: 'pending', total_amount: total,
  }).select('id').single()
  if (error) return { ok: false, error: error.message }
  const rows = items.map(it => ({ po_id: po.id, material_id: it.material_id, description: it.description, quantity: it.quantity, unit: it.unit, unit_price: it.unit_price, line_total: Number(it.quantity) * Number(it.unit_price) }))
  await supabase.from('purchase_order_items').insert(rows)
  revalidateAll()
  return { ok: true, po_number }
}

// 9) Log a goods-receipt delivery against a PO (one click) → PO becomes 'delivered'.
export async function logDelivery(poId: number): Promise<{ ok: boolean; error?: string }> {
  const { data: po } = await supabase.from('purchase_orders').select('po_number').eq('id', poId).single()
  const ref = (po?.po_number ?? 'PO-0000').replace('PO-', 'DO-')
  const { error } = await supabase.from('deliveries').insert({ po_id: poId, delivery_order_number: ref, received_date: today(), status: 'received', received_by: 'Site Office', remarks: 'Goods received in full' })
  if (error) return { ok: false, error: error.message }
  await supabase.from('purchase_orders').update({ status: 'delivered' }).eq('id', poId)
  revalidateAll()
  return { ok: true }
}

// 10) Record a supplier invoice for a delivered PO (one click) → PO becomes 'invoiced'.
export async function recordInvoice(poId: number): Promise<{ ok: boolean; error?: string; invoice_number?: string }> {
  const { data: po } = await supabase.from('purchase_orders').select('*').eq('id', poId).single()
  if (!po) return { ok: false, error: 'PO not found' }
  const { data: last } = await supabase.from('invoices').select('id').order('id', { ascending: false }).limit(1).maybeSingle()
  const invoice_number = `INV-2026-${String((last?.id ?? 0) + 1).padStart(3, '0')}`
  const due = new Date(); due.setDate(due.getDate() + 30)
  const { error } = await supabase.from('invoices').insert({
    invoice_number, po_id: poId, supplier_id: po.supplier_id, invoice_date: today(),
    due_date: due.toISOString().slice(0, 10), amount: po.total_amount, status: 'pending',
  })
  if (error) return { ok: false, error: error.message }
  await supabase.from('purchase_orders').update({ status: 'invoiced' }).eq('id', poId)
  revalidateAll()
  return { ok: true, invoice_number }
}

// 11) Mark an invoice paid → its PO becomes 'paid' too.
export async function markInvoicePaid(id: number): Promise<{ ok: boolean; error?: string }> {
  const { data: inv } = await supabase.from('invoices').select('po_id').eq('id', id).single()
  const { error } = await supabase.from('invoices').update({ status: 'paid', paid_date: today() }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  if (inv?.po_id) await supabase.from('purchase_orders').update({ status: 'paid' }).eq('id', inv.po_id)
  revalidateAll()
  return { ok: true }
}
