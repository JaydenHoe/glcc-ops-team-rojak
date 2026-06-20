'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPR, type PRItemInput } from '@/lib/actions'
import { SITE_ENGINEERS, PRIORITIES } from '@/lib/team'

type Project = { id: number; name: string }
type Material = { id: number; name: string; unit: string | null; estimated_unit_cost: number }

const blankItem = (): PRItemInput => ({ material_id: null, description: '', quantity: 1, unit: '', estimated_unit_cost: 0 })

export default function NewPRForm({ projects, materials }: { projects: Project[]; materials: Material[] }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<number | null>(projects[0]?.id ?? null)
  const [requestedBy, setRequestedBy] = useState(SITE_ENGINEERS[0])
  const [requiredDate, setRequiredDate] = useState('')
  const [priority, setPriority] = useState('normal')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<PRItemInput[]>([blankItem()])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  function setItem(i: number, patch: Partial<PRItemInput>) {
    setItems(prev => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }
  function pickMaterial(i: number, materialId: number) {
    const m = materials.find(x => x.id === materialId)
    if (!m) return setItem(i, { material_id: null })
    setItem(i, { material_id: m.id, description: m.name, unit: m.unit ?? '', estimated_unit_cost: Number(m.estimated_unit_cost) })
  }

  const total = items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.estimated_unit_cost || 0), 0)

  async function submit() {
    setErr(''); setBusy(true)
    const res = await createPR({ project_id: projectId, requested_by: requestedBy, required_date: requiredDate || null, priority, description, items })
    setBusy(false)
    if (!res.ok) { setErr(res.error ?? 'Could not create the PR'); return }
    router.push('/tasks')
  }

  return (
    <div className="form">
      <div className="field">
        <label>Project / site</label>
        <select className="select" value={projectId ?? ''} onChange={e => setProjectId(Number(e.target.value))}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="field">
        <label>Requested by (site engineer)</label>
        <select className="select" value={requestedBy} onChange={e => setRequestedBy(e.target.value)}>
          {SITE_ENGINEERS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="field-2">
        <div className="field">
          <label>Required date</label>
          <input className="input" type="date" value={requiredDate} onChange={e => setRequiredDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Priority</label>
          <select className="select" value={priority} onChange={e => setPriority(e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label>Description</label>
        <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Soil &amp; waste piping for Tower A risers" />
      </div>

      <div className="field">
        <label>Line items</label>
        {items.map((it, i) => (
          <div className="item-row" key={i}>
            <select className="select" value={it.material_id ?? ''} onChange={e => pickMaterial(i, Number(e.target.value))}>
              <option value="">Select material…</option>
              {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input className="input" type="number" min={0} value={it.quantity} onChange={e => setItem(i, { quantity: Number(e.target.value) })} aria-label="Quantity" />
            <input className="input" value={it.unit} onChange={e => setItem(i, { unit: e.target.value })} aria-label="Unit" placeholder="unit" />
            <input className="input" type="number" min={0} step="0.01" value={it.estimated_unit_cost} onChange={e => setItem(i, { estimated_unit_cost: Number(e.target.value) })} aria-label="Unit cost" />
            <button type="button" className="x" onClick={() => setItems(items.filter((_, idx) => idx !== i))} aria-label="Remove line">×</button>
          </div>
        ))}
        <button type="button" className="btn sm ghost" onClick={() => setItems([...items, blankItem()])}>+ Add line</button>
      </div>

      <p className="cap" style={{ margin: 0 }}>Estimated total: <strong>S${total.toLocaleString('en-SG')}</strong></p>

      {err && <p className="form-err">{err}</p>}

      <div className="row-actions">
        <button className="btn" disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit PR for approval'}</button>
        <button className="btn ghost" type="button" onClick={() => router.push('/tasks')}>Cancel</button>
      </div>
    </div>
  )
}
