import { sendMessage } from '@/lib/telegram'
import { loadAll, dashboard, money, isOverdue } from '@/lib/procurement'

export const dynamic = 'force-dynamic'

// Cloud cron route: Vercel Cron hits this daily at 00:00 UTC (08:00 SGT/UTC+8)
// and texts the owner a morning procurement digest. Secured with CRON_SECRET —
// when that env var is set, Vercel sends it as a Bearer token and we reject
// anyone else. Reuses TELEGRAM_BOT_TOKEN + OWNER_CHAT_ID.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('forbidden', { status: 401 })
  }

  const db = await loadAll()
  if (!db.ok) return Response.json({ ok: false, reason: 'no_data — run supabase/procurement.sql and check env keys' })

  const d = dashboard(db)
  const supplierName = (id: number | null) => db.suppliers.find(x => x.id === id)?.company_name ?? '—'
  const overdueDeliveries = db.pos.filter(p => ['approved', 'partially_delivered'].includes(p.status) && isOverdue(p.delivery_due_date))
  const overdueInvoices = db.invoices.filter(i => i.status === 'overdue' || (i.status === 'pending' && isOverdue(i.due_date)))

  const dateStr = new Date().toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'short' })
  const msg =
    `☀️ <b>Evermount — morning procurement digest</b>\n` +
    `<i>${dateStr}</i>\n\n` +
    `📋 Open PRs: <b>${d.openPRs}</b>\n` +
    `🖊️ POs awaiting approval: <b>${d.posAwaitingApproval}</b>\n` +
    `🚚 Overdue deliveries: <b>${d.overdueDeliveries}</b>\n` +
    `💰 Outstanding payments: <b>${money(d.outstandingTotal)}</b>\n` +
    `📊 Spend vs budget: <b>${d.budgetPct}%</b> (${money(d.committed)} of ${money(d.totalBudget)})\n` +
    (overdueDeliveries.length ? `\n🔴 <b>Chase deliveries:</b>\n` + overdueDeliveries.map(p => `• ${p.po_number} — ${supplierName(p.supplier_id)} (due ${p.delivery_due_date})`).join('\n') : '') +
    (overdueInvoices.length ? `\n💸 <b>Overdue payments:</b>\n` + overdueInvoices.map(i => `• ${i.invoice_number} — ${money(i.amount)} (${supplierName(i.supplier_id)})`).join('\n') : '') +
    (!overdueDeliveries.length && !overdueInvoices.length ? `\n✅ Nothing overdue today.` : '')

  const owner = process.env.OWNER_CHAT_ID
  if (owner) await sendMessage(owner, msg)

  return Response.json({ ok: true, sent: Boolean(owner), preview: msg })
}
