// ============================================================
// Discussion.tsx — localStorage-persisted chat thread
// ============================================================

import React, { useState, useEffect, useRef } from 'react'
import { shortPubkey } from '../lib/contract'
import { useAI } from '../context/AIContext'

interface Message {
  id: string
  sender: string
  text: string
  timestamp: number
}

interface Props {
  taskId: string
  walletPubkey: string | null
}

export const Discussion: React.FC<Props> = ({ taskId, walletPubkey }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const { summarizeChat }       = useAI()

  const storageKey = `tasky_chat_${taskId}`

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) setMessages(JSON.parse(stored))
  }, [taskId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    if (!input.trim() || !walletPubkey) return
    const msg: Message = {
      id: `${Date.now()}_${Math.random()}`,
      sender: walletPubkey,
      text: input.trim(),
      timestamp: Date.now(),
    }
    const updated = [...messages, msg]
    setMessages(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    setInput('')
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Discussion</h3>

      <div style={styles.chatBox}>
        {messages.length === 0 && (
          <div style={styles.empty}>No messages yet. Start the conversation!</div>
        )}
        {messages.map(m => {
          const isMeeting = m.text.startsWith('[MEETING_PROPOSAL]')
          const text = isMeeting ? m.text.replace('[MEETING_PROPOSAL]', '').trim() : m.text

          return (
            <div key={m.id} style={{
              ...styles.bubble,
              ...(m.sender === walletPubkey ? styles.bubbleMine : styles.bubbleOther),
            }}>
              <span style={styles.bubbleSender}>{shortPubkey(m.sender)}</span>
              
              {isMeeting ? (
                <div style={{ background: 'rgba(20,241,149,0.1)', border: '1px solid rgba(20,241,149,0.3)', borderRadius: 8, padding: 12, marginTop: 4 }}>
                  <div style={{ color: '#14F195', fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>Meeting Proposed</div>
                  <p style={{ ...styles.bubbleText, marginBottom: 12 }}>{text}</p>
                  <button className="btn btn-green" style={{ fontSize: '0.75rem', padding: '6px 12px', width: '100%' }} onClick={() => window.open(`https://meet.jit.si/TaskyRoom-${taskId}`, '_blank')}>
                    Join Video Call ↗
                  </button>
                </div>
              ) : (
                <p style={styles.bubbleText}>{text}</p>
              )}
              
              <span style={styles.bubbleTime}>{new Date(m.timestamp).toLocaleTimeString()}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {walletPubkey ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* AI Summarize bar */}
          {messages.length >= 2 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(20,241,149,0.05)', border: '1px solid rgba(20,241,149,0.15)', borderRadius: 8 }}>
              <span style={{ fontSize: '0.75rem', color: '#5a8a70', flex: 1 }}>🧠 AI can summarize this conversation for the AI Monitor panel.</span>
              <button
                style={{ background: 'rgba(20,241,149,0.12)', border: '1px solid rgba(20,241,149,0.3)', color: '#14F195', borderRadius: 6, padding: '4px 12px', fontSize: '0.72rem', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontWeight: 700 }}
                disabled={summarizing}
                onClick={() => { setSummarizing(true); summarizeChat(messages); setTimeout(() => setSummarizing(false), 2200); }}
              >
                {summarizing ? '...' : 'Summarize'}
              </button>
            </div>
          )}
          <div style={styles.inputRow}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Type a message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button
              className="btn btn-outline"
              style={{ padding: '0 12px', fontSize: '0.85rem', color: '#14F195', borderColor: 'rgba(20,241,149,0.3)', whiteSpace: 'nowrap' }}
              onClick={() => {
                const time = window.prompt("When would you like to meet? (e.g., 'Tomorrow at 10 AM')")
                if (time) setInput(`[MEETING_PROPOSAL] Let's jump on a quick call to discuss the requirements: ${time}`)
              }}
              title="Schedule Meeting"
            >
              Schedule
            </button>
            <button className="btn btn-primary" onClick={send} disabled={!input.trim()}>Send</button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '0.85rem', color: '#555577', textAlign: 'center' }}>
          Connect your wallet to participate in the discussion.
        </p>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  heading: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#f0f0ff',
  },
  chatBox: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: 16,
    minHeight: 200,
    maxHeight: 340,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  empty: {
    color: '#555577',
    fontSize: '0.85rem',
    textAlign: 'center',
    margin: 'auto',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 12,
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    background: 'rgba(20,241,149,0.10)',
    border: '1px solid rgba(20,241,149,0.25)',
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(20,241,149,0.10)',
  },
  bubbleSender: {
    fontSize: '0.7rem',
    color: '#14F195',
    fontFamily: 'monospace',
    fontWeight: 600,
  },
  bubbleText: {
    fontSize: '0.88rem',
    color: '#f0f0ff',
    lineHeight: 1.5,
  },
  bubbleTime: {
    fontSize: '0.65rem',
    color: '#555577',
    alignSelf: 'flex-end',
  },
  inputRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
}
