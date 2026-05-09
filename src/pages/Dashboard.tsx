// ============================================================
// Dashboard.tsx — Unified Client + Expert Dashboard with tabs
// ============================================================

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { lamportsToSol, type Task } from '../lib/contract'
import { useTaskStore } from '../context/TaskStoreContext'

/* ── Reputation badge system ── */
function getRank(completed: number): { label: string; color: string; next: number } {
  if (completed >= 10) return { label: 'Tasky Legend',    color: '#14F195', next: -1 }
  if (completed >= 6)  return { label: 'Elite Helper',    color: '#00ffaa', next: 10 }
  if (completed >= 3)  return { label: 'Verified Expert', color: '#14F195', next: 6 }
  if (completed >= 1)  return { label: 'Rising Star',     color: '#a0ffd0', next: 3 }
  return                      { label: 'Newcomer',        color: '#5a8a70', next: 1 }
}

type Tab = 'posted' | 'working'

export const Dashboard: React.FC = () => {
  const { publicKey, connected } = useWallet()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('posted')

  // Client state
  const [myPostedTasks, setMyPostedTasks] = useState<Task[]>([])

  // Expert state
  const [openTasks, setOpenTasks] = useState<Task[]>([])
  const [myJobs, setMyJobs]       = useState<Task[]>([])

  const { tasks: allTasks } = useTaskStore()

  const loadData = () => {
    if (!publicKey) return
    const pk  = publicKey.toBase58()

    setMyPostedTasks(allTasks.filter(t => t.creator === pk).sort((a, b) => b.createdAt - a.createdAt))
    setMyJobs(allTasks.filter(t => t.helper === pk).sort((a, b) => b.createdAt - a.createdAt))
    setOpenTasks(allTasks.filter(t => t.status === 'open' && t.creator !== pk).sort((a, b) => b.createdAt - a.createdAt))
  }

  useEffect(() => { loadData() }, [publicKey, allTasks])

  useEffect(() => { loadData() }, [publicKey, allTasks])

  /* ── Stats ── */
  const activePosted  = myPostedTasks.filter(t => t.status === 'open' || t.status === 'in_progress').length
  const totalSpent    = myPostedTasks.filter(t => t.status === 'completed').reduce((a, t) => a + t.lamports, 0)
  const activeJobs    = myJobs.filter(t => t.status === 'in_progress').length
  const totalEarned   = myJobs.filter(t => t.status === 'completed').reduce((a, t) => a + t.lamports, 0)
  const completedCount = myJobs.filter(t => t.status === 'completed').length
  const rank = getRank(completedCount)
  const progress = rank.next > 0 ? Math.min((completedCount / rank.next) * 100, 100) : 100

  if (!connected) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 100 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>◎</div>
        <h2 style={{ color: '#e0ffe8', marginBottom: 12 }}>My Dashboard</h2>
        <p style={{ color: '#8888aa', marginBottom: 28 }}>
          Connect your wallet to manage your tasks and find work.
        </p>
        <WalletMultiButton />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#14F195', margin: 0, fontFamily: "'Share Tech Mono', monospace" }}>
              My Dashboard
            </h1>
            <p style={{ color: '#8888aa', marginTop: 6 }}>
              You are both a <strong style={{ color: '#14F195' }}>Client</strong> and an <strong style={{ color: '#9945FF' }}>Expert</strong> — switch tabs below.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/create')}
            style={{ fontSize: '1rem', padding: '14px 28px' }}
          >
            + Post a Task
          </button>
        </div>

        {/* ── Summary Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 36 }}>
          {[
            { label: 'Tasks Posted',   value: myPostedTasks.length, color: '#e0ffe8' },
            { label: 'Active Posts',   value: activePosted,          color: '#14F195' },
            { label: 'SOL Spent',      value: `◎ ${lamportsToSol(totalSpent).toFixed(2)}`, color: '#14F195' },
            { label: 'Active Jobs',    value: activeJobs,            color: '#9945FF' },
            { label: 'SOL Earned',     value: `◎ ${lamportsToSol(totalEarned).toFixed(2)}`, color: '#14F195' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '16px 20px', textAlign: 'center', background: 'rgba(20,241,149,0.04)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, fontFamily: "'Share Tech Mono', monospace" }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#5a8a70', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tab Switcher ── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'rgba(20,241,149,0.04)', border: '1px solid rgba(20,241,149,0.12)', borderRadius: 12, padding: 4 }}>
          {([
            { key: 'posted',  label: 'My Posted Tasks',  count: myPostedTasks.length },
            { key: 'working', label: 'My Active Work',    count: myJobs.length },
          ] as { key: Tab; label: string; count: number }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
                background: tab === t.key ? 'linear-gradient(135deg, #14F195, #0aad6a)' : 'transparent',
                color: tab === t.key ? '#010a04' : '#5a8a70',
                boxShadow: tab === t.key ? '0 0 20px rgba(20,241,149,0.35)' : 'none',
              }}
            >
              {t.label}
              <span style={{
                marginLeft: 8,
                background: tab === t.key ? 'rgba(1,10,4,0.2)' : 'rgba(20,241,149,0.1)',
                color: tab === t.key ? '#010a04' : '#14F195',
                borderRadius: 999,
                padding: '2px 8px',
                fontSize: '0.75rem',
              }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════
            TAB 1 — MY POSTED TASKS (Client)
        ══════════════════════════════════ */}
        {tab === 'posted' && (
          <div>
            {myPostedTasks.length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <h3 style={{ color: '#e0ffe8', marginBottom: 8 }}>No tasks posted yet</h3>
                <p style={{ color: '#8888aa', marginBottom: 24 }}>Post your first task and an expert will help you.</p>
                <button className="btn btn-primary" onClick={() => navigate('/create')}>Post a Task</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {myPostedTasks.map(task => {
                  const sol = lamportsToSol(task.lamports)
                  const isIP = task.status === 'in_progress'
                  const isOpen = task.status === 'open'
                  const statusColor = { open: '#14F195', in_progress: '#ffaa44', completed: '#9945FF', cancelled: '#ff6060', disputed: '#ff4444' }[task.status] ?? '#8888aa'
                  return (
                    <div
                      key={task.id}
                      className="card"
                      style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer', borderLeft: `3px solid ${statusColor}` }}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span className="badge badge-green">{task.category}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span className={`status-dot ${task.status}`} />
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: statusColor, textTransform: 'uppercase' }}>
                                {task.status.replace('_', ' ')}
                              </span>
                            </span>
                          </div>
                          <h3 style={{ color: '#e0ffe8', fontSize: '1.1rem', margin: 0, lineHeight: 1.4 }}>{task.title}</h3>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#14F195' }}>◎ {sol.toFixed(3)}</div>
                        </div>
                      </div>

                      {isOpen && (
                        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: '0.83rem', color: '#5a8a70' }}>
                          Waiting for an expert to accept...
                        </div>
                      )}
                      {isIP && (
                        <div style={{ padding: '10px 14px', background: 'rgba(20,241,149,0.08)', borderRadius: 8, fontSize: '0.83rem', color: '#14F195', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Expert is working — review and release payment when ready.</span>
                          <span style={{ fontWeight: 800 }}>Review →</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════
            TAB 2 — MY ACTIVE WORK (Expert)
        ══════════════════════════════════ */}
        {tab === 'working' && (
          <div>
            {/* Reputation Badge */}
            <div style={{ marginBottom: 28, background: 'rgba(20,241,149,0.04)', border: `1px solid ${rank.color}33`, borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(20,241,149,0.1)', border: `2px solid ${rank.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, color: rank.color, flexShrink: 0 }}>
                {rank.label[0]}
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: '0.68rem', color: '#5a8a70', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Expert Rank</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: rank.color, fontFamily: "'Share Tech Mono', monospace", marginBottom: 8 }}>{rank.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 5, background: 'rgba(20,241,149,0.12)', borderRadius: 99 }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${rank.color}, #0aad6a)`, borderRadius: 99, transition: 'width 0.8s ease', boxShadow: `0 0 8px ${rank.color}` }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#5a8a70', whiteSpace: 'nowrap' }}>
                    {rank.next > 0 ? `${completedCount}/${rank.next} tasks` : 'Max rank!'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Fast Responder', 'Bug Hunter', '5★ Guru', 'Tutor'].slice(0, completedCount >= 1 ? Math.min(completedCount + 1, 4) : 0).map(badge => (
                  <span key={badge} style={{ background: 'rgba(20,241,149,0.08)', border: '1px solid rgba(20,241,149,0.25)', borderRadius: 999, padding: '3px 10px', fontSize: '0.68rem', color: '#14F195', fontWeight: 700 }}>{badge}</span>
                ))}
                {completedCount === 0 && <span style={{ fontSize: '0.8rem', color: '#2a5040' }}>Complete tasks to unlock badges</span>}
              </div>
            </div>

            {/* My Jobs */}
            {myJobs.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ color: '#e0ffe8', marginBottom: 16, fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10 }}>
                  Jobs I'm Working On
                </h2>
                <div style={{ display: 'grid', gap: 14 }}>
                  {myJobs.map(task => {
                    const sol = lamportsToSol(task.lamports)
                    const isIP = task.status === 'in_progress'
                    return (
                      <div key={task.id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderLeft: isIP ? '3px solid #9945FF' : '3px solid rgba(20,241,149,0.2)' }} onClick={() => navigate(`/tasks/${task.id}`)}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span className="badge badge-purple">{task.category}</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isIP ? '#9945FF' : '#14F195', textTransform: 'uppercase' }}>{task.status.replace('_', ' ')}</span>
                          </div>
                          <h3 style={{ color: '#e0ffe8', fontSize: '1.05rem', margin: 0 }}>{task.title}</h3>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 20 }}>
                          <div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#9945FF' }}>◎ {sol.toFixed(3)}</div>
                            <div style={{ fontSize: '0.68rem', color: '#555577' }}>{task.status === 'completed' ? 'Paid out' : 'In escrow'}</div>
                          </div>
                          <span style={{ color: '#5a8a70', fontSize: '1.2rem' }}>→</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Open Marketplace */}
            <h2 style={{ color: '#e0ffe8', marginBottom: 16, fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10 }}>
              Browse Open Tasks — Earn SOL
            </h2>
            {openTasks.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                <h3 style={{ color: '#e0ffe8', marginBottom: 8 }}>No open tasks right now</h3>
                <p style={{ color: '#8888aa' }}>Check back soon — new tasks are posted daily.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
                {openTasks.map(task => {
                  const sol = lamportsToSol(task.lamports)
                  return (
                    <div key={task.id} className="card market-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer' }} onClick={() => navigate(`/tasks/${task.id}`)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span className="badge badge-purple">{task.category}</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#14F195' }}>◎ {sol.toFixed(3)}</div>
                          <div style={{ fontSize: '0.65rem', color: '#555577' }}>SOL reward</div>
                        </div>
                      </div>
                      <h3 style={{ color: '#e0ffe8', fontSize: '0.95rem', fontWeight: 700, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.title}</h3>
                      <p style={{ color: '#5a8a70', fontSize: '0.8rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>{task.description}</p>
                      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: '#14F195', fontWeight: 700, fontSize: '0.85rem' }}>
                        View & Accept →
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
