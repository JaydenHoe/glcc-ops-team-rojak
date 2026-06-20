import { loadAll } from '@/lib/procurement'
import Empty from '@/app/_components/Empty'
import NewPRForm from './NewPRForm'

export const dynamic = 'force-dynamic'

export default async function NewPR() {
  const db = await loadAll()
  if (!db.ok) return (
    <><h1 className="ph">New purchase requisition</h1><p className="cap">Raise a PR for approval</p><Empty /></>
  )

  const projects = db.projects.map(p => ({ id: p.id, name: p.name }))
  const materials = db.materials.map(m => ({ id: m.id, name: m.name, unit: m.unit, estimated_unit_cost: m.estimated_unit_cost }))

  return (
    <>
      <h1 className="ph">New purchase requisition</h1>
      <p className="cap">Raise a PR — it goes to the Approvals queue for sign-off</p>
      <NewPRForm projects={projects} materials={materials} />
    </>
  )
}
