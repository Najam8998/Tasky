// TaskDetail.tsx — Full task view with accept, release, discussion, and tx history
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { acceptTask, releaseEscrow, raiseDispute, adminResolve, lamportsToSol, shortPubkey, explorerUrl, cancelTask, editTask, type Task } from '../lib/contract'
import { useTaskStore } from '../context/TaskStoreContext'
import { Discussion } from '../components/Discussion'
import { useAI } from '../context/AIContext'
import { useNotifications } from '../context/NotificationContext'

export const TaskDetail: React.FC = () => {
  const { id }                        = useParams<{ id: string }>()
  const navigate                      = useNavigate()
  const wallet                        = useWallet()
  const { publicKey, connected }      = wallet
  const { connection }                = useConnection()
  const { logActivity }               = useAI()
  const { addNotification }           = useNotifications()
  const { getTask, refresh }          = useTaskStore()
  const [task, setTask]               = useState<Task | null>(null)
  const [loading, setLoading]         = useState<string | null>(null)
  const [txMsg, setTxMsg]             = useState<{ sig: string; label: string } | null>(null)
  const [error, setError]             = useState('')
  const [editing, setEditing]         = useState(false)
  const [editForm, setEditForm]       = useState({ title: '', description: '', category: '' })

  const reload = useCallback(() => { 
    if (id) {
      const t = getTask(id)
      setTask(t)
      if (t) setEditForm({ title: t.title, description: t.description, category: t.category })
    }
  }, [id, getTask])
  useEffect(() => { reload() }, [reload])

  if (!task) return (
    <div className="page" style={{ textAlign:'center' }}>
      <h2 style={{ color:'#f0f0ff' }}>Task not found</h2>
      <button className="btn btn-outline" style={{ marginTop:16 }} onClick={() => navigate('/tasks')}>Back to Tasks</button>
    </div>
  )

  const walletPk  = publicKey?.toBase58() ?? null
  const isAdmin   = new URLSearchParams(window.location.search).get('admin') === 'true'
  const isClient  = walletPk === task.creator
  const isHelper  = walletPk === task.helper
  const isOpen    = task.status === 'open'
  const isIP      = task.status === 'in_progress'
  const isDone    = task.status === 'completed'
  const isDisputed= task.status === 'disputed'
  const canAccept = connected && isOpen && !isClient

  const handleAccept = async () => {
    if (!walletPk) return
    setLoading('accept'); setError('')
    try {
      const { signature } = await acceptTask(wallet, connection, task)
      setTxMsg({ sig: signature, label: 'Task accepted!' })
      logActivity(`Task Accepted: ${task.title}`)
      addNotification('task_accepted', 'Task Accepted!', `You are now working on "${task.title}".`, task.id)
      await refresh()
      reload()
    } catch (e: any) { setError(e.message)
    } finally { setLoading(null) }
  }

  const handleRelease = async () => {
    if (!walletPk || !publicKey) return
    setLoading('release'); setError('')
    try {
      if (!task.helper) throw new Error("No helper found")

      const { signature } = await releaseEscrow(wallet, connection, task)
      setTxMsg({ sig: signature, label: 'SOL successfully released via Smart Contract!' })
      logActivity(`Escrow Released for Task: ${task.title}`)
      addNotification('payment_released', 'Payment Released!', `◎ ${lamportsToSol(task.lamports).toFixed(3)} SOL sent to helper for "${task.title}".`, task.id)
      await refresh()
      reload()
    } catch (e: any) {
      console.error(e)
      setError(e.message)
    } finally { setLoading(null) }
  }

  const handleDispute = async () => {
    if (!walletPk) return
    if (!window.confirm("Are you sure you want to raise a dispute? An admin will review the chat logs.")) return
    setLoading('dispute'); setError('')
    try {
      const { signature } = await raiseDispute(wallet, connection, task)
      setTxMsg({ sig: signature, label: 'Dispute raised. Admin notified.' })
      logActivity(`Dispute Raised: ${task.title}`)
      addNotification('dispute_raised', 'Dispute Raised', `Admin has been notified about "${task.title}".`, task.id)
      await refresh()
      reload()
    } catch (e: any) { setError(e.message) }
    finally { setLoading(null) }
  }

  const handleAdminResolve = async (res: 'release' | 'refund') => {
    if (!window.confirm(`Force ${res}? This action is final.`)) return
    setLoading('admin'); setError('')
    try {
      const { signature } = await adminResolve(wallet, connection, task, res)
      setTxMsg({ sig: signature, label: `Task successfully resolved via ${res}.` })
      logActivity(`Admin Resolution (${res}): ${task.title}`)
      await refresh()
      reload()
    } catch (e: any) { setError(e.message) }
    finally { setLoading(null) }
  }

  const handleUpdate = async () => {
    setLoading('update'); setError('')
    try {
      const { signature } = await editTask(wallet, connection, task, editForm.title, editForm.description, editForm.category)
      setTxMsg({ sig: signature, label: 'Task updated on blockchain.' })
      logActivity(`Task Edited: ${task.title}`)
      setEditing(false)
      await refresh()
      reload()
    } catch (e: any) { setError(e.message) }
    finally { setLoading(null) }
  }

  const handleCancelTask = async () => {
    if (!window.confirm("Cancel this task and refund your SOL? This cannot be undone.")) return
    setLoading('cancel'); setError('')
    try {
      const { signature } = await cancelTask(wallet, connection, task)
      setTxMsg({ sig: signature, label: 'Task cancelled. SOL refunded.' })
      logActivity(`Task Cancelled: ${task.title}`)
      await refresh()
      navigate('/tasks')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(null) }
  }

  const sol = lamportsToSol(task.lamports)
  const statusColor = { open:'#14F195', in_progress:'#ffaa44', completed:'#9945FF', cancelled:'#ff6060', disputed:'#ff4444' }[task.status]

  return (
    <div className="page"><div className="container" style={{ maxWidth:860, margin:'0 auto' }}>
      {/* Back */}
      <button className="btn btn-ghost" style={{ marginBottom:24, fontSize:'0.85rem' }} onClick={() => navigate('/tasks')}>
        ← Back to Tasks
      </button>

      {/* Header card */}
      <div className="card" style={{ padding:32, marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap', marginBottom:20 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span className="badge badge-purple">{task.category}</span>
              <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span className={`status-dot ${task.status}`} />
                <span style={{ fontSize:'0.78rem', fontWeight:600, color: statusColor }}>
                  {task.status.replace('_',' ').toUpperCase()}
                </span>
              </span>
            </div>
            <h1 style={{ fontSize:'1.6rem', fontWeight:800, color:'#e0ffe8', lineHeight:1.3 }}>{task.title}</h1>
          </div>
          <div style={{ background:'rgba(20,241,149,0.1)', border:'1px solid rgba(20,241,149,0.25)', borderRadius:16, padding:'16px 24px', textAlign:'center', flexShrink:0 }}>
            <div style={{ fontSize:'0.7rem', color:'#5a8a70', fontWeight:600, marginBottom:4 }}>ESCROW</div>
            <div style={{ fontSize:'1.8rem', fontWeight:800, color:'#14F195' }}>◎ {sol.toFixed(3)}</div>
            <div style={{ fontSize:'0.7rem', color:'#5a8a70' }}>SOL locked</div>
          </div>
        </div>

        <p style={{ color:'#8888aa', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{task.description}</p>

        <div className="divider" />

        {/* Meta row */}
        <div style={{ display:'flex', gap:24, flexWrap:'wrap', fontSize:'0.8rem', color:'#5a8a70' }}>
          <span>👤 Client: <span style={{ color:'#14F195', fontFamily:'monospace' }}>{shortPubkey(task.creator)}</span></span>
          {task.helper && <span>🤝 Helper: <span style={{ color:'#14F195', fontFamily:'monospace' }}>{shortPubkey(task.helper)}</span></span>}
          <span>📅 {new Date(task.createdAt).toLocaleDateString()}</span>
          <span>🔒 PDA: <span style={{ fontFamily:'monospace' }}>{shortPubkey(task.escrowPda)}</span></span>
        </div>
      </div>

      {/* Action area */}
      {!connected ? (
        <div style={{ textAlign:'center', padding:'32px 0', marginBottom:24 }}>
          <p style={{ color:'#8888aa', marginBottom:16 }}>Connect wallet to interact with this task.</p>
          <WalletMultiButton />
        </div>
      ) : (
        <div style={{ marginBottom:32 }}>
          {error && <div style={{ background:'rgba(255,80,80,0.1)', border:'1px solid rgba(255,80,80,0.25)', borderRadius:10, padding:'12px 16px', fontSize:'0.85rem', color:'#ff6060', marginBottom:16 }}>⚠️ {error}</div>}
          {txMsg && (
            <div style={{ background:'rgba(20,241,149,0.08)', border:'1px solid rgba(20,241,149,0.2)', borderRadius:10, padding:'16px 20px', fontSize:'0.9rem', color:'#14F195', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ flex:1, fontWeight:600 }}>{txMsg.label}</span>
              <a href={explorerUrl(txMsg.sig)} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize:'0.75rem', padding:'6px 12px' }}>View on Explorer ↗</a>
            </div>
          )}

          {isAdmin && (
             <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, padding:'14px 20px', background:'rgba(255,96,96,0.1)', border:'1px solid rgba(255,96,96,0.3)', borderRadius:14 }}>
                <div>
                   <div style={{ fontWeight:800, color:'#ff6060', fontSize:'1.1rem' }}>Admin Override Mode</div>
                   <div style={{ fontSize:'0.85rem', color:'#8888aa' }}>You have full authority to resolve disputes.</div>
                </div>
             </div>
          )}

          {isDisputed && !isAdmin && (
            <div style={{ background:'rgba(255,96,96,0.05)', border:'1px solid rgba(255,96,96,0.2)', borderRadius:16, padding:'24px', marginBottom:16, textAlign:'center' }}>
              <h3 style={{ color:'#ff6060', fontSize:'1.3rem', marginBottom:8 }}>Task under Dispute</h3>
              <p style={{ color:'#8888aa', fontSize:'0.9rem' }}>A Tasky Admin is currently reviewing the chat logs and will make a final ruling.</p>
            </div>
          )}

          {isAdmin && isDisputed && (
            <div style={{ background:'linear-gradient(135deg, rgba(255,96,96,0.1), rgba(255,96,96,0.02))', border:'1px solid rgba(255,96,96,0.3)', borderRadius:16, padding:'32px 24px', marginBottom:16, textAlign:'center', boxShadow:'0 8px 32px rgba(255,96,96,0.1)' }}>
              <h3 style={{ color:'#ff6060', fontSize:'1.6rem', marginBottom:8, fontWeight:800 }}>Resolve Dispute</h3>
              <p style={{ color:'#8888aa', fontSize:'0.95rem', marginBottom:24, maxWidth:400, margin:'0 auto 24px' }}>
                Review the chat below. You can force the payment to the Helper, or refund the SOL back to the Client.
              </p>
              <div style={{ display:'flex', gap:16, justifyContent:'center' }}>
                <button className="btn btn-green" onClick={() => handleAdminResolve('release')} disabled={loading === 'admin'} style={{ padding:'12px 24px' }}>
                  Force Release to Helper
                </button>
                <button className="btn btn-outline" onClick={() => handleAdminResolve('refund')} disabled={loading === 'admin'} style={{ padding:'12px 24px', color:'#ff6060', borderColor:'rgba(255,96,96,0.3)' }}>
                  Refund to Client
                </button>
              </div>
            </div>
          )}

          {/* Role Indicator */}
          {isClient && (
             <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, padding:'14px 20px', background:'rgba(20,241,149,0.1)', border:'1px solid rgba(20,241,149,0.3)', borderRadius:14 }}>
                <div>
                   <div style={{ fontWeight:800, color:'#14F195', fontSize:'1.1rem' }}>You are the Client</div>
                   <div style={{ fontSize:'0.85rem', color:'#5a8a70' }}>You posted this task and funded the escrow.</div>
                </div>
             </div>
          )}
          
          {isHelper && (
             <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, padding:'14px 20px', background:'rgba(20,241,149,0.1)', border:'1px solid rgba(20,241,149,0.3)', borderRadius:14 }}>
                <div>
                   <div style={{ fontWeight:800, color:'#14F195', fontSize:'1.1rem' }}>You are the Helper</div>
                   <div style={{ fontSize:'0.85rem', color:'#5a8a70' }}>You accepted this task and are assisting the client.</div>
                </div>
             </div>
          )}

          {!isClient && !isHelper && isOpen && (
             <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, padding:'14px 20px', background:'rgba(0,194,255,0.1)', border:'1px solid rgba(0,194,255,0.3)', borderRadius:14 }}>
                <div>
                   <div style={{ fontWeight:800, color:'#00C2FF', fontSize:'1.1rem' }}>You are a Viewer</div>
                   <div style={{ fontSize:'0.85rem', color:'#8888aa' }}>You can accept this task to become the Helper and earn the SOL.</div>
                </div>
             </div>
          )}

          {isClient && isIP && (
            <div style={{ background:'linear-gradient(135deg, rgba(20,241,149,0.1), rgba(20,241,149,0.02))', border:'1px solid rgba(20,241,149,0.3)', borderRadius:16, padding:'32px 24px', marginBottom:16, textAlign:'center', boxShadow:'0 8px 32px rgba(20,241,149,0.1)' }}>
              <h3 style={{ color:'#14F195', fontSize:'1.6rem', marginBottom:8, fontWeight:800 }}>Approve & Release Payment</h3>
              <p style={{ color:'#8888aa', fontSize:'0.95rem', marginBottom:24, maxWidth:400, margin:'0 auto 24px' }}>
                Are you satisfied with the helper's work? Release the ◎ {sol.toFixed(3)} SOL directly to their wallet on the Solana Devnet.
              </p>
              <button className="btn btn-green" onClick={handleRelease} disabled={loading === 'release'} style={{ fontSize:'1.15rem', padding:'16px 40px', marginBottom: 16 }}>
                {loading === 'release' ? <><span className="spinner" /> Processing on Solana…</> : `Send ◎ ${sol.toFixed(3)} to Helper`}
              </button>
              <div>
                <button className="btn btn-ghost" onClick={handleDispute} disabled={loading === 'dispute'} style={{ fontSize: '0.8rem', color: '#ff6060' }}>
                  Raise Dispute
                </button>
              </div>
            </div>
          )}

          {isHelper && isIP && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
               <button className="btn btn-ghost" onClick={handleDispute} disabled={loading === 'dispute'} style={{ fontSize: '0.8rem', color: '#ff6060' }}>
                  Raise Dispute (Client unresponsive)
               </button>
            </div>
          )}

          {canAccept && (
            <div style={{ background:'linear-gradient(135deg, rgba(153,69,255,0.1), rgba(153,69,255,0.02))', border:'1px solid rgba(153,69,255,0.3)', borderRadius:16, padding:'32px 24px', marginBottom:16, textAlign:'center', boxShadow:'0 8px 32px rgba(153,69,255,0.1)' }}>
              <h3 style={{ color:'#9945FF', fontSize:'1.6rem', marginBottom:8, fontWeight:800 }}>Accept This Task</h3>
              <p style={{ color:'#8888aa', fontSize:'0.95rem', marginBottom:24, maxWidth:400, margin:'0 auto 24px' }}>
                Can you help the client? Accept the task to start chatting and earn ◎ {sol.toFixed(3)} SOL.
              </p>
              <button className="btn btn-primary" onClick={handleAccept} disabled={loading === 'accept'} style={{ fontSize:'1.15rem', padding:'16px 40px' }}>
                {loading === 'accept' ? <><span className="spinner" /> Accepting…</> : 'Accept & Start Working'}
              </button>
            </div>
          )}

          {isDone && (
            <div style={{ background:'rgba(153,69,255,0.08)', border:'1px solid rgba(153,69,255,0.2)', borderRadius:16, padding:'32px 24px', marginBottom:16, textAlign:'center' }}>
              <h3 style={{ color:'#9945FF', fontSize:'1.5rem', fontWeight:800 }}>Task Completed!</h3>
              <p style={{ color:'#8888aa', fontSize:'0.9rem' }}>The escrow payment has been successfully released to the helper.</p>
            </div>
          )}

          {isOpen && isClient && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'32px 24px', textAlign:'center' }}>
              {editing ? (
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h3 style={{ color: '#e0ffe8', margin: 0 }}>Edit Task Details</h3>
                  <div className="form-group">
                    <label className="form-label">Task Title</label>
                    <input className="form-input" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows={4} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-primary" onClick={handleUpdate} disabled={loading === 'update'} style={{ flex: 1 }}>
                      {loading === 'update' ? 'Saving to Blockchain...' : 'Save Changes'}
                    </button>
                    <button className="btn btn-outline" onClick={() => setEditing(false)} disabled={loading === 'update'} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 style={{ color:'#e0ffe8', fontSize:'1.2rem', marginBottom:8 }}>Waiting for an Expert</h3>
                  <p style={{ color:'#5a8a70', fontSize:'0.9rem', marginBottom:24 }}>No one has accepted your task yet. You can still modify the details or cancel it for a full refund.</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button className="btn btn-outline" onClick={() => setEditing(true)} style={{ padding: '10px 24px' }}>Edit Task</button>
                    <button className="btn btn-ghost" onClick={handleCancelTask} disabled={loading === 'cancel'} style={{ color: '#ff6060' }}>
                      {loading === 'cancel' ? 'Cancelling...' : 'Cancel Task & Refund SOL'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Discussion */}
      <div className="card" style={{ padding:28, marginBottom:24 }}>
        <Discussion taskId={task.id} walletPubkey={walletPk} />
      </div>

      {/* Transaction history */}
      <div className="card" style={{ padding:28 }}>
        <h3 style={{ color:'#f0f0ff', marginBottom:20 }}>📜 Transaction History</h3>
        {task.txSignatures.length === 0 ? (
          <p style={{ color:'#555577', fontSize:'0.85rem' }}>No transactions yet.</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {task.txSignatures.map((tx, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10 }}>
                <span style={{ fontSize:'1.2rem' }}>{{ create:'🔒', accept:'🤝', release:'💸', cancel:'❌', dispute:'⚠️', resolve:'✅', refund:'↩️' }[tx.action as string] || '⚡'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontWeight:600, color:'#f0f0ff', fontSize:'0.85rem', textTransform:'capitalize' }}>{tx.action.replace('_',' ')}</span>
                    {tx.lamports > 0 && <span style={{ color:'#9945FF', fontWeight:700, fontSize:'0.82rem' }}>◎ {lamportsToSol(tx.lamports).toFixed(3)}</span>}
                  </div>
                  <div style={{ fontSize:'0.72rem', color:'#555577', fontFamily:'monospace' }}>
                    {shortPubkey(tx.from)} → {shortPubkey(tx.to)}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'0.72rem', color:'#555577', marginBottom:4 }}>{new Date(tx.timestamp).toLocaleString()}</div>
                  <a href={explorerUrl(tx.signature)} target="_blank" rel="noreferrer" style={{ fontSize:'0.72rem', color:'#9945FF', fontFamily:'monospace' }}>
                    {tx.signature.slice(0,10)}… ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div></div>
  )
}
