import { useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

/* ─── canvas helpers ────────────────────────────────────────────── */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

/* ─── inline SVG icons ──────────────────────────────────────────── */
const IcoDoc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#E85D04" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="13" y2="17"/>
  </svg>
)
const IcoQuiz = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#E85D04" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <polyline points="9 11 12 14 22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
)
const IcoMic = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#E85D04" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)

/* ─── component ─────────────────────────────────────────────────── */
export default function LandingPage() {
  const gridRef         = useRef(null)
  const animRef         = useRef(null)
  const animContainerRef = useRef(null)
  const rafRef          = useRef(null)
  const navigate        = useNavigate()
  const token           = localStorage.getItem('token')

  /* ── grid canvas ─────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = gridRef.current
    if (!canvas) return

    const draw = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const ctx = canvas.getContext('2d')
      const W = canvas.width
      const H = canvas.height
      const S = 36

      ctx.clearRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'
      ctx.lineWidth   = 0.5

      for (let x = 0; x <= W; x += S) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = 0; y <= H; y += S) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      /* fade mask: transparent at 28%, fully opaque (#0a0a0a) at 82% */
      const fadeH   = H * (0.82 - 0.28)
      const grad    = ctx.createLinearGradient(0, H * 0.28, 0, H * 0.82)
      grad.addColorStop(0, 'rgba(10,10,10,0)')
      grad.addColorStop(1, 'rgba(10,10,10,1)')
      ctx.fillStyle = grad
      ctx.fillRect(0, H * 0.28, W, fadeH)

      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, H * 0.82, W, H * 0.18 + 1)
    }

    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [])

  /* ── animation canvas ────────────────────────────────────────── */
  useEffect(() => {
    const canvas    = animRef.current
    const container = animContainerRef.current
    if (!canvas || !container) return

    const W = Math.min(container.offsetWidth || 700, 700)
    const H = 240
    canvas.width  = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    /* layout (proportional to W) */
    const PDF_X  = Math.round(W * 0.06)
    const PDF_Y  = Math.round(H * 0.20)
    const PDF_W  = Math.min(85, Math.round(W * 0.13))
    const PDF_H  = 110
    const PDF_CX = PDF_X + PDF_W / 2
    const PDF_CY = PDF_Y + PDF_H / 2

    const NET_CX = Math.round(W * 0.63)
    const NET_CY = Math.round(H * 0.50)

    /* state */
    let pdfOpen = 0
    let frame   = 0
    const particles = []

    /* nodes — cerveau VU DE PROFIL (vue latérale gauche) */
    const COLORS = ['#E85D04', '#F48C06', '#444']
    const BRAIN_POS = [
      /* lobe frontal (avant-gauche) */
      { hx: -62, hy: -16 },
      /* gyri du dessus (bosses, de gauche à droite) */
      { hx: -44, hy: -52 },
      { hx: -18, hy: -56 },
      { hx:   8, hy: -54 },
      { hx:  34, hy: -50 },
      { hx:  58, hy: -34 },
      /* lobe occipital (arrière) */
      { hx:  72, hy:  -4 },
      { hx:  66, hy:  26 },
      /* base (de l'arrière vers l'avant) */
      { hx:  40, hy:  46 },
      { hx:   8, hy:  48 },
      { hx: -24, hy:  42 },
      /* intérieur — corps calleux */
      { hx: -10, hy: -10 },
      { hx:  22, hy:   8 },
    ]
    const nodes = BRAIN_POS.map((b, i) => ({
      x:     NET_CX + b.hx + (Math.random() - 0.5) * 6,
      y:     NET_CY + b.hy + (Math.random() - 0.5) * 6,
      hx:    b.hx,
      hy:    b.hy,
      vx:    (Math.random() - 0.5) * 0.3,
      vy:    (Math.random() - 0.5) * 0.3,
      r:     3.5 + Math.random() * 2.5,
      phase: Math.random() * Math.PI * 2,
      color: COLORS[i % 3],
    }))

    const spawnParticles = () => {
      for (let i = 0; i < 2; i++) {
        const target = nodes[Math.floor(Math.random() * nodes.length)]
        particles.push({
          sx:    PDF_X + PDF_W,
          sy:    PDF_CY,
          target,
          prog:  0,
          speed: 0.008 + Math.random() * 0.006,
          color: Math.random() > 0.5 ? '#E85D04' : '#F48C06',
          arcDir: Math.random() > 0.5 ? 1 : -1,
          arcMag: 18 + Math.random() * 38,
        })
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, W, H)

      /* background */
      ctx.fillStyle = '#0d0d0d'
      ctx.fillRect(0, 0, W, H)

      /* advance state */
      if (pdfOpen < 1) pdfOpen = Math.min(1, pdfOpen + 0.007)
      if (frame % 20 === 0 && pdfOpen > 0.2) spawnParticles()
      const t = frame * 0.016

      /* ── dashed arrow ── */
      if (pdfOpen > 0.3) {
        const alpha = Math.min(1, (pdfOpen - 0.3) / 0.4) * 0.5
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.strokeStyle = '#444'
        ctx.lineWidth   = 1
        ctx.setLineDash([4, 5])
        ctx.beginPath()
        ctx.moveTo(PDF_X + PDF_W + 6, PDF_CY)
        ctx.lineTo(NET_CX - 72, NET_CY - 2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      }

      /* ── PDF ── */
      ctx.save()

      /* main rectangle */
      roundRect(ctx, PDF_X, PDF_Y, PDF_W, PDF_H, 5)
      ctx.fillStyle   = '#111'
      ctx.fill()
      ctx.strokeStyle = '#F48C06'
      ctx.lineWidth   = 1.2
      ctx.stroke()

      /* corner fold (top-left flap rotates open) */
      const FLAP = 20
      const flapAngle = pdfOpen * (Math.PI / 5)   /* 0 → 36° */

      ctx.save()
      /* rotate around the inner diagonal point */
      ctx.translate(PDF_X + FLAP, PDF_Y + FLAP)
      ctx.rotate(-flapAngle)
      ctx.translate(-(PDF_X + FLAP), -(PDF_Y + FLAP))

      ctx.beginPath()
      ctx.moveTo(PDF_X,        PDF_Y)
      ctx.lineTo(PDF_X + FLAP, PDF_Y)
      ctx.lineTo(PDF_X,        PDF_Y + FLAP)
      ctx.closePath()
      ctx.fillStyle   = '#1d1d1d'
      ctx.fill()
      ctx.strokeStyle = '#F48C06'
      ctx.lineWidth   = 0.85
      ctx.stroke()
      ctx.restore()

      /* crease line */
      ctx.beginPath()
      ctx.moveTo(PDF_X + FLAP, PDF_Y)
      ctx.lineTo(PDF_X,        PDF_Y + FLAP)
      ctx.strokeStyle = '#F48C06'
      ctx.lineWidth   = 0.85
      ctx.stroke()

      /* text lines (shrink as PDF opens) */
      const lineRows = [
        [PDF_X + 10, PDF_Y + 33, 52],
        [PDF_X + 10, PDF_Y + 47, 44],
        [PDF_X + 10, PDF_Y + 61, 48],
        [PDF_X + 10, PDF_Y + 75, 38],
      ]
      lineRows.forEach(([lx, ly, maxW]) => {
        const w = maxW * (1 - pdfOpen * 0.12)
        ctx.fillStyle = '#2c2c2c'
        ctx.beginPath()
        ctx.rect(lx, ly, w, 3.5)
        ctx.fill()
      })

      /* "PDF" label fades in */
      if (pdfOpen > 0.6) {
        const a = Math.min(1, (pdfOpen - 0.6) / 0.25)
        ctx.globalAlpha = a
        ctx.fillStyle   = '#E85D04'
        ctx.font        = 'bold 8px monospace'
        ctx.fillText('PDF', PDF_X + PDF_W - 24, PDF_Y + 14)
      }
      ctx.restore()

      /* ── neural network ── */
      /* physics update */
      nodes.forEach((n, i) => {
        n.x += n.vx
        n.y += n.vy

        /* ressort vers la position d'ancrage (maintient la forme cerveau) */
        const dx = n.x - (NET_CX + n.hx)
        const dy = n.y - (NET_CY + n.hy)
        n.vx -= dx * 0.005
        n.vy -= dy * 0.005

        /* répulsion légère entre nœuds voisins */
        nodes.forEach((other, j) => {
          if (i === j) return
          const ddx = n.x - other.x
          const ddy = n.y - other.y
          const dd  = Math.hypot(ddx, ddy)
          if (dd < 36 && dd > 0.1) {
            const f = 0.12 / dd
            n.vx += ddx * f
            n.vy += ddy * f
          }
        })

        /* clamp vitesse à ±0.28 */
        const speed = Math.hypot(n.vx, n.vy)
        if (speed > 0.28) {
          n.vx = (n.vx / speed) * 0.28
          n.vy = (n.vy / speed) * 0.28
        }
      })

      /* ── contour cerveau de profil (silhouette en pointillés) ── */
      if (pdfOpen > 0.15) {
        const bAlpha = Math.min(1, (pdfOpen - 0.15) / 0.5) * 0.24
        ctx.save()
        ctx.globalAlpha = bAlpha
        ctx.strokeStyle = '#E85D04'
        ctx.lineWidth   = 0.9
        ctx.setLineDash([3, 5])

        /* ─ contour extérieur ─ */
        ctx.beginPath()
        /* départ : base avant */
        ctx.moveTo(NET_CX - 28, NET_CY + 46)
        /* paroi frontale montante */
        ctx.bezierCurveTo(NET_CX - 54, NET_CY + 42, NET_CX - 70, NET_CY + 16, NET_CX - 68, NET_CY - 18)
        /* gyrus 1 (lobe frontal) */
        ctx.bezierCurveTo(NET_CX - 66, NET_CY - 40, NET_CX - 56, NET_CY - 54, NET_CX - 44, NET_CY - 52)
        /* sulcus 1 */
        ctx.bezierCurveTo(NET_CX - 34, NET_CY - 50, NET_CX - 28, NET_CY - 42, NET_CX - 18, NET_CY - 56)
        /* gyrus 2 */
        ctx.bezierCurveTo(NET_CX -  8, NET_CY - 58, NET_CX +  2, NET_CY - 46, NET_CX +  8, NET_CY - 54)
        /* sulcus 2 */
        ctx.bezierCurveTo(NET_CX + 18, NET_CY - 60, NET_CX + 28, NET_CY - 48, NET_CX + 34, NET_CY - 52)
        /* gyrus 3 */
        ctx.bezierCurveTo(NET_CX + 44, NET_CY - 56, NET_CX + 56, NET_CY - 46, NET_CX + 58, NET_CY - 34)
        /* arc occipital (arrière-haut) */
        ctx.bezierCurveTo(NET_CX + 70, NET_CY - 22, NET_CX + 76, NET_CY -  4, NET_CX + 74, NET_CY + 20)
        /* arrière-bas */
        ctx.bezierCurveTo(NET_CX + 70, NET_CY + 38, NET_CX + 52, NET_CY + 50, NET_CX + 30, NET_CY + 50)
        /* base (de l'arrière vers l'avant) */
        ctx.bezierCurveTo(NET_CX + 12, NET_CY + 52, NET_CX - 8,  NET_CY + 50, NET_CX - 28, NET_CY + 46)
        ctx.stroke()

        /* ─ quelques sulci internes (plis du cortex) ─ */
        ctx.globalAlpha = bAlpha * 0.55
        /* sulcus central */
        ctx.beginPath()
        ctx.moveTo(NET_CX + 2, NET_CY - 52)
        ctx.bezierCurveTo(NET_CX - 2, NET_CY - 30, NET_CX + 6, NET_CY - 10, NET_CX + 4, NET_CY + 12)
        ctx.stroke()
        /* scissure de Sylvius */
        ctx.beginPath()
        ctx.moveTo(NET_CX - 55, NET_CY - 10)
        ctx.bezierCurveTo(NET_CX - 30, NET_CY -  8, NET_CX + 5, NET_CY +  2, NET_CX + 30, NET_CY + 14)
        ctx.stroke()

        ctx.setLineDash([])
        ctx.restore()
      }

      /* connections */
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y)
          if (d < 85) {
            const alpha = (1 - d / 85) * 0.45
            ctx.beginPath()
            ctx.strokeStyle = `rgba(232,93,4,${alpha.toFixed(3)})`
            ctx.lineWidth   = 0.6
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      /* node dots */
      nodes.forEach(n => {
        const r = n.r + Math.sin(t * 1.6 + n.phase) * 1.2
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = n.color
        ctx.fill()
      })

      /* ── particles ── */
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.prog = Math.min(1, p.prog + p.speed)
        if (p.prog >= 1) { particles.splice(i, 1); continue }

        const e  = easeInOut(p.prog)
        const tx = p.target.x
        const ty = p.target.y
        const px = p.sx + (tx - p.sx) * e
        const py = p.sy + (ty - p.sy) * e + Math.sin(p.prog * Math.PI) * p.arcMag * p.arcDir

        const alpha = p.prog > 0.78 ? 1 - (p.prog - 0.78) / 0.22 : 1

        ctx.beginPath()
        ctx.arc(px, py, 2.8, 0, Math.PI * 2)
        ctx.fillStyle   = p.color
        ctx.globalAlpha = alpha
        ctx.fill()
        ctx.globalAlpha = 1
      }

      frame++
      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const goApp   = () => navigate(token ? '/home' : '/register')
  const goLogin = () => navigate('/login')

  /* ── shared button styles ── */
  const btnOrange = {
    background: '#E85D04', border: 'none', color: '#fff',
    fontWeight: 600, fontSize: '.92rem', cursor: 'pointer',
    padding: '11px 24px', borderRadius: '9px',
    transition: 'background .15s',
  }
  const btnGhost = {
    background: '#111', border: '1px solid #2a2a2a', color: '#f5f5f5',
    fontWeight: 500, fontSize: '.92rem', cursor: 'pointer',
    padding: '11px 22px', borderRadius: '9px',
    transition: 'background .15s, border-color .15s',
  }

  return (
    <div style={{ background:'#0a0a0a', color:'#f5f5f5', minHeight:'100vh',
                  fontFamily:'system-ui,-apple-system,Segoe UI,sans-serif' }}>

      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position:'sticky', top:0, zIndex:50,
        background:'rgba(10,10,10,.92)',
        backdropFilter:'blur(12px)',
        borderBottom:'1px solid #1e1e1e',
      }}>
        <div style={{
          maxWidth:'1080px', margin:'0 auto', padding:'0 24px',
          display:'flex', alignItems:'center', height:'58px', gap:'0',
        }}>
          {/* logo */}
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:'9px',
                                textDecoration:'none', flexShrink:0 }}>
            <div style={{
              width:'30px', height:'30px', background:'#E85D04',
              borderRadius:'7px', display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            <span style={{ fontWeight:800, fontSize:'1.05rem', color:'#f5f5f5', letterSpacing:'-.01em' }}>
              APSA
            </span>
          </Link>

          {/* nav links — centered */}
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'32px' }}>
            <a href="#features"
               style={{ color:'#777', fontSize:'.875rem', textDecoration:'none', transition:'color .15s' }}
               onMouseEnter={e=>e.target.style.color='#f5f5f5'}
               onMouseLeave={e=>e.target.style.color='#777'}>
              Fonctionnalités
            </a>
            <a href="#about"
               style={{ color:'#777', fontSize:'.875rem', textDecoration:'none', transition:'color .15s' }}
               onMouseEnter={e=>e.target.style.color='#f5f5f5'}
               onMouseLeave={e=>e.target.style.color='#777'}>
              À propos
            </a>
          </div>

          {/* actions */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
            <button onClick={goLogin}
                    style={{ background:'none', border:'1px solid #2a2a2a', color:'#777',
                             fontSize:'.875rem', cursor:'pointer', padding:'7px 15px',
                             borderRadius:'8px', transition:'border-color .15s,color .15s' }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor='#555'; e.currentTarget.style.color='#f5f5f5' }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor='#2a2a2a'; e.currentTarget.style.color='#777' }}>
              Connexion
            </button>
            <button onClick={goApp}
                    style={{ background:'#E85D04', border:'none', color:'#fff',
                             fontWeight:600, fontSize:'.875rem', cursor:'pointer',
                             padding:'7px 18px', borderRadius:'8px', transition:'background .15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#d0520a'}
                    onMouseLeave={e=>e.currentTarget.style.background='#E85D04'}>
              Commencer
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{ position:'relative', overflow:'hidden', paddingBottom:'60px' }}>
        {/* grid canvas — full section bg, z 0 */}
        <canvas ref={gridRef}
                style={{ position:'absolute', inset:0, width:'100%', height:'100%',
                         zIndex:0, pointerEvents:'none', display:'block' }}/>

        {/* content */}
        <div style={{ position:'relative', zIndex:2, textAlign:'center', padding:'68px 24px 44px' }}>

          {/* badge */}
          <div style={{ marginBottom:'26px' }}>
            <span style={{
              display:'inline-flex', alignItems:'center', gap:'7px',
              background:'#1a1a1a', border:'1px solid #2d2d2d',
              borderRadius:'999px', padding:'5px 14px',
              fontSize:'.78rem', fontWeight:500, color:'#E85D04',
            }}>
              <span style={{ width:'5px', height:'5px', borderRadius:'50%',
                             background:'#E85D04', flexShrink:0 }}/>
              Assistant pédagogique IA
            </span>
          </div>

          {/* title */}
          <h1 style={{
            fontSize:'clamp(28px,5vw,42px)',
            fontWeight:500, lineHeight:1.18,
            letterSpacing:'-.025em',
            margin:'0 auto 18px',
            maxWidth:'620px',
          }}>
            <span style={{ color:'#f5f5f5' }}>Tes cours.</span>
            <br/>
            <span style={{ color:'#E85D04' }}>Compris. </span>
            <span style={{ color:'#555' }}>En secondes.</span>
          </h1>

          {/* subtitle */}
          <p style={{
            color:'#777', fontSize:'clamp(.88rem,2vw,.98rem)',
            lineHeight:1.68, maxWidth:'420px', margin:'0 auto 34px',
          }}>
            Upload un PDF, obtiens un résumé intelligent,
            un quiz sur-mesure et un assistant qui connaît
            ton cours par cœur.
          </p>

          {/* CTAs */}
          <div style={{ display:'flex', gap:'12px', justifyContent:'center',
                        flexWrap:'wrap', marginBottom:'44px' }}>
            <button onClick={goApp}
                    style={btnOrange}
                    onMouseEnter={e=>e.currentTarget.style.background='#d0520a'}
                    onMouseLeave={e=>e.currentTarget.style.background='#E85D04'}>
              Uploader un cours
            </button>
            <button style={btnGhost}
                    onMouseEnter={e=>{ e.currentTarget.style.background='#1a1a1a'; e.currentTarget.style.borderColor='#444' }}
                    onMouseLeave={e=>{ e.currentTarget.style.background='#111'; e.currentTarget.style.borderColor='#2a2a2a' }}>
              Voir la démo →
            </button>
          </div>

          {/* animation box */}
          <div ref={animContainerRef}
               style={{
                 maxWidth:'700px', margin:'0 auto',
                 borderRadius:'14px', overflow:'hidden',
                 border:'1px solid #1e1e1e',
                 position:'relative',
               }}>
            {/* orange gradient top border */}
            <div style={{
              position:'absolute', top:0, left:0, right:0, height:'2px', zIndex:3,
              background:'linear-gradient(90deg,transparent 0%,#E85D04 35%,#F48C06 65%,transparent 100%)',
            }}/>
            <canvas ref={animRef}
                    style={{ display:'block', width:'100%' }}/>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features"
               style={{ maxWidth:'900px', margin:'0 auto', padding:'0 24px 80px' }}>
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',
          gap:'14px',
        }}>
          {[
            { Icon: IcoDoc,  title:'Résumé intelligent', desc:'Court, moyen ou détaillé — généré par Gemini en moins de 30 s.' },
            { Icon: IcoQuiz, title:'Quiz QCM',            desc:'10 questions basées uniquement sur ton document.' },
            { Icon: IcoMic,  title:'Chat vocal',          desc:'Pose tes questions à voix haute, reçois les réponses en audio.' },
          ].map(({ Icon, title, desc }) => (
            <div key={title}
                 style={{
                   background:'#0d0d0d', border:'1px solid #1a1a1a',
                   borderRadius:'14px', padding:'22px',
                   transition:'border-color .2s',
                 }}
                 onMouseEnter={e=>e.currentTarget.style.borderColor='#2a2a2a'}
                 onMouseLeave={e=>e.currentTarget.style.borderColor='#1a1a1a'}>
              <div style={{
                width:'38px', height:'38px', background:'#1a1a1a',
                borderRadius:'10px', display:'flex', alignItems:'center',
                justifyContent:'center', marginBottom:'14px',
              }}>
                <Icon/>
              </div>
              <h3 style={{ fontWeight:600, fontSize:'.92rem', color:'#f5f5f5', margin:'0 0 7px' }}>{title}</h3>
              <p  style={{ color:'#555', fontSize:'.83rem', lineHeight:1.55, margin:0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        borderTop:'1px solid #1a1a1a', padding:'20px 24px',
        textAlign:'center', color:'#444', fontSize:'.78rem',
      }}>
        © {new Date().getFullYear()} APSA — Assistant pédagogique IA
      </footer>
    </div>
  )
}
