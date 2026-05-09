// ============================================================
// TaskCard.tsx
// ============================================================

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { type Task, lamportsToSol, shortPubkey } from '../lib/contract'

const CATEGORY_COLORS: Record<string, string> = {
  'VSCode Setup':    'badge-blue',
  'Programming':     'badge-purple',
  'Mathematics':     'badge-orange',
  'Writing':         'badge-green',
  'Design':          'badge-purple',
  'Other':           'badge-blue',
}

const STATUS_LABELS: Record<string, string> = {
  open:        'Open',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
}

interface Props { task: Task }

export const TaskCard: React.FC<Props> = ({ task }) => {
  const navigate = useNavigate()
  const sol = lamportsToSol(task.lamports)
  const catClass = CATEGORY_COLORS[task.category] ?? 'badge-blue'

  return (
    <div
      className="card"
      style={styles.card}
      onClick={() => navigate(`/tasks/${task.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/tasks/${task.id}`)}
    >
      {/* Header */}
      <div style={styles.header}>
        <span className={`badge ${catClass}`}>{task.category}</span>
        <div style={styles.statusRow}>
          <span className={`status-dot ${task.status}`} />
          <span style={styles.statusLabel}>{STATUS_LABELS[task.status]}</span>
        </div>
      </div>

      {/* Title */}
      <h3 style={styles.title}>{task.title}</h3>

      {/* Description preview */}
      <p style={styles.desc}>
        {task.description.length > 120 ? task.description.slice(0, 120) + '…' : task.description}
      </p>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.solChip}>
          <span style={styles.solIcon}>◎</span>
          <span style={styles.solAmount}>{sol.toFixed(3)} SOL</span>
        </div>
        <span style={styles.creator}>by {shortPubkey(task.creator)}</span>
        <span style={styles.time}>{timeAgo(task.createdAt)}</span>
      </div>

      {/* Escrow indicator */}
      <div style={styles.escrowBar}>
        <span style={styles.escrowLabel}>🔒 Escrowed</span>
        <span style={styles.escrowPda}>{shortPubkey(task.escrowPda)}</span>
      </div>
    </div>
  )
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    padding: 24,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#8888aa',
  },
  title: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#f0f0ff',
    lineHeight: 1.3,
  },
  desc: {
    fontSize: '0.88rem',
    color: '#8888aa',
    lineHeight: 1.6,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  solChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: 'rgba(153,69,255,0.1)',
    border: '1px solid rgba(153,69,255,0.2)',
    borderRadius: 999,
    padding: '4px 12px',
  },
  solIcon: {
    color: '#9945FF',
    fontSize: '0.85rem',
  },
  solAmount: {
    color: '#9945FF',
    fontWeight: 700,
    fontSize: '0.9rem',
  },
  creator: {
    fontSize: '0.78rem',
    color: '#555577',
    fontFamily: 'monospace',
    marginLeft: 'auto',
  },
  time: {
    fontSize: '0.75rem',
    color: '#555577',
  },
  escrowBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(20,241,149,0.05)',
    border: '1px solid rgba(20,241,149,0.12)',
    borderRadius: 8,
    padding: '6px 12px',
  },
  escrowLabel: {
    fontSize: '0.75rem',
    color: '#14F195',
    fontWeight: 600,
  },
  escrowPda: {
    fontSize: '0.7rem',
    color: '#555577',
    fontFamily: 'monospace',
  },
}
