// ============================================================
// Profile.tsx — User profile, stats, and badge collection
// ============================================================
import React, { useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { getAllTasks, lamportsToSol } from '../lib/contract'
import { useAI } from '../context/AIContext'

/* ── Reputation badge logic (shared with ExpertDashboard) ── */
function getRank(completed: number) {
  if (completed >= 10) return { label: 'Tasky Legend',    color: '#14F195', next: -1 }
  if (completed >= 6)  return { label: 'Elite Helper',    color: '#00ffaa', next: 10 }
  if (completed >= 3)  return { label: 'Verified Expert', color: '#14F195', next: 6 }
  if (completed >= 1)  return { label: 'Rising Star',     color: '#a0ffd0', next: 3 }
  return                      { label: 'Newcomer',        color: '#5a8a70', next: 1 }
}

export const Profile: React.FC = () => {
  const { publicKey, connected } = useWallet()
  const { activities } = useAI()

  const stats = useMemo(() => {
    if (!publicKey) return null
    const all = getAllTasks()
    const pk = publicKey.toBase58()
    
    const clientTasks = all.filter(t => t.creator === pk)
    const expertJobs  = all.filter(t => t.helper === pk)
    
    const earned = expertJobs.filter(t => t.status === 'completed').reduce((a, t) => a + lamportsToSol(t.lamports), 0)
    const spent  = clientTasks.filter(t => t.status === 'completed').reduce((a, t) => a + lamportsToSol(t.lamports), 0)
    
    return {
      earned,
      spent,
      completed: expertJobs.filter(t => t.status === 'completed').length,
      active: expertJobs.filter(t => t.status === 'in_progress').length,
      posted: clientTasks.length
    }
  }, [publicKey])

  if (!connected) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 100 }}>
      <h2 style={{ color: '#e0ffe8', marginBottom: 12 }}>User Profile</h2>
      <p style={{ color: '#5a8a70', marginBottom: 24 }}>Connect your wallet to view your identity on the Tasky network.</p>
      <WalletMultiButton />
    </div>
  )

  const rank = getRank(stats?.completed ?? 0)

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        
        {/* Header / Identity */}
        <section style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 48, background: 'rgba(20,241,149,0.04)', border: '1px solid rgba(20,241,149,0.15)', borderRadius: 20, padding: 32 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(20,241,149,0.1)', border: '2px solid #14F195', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, color: '#14F195', boxShadow: '0 0 30px rgba(20,241,149,0.2)' }}>
            {rank.label[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <span style={{ fontSize: '0.7rem', color: '#14F195', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{rank.label}</span>
              <span style={{ height: 1, flex: 1, background: 'rgba(20,241,149,0.15)' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e0ffe8', margin: 0, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {publicKey?.toBase58()}
            </h1>
          </div>
        </section>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 48 }}>
          {[
            { label: 'Total Earned', val: `◎ ${stats?.earned.toFixed(3)}` },
            { label: 'Total Spent',  val: `◎ ${stats?.spent.toFixed(3)}` },
            { label: 'Tasks Resolved', val: String(stats?.completed) },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(20,241,149,0.1)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#5a8a70', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#14F195', fontFamily: "'Share Tech Mono', monospace" }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Badge Collection */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: '1rem', color: '#5a8a70', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Badge Collection</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
            {[
              { name: 'Fast Responder', id: 'FR', req: 1 },
              { name: 'Bug Hunter', id: 'BH', req: 3 },
              { name: '5★ Guru', id: 'GR', req: 5 },
              { name: 'Tutor', id: 'TR', req: 2 },
              { name: 'Early Adopter', id: 'EA', req: 0 },
              { name: 'Solana Whale', id: 'SW', req: -1 }, // Secret
            ].map(b => {
              const unlocked = (stats?.completed ?? 0) >= b.req || b.req === 0
              return (
                <div key={b.name} style={{ 
                  background: unlocked ? 'rgba(20,241,149,0.06)' : 'rgba(255,255,255,0.02)', 
                  border: `1px solid ${unlocked ? 'rgba(20,241,149,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 14, padding: 20, textAlign: 'center', opacity: unlocked ? 1 : 0.4,
                  transition: 'transform 0.2s', cursor: 'default'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: unlocked ? '#14F195' : '#2a5040', marginBottom: 8, fontFamily: 'monospace' }}>
                    {`[${b.id}]`}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: unlocked ? '#e0ffe8' : '#5a8a70' }}>{b.name}</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 style={{ fontSize: '1rem', color: '#5a8a70', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Recent Network Activity</h2>
          <div style={{ background: 'rgba(20,241,149,0.03)', border: '1px solid rgba(20,241,149,0.1)', borderRadius: 14, padding: 20 }}>
            {activities.length === 0 ? (
              <div style={{ color: '#2a5040', fontSize: '0.85rem', textAlign: 'center' }}>No recent activity found.</div>
            ) : (
              activities.slice(0, 10).map(act => (
                <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(20,241,149,0.06)' }}>
                  <span style={{ fontSize: '0.85rem', color: '#e0ffe8' }}>{act.action}</span>
                  <span style={{ fontSize: '0.75rem', color: '#2a5040' }}>{new Date(act.timestamp).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
