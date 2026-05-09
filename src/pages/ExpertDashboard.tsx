import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { getAllTasks, lamportsToSol, type Task } from '../lib/contract'

/* ── Reputation badge system ── */
function getRank(completed: number): { label: string; color: string; next: number } {
  if (completed >= 10) return { label: 'Tasky Legend',    color: '#14F195', next: -1 }
  if (completed >= 6)  return { label: 'Elite Helper',    color: '#00ffaa', next: 10 }
  if (completed >= 3)  return { label: 'Verified Expert', color: '#14F195', next: 6 }
  if (completed >= 1)  return { label: 'Rising Star',     color: '#a0ffd0', next: 3 }
  return                      { label: 'Newcomer',        color: '#5a8a70', next: 1 }
}

export const ExpertDashboard: React.FC = () => {
  const { publicKey, connected } = useWallet()
  const navigate = useNavigate()
  
  const [openTasks, setOpenTasks] = useState<Task[]>([])
  const [myJobs, setMyJobs] = useState<Task[]>([])

  useEffect(() => {
    if (publicKey) {
      const all = getAllTasks()
      const pk = publicKey.toBase58()
      
      // Tasks I can accept (Open, not created by me)
      setOpenTasks(all.filter(t => t.status === 'open' && t.creator !== pk).sort((a,b) => b.createdAt - a.createdAt))
      
      // Tasks I am working on or have completed (Helper is me)
      setMyJobs(all.filter(t => t.helper === pk).sort((a,b) => b.createdAt - a.createdAt))
    } else {
      setOpenTasks([])
      setMyJobs([])
    }
  }, [publicKey])

  if (!connected) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 100 }}>
        <h2 style={{ color: '#f0f0ff', marginBottom: 16 }}>Expert Portal</h2>
        <p style={{ color: '#8888aa', marginBottom: 24 }}>Connect your wallet to browse available tasks and track your earnings.</p>
        <WalletMultiButton />
      </div>
    )
  }

  const activeJobs = myJobs.filter(t => t.status === 'in_progress').length
  const totalEarned = myJobs.filter(t => t.status === 'completed').reduce((acc, t) => acc + t.lamports, 0)

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* Header Area */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#14F195', margin: 0 }}>Expert Portal</h1>
            </div>
            <p style={{ color: '#8888aa', fontSize: '1rem', maxWidth: 500 }}>
              Browse available tasks, communicate with clients, and track your SOL earnings.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
          <div className="card" style={{ padding: 20, textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f0f0ff' }}>{openTasks.length}</div>
            <div style={{ fontSize: '0.8rem', color: '#8888aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Now</div>
          </div>
          <div className="card" style={{ padding: 20, textAlign: 'center', background: 'rgba(153,69,255,0.05)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#9945FF' }}>{activeJobs}</div>
            <div style={{ fontSize: '0.8rem', color: '#8888aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Active Jobs</div>
          </div>
          <div className="card" style={{ padding: 20, textAlign: 'center', background: 'rgba(20,241,149,0.05)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#14F195' }}>◎ {lamportsToSol(totalEarned).toFixed(2)}</div>
            <div style={{ fontSize: '0.8rem', color: '#8888aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Earned</div>
          </div>
        </div>

        {/* ── Reputation Badge Card ── */}
        {(() => {
          const completedCount = myJobs.filter(t => t.status === 'completed').length
          const rank = getRank(completedCount)
          const progress = rank.next > 0 ? Math.min((completedCount / rank.next) * 100, 100) : 100
          return (
            <div style={{ marginBottom: 40, background: 'rgba(20,241,149,0.04)', border: `1px solid ${rank.color}33`, borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' as const }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(20,241,149,0.1)', border: `1px solid ${rank.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: rank.color }}>
                {rank.label[0]}
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: '0.7rem', color: '#5a8a70', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4 }}>Expert Rank</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: rank.color, fontFamily: "'Share Tech Mono', monospace", marginBottom: 8 }}>{rank.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 6, background: 'rgba(20,241,149,0.12)', borderRadius: 99 }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${rank.color}, #0aad6a)`, borderRadius: 99, transition: 'width 0.8s ease', boxShadow: `0 0 8px ${rank.color}` }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#5a8a70', whiteSpace: 'nowrap' as const }}>
                    {rank.next > 0 ? `${completedCount}/${rank.next} tasks` : 'Max rank!'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                {['Fast Responder','Bug Hunter','5★ Guru','Tutor'].slice(0, completedCount >= 1 ? Math.min(completedCount + 1, 4) : 0).map(badge => (
                  <span key={badge} style={{ background: 'rgba(20,241,149,0.08)', border: '1px solid rgba(20,241,149,0.25)', borderRadius: 999, padding: '3px 10px', fontSize: '0.68rem', color: '#14F195', fontWeight: 700 }}>{badge}</span>
                ))}
                {completedCount === 0 && <span style={{ fontSize: '0.8rem', color: '#2a5040' }}>Complete tasks to unlock badges</span>}
              </div>
            </div>
          )
        })()}

        {/* My Jobs Section */}
        {myJobs.length > 0 && (
          <div style={{ marginBottom: 48 }}>
             <h2 style={{ color: '#f0f0ff', marginBottom: 20, fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>My Active Jobs</h2>
             <div style={{ display: 'grid', gap: 16 }}>
               {myJobs.map(task => {
                  const sol = lamportsToSol(task.lamports)
                  const isIP = task.status === 'in_progress'
                  
                  return (
                    <div key={task.id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', borderLeft: isIP ? '4px solid #14F195' : '4px solid transparent' }} onClick={() => navigate(`/tasks/${task.id}`)}>
                       <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                             <span className="badge badge-purple">{task.category}</span>
                             <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8888aa', textTransform: 'uppercase' }}>
                                {task.status.replace('_',' ')}
                             </span>
                          </div>
                          <h3 style={{ color: '#f0f0ff', fontSize: '1.1rem', margin: 0 }}>{task.title}</h3>
                       </div>
                       <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 24 }}>
                          <div>
                             <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#9945FF' }}>◎ {sol.toFixed(3)}</div>
                             <div style={{ fontSize: '0.7rem', color: '#555577' }}>{task.status === 'completed' ? 'Paid' : 'Escrowed'}</div>
                          </div>
                          <div style={{ color: '#8888aa' }}>→</div>
                       </div>
                    </div>
                  )
               })}
             </div>
          </div>
        )}

        {/* Marketplace Section */}
        <h2 style={{ color: '#f0f0ff', marginBottom: 20, fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>Marketplace — Available Tasks</h2>
        
        {openTasks.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <h3 style={{ color: '#f0f0ff', marginBottom: 8 }}>No open tasks right now</h3>
            <p style={{ color: '#8888aa', marginBottom: 24 }}>Check back later for new tasks from clients.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {openTasks.map(task => {
               const sol = lamportsToSol(task.lamports)
               
               return (
                 <div key={task.id} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => navigate(`/tasks/${task.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <span className="badge badge-purple">{task.category}</span>
                       <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#14F195' }}>◎ {sol.toFixed(3)}</div>
                    </div>
                    <h3 style={{ color: '#f0f0ff', fontSize: '1.1rem', margin: 0, lineHeight: 1.4 }}>{task.title}</h3>
                    <p style={{ color: '#8888aa', fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                       {task.description}
                    </p>
                    <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: '#14F195', fontWeight: 600, fontSize: '0.9rem' }}>
                       View Details & Accept
                    </div>
                 </div>
               )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
