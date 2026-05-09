// ============================================================
// ClientDashboard.tsx — Portal for the Task Creator
// ============================================================

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { getAllTasks, lamportsToSol, type Task } from '../lib/contract'

export const ClientDashboard: React.FC = () => {
  const { publicKey, connected } = useWallet()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])

  const loadTasks = () => {
    if (publicKey) {
      const all = getAllTasks()
      setTasks(all.filter(t => t.creator === publicKey.toBase58()).sort((a,b) => b.createdAt - a.createdAt))
    }
  }

  useEffect(() => {
    loadTasks()
  }, [publicKey])



  if (!connected) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 100 }}>
        <h2 style={{ color: '#f0f0ff', marginBottom: 16 }}>Client Portal</h2>
        <p style={{ color: '#8888aa', marginBottom: 24 }}>Connect your wallet to manage your posted tasks.</p>
        <WalletMultiButton />
      </div>
    )
  }

  const activeCount = tasks.filter(t => t.status === 'open' || t.status === 'in_progress').length
  const totalSpent = tasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + t.lamports, 0)

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* Header Area */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#14F195', margin: 0, fontFamily: "'Share Tech Mono', monospace" }}>Client Portal</h1>
            </div>
            <p style={{ color: '#8888aa', fontSize: '1rem', maxWidth: 500 }}>
              Manage the tasks you've posted, review expert applications, and release payments.
            </p>
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/create')}
            style={{ fontSize: '1.1rem', padding: '16px 32px', boxShadow: '0 8px 32px rgba(153,69,255,0.3)' }}
          >
            Post a New Task
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
          <div className="card" style={{ padding: 20, textAlign: 'center', background: 'rgba(20,241,149,0.05)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f0f0ff' }}>{tasks.length}</div>
            <div style={{ fontSize: '0.8rem', color: '#5a8a70', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Posted</div>
          </div>
          <div className="card" style={{ padding: 20, textAlign: 'center', background: 'rgba(20,241,149,0.05)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#14F195' }}>{activeCount}</div>
            <div style={{ fontSize: '0.8rem', color: '#5a8a70', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Tasks</div>
          </div>
          <div className="card" style={{ padding: 20, textAlign: 'center', background: 'rgba(20,241,149,0.05)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#14F195' }}>◎ {lamportsToSol(totalSpent).toFixed(2)}</div>
            <div style={{ fontSize: '0.8rem', color: '#5a8a70', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SOL Paid Out</div>
          </div>
        </div>

        <h2 style={{ color: '#f0f0ff', marginBottom: 20, fontSize: '1.4rem' }}>Your Tasks</h2>
        
        {tasks.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <h3 style={{ color: '#f0f0ff', marginBottom: 8 }}>No tasks yet</h3>
            <p style={{ color: '#8888aa', marginBottom: 24 }}>You haven't posted any academic tasks yet.</p>
            <button className="btn btn-primary" onClick={() => navigate('/create')}>Create your first task</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {tasks.map(task => {
               const sol = lamportsToSol(task.lamports)
               const isIP = task.status === 'in_progress'
               const isOpen = task.status === 'open'
               return (
                 <div key={task.id} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => navigate(`/tasks/${task.id}`)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                         <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                               <span className="badge badge-green">{task.category}</span>
                               <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span className={`status-dot ${task.status}`} />
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#5a8a70', textTransform: 'uppercase' }}>
                                     {task.status.replace('_',' ')}
                                  </span>
                               </span>
                            </div>
                            <h3 style={{ color: '#e0ffe8', fontSize: '1.2rem', margin: 0 }}>{task.title}</h3>
                         </div>
                         <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#14F195' }}>◎ {sol.toFixed(3)}</div>
                         </div>
                      </div>
                    
                    {/* Action Prompts based on status */}
                    {isOpen && (
                       <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: '0.85rem', color: '#5a8a70', display: 'flex', alignItems: 'center', gap: 8 }}>
                          Waiting for an expert to accept...
                       </div>
                    )}
                    {isIP && (
                       <div style={{ padding: '10px 14px', background: 'rgba(20,241,149,0.1)', borderRadius: 8, fontSize: '0.85rem', color: '#14F195', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Expert is working. Review and release payment when ready.</span>
                          <span style={{ fontWeight: 800 }}>Review →</span>
                       </div>
                    )}
                 </div>
               )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
