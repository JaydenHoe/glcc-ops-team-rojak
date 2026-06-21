'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { consumeInventory } from '@/lib/actions'

// Site-engineer control: enter how many units were used on site → stock drops.
export default function InventoryUse({ id }: { id: number }) {
  const [qty, setQty] = useState(1)
  const [pending, start] = useTransition()
  const [err, setErr] = useState('')
  const router = useRouter()

  return (
    <div className="row-actions">
      <input
        className="input" style={{ width: 72 }} type="number" min={1} value={qty}
        onChange={e => setQty(Number(e.target.value))} aria-label="Quantity used"
      />
      <button
        className="btn sm" disabled={pending}
        onClick={() => start(async () => {
          setErr('')
          const res = await consumeInventory(id, qty)
          if (!res.ok) setErr(res.error ?? 'Failed')
          else router.refresh()
        })}
      >
        {pending ? '…' : 'Use'}
      </button>
      {err && <span className="form-err">{err}</span>}
    </div>
  )
}
