// ============================================================
// Analytics.tsx — SOL financial dashboard + charts
// ============================================================
import React, { useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { lamportsToSol } from '../lib/contract'
import { useTaskStore } from '../context/TaskStoreContext'

/* ── Tiny SVG bar-chart component ── */
const BarChart: React.FC<{ data: { label: string; value: number; color?: string }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.value), 0.001)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
          <span style={{ fontSize: '0.65rem', color: '#5a8a70' }}>◎{d.value.toFixed(2)}</span>
          <div style={{
            width: '100%',
            height: `${Math.max((d.value / max) * 90, 4)}px`,
            background: d.color ?? 'linear-gradient(180deg, #14F195, #0aad6a)',
            borderRadius: '4px 4px 0 0',
            transition: 'height 0.5s ease',
            boxShadow: `0 0 12px ${d.color ?? 'rgba(20,241,149,0.3)'}`,
          }} />
          <span style={{ fontSize: '0.65rem', color: '#5a8a70', textAlign: 'center', wordBreak: 'break-word' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Stat card ── */
const StatCard: React.FC<{ label: string; value: string; sub?: string; glow?: string }> = ({ label, value, sub, glow }) => (
  <div style={{
    background: 'rgba(20,241,149,0.04)',
    border: `1px solid ${glow ?? 'rgba(20,241,149,0.2)'}`,
    borderRadius: 12,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    boxShadow: `0 0 20px ${glow ?? 'rgba(20,241,149,0.06)'}`,
  }}>
    <div style={{ fontSize: '0.72rem', color: '#5a8a70', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e0ffe8', fontFamily: "'Share Tech Mono', monospace" }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: '#2a5040' }}>{sub}</div>}
  </div>
)

export const Analytics: React.FC = () => {
  const { publicKey, connected } = useWallet()
  const { tasks: all } = useTaskStore()

  const { clientStats, expertStats, categoryData, timelineData, global, leaderboard } = useMemo(() => {
    const pk  = publicKey?.toBase58() ?? ''

    // Global stats
    const totalTasks     = all.length
    const totalSolLocked = all.filter(t => t.status !== 'cancelled').reduce((a, t) => a + lamportsToSol(t.lamports), 0)
    const completedCount = all.filter(t => t.status === 'completed').length

    // Client stats
    const myTasks       = all.filter(t => t.creator === pk)
    const solSpent      = myTasks.filter(t => t.status === 'completed').reduce((a, t) => a + lamportsToSol(t.lamports), 0)
    const solInEscrow   = myTasks.filter(t => t.status === 'open' || t.status === 'in_progress').reduce((a, t) => a + lamportsToSol(t.lamports), 0)

    // Expert stats
    const myJobs       = all.filter(t => t.helper === pk)
    const solEarned    = myJobs.filter(t => t.status === 'completed').reduce((a, t) => a + lamportsToSol(t.lamports), 0)
    const activeJobs   = myJobs.filter(t => t.status === 'in_progress').length
    const completedJobs = myJobs.filter(t => t.status === 'completed').length

    // Category breakdown
    const catMap: Record<string, number> = {}
    all.forEach(t => { catMap[t.category] = (catMap[t.category] ?? 0) + lamportsToSol(t.lamports) })
    const categoryData = Object.entries(catMap).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)

    // Timeline (last 7 days tasks)
    const now = Date.now()
    const timelineData = Array.from({ length: 7 }, (_, i) => {
      const dayStart = now - (6 - i) * 86400000
      const dayEnd   = dayStart + 86400000
      const dayTasks = all.filter(t => t.createdAt >= dayStart && t.createdAt < dayEnd)
      const sol      = dayTasks.reduce((a, t) => a + lamportsToSol(t.lamports), 0)
      const date     = new Date(dayStart)
      return { label: date.toLocaleDateString('en', { weekday: 'short' }), value: sol }
    })

    // Top Experts Leaderboard
    const expertMap: Record<string, { sol: number; count: number }> = {}
    all.filter(t => t.status === 'completed' && t.helper).forEach(t => {
      const h = t.helper!
      if (!expertMap[h]) expertMap[h] = { sol: 0, count: 0 }
      expertMap[h].sol += lamportsToSol(t.lamports)
      expertMap[h].count += 1
    })
    const leaderboard = Object.entries(expertMap)
      .map(([address, stats]) => ({ address, ...stats }))
      .sort((a, b) => b.sol - a.sol)
      .slice(0, 5)

    return {
      global:       { totalTasks, totalSolLocked, completedCount },
      clientStats:  { myTasks: myTasks.length, solSpent, solInEscrow },
      expertStats:  { myJobs: myJobs.length, solEarned, activeJobs, completedJobs },
      categoryData,
      timelineData,
      leaderboard,
    }
  }, [publicKey, all])

  if (!connected) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 100 }}>
      <h2 style={{ color: '#e0ffe8', marginBottom: 12 }}>Analytics Dashboard</h2>
      <p style={{ color: '#5a8a70', marginBottom: 24 }}>Connect your wallet to see your personal SOL analytics.</p>
      <WalletMultiButton />
    </div>
  )

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#14F195', margin: 0, fontFamily: "'Share Tech Mono', monospace" }}>
              Analytics
            </h1>
          </div>
          <p style={{ color: '#5a8a70', fontSize: '0.95rem' }}>Real-time financial intelligence for the Tasky ecosystem.</p>
        </div>

        {/* Global Platform Stats */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: '1rem', color: '#5a8a70', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Platform Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <StatCard label="Total Tasks" value={String(global.totalTasks)} sub="All time" />
            <StatCard label="SOL Flowing" value={`◎ ${global.totalSolLocked.toFixed(3)}`} sub="Active escrow value" glow="rgba(20,241,149,0.15)" />
            <StatCard label="Completed" value={String(global.completedCount)} sub="Successfully released" />
            <StatCard label="Success Rate" value={global.totalTasks > 0 ? `${Math.round((global.completedCount / global.totalTasks) * 100)}%` : '—'} sub="Tasks resolved" />
          </div>
        </section>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 48 }}>
          {/* 7-day timeline */}
          <div style={{ background: 'rgba(20,241,149,0.03)', border: '1px solid rgba(20,241,149,0.15)', borderRadius: 14, padding: 24 }}>
            <h3 style={{ color: '#e0ffe8', fontSize: '0.9rem', fontWeight: 700, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SOL Activity — 7 Days
            </h3>
            {timelineData.every(d => d.value === 0)
              ? <div style={{ textAlign: 'center', color: '#2a5040', padding: '40px 0', fontSize: '0.85rem' }}>No activity in past 7 days</div>
              : <BarChart data={timelineData} />
            }
          </div>

          {/* Category breakdown */}
          <div style={{ background: 'rgba(20,241,149,0.03)', border: '1px solid rgba(20,241,149,0.15)', borderRadius: 14, padding: 24 }}>
            <h3 style={{ color: '#e0ffe8', fontSize: '0.9rem', fontWeight: 700, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SOL by Category
            </h3>
            {categoryData.length === 0
              ? <div style={{ textAlign: 'center', color: '#2a5040', padding: '40px 0', fontSize: '0.85rem' }}>No tasks posted yet</div>
              : <BarChart data={categoryData} />
            }
          </div>
        </div>

        {/* My Stats — Client + Expert side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Client Breakdown */}
          <div style={{ background: 'rgba(20,241,149,0.03)', border: '1px solid rgba(20,241,149,0.15)', borderRadius: 14, padding: 24 }}>
            <h3 style={{ color: '#14F195', fontSize: '0.9rem', fontWeight: 700, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              My Client Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Tasks Posted',  val: String(clientStats.myTasks) },
                { label: 'SOL Paid Out',  val: `◎ ${clientStats.solSpent.toFixed(3)}` },
                { label: 'SOL in Escrow', val: `◎ ${clientStats.solInEscrow.toFixed(3)}` },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(20,241,149,0.08)' }}>
                  <span style={{ fontSize: '0.82rem', color: '#5a8a70' }}>{r.label}</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e0ffe8', fontFamily: "'Share Tech Mono', monospace" }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expert Breakdown */}
          <div style={{ background: 'rgba(20,241,149,0.03)', border: '1px solid rgba(20,241,149,0.15)', borderRadius: 14, padding: 24 }}>
            <h3 style={{ color: '#14F195', fontSize: '0.9rem', fontWeight: 700, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              My Expert Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Jobs Accepted',  val: String(expertStats.myJobs) },
                { label: 'Active Jobs',    val: String(expertStats.activeJobs) },
                { label: 'Completed Jobs', val: String(expertStats.completedJobs) },
                { label: 'Total Earned',   val: `◎ ${expertStats.solEarned.toFixed(3)}` },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(20,241,149,0.08)' }}>
                  <span style={{ fontSize: '0.82rem', color: '#5a8a70' }}>{r.label}</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e0ffe8', fontFamily: "'Share Tech Mono', monospace" }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Experts Leaderboard */}
        <section style={{ marginTop: 48, marginBottom: 80 }}>
          <h2 style={{ fontSize: '1rem', color: '#5a8a70', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Top Experts Leaderboard</h2>
          <div style={{ background: 'rgba(20,241,149,0.03)', border: '1px solid rgba(20,241,149,0.15)', borderRadius: 14, overflow: 'hidden' }}>
            {leaderboard.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#2a5040' }}>No tasks completed yet. Be the first to earn SOL!</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(20,241,149,0.05)', borderBottom: '1px solid rgba(20,241,149,0.1)' }}>
                    <th style={{ padding: '14px 20px', fontSize: '0.72rem', color: '#5a8a70', fontWeight: 600 }}>RANK</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.72rem', color: '#5a8a70', fontWeight: 600 }}>EXPERT ADDRESS</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.72rem', color: '#5a8a70', fontWeight: 600, textAlign: 'center' }}>TASKS</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.72rem', color: '#5a8a70', fontWeight: 600, textAlign: 'right' }}>TOTAL EARNED</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((ex, i) => (
                    <tr key={ex.address} style={{ borderBottom: i === leaderboard.length - 1 ? 'none' : '1px solid rgba(20,241,149,0.06)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ 
                          width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: i === 0 ? '#14F195' : i === 1 ? 'rgba(20,241,149,0.7)' : 'rgba(20,241,149,0.3)',
                          color: '#010a04', fontSize: '0.75rem', fontWeight: 800
                        }}>{i + 1}</span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.88rem', color: '#e0ffe8', fontFamily: 'monospace' }}>
                        {ex.address.slice(0, 12)}...{ex.address.slice(-8)}
                        {ex.address === publicKey?.toBase58() && <span style={{ marginLeft: 8, fontSize: '0.65rem', background: 'rgba(20,241,149,0.15)', color: '#14F195', padding: '2px 6px', borderRadius: 4 }}>YOU</span>}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: '#5a8a70', textAlign: 'center' }}>{ex.count}</td>
                      <td style={{ padding: '16px 20px', fontSize: '1rem', color: '#14F195', fontWeight: 700, textAlign: 'right', fontFamily: "'Share Tech Mono', monospace" }}>
                        ◎ {ex.sol.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
