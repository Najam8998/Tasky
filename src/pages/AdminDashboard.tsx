// ============================================================
// AdminDashboard.tsx — Protected with password gate
// ============================================================

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllTasks, lamportsToSol, type Task } from '../lib/contract'

const ADMIN_KEY = 'tasky_admin_2024'

const AdminGate: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake]  = useState(false)

  const attempt = () => {
    if (input === ADMIN_KEY) {
      sessionStorage.setItem('tasky_admin_auth', '1')
      onUnlock()
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 76px)' }}>
      <div
        className="card"
        style={{
          padding: '48px 40px',
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          background: 'rgba(255,60,60,0.04)',
          border: '1px solid rgba(255,60,60,0.2)',
          animation: shake ? 'shake 0.4s ease' : 'none',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔐</div>
        <h2 style={{ color: '#ff6060', fontWeight: 800, marginBottom: 8 }}>Admin Access</h2>
        <p style={{ color: '#8888aa', fontSize: '0.9rem', marginBottom: 28 }}>
          This area is restricted. Enter the admin key to continue.
        </p>
        <input
          type="password"
          className="form-input"
          placeholder="Enter admin key..."
          value={input}
          onChange={e => { setInput(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          style={{ marginBottom: 12, borderColor: error ? 'rgba(255,60,60,0.5)' : undefined }}
          autoFocus
        />
        {error && (
          <p style={{ color: '#ff6060', fontSize: '0.82rem', marginBottom: 12 }}>
            ❌ Incorrect key. Access denied.
          </p>
        )}
        <button
          className="btn btn-primary"
          onClick={attempt}
          style={{ width: '100%', background: 'linear-gradient(135deg, #ff6060, #cc2222)', boxShadow: '0 0 20px rgba(255,60,60,0.3)' }}
        >
          Unlock Admin Portal
        </button>
        <p style={{ color: '#2a5040', fontSize: '0.72rem', marginTop: 20 }}>
          Only authorized Tasky administrators should access this page.
        </p>
      </div>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(false)
  const [tasks, setTasks]   = useState<Task[]>([])

  useEffect(() => {
    // Check URL key or session
    const params = new URLSearchParams(window.location.search)
    if (params.get('key') === ADMIN_KEY || sessionStorage.getItem('tasky_admin_auth') === '1') {
      setAuthed(true)
    }
  }, [])

  useEffect(() => {
    if (authed) {
      setTasks(getAllTasks().sort((a, b) => b.createdAt - a.createdAt))
    }
  }, [authed])

  if (!authed) return <AdminGate onUnlock={() => setAuthed(true)} />

  const disputedTasks = tasks.filter(t => t.status === 'disputed')
  const allOtherTasks = tasks.filter(t => t.status !== 'disputed')

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ background: 'rgba(255,60,60,0.15)', border: '1px solid rgba(255,60,60,0.3)', borderRadius: 6, padding: '2px 10px', fontSize: '0.68rem', fontWeight: 800, color: '#ff6060', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                🔐 Admin Mode
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#ff6060', margin: 0 }}>Admin Portal</h1>
            <p style={{ color: '#8888aa', fontSize: '1rem', maxWidth: 500, marginTop: 6 }}>
              Verify records, review discussions, and resolve disputes between clients and experts.
            </p>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => { sessionStorage.removeItem('tasky_admin_auth'); setAuthed(false) }}
            style={{ color: '#ff6060', borderColor: 'rgba(255,60,60,0.3)', fontSize: '0.8rem' }}
          >
            🔒 Lock Admin
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 40 }}>
          {[
            { label: 'Total Tasks',    value: tasks.length,          color: '#e0ffe8' },
            { label: 'Active Disputes',value: disputedTasks.length,  color: '#ff6060' },
            { label: 'Completed',      value: tasks.filter(t => t.status === 'completed').length, color: '#14F195' },
            { label: 'In Progress',    value: tasks.filter(t => t.status === 'in_progress').length, color: '#ffaa44' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, fontFamily: "'Share Tech Mono', monospace" }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#5a8a70', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Dispute Queue */}
        <h2 style={{ color: '#ff6060', marginBottom: 20, fontSize: '1.4rem', borderBottom: '1px solid rgba(255,96,96,0.2)', paddingBottom: 10 }}>
          ⚠️ Active Disputes — Action Required
        </h2>

        {disputedTasks.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', marginBottom: 48 }}>
            <h3 style={{ color: '#14F195', marginBottom: 8 }}>✅ No active disputes</h3>
            <p style={{ color: '#8888aa' }}>All tasks are proceeding smoothly.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16, marginBottom: 48 }}>
            {disputedTasks.map(task => {
              const sol = lamportsToSol(task.lamports)
              return (
                <div key={task.id} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, cursor: 'pointer', borderLeft: '4px solid #ff6060', background: 'rgba(255,96,96,0.05)' }} onClick={() => navigate(`/tasks/${task.id}?admin=true`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span className="badge badge-purple">{task.category}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ff6060', textTransform: 'uppercase' }}>DISPUTED</span>
                      </div>
                      <h3 style={{ color: '#f0f0ff', fontSize: '1.2rem', margin: 0 }}>{task.title}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ff6060' }}>◎ {sol.toFixed(3)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#ff6060' }}>Locked</div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px', background: 'rgba(255,96,96,0.1)', borderRadius: 8, fontSize: '0.85rem', color: '#ff6060', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>Requires manual review of chat logs.</span>
                    <span>Review & Resolve →</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* All Tasks */}
        <h2 style={{ color: '#f0f0ff', marginBottom: 20, fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>
          All Other Tasks
        </h2>
        {allOtherTasks.length === 0 ? (
          <p style={{ color: '#8888aa' }}>No other tasks found.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {allOtherTasks.map(task => {
              const sol = lamportsToSol(task.lamports)
              return (
                <div key={task.id} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer', opacity: 0.85 }} onClick={() => navigate(`/tasks/${task.id}?admin=true`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`status-dot ${task.status}`} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8888aa', textTransform: 'uppercase' }}>{task.status.replace('_',' ')}</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#8888aa' }}>◎ {sol.toFixed(3)}</div>
                  </div>
                  <h3 style={{ color: '#f0f0ff', fontSize: '1rem', margin: 0, lineHeight: 1.4 }}>{task.title}</h3>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
