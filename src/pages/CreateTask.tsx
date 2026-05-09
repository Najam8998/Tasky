// CreateTask.tsx — Task creation with escrow deposit
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { createTaskEscrow, solToLamports, explorerUrl } from '../lib/contract'
import { useTaskStore } from '../context/TaskStoreContext'
import { useAI } from '../context/AIContext'
import { useNotifications } from '../context/NotificationContext'

const CATEGORIES = ['VSCode Setup', 'Programming', 'Mathematics', 'Writing', 'Design', 'Other']

export const CreateTask: React.FC = () => {
  const wallet = useWallet()
  const { connected, publicKey } = wallet
  const { connection } = useConnection()
  const navigate = useNavigate()
  const { refresh } = useTaskStore()
  const { logActivity } = useAI()
  const { addNotification } = useNotifications()
  const [form, setForm] = useState({ title: '', description: '', category: 'Programming', sol: '0.1' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState<{ taskId: string; sig: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }
  const solNum = parseFloat(form.sol) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!connected || !publicKey) return setError('Connect your wallet first.')
    if (!form.title.trim())       return setError('Task title is required.')
    if (!form.description.trim()) return setError('Description is required.')
    if (solNum <= 0)              return setError('SOL amount must be > 0.')
    setLoading(true); setError('')
    try {
      const { taskId, signature } = await createTaskEscrow(wallet, connection, {
        title: form.title.trim(), description: form.description.trim(),
        category: form.category, lamports: solToLamports(solNum),
      })
      setSuccess({ taskId, sig: signature })
      logActivity(`Task Created: ${form.title.trim()}`)
      addNotification('task_created', 'Task Published!', `"${form.title.trim()}" is live. SOL locked in escrow.`, taskId)
      await refresh()
    } catch (err: any) { setError(err.message ?? 'Failed to create task.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="page"><div className="container" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={s.successCard}>
        <div style={{ fontSize: '3rem', textAlign: 'center' }}>🎉</div>
        <h2 style={{ color: '#14F195', textAlign: 'center' }}>Task Created!</h2>
        <p style={{ textAlign: 'center', color: '#8888aa' }}>SOL locked in escrow. Your task is live.</p>
        <div style={s.detail}><span style={s.dlabel}>Task ID</span><span style={s.dval}>{success.taskId}</span></div>
        <div style={s.detail}><span style={s.dlabel}>Tx Signature</span>
          <a href={explorerUrl(success.sig)} target="_blank" rel="noreferrer" style={{ color:'#9945FF', fontFamily:'monospace', fontSize:'0.8rem' }}>
            {success.sig.slice(0,20)}…{success.sig.slice(-6)} ↗
          </a>
        </div>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate(`/tasks/${success.taskId}`)}>View Task</button>
          <button className="btn btn-outline" onClick={() => navigate('/tasks')}>Browse Tasks</button>
        </div>
      </div>
    </div></div>
  )

  return (
    <div className="page"><div className="container" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize:'2rem', fontWeight:800, color:'#f0f0ff', marginBottom:8 }}>Create a Task</h1>
        <p style={{ color:'#8888aa', lineHeight:1.6 }}>Post your academic request and lock SOL in escrow.</p>
      </div>

      <div style={s.gateBanner}>
        <span style={{ fontSize:'1.5rem', flexShrink:0 }}>🔐</span>
        <div>
          <div style={{ fontWeight:700, color:'#f0f0ff', marginBottom:4 }}>Payment-Gated Activation (x402)</div>
          <div style={{ fontSize:'0.83rem', color:'#8888aa' }}>SOL is deposited into a PDA escrow at creation. Task is only active after payment confirmed.</div>
        </div>
      </div>

      {!connected ? (
        <div style={s.connectBox}><p style={{ color:'#8888aa', marginBottom:20 }}>Connect Phantom wallet to post a task.</p><WalletMultiButton /></div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:24 }}>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input className="form-input" name="title" placeholder="e.g. Help me set up VSCode for Python" value={form.title} onChange={handleChange} maxLength={100} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" name="description" placeholder="Describe your task in detail…" value={form.description} onChange={handleChange} style={{ minHeight:160 }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment (SOL)</label>
              <input className="form-input" type="number" name="sol" min="0.001" step="0.001" value={form.sol} onChange={handleChange} />
            </div>
          </div>
          <div style={s.payPreview}>
            <span style={{ fontSize:'0.85rem', color:'#8888aa' }}>🔒 Will lock in escrow:</span>
            <span style={{ fontSize:'1.2rem', fontWeight:800, color:'#14F195' }}>◎ {solNum.toFixed(3)} SOL</span>
          </div>
          {error && <div style={s.errorMsg}>⚠️ {error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ fontSize:'1rem', padding:'14px 0', width:'100%' }}>
            {loading ? <><span className="spinner" /> Locking SOL in Escrow…</> : 'Create Task & Lock SOL'}
          </button>
          <p style={{ fontSize:'0.75rem', color:'#555577', textAlign:'center' }}>
            Connected: <span style={{ color:'#9945FF', fontFamily:'monospace' }}>{publicKey?.toBase58().slice(0,8)}…</span>
          </p>
        </form>
      )}
    </div></div>
  )
}

const s: Record<string, React.CSSProperties> = {
  gateBanner: { display:'flex', gap:16, alignItems:'flex-start', background:'rgba(153,69,255,0.08)', border:'1px solid rgba(153,69,255,0.2)', borderRadius:14, padding:'16px 20px', marginBottom:32 },
  connectBox: { textAlign:'center', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:48, display:'flex', flexDirection:'column', alignItems:'center' },
  payPreview: { display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(20,241,149,0.06)', border:'1px solid rgba(20,241,149,0.15)', borderRadius:12, padding:'14px 18px' },
  errorMsg:   { background:'rgba(255,80,80,0.1)', border:'1px solid rgba(255,80,80,0.25)', borderRadius:10, padding:'12px 16px', fontSize:'0.85rem', color:'#ff6060' },
  successCard:{ background:'rgba(20,241,149,0.05)', border:'1px solid rgba(20,241,149,0.2)', borderRadius:24, padding:48, display:'flex', flexDirection:'column', gap:20, alignItems:'center' },
  detail:     { display:'flex', flexDirection:'column', gap:4, alignItems:'center', width:'100%' },
  dlabel:     { fontSize:'0.72rem', color:'#555577', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' },
  dval:       { fontFamily:'monospace', fontSize:'0.78rem', color:'#f0f0ff', wordBreak:'break-all', textAlign:'center' },
}
