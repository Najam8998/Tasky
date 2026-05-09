// ============================================================
// AIPanel.tsx — Tabbed AI Monitor: Analysis | Logs | Live Feed
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAI } from '../context/AIContext';
import { getAllTasks, lamportsToSol } from '../lib/contract';

/* ── simulated live feed events ── */
const FEED_TEMPLATES = [
  (sol: string, cat: string) => `NEW ESCROW LOCKED: ◎${sol} for "${cat}" task`,
  ()                         => `PROGRAM CALL: createTask() confirmed on-chain`,
  (sol: string)              => `PAYMENT RELEASED: ◎${sol} transferred to helper`,
  ()                         => `VALIDATOR: Transaction finalized in ~400ms`,
  ()                         => `RPC NODE: Slot advanced — network healthy`,
  ()                         => `ANCHOR: PDA derived successfully`,
  (sol: string)              => `ESCROW: ◎${sol} still secured in PDA`,
];

function buildFeedEvent(tasks: ReturnType<typeof getAllTasks>): string {
  const t   = tasks[Math.floor(Math.random() * Math.max(tasks.length, 1))];
  const tpl = FEED_TEMPLATES[Math.floor(Math.random() * FEED_TEMPLATES.length)];
  const sol = t ? lamportsToSol(t.lamports).toFixed(3) : '0.100';
  const cat = t?.category ?? 'Programming';
  return tpl(sol, cat);
}

type Tab = 'analysis' | 'logs' | 'feed';

