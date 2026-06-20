// Shown when the procurement tables are empty / not created yet (server component).
export default function Empty() {
  return (
    <div className="empty">
      No procurement data yet — run the SQL from <code>supabase/procurement.sql</code> in your
      Supabase SQL editor, make sure your <code>.env</code> keys are set, then refresh.
    </div>
  )
}
