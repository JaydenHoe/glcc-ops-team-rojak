'use client'
import { useState } from 'react'

// Pure client UI. It receives PRECOMPUTED answers (built server-side from seeded
// data in lib/procurement.agentAnswers) so it never imports the service_role key.
// Phase 2 swaps these canned answers for a real /api call to the LLM agent.
const COMMANDS: { key: string; icon: string; label: string }[] = [
  { key: 'digest',           icon: '🧾', label: 'Give me the procurement digest' },
  { key: 'overdue_deliveries', icon: '🚚', label: 'What deliveries are overdue this week?' },
  { key: 'supplier_payments',  icon: '💸', label: 'Which supplier has the most outstanding invoices?' },
  { key: 'po_approvals',     icon: '✅', label: 'Summarise all POs pending approval' },
  { key: 'project_spend',    icon: '🏗️', label: 'What is the spend per project?' },
  { key: 'unpaid_over_5k',   icon: '🔎', label: 'Show me all unpaid invoices above S$5,000' },
  { key: 'follow_up',        icon: '✍️', label: 'Generate a supplier follow-up message' },
]

type Msg = { role: 'user' | 'bot'; text: string }

export default function AgentPanel({ answers }: { answers: Record<string, string> }) {
  const [log, setLog] = useState<Msg[]>([])

  function ask(cmd: { key: string; label: string }) {
    setLog(l => [...l, { role: 'user', text: cmd.label }, { role: 'bot', text: answers[cmd.key] ?? 'No data for that yet.' }])
  }

  return (
    <>
      <div className="agent-card" style={{ maxWidth: 'none', marginBottom: 18 }}>
        <p className="ac-name">🤖 Procurement Assistant <span className="tag proactive">preview</span></p>
        <p className="ac-role">
          Ask about your live procurement data. Tap a question below. (Phase 1 uses on-data answers;
          Phase 2 connects the live AI model + Telegram.)
        </p>
      </div>

      <div className="cmds">
        {COMMANDS.map(c => (
          <button key={c.key} className="cmd" onClick={() => ask(c)}>
            <span className="ico">{c.icon}</span>{c.label}
          </button>
        ))}
      </div>

      {log.length === 0 ? (
        <div className="chat-empty">Pick a question above to see the assistant answer from your data.</div>
      ) : (
        <div className="chatlog">
          {log.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div className="bubble">{m.text}</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