export const AIPanel: React.FC = () => {
  const { activities, insight, isAnalyzing, aiSummary } = useAI();
  const [isOpen, setIsOpen]   = useState(false);
  const [tab, setTab]         = useState<Tab>('analysis');
  const [feedLines, setFeedLines] = useState<{ text: string; ts: string }[]>([]);

  // Live feed ticker
  useEffect(() => {
    if (!isOpen || tab !== 'feed') return;
    const tasks = getAllTasks();
    const id = setInterval(() => {
      const text = buildFeedEvent(tasks);
      const ts   = new Date().toLocaleTimeString();
      setFeedLines(prev => [{ text, ts }, ...prev].slice(0, 40));
    }, 2200);
    return () => clearInterval(id);
  }, [isOpen, tab]);

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} style={styles.minimizedBtn} title="Open AI Monitor">
      <span style={styles.pulseDotSmall} /> AI Monitor
    </button>
  );

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.pulseDot} />
          <span style={styles.title}>SYSTEM AI MONITOR</span>
        </div>
        <button onClick={() => setIsOpen(false)} style={styles.closeBtn} title="Minimize">—</button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['analysis', 'logs', 'feed'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}>
            {t === 'analysis' ? 'Analysis' : t === 'logs' ? 'Logs' : 'Live Feed'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.body}>
        {tab === 'analysis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={styles.sectionTitle}>REAL-TIME INSIGHT</div>
            <div style={styles.insightBox}>
              {isAnalyzing
                ? <span style={styles.analyzing}>⬛ Processing data stream...</span>
                : <span style={{ color: '#e0ffe8', fontSize: '0.83rem', lineHeight: 1.5 }}>{insight}</span>
              }
            </div>
            {aiSummary && (
              <>
                <div style={styles.sectionTitle}>AI DISCUSSION SUMMARY</div>
                <div style={{ ...styles.insightBox, borderColor: 'rgba(0,255,170,0.3)' }}>
                  <span style={{ color: '#00ffaa', fontSize: '0.8rem', lineHeight: 1.5 }}>{aiSummary}</span>
                </div>
              </>
            )}
            <div style={styles.sectionTitle}>SESSION STATS</div>
            <div style={styles.statsRow}>
              <div style={styles.statChip}><span style={{ color: '#14F195' }}>{activities.length}</span><br /><span style={{ fontSize: '0.6rem' }}>Events</span></div>
              <div style={styles.statChip}><span style={{ color: '#14F195' }}>{getAllTasks().length}</span><br /><span style={{ fontSize: '0.6rem' }}>Tasks</span></div>
              <div style={styles.statChip}><span style={{ color: '#14F195' }}>◎{getAllTasks().filter(t => t.status !== 'completed').reduce((a, t) => a + lamportsToSol(t.lamports), 0).toFixed(2)}</span><br /><span style={{ fontSize: '0.6rem' }}>Locked</span></div>
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={styles.sectionTitle}>ACTIVITY LOG ({activities.length})</div>
            <div style={styles.logContainer}>
              {activities.length === 0
                ? <div style={{ color: '#2a5040', fontSize: '0.75rem', textAlign: 'center', padding: '16px 0' }}>No activity yet</div>
                : activities.map(act => (
                    <div key={act.id} style={styles.logItem}>
                      <span style={styles.time}>[{new Date(act.timestamp).toLocaleTimeString()}]</span>
                      <span style={styles.action}>{act.action}</span>
                    </div>
                  ))
              }
            </div>
          </div>
        )}

        {tab === 'feed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ ...styles.sectionTitle, display: 'flex', justifyContent: 'space-between' }}>
              <span>BLOCKCHAIN FEED</span>
              <span style={{ color: '#14F195', fontSize: '0.65rem' }}>● LIVE</span>
            </div>
            <div style={styles.logContainer}>
              {feedLines.length === 0
                ? <div style={{ color: '#2a5040', fontSize: '0.75rem', textAlign: 'center', padding: '16px 0' }}>Connecting to Devnet...</div>
                : feedLines.map((line, i) => (
                    <div key={i} style={styles.logItem}>
                      <span style={styles.time}>[{line.ts}]</span>
                      <span style={{ ...styles.action, color: '#14F195', opacity: 1 - i * 0.02 }}>{line.text}</span>
                    </div>
                  ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  minimizedBtn: {
    position: 'fixed', bottom: 16, left: 16, zIndex: 9999,
    background: '#010a04', border: '1px solid rgba(20,241,149,0.4)',
    color: '#14F195', padding: '10px 18px', borderRadius: '12px',
    fontFamily: "'Share Tech Mono', monospace", cursor: 'pointer',
    boxShadow: '0 0 24px rgba(20, 241, 149, 0.25)',
    display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.95rem', fontWeight: 800,
  },
  panel: {
    position: 'fixed', bottom: 16, left: 16,
    width: 'min(340px, calc(100vw - 32px))',
    zIndex: 9999,
    background: 'rgba(1, 10, 4, 0.97)', border: '1px solid rgba(20, 241, 149, 0.25)',
    borderRadius: '12px', boxShadow: '0 0 30px rgba(20, 241, 149, 0.12)',
    backdropFilter: 'blur(10px)', fontFamily: "'Share Tech Mono', monospace",
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    maxHeight: 'min(460px, calc(100vh - 120px))',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', background: 'rgba(20, 241, 149, 0.08)',
    borderBottom: '1px solid rgba(20, 241, 149, 0.15)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  pulseDot: {
    width: 8, height: 8, backgroundColor: '#14F195', borderRadius: '50%',
    boxShadow: '0 0 8px #14F195', animation: 'pulse-glow 2s infinite',
  },
  pulseDotSmall: {
    width: 6, height: 6, backgroundColor: '#14F195', borderRadius: '50%',
    boxShadow: '0 0 6px #14F195', display: 'inline-block',
  },
  title: { color: '#e0ffe8', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.08em' },
  closeBtn: { background: 'transparent', border: 'none', color: '#5a8a70', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 },
  tabs: { display: 'flex', borderBottom: '1px solid rgba(20,241,149,0.12)' },
  tab: {
    flex: 1, background: 'transparent', border: 'none', color: '#5a8a70',
    padding: '8px 4px', fontSize: '0.68rem', cursor: 'pointer',
    fontFamily: "'Share Tech Mono', monospace", letterSpacing: '0.02em',
    transition: 'color 0.2s',
  },
  tabActive: { color: '#14F195', borderBottom: '2px solid #14F195', background: 'rgba(20,241,149,0.05)' },
  body: { padding: '12px 14px', overflowY: 'auto', flex: 1 },
  sectionTitle: { fontSize: '0.62rem', color: '#2a5040', letterSpacing: '0.1em', marginBottom: 6 },
  insightBox: {
    background: 'rgba(20,241,149,0.04)', border: '1px solid rgba(20,241,149,0.15)',
    borderRadius: 8, padding: '10px 12px', minHeight: 48,
  },
  analyzing: { color: '#14F195', opacity: 0.8, fontSize: '0.82rem' },
  statsRow: { display: 'flex', gap: 8 },
  statChip: {
    flex: 1, background: 'rgba(20,241,149,0.06)', border: '1px solid rgba(20,241,149,0.15)',
    borderRadius: 8, padding: '8px 4px', textAlign: 'center',
    fontSize: '0.9rem', fontWeight: 800, color: '#e0ffe8',
  },
  logContainer: { maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 },
  logItem: { fontSize: '0.7rem', lineHeight: 1.4, wordBreak: 'break-word' },
  time:   { color: '#2a5040', marginRight: 5 },
  action: { color: '#14F195', opacity: 0.85 },
};
