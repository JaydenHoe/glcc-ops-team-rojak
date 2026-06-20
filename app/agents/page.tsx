import { loadAll, agentAnswers } from '@/lib/procurement'
import Empty from '@/app/_components/Empty'
import AgentPanel from './AgentPanel'

export const dynamic = 'force-dynamic'

// Server component — computes the agent's answers from seeded data (service_role
// stays server-side) and hands the plain strings to the client <AgentPanel>.
export default async function Agent() {
  const db = await loadAll()
  return (
    <>
      <h1 className="ph">AI Procurement Agent</h1>
      <p className="cap">Your procurement assistant — summaries, follow-ups &amp; alerts</p>
      {!db.ok ? <Empty /> : <AgentPanel answers={agentAnswers(db)} />}
    </>
  )
}
