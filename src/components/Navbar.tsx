// ============================================================
// Navbar.tsx — Responsive with hamburger menu for mobile
// ============================================================

import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { getBalance, requestAirdrop } from '../lib/solana'
import { NotificationBell } from './NotificationBell'

const NAV_LINKS = [
  { to: '/',           label: 'Home' },
  { to: '/dashboard',  label: 'Dashboard' },
  { to: '/analytics',  label: 'Analytics' },
  { to: '/profile',    label: 'Profile' },
]

export const Navbar: React.FC = () => {
  const { publicKey, connected } = useWallet()
  const location = useLocation()
  const [balance, setBalance]       = useState<number | null>(null)
  const [airdropping, setAirdropping] = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      const nav = document.getElementById('tasky-navbar')
      if (nav && !nav.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => {
    if (connected && publicKey) {
      getBalance(publicKey.toBase58()).then(setBalance).catch(() => {})
    } else {
      setBalance(null)
    }
  }, [connected, publicKey, location.pathname])

  const handleAirdrop = async () => {
    if (!publicKey) return
    setAirdropping(true)
    try {
      await requestAirdrop(publicKey.toBase58())
      const b = await getBalance(publicKey.toBase58())
      setBalance(b)
    } catch (e: any) {
      console.error(e)
      alert(`Airdrop failed: ${e.message}\n\nTry https://faucet.solana.com/`)
    } finally {
      setAirdropping(false)
    }
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <style>{`
        .nav-inner {
          max-width: 100%;
          margin: 0 auto;
          padding: 0 32px;
          height: 72px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          margin-left: 24px;
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
        }
        .nav-hamburger {
          display: none;
          background: none;
          border: 1px solid rgba(20,241,149,0.3);
          border-radius: 8px;
          color: #14F195;
          cursor: pointer;
          padding: 8px 10px;
          font-size: 1.1rem;
          line-height: 1;
          margin-left: auto;
          flex-shrink: 0;
        }
        .nav-mobile-menu {
          display: none;
        }
        .nav-balance-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(20,241,149,0.15);
          border-radius: 999px;
          padding: 6px 14px;
        }

        /* ── Tablet (≤ 900px): hide balance chip text, shrink padding ── */
        @media (max-width: 900px) {
          .nav-inner { padding: 0 20px; gap: 12px; }
          .nav-balance-text { display: none; }
          .nav-balance-chip { padding: 6px 10px; }
        }

        /* ── Mobile (≤ 680px): hamburger replaces links ── */
        @media (max-width: 680px) {
          .nav-links  { display: none !important; }
          .nav-right  { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-inner  { padding: 0 16px; height: 64px; }

          .nav-mobile-menu {
            display: flex;
            flex-direction: column;
            gap: 0;
            background: rgba(1,10,4,0.98);
            border-bottom: 1px solid rgba(20,241,149,0.2);
            backdrop-filter: blur(20px);
            padding: 12px 16px 20px;
            animation: slideDown 0.2s ease;
          }
          .nav-mobile-menu.closed { display: none; }

          .nav-mobile-link {
            display: block;
            padding: 14px 16px;
            color: #d0eadc;
            font-size: 0.95rem;
            font-weight: 600;
            text-decoration: none;
            border-radius: 10px;
            letter-spacing: 0.04em;
            transition: all 0.15s;
          }
          .nav-mobile-link:hover,
          .nav-mobile-link.active {
            background: rgba(20,241,149,0.12);
            color: #14F195;
          }
          .nav-mobile-divider {
            height: 1px;
            background: rgba(20,241,149,0.08);
            margin: 8px 0;
          }
          .nav-mobile-wallet {
            margin-top: 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <nav id="tasky-navbar" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'linear-gradient(to bottom, rgba(1,10,4,0.97), rgba(1,10,4,0.80))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(20,241,149,0.3)',
        boxShadow: '0 10px 40px -10px rgba(20,241,149,0.15), 0 4px 20px rgba(0,0,0,0.5)',
      }}>
        <div className="nav-inner">
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, textDecoration: 'none', flexShrink: 0, marginBottom: 3 }}>
            <span style={{ fontSize: '2rem', color: '#fff', lineHeight: 0.85, textShadow: '0 0 20px #14F195, 0 0 10px #14F195' }}>◎</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', fontFamily: "'Share Tech Mono', monospace", lineHeight: 0.85, textShadow: '0 0 15px rgba(20,241,149,0.8)' }}>Tasky</span>
            <span style={{ background: 'rgba(20,241,149,0.1)', color: '#14F195', border: '1px solid rgba(20,241,149,0.3)', borderRadius: 4, fontSize: '0.58rem', fontWeight: 800, padding: '2px 6px', letterSpacing: '0.1em', textTransform: 'uppercase', transform: 'translateY(-2px)' }}>devnet</span>
          </Link>

          {/* Desktop nav links */}
          <div className="nav-links">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} style={{
                color: isActive(to) ? '#14F195' : '#d0eadc',
                fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase',
                letterSpacing: '0.1em', padding: '8px 14px', borderRadius: 8,
                transition: 'all 0.2s', textDecoration: 'none',
                ...(isActive(to) ? {
                  textShadow: '0 0 10px rgba(20,241,149,0.4)',
                  background: 'rgba(20,241,149,0.15)',
                  boxShadow: '0 0 20px rgba(20,241,149,0.25), inset 0 0 10px rgba(20,241,149,0.1)',
                  border: '1px solid rgba(20,241,149,0.3)',
                } : {}),
              }}>{label}</Link>
            ))}
          </div>

          {/* Desktop right side */}
          <div className="nav-right">
            {connected && balance !== null && (
              <div className="nav-balance-chip">
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#14F195', boxShadow: '0 0 6px #14F195', flexShrink: 0, display: 'inline-block' }} />
                <span className="nav-balance-text" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e0ffe8', fontFamily: "'Share Tech Mono', monospace" }}>{balance.toFixed(3)} SOL</span>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: '0.9rem', lineHeight: 1 }} onClick={handleAirdrop} disabled={airdropping} title="Request 1 SOL airdrop">
                  {airdropping ? '⏳' : '🪂'}
                </button>
              </div>
            )}
            <NotificationBell />
            <WalletMultiButton />
          </div>

          {/* Mobile hamburger */}
          <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <div className={`nav-mobile-menu ${menuOpen ? '' : 'closed'}`}>
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className={`nav-mobile-link ${isActive(to) ? 'active' : ''}`}>
              {label}
            </Link>
          ))}
          <div className="nav-mobile-divider" />
          <div className="nav-mobile-wallet">
            {connected && balance !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(20,241,149,0.05)', borderRadius: 10, border: '1px solid rgba(20,241,149,0.15)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#14F195', boxShadow: '0 0 6px #14F195', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e0ffe8', fontFamily: "'Share Tech Mono', monospace", flex: 1 }}>{balance.toFixed(3)} SOL</span>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} onClick={handleAirdrop} disabled={airdropping} title="Airdrop">
                  {airdropping ? '⏳' : '🪂'}
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <NotificationBell />
              <WalletMultiButton />
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
