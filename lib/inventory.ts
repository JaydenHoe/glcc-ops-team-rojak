import { supabase, supabaseConfigured } from './supabase'

// Inventory data layer. Server-only (service_role). The Inventory tab + the
// digest low-stock alert read through here. Separate file so the procurement
// tabs are untouched.
export type Inv = {
  id: number
  project_id: number | null
  material_id: number | null
  item_name: string
  unit: string | null
  quantity: number
  reorder_level: number
  location: string | null
}

export async function loadInventory(): Promise<{ ok: boolean; rows: Inv[]; projects: { id: number; name: string }[]; cost: Record<number, number> }> {
  if (!supabaseConfigured) return { ok: false, rows: [], projects: [], cost: {} }
  try {
    const [inv, proj, mat] = await Promise.all([
      supabase.from('inventory').select('*').order('item_name'),
      supabase.from('projects').select('id,name'),
      supabase.from('materials').select('id,estimated_unit_cost'),
    ])
    if (inv.error) {
      console.warn('[inventory] read failed (did you run supabase/inventory.sql?):', inv.error.message)
      return { ok: false, rows: [], projects: [], cost: {} }
    }
    const cost: Record<number, number> = {}
    for (const m of mat.data ?? []) cost[m.id] = Number(m.estimated_unit_cost)
    return { ok: true, rows: (inv.data ?? []) as Inv[], projects: proj.data ?? [], cost }
  } catch (e) {
    console.warn('[inventory] loadInventory error:', (e as Error).message)
    return { ok: false, rows: [], projects: [], cost: {} }
  }
}

export function stockStatus(r: Inv): 'ok' | 'low' | 'out' {
  if (Number(r.quantity) <= 0) return 'out'
  if (Number(r.quantity) <= Number(r.reorder_level)) return 'low'
  return 'ok'
}
