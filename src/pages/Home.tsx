// ============================================================
// Home.tsx — Landing page
// ============================================================

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { lamportsToSol, type Task } from '../lib/contract'
import { useTaskStore } from '../context/TaskStoreContext'
import { SolanaPriceChart } from '../components/SolanaPriceChart'

export const Home: React.FC = () => {
  const { connected } = useWallet()
  const navigate = useNavigate()
  const { tasks } = useTaskStore()
  const [stats, setStats] = useState({ total: 0, open: 0, solLocked: 0 })
  const [openTasks, setOpenTasks] = useState<Task[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const solLocked = tasks
      .filter(t => t.status === 'open' || t.status === 'in_progress')
      .reduce((acc, t) => acc + lamportsToSol(t.lamports), 0)
    setStats({
      total:     tasks.length,
      open:      tasks.filter(t => t.status === 'open').length,
      solLocked,
    })
    setOpenTasks(tasks.filter(t => t.status === 'open').sort((a, b) => b.createdAt - a.createdAt))
  }, [tasks])

  const filteredTasks = openTasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 6)

  return (
    <div style={styles.root}>
      {/* Hero */}
      <section style={styles.hero}>
        <div className="animate-fade-up" style={styles.heroInner}>
          <div style={styles.eyebrow}>
            <span style={styles.eyebrowDot} />
            Powered by Solana Devnet
          </div>

          <h1 style={styles.title}>
            The Trustless Marketplace for{' '}
            <span style={styles.gradientText}>Academic Help</span>
          </h1>

          <p style={styles.subtitle}>
            Stop paying 30% middleman fees. Connect directly with expert tutors using Solana smart contracts for secure, instant, and transparent escrow payments.
          </p>

          <div style={styles.ctaRow}>
            {connected ? (
              <>
                <button className="btn btn-primary animate-pulse" onClick={() => navigate('/create')} style={{ fontSize: '1.25rem', padding: '20px 48px', borderRadius: 14, letterSpacing: '0.05em' }}>
                  Post a Task
                </button>
                <button className="btn btn-outline" onClick={() => navigate('/expert')} style={{ fontSize: '1.2rem', padding: '18px 42px', borderRadius: 14, letterSpacing: '0.05em' }}>
                  Expert Portal
                </button>
              </>
            ) : (
              <>
                <WalletMultiButton />
                <button className="btn btn-ghost" onClick={() => navigate('/expert')}>
                  Browse marketplace →
                </button>
              </>
            )}
          </div>
          {/* Scroll Down Indicator */}
          <div 
            style={{ marginTop: 20, display: 'flex', justifyContent: 'center', cursor: 'pointer', paddingBottom: 10 }}
            onClick={() => window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' })}
          >
             <div className="animate-float" style={{ 
               fontSize: '1.5rem', 
               color: '#010a04', 
               fontWeight: 800,
               width: 50, 
               height: 50, 
               borderRadius: '50%', 
               background: '#14F195',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               boxShadow: '0 0 30px rgba(20,241,149,0.5)'
             }}>
                ↓
             </div>
          </div>
        </div>
      </section>

      {/* ── Live Network Ticker ── */}
      <div className="ticker-wrapper" style={{ marginBottom: 60, marginTop: -20, position: 'relative', zIndex: 2 }}>
        <div className="ticker-track">
          <div className="ticker-item"><span style={{width: 6, height: 6, background: '#14F195', borderRadius: '50%', boxShadow: '0 0 8px #14F195'}}></span> 7xKp just escrowed <span className="highlight">◎ 1.50 SOL</span> for Python debugging</div>
          <div className="ticker-item"><span style={{width: 6, height: 6, background: '#14F195', borderRadius: '50%', boxShadow: '0 0 8px #14F195'}}></span> A2bR released <span className="highlight">◎ 0.85 SOL</span> to expert</div>
          <div className="ticker-item"><span style={{width: 6, height: 6, background: '#14F195', borderRadius: '50%', boxShadow: '0 0 8px #14F195'}}></span> New task posted: <span className="highlight">Calculus Assignment</span></div>
          <div className="ticker-item"><span style={{width: 6, height: 6, background: '#14F195', borderRadius: '50%', boxShadow: '0 0 8px #14F195'}}></span> 9mYt earned <span className="highlight">◎ 2.20 SOL</span> this week</div>
          <div className="ticker-item"><span style={{width: 6, height: 6, background: '#14F195', borderRadius: '50%', boxShadow: '0 0 8px #14F195'}}></span> Expert 4fLp just reached <span className="highlight">Verified</span> rank</div>
          {/* Duplicate for seamless loop */}
          <div className="ticker-item"><span style={{width: 6, height: 6, background: '#14F195', borderRadius: '50%', boxShadow: '0 0 8px #14F195'}}></span> 7xKp just escrowed <span className="highlight">◎ 1.50 SOL</span> for Python debugging</div>
          <div className="ticker-item"><span style={{width: 6, height: 6, background: '#14F195', borderRadius: '50%', boxShadow: '0 0 8px #14F195'}}></span> A2bR released <span className="highlight">◎ 0.85 SOL</span> to expert</div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={styles.statsBar}>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{stats.total}</span>
          <span style={styles.statLabel}>Total Tasks</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={{ ...styles.statValue, color: '#14F195' }}>{stats.open}</span>
          <span style={styles.statLabel}>Open Now</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={{ ...styles.statValue, color: '#14F195' }}>◎ {stats.solLocked.toFixed(2)}</span>
          <span style={styles.statLabel}>SOL in Escrow</span>
        </div>
      </div>

      {/* Solana Real Value Chart */}
      <div style={{ marginBottom: 60 }}>
        <SolanaPriceChart />
      </div>

      {/* ── Marketplace Browse Panel ── */}
      <section style={styles.marketSection}>
        <div style={styles.marketHeader}>
          <div>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: '#e0ffe8' }}>
              Open Tasks Marketplace
            </h2>
            <p style={{ color: '#8888aa', marginTop: 6, fontSize: '0.9rem' }}>
              {openTasks.length > 0
                ? `${openTasks.length} task${openTasks.length !== 1 ? 's' : ''} looking for an expert — pick one and earn SOL`
                : 'No open tasks yet. Be the first to post one!'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input"
              style={{ width: 240, margin: 0, height: 42, background: 'rgba(20,241,149,0.03)' }}
            />
            <button
              className="btn btn-outline"
              onClick={() => navigate('/tasks')}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              View All →
            </button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div style={styles.marketEmpty}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
            <h3 style={{ color: '#e0ffe8', marginBottom: 8 }}>No results found</h3>
            <p style={{ color: '#5a8a70', marginBottom: 20 }}>Try adjusting your search terms or browse all tasks.</p>
          </div>
        ) : (
          <div style={styles.marketGrid}>
            {filteredTasks.map(task => {
              const sol = lamportsToSol(task.lamports)
              return (
                <div
                  key={task.id}
                  className="card market-card"
                  style={styles.marketCard}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{task.category}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#14F195', lineHeight: 1 }}>◎ {sol.toFixed(3)}</div>
                      <div style={{ fontSize: '0.65rem', color: '#555577', marginTop: 2 }}>SOL reward</div>
                    </div>
                  </div>
                  <h3 style={{ color: '#e0ffe8', fontSize: '0.95rem', fontWeight: 700, marginBottom: 8, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {task.title}
                  </h3>
                  <p style={{ color: '#5a8a70', fontSize: '0.78rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 12 }}>
                    {task.description}
                  </p>
                  <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#2a5040' }}>
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#14F195' }}>View &amp; Accept →</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* How it works */}
      <section style={styles.howSection}>
        <h2 style={{ textAlign: 'center', marginBottom: 48 }}>How Tasky Works</h2>
        <div style={styles.steps}>
          {HOW_STEPS.map((step, i) => (
            <div key={i} className="card" style={styles.stepCard}>
              <div style={styles.stepNum}>{i + 1}</div>
              <div style={styles.stepIcon}>{step.icon}</div>
              <h3 style={styles.stepTitle}>{step.title}</h3>
              <p style={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section style={styles.featuresSection}>
        <h2 style={{ textAlign: 'center', marginBottom: 12 }}>Why Tasky?</h2>
        <p style={{ textAlign: 'center', marginBottom: 48, color: '#8888aa' }}>
          Built on Solana's fast, low-fee infrastructure.
        </p>
        <div style={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} className="card" style={styles.featureCard}>
              <span style={styles.featureEmoji}>{f.icon}</span>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const HOW_STEPS = [
  { icon: '01', title: 'Connect Phantom', desc: 'Link your Phantom wallet to Tasky. Make sure you\'re on Solana Devnet.' },
  { icon: '02', title: 'Post a Task', desc: 'Describe your academic need and set a SOL reward. Funds lock into escrow immediately.' },
  { icon: '03', title: 'Expert Accepts', desc: 'A qualified helper accepts your task. You discuss directly on the task page.' },
  { icon: '04', title: 'Release Payment', desc: 'Once satisfied, release the escrowed SOL to the helper with one click.' },
]

const FEATURES = [
  { icon: 'ESCROW', title: 'Escrow Security', desc: 'SOL is locked in a PDA — neither party can take funds unfairly.' },
  { icon: 'INSTANT', title: 'Instant Settlement', desc: 'Solana confirms transactions in ~400ms. No waiting days for payment.' },
  { icon: 'TRUST', title: 'Trustless', desc: 'Smart contract enforces rules. No middleman, no platform fees.' },
  { icon: 'ACAD', title: 'Academic Focus', desc: 'Built for programming help, writing, maths, and more.' },
  { icon: 'CHAT', title: 'Built-in Chat', desc: 'Discuss requirements directly on the task page, fully on-chain accountable.' },
  { icon: 'EXPL', title: 'Tx History', desc: 'Every action is recorded. Full transparency via Solana Explorer.' },
]

const styles: Record<string, React.CSSProperties> = {
  root: { maxWidth: 1140, margin: '0 auto', padding: '0 24px' },

  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '80px 0 40px',
  },
  heroInner: { display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', maxWidth: 900 },

  eyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: '0.85rem',
    fontWeight: 800,
    color: '#14F195',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  eyebrowDot: {
    width: 8, height: 8,
    borderRadius: '50%',
    background: '#14F195',
    boxShadow: '0 0 12px #14F195',
  },

  title: {
    fontSize: 'clamp(2rem, 6vw, 4.5rem)',
    fontWeight: 800,
    lineHeight: 1.1,
    color: '#ffffff',
    letterSpacing: '-0.02em',
    textShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #14F195, #00ffaa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 0 20px rgba(20,241,149,0.4))',
  },
  subtitle: {
    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
    color: '#c8e0d4',
    lineHeight: 1.6,
    maxWidth: 700,
    fontWeight: 400,
    margin: '0 auto',
  },
  ctaRow: { display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' },

  // PDA card
  heroVisual: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdaCard: {
    background: 'rgba(20,241,149,0.05)',
    border: '1px solid rgba(20,241,149,0.25)',
    borderRadius: 16,
    padding: 20,
    backdropFilter: 'blur(20px)',
    animation: 'pulse-glow 3s ease-in-out infinite',
    maxWidth: 280,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: '0 8px 32px rgba(20,241,149,0.1)',
  },
  pdaHeader: { display: 'flex', alignItems: 'center', gap: 8 },
  pdaIcon:  { fontSize: '1.2rem', color: '#14F195' },
  pdaTitle: { fontWeight: 700, color: '#e0ffe8', flex: 1, fontFamily: "'Share Tech Mono', monospace" },
  pdaAmount: { fontSize: '2rem', fontWeight: 800, color: '#14F195', textShadow: '0 0 15px rgba(20,241,149,0.8), 0 0 30px rgba(20,241,149,0.4)' },
  pdaDesc:  { fontSize: '0.68rem', color: '#14F195', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.8 },
  pdaTask: {
    background: 'rgba(20,241,149,0.05)',
    border: '1px solid rgba(20,241,149,0.3)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: '0.8rem',
    color: '#e0ffe8',
    fontFamily: "'Share Tech Mono', monospace",
    lineHeight: 1.4,
  },
  pdaFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  pdaAddr:  { fontSize: '0.7rem', fontFamily: 'monospace', color: '#e0ffe8', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 },

  // Stats
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 60,
    background: 'linear-gradient(90deg, transparent, rgba(20,241,149,0.05), transparent)',
    borderTop: '1px solid rgba(20,241,149,0.15)',
    borderBottom: '1px solid rgba(20,241,149,0.15)',
    padding: '40px 0',
    marginBottom: 60,
    boxShadow: 'inset 0 0 40px rgba(20,241,149,0.02)',
  },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statValue: {
    fontSize: '2.8rem',
    fontWeight: 800,
    color: '#e0ffe8',
    lineHeight: 1,
    marginBottom: 8,
    fontFamily: "'Share Tech Mono', monospace",
    textShadow: '0 0 20px rgba(20,241,149,0.5)',
  },
  statLabel: { fontSize: '0.85rem', color: '#5a8a70', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 },
  statDivider: { width: 1, background: 'linear-gradient(to bottom, transparent, rgba(20,241,149,0.3), transparent)' },

  // Marketplace section
  marketSection: { marginBottom: 80 },
  marketHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 28,
    flexWrap: 'wrap' as const,
  },
  marketGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 18,
  },
  marketCard: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    cursor: 'pointer',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
    minHeight: 180,
  },
  marketEmpty: {
    textAlign: 'center' as const,
    padding: '60px 0',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },

  // How it works
  howSection: { marginBottom: 80 },
  steps: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 },
  stepCard: { padding: 28, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' },
  stepNum: {
    position: 'absolute', top: 20, right: 20,
    fontSize: '0.7rem', fontWeight: 800, color: '#555577',
  },
  stepIcon: { fontSize: '2rem' },
  stepTitle: { color: '#e0ffe8', fontWeight: 700 },
  stepDesc:  { fontSize: '0.85rem', color: '#5a8a70', lineHeight: 1.6 },

  // Features
  featuresSection: { paddingBottom: 80 },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 },
  featureCard: { padding: 28, display: 'flex', flexDirection: 'column', gap: 10 },
  featureEmoji: { fontSize: '1.8rem' },
  featureTitle: { color: '#e0ffe8', fontWeight: 700 },
  featureDesc:  { fontSize: '0.85rem', color: '#5a8a70', lineHeight: 1.6 },
}
