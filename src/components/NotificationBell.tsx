// ============================================================
// NotificationBell.tsx — Navbar notification bell with dropdown
// ============================================================
import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'

const TYPE_ICON: Record<string, string> = {
  task_accepted:    '🤝',
  payment_released: '💸',
  dispute_raised:   '⚠️',
  task_created:     '📝',
  message:          '💬',
  info:             '📡',
}

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications()
  const [open, setOpen] = useState(false)
  const navigate        = useNavigate()
  const ref             = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(o => !o)
    if (!open) markAllRead()
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={handleOpen} style={styles.bell} title="Notifications">
        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🔔</span>
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropHeader}>
            <span style={styles.dropTitle}>Notifications</span>
            <button onClick={clearAll} style={styles.clearBtn}>Clear all</button>
          </div>

          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>No notifications yet</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  style={{ ...styles.item, background: n.read ? 'transparent' : 'rgba(20,241,149,0.04)' }}
                  onClick={() => { setOpen(false); if (n.taskId) navigate(`/tasks/${n.taskId}`) }}
                >
                  <span style={styles.itemIcon}>{TYPE_ICON[n.type] ?? '📡'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.itemTitle}>{n.title}</div>
                    <div style={styles.itemBody}>{n.body}</div>
                    <div style={styles.itemTime}>{new Date(n.timestamp).toLocaleTimeString()}</div>
                  </div>
                  {!n.read && <span style={styles.dot} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  bell: {
    position: 'relative',
    background: 'rgba(20,241,149,0.06)',
    border: '1px solid rgba(20,241,149,0.2)',
    borderRadius: 8,
    padding: '6px 10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    background: '#14F195',
    color: '#010a04',
    borderRadius: 999,
    fontSize: '0.6rem',
    fontWeight: 800,
    minWidth: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    width: 320,
    background: '#010e06',
    border: '1px solid rgba(20,241,149,0.25)',
    borderRadius: 12,
    boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 30px rgba(20,241,149,0.08)',
    zIndex: 10000,
    overflow: 'hidden',
    fontFamily: 'Inter, sans-serif',
  },
  dropHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(20,241,149,0.15)',
    background: 'rgba(20,241,149,0.06)',
  },
  dropTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#e0ffe8',
    letterSpacing: '0.05em',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#5a8a70',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  list: {
    maxHeight: 360,
    overflowY: 'auto',
  },
  empty: {
    padding: '32px 16px',
    textAlign: 'center',
    color: '#2a5040',
    fontSize: '0.85rem',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 16px',
    borderBottom: '1px solid rgba(20,241,149,0.07)',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  itemIcon: { fontSize: '1.1rem', flexShrink: 0, marginTop: 2 },
  itemTitle: { fontSize: '0.82rem', fontWeight: 700, color: '#e0ffe8', marginBottom: 2 },
  itemBody:  { fontSize: '0.75rem', color: '#5a8a70', lineHeight: 1.4 },
  itemTime:  { fontSize: '0.65rem', color: '#2a5040', marginTop: 4 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#14F195',
    boxShadow: '0 0 6px #14F195',
    flexShrink: 0,
    marginTop: 6,
  },
}
