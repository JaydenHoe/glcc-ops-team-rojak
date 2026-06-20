'use client'
import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { approvePR, rejectPR, createPOFromPR, approvePO, rejectPO } from '@/lib/actions'

// Small client buttons that call the Phase-2 server actions and refresh the
// page. `kind` picks which buttons to show for the row.
export default function RowActions({ kind, id }: { kind: 'pr' | 'topo' | 'po'; id: number }) {
  const [pending, start] = useTransition()
  const [err, setErr] = useState('')
  const router = useRouter()

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setErr('')
      const res = await fn()
      if (!res.ok) setErr(res.error ?? 'Something went wrong')
      else router.refresh()
    })

  return (
    <div className="row-actions">
      {kind === 'pr' && (
        <>
          <button className="btn sm" disabled={pending} onClick={() => run(() => approvePR(id))}>Approve</button>
          <button className="btn sm ghost" disabled={pending} onClick={() => run(() => rejectPR(id))}>Reject</button>
        </>
      )}
      {kind === 'topo' && (
        <button className="btn sm" disabled={pending} onClick={() => run(() => createPOFromPR(id))}>
          {pending ? 'Creating…' : 'Create PO'}
        </button>
      )}
      {kind === 'po' && (
        <>
          <button className="btn sm" disabled={pending} onClick={() => run(() => approvePO(id))}>Approve</button>
          <button className="btn sm ghost" disabled={pending} onClick={() => run(() => rejectPO(id))}>Reject</button>
        </>
      )}
      {err && <span className="form-err">{err}</span>}
    </div>
  )
}
