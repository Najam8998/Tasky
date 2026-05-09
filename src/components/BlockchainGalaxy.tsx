// BlockchainGalaxy.tsx — Full-screen animated blockchain network canvas
import React, { useEffect, useRef } from 'react'

interface Node {
  x: number; y: number
  vx: number; vy: number
  radius: number
  glowSize: number
  pulsePhase: number
  pulseSpeed: number
}
interface Packet {
  from: number; to: number
  progress: number
  speed: number
}
interface Star {
  x: number; y: number
  size: number
  opacity: number
  twinklePhase: number
  twinkleSpeed: number
}

const NODE_COUNT      = 38
const CONNECTION_DIST = 190
const STAR_COUNT      = 220

export const BlockchainGalaxy: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let W = window.innerWidth
    let H = window.innerHeight

    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width  = W
      canvas.height = H
    }
    resize()
    window.addEventListener('resize', resize)

    /* ── Stars ── */
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 1.2 + 0.2,
      opacity: Math.random() * 0.55 + 0.1,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.006 + Math.random() * 0.012,
    }))

    /* ── Blockchain nodes ── */
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      radius: 1.8 + Math.random() * 2.2,
      glowSize: 10 + Math.random() * 16,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.012 + Math.random() * 0.022,
    }))

    /* ── Data packets ── */
    const packets: Packet[] = []
    const spawnPacket = () => {
      const from = Math.floor(Math.random() * NODE_COUNT)
      const to   = Math.floor(Math.random() * NODE_COUNT)
      if (from !== to) packets.push({ from, to, progress: 0, speed: 0.003 + Math.random() * 0.005 })
    }
    for (let i = 0; i < 14; i++) spawnPacket()

    /* ── Nebula positions (% of screen) ── */
    const nebulae = [
      { rx: 0.15, ry: 0.22, r: 320, a: 0.028 },
      { rx: 0.82, ry: 0.58, r: 270, a: 0.022 },
      { rx: 0.50, ry: 0.08, r: 220, a: 0.020 },
      { rx: 0.30, ry: 0.85, r: 300, a: 0.024 },
      { rx: 0.90, ry: 0.18, r: 190, a: 0.018 },
      { rx: 0.65, ry: 0.45, r: 240, a: 0.016 },
    ]

    /* ── Main draw loop ── */
    const draw = () => {
      /* Background */
      ctx.fillStyle = '#010a04'
      ctx.fillRect(0, 0, W, H)

      /* Nebula glows */
      nebulae.forEach(n => {
        const cx = n.rx * W, cy = n.ry * H
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, n.r)
        g.addColorStop(0, `rgba(20,241,149,${n.a})`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(cx, cy, n.r, 0, Math.PI * 2)
        ctx.fill()
      })

      /* Stars */
      stars.forEach(s => {
        s.twinklePhase += s.twinkleSpeed
        const alpha = s.opacity * (0.55 + 0.45 * Math.sin(s.twinklePhase))
        ctx.globalAlpha = alpha
        ctx.fillStyle   = '#d0ffe8'
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1

      /* Update node positions (wrap / bounce) */
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy
        n.pulsePhase += n.pulseSpeed
        /* Soft wrap */
        if (n.x < -40)    n.x = W + 40
        if (n.x > W + 40) n.x = -40
        if (n.y < -40)    n.y = H + 40
        if (n.y > H + 40) n.y = -40
      })

      /* Connection lines */
      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const a = nodes[i], b = nodes[j]
          const dx = b.x - a.x, dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.28
            ctx.globalAlpha = alpha
            /* Gradient line */
            const lg = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
            lg.addColorStop(0, '#14F195')
            lg.addColorStop(1, '#00cc88')
            ctx.strokeStyle = lg
            ctx.lineWidth   = 0.7
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1

      /* Data packets */
      for (let k = packets.length - 1; k >= 0; k--) {
        const p  = packets[k]
        p.progress += p.speed
        if (p.progress >= 1) { packets.splice(k, 1); spawnPacket(); continue }
        const a  = nodes[p.from], b = nodes[p.to]
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > CONNECTION_DIST * 1.6) { packets.splice(k, 1); spawnPacket(); continue }
        const px = a.x + dx * p.progress
        const py = a.y + dy * p.progress
        /* Packet glow */
        const pg = ctx.createRadialGradient(px, py, 0, px, py, 6)
        pg.addColorStop(0, 'rgba(20,241,149,1)')
        pg.addColorStop(0.4, 'rgba(20,241,149,0.4)')
        pg.addColorStop(1, 'rgba(20,241,149,0)')
        ctx.fillStyle = pg
        ctx.beginPath()
        ctx.arc(px, py, 6, 0, Math.PI * 2)
        ctx.fill()
      }

      /* Nodes */
      nodes.forEach(n => {
        const pulse = 0.72 + 0.28 * Math.sin(n.pulsePhase)

        /* Outer aura */
        const aura = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.glowSize * pulse)
        aura.addColorStop(0, `rgba(20,241,149,${0.14 * pulse})`)
        aura.addColorStop(1, 'rgba(20,241,149,0)')
        ctx.fillStyle = aura
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.glowSize * pulse, 0, Math.PI * 2)
        ctx.fill()

        /* Core */
        const core = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 1.6)
        core.addColorStop(0, '#ffffff')
        core.addColorStop(0.35, '#14F195')
        core.addColorStop(1, 'rgba(20,241,149,0.15)')
        ctx.fillStyle = core
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius * pulse, 0, Math.PI * 2)
        ctx.fill()

        /* Orbit ring */
        ctx.strokeStyle = `rgba(20,241,149,${0.22 * pulse})`
        ctx.lineWidth   = 0.65
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius * 2.8 * pulse, 0, Math.PI * 2)
        ctx.stroke()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
