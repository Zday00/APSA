import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import UploadZone from '../components/UploadZone'
import SummaryView from '../components/SummaryView'
import client from '../api/client'

/* ── Tab definitions ───────────────────────────────────────── */
const TABS = [
  { key: 'summary',  label: 'Résumé',     icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'quiz',     label: 'Quiz QCM',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { key: 'chat',     label: 'Chat vocal', icon: 'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8' },
]

/* ── Grid canvas (réutilisé depuis LandingPage) ─────────────── */
function useGridCanvas(canvasRef, active) {
  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const draw = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const ctx = canvas.getContext('2d')
      const W = canvas.width, H = canvas.height, S = 36
      ctx.clearRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 0.5
      for (let x = 0; x <= W; x += S) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y <= H; y += S) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
      const grad = ctx.createLinearGradient(0, H * 0.35, 0, H)
      grad.addColorStop(0, 'rgba(10,10,10,0)')
      grad.addColorStop(1, 'rgba(10,10,10,1)')
      ctx.fillStyle = grad
      ctx.fillRect(0, H * 0.35, W, H * 0.65)
    }
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [active, canvasRef])
}

export default function Home() {
  const [doc,        setDoc]        = useState(null)
  const [pdfUrl,     setPdfUrl]     = useState(null)
  const [activeTab,  setActiveTab]  = useState('summary')
  const [pdfOpen,    setPdfOpen]    = useState(true)
  const gridRef  = useRef(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  /* Charge un doc depuis ?doc=X (ex: dashboard) */
  useEffect(() => {
    const docId = searchParams.get('doc')
    if (docId && !doc) {
      client.get(`/upload/${docId}`)
        .then(r => {
          setDoc(r.data)
          if (r.data.file_url) setPdfUrl(r.data.file_url)
          setActiveTab('summary')
        })
        .catch(() => {})
    }
  }, [])

  /* Libère l'URL blob quand le composant démonte ou change */
  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }
  }, [pdfUrl])

  useGridCanvas(gridRef, !doc)

  const handleUpload = (data, file) => {
    setDoc(data)
    // Priorité : URL Supabase Storage (persistante) ; fallback : blob local (session only)
    if (data.file_url) {
      setPdfUrl(data.file_url)
    } else if (file) {
      setPdfUrl(URL.createObjectURL(file))
    }
    setActiveTab('summary')
  }

  const handleNewDoc = () => {
    setDoc(null)
    if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null) }
    setActiveTab('summary')
  }

  /* ══════════════════════════════════════════════════════════
     ÉCRAN PRÉ-UPLOAD  (centré, grid canvas)
  ══════════════════════════════════════════════════════════ */
  if (!doc) {
    return (
      <div style={{
        position: 'relative', minHeight: 'calc(100vh - 58px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', background: '#0a0a0a',
      }}>
        <canvas ref={gridRef} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          zIndex: 0, pointerEvents: 'none', display: 'block',
        }}/>

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '560px', padding: '40px 24px' }}>

          {/* Badge */}
          <div style={{ textAlign: 'center', marginBottom: '26px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              background: '#1a1a1a', border: '1px solid #2d2d2d',
              borderRadius: '999px', padding: '5px 14px',
              fontSize: '.78rem', fontWeight: 500, color: '#E85D04',
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#E85D04', flexShrink: 0 }}/>
              Prêt à analyser
            </span>
          </div>

          {/* Titre */}
          <h1 style={{
            fontSize: 'clamp(22px,4vw,30px)', fontWeight: 500, textAlign: 'center',
            letterSpacing: '-.02em', color: '#f5f5f5', margin: '0 0 10px',
          }}>
            Charge ton <span style={{ color: '#E85D04' }}>cours</span>
          </h1>
          <p style={{ color: '#555', textAlign: 'center', fontSize: '.9rem', lineHeight: 1.65, margin: '0 0 32px' }}>
            PDF importé → résumé, quiz et chatbot<br/>en quelques secondes
          </p>

          {/* Zone d'upload avec top-border orange */}
          <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px', zIndex: 3,
              background: 'linear-gradient(90deg,transparent 0%,#E85D04 35%,#F48C06 65%,transparent 100%)',
            }}/>
            <UploadZone onUploadSuccess={handleUpload} />
          </div>

        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════════
     ÉCRAN SPLIT  (topbar + PDF gauche + contenu droite)
  ══════════════════════════════════════════════════════════ */
  return (
    <div style={{
      height: 'calc(100vh - 58px)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: '#0a0a0a',
    }}>

      {/* ── Topbar ── */}
      <div style={{
        height: '48px', flexShrink: 0,
        background: '#0d0d0d', borderBottom: '1px solid #1a1a1a',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px',
      }}>

        {/* Toggle PDF */}
        <button
          onClick={() => setPdfOpen(o => !o)}
          title={pdfOpen ? 'Masquer le PDF' : 'Afficher le PDF'}
          style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            color: '#666', width: '30px', height: '30px', borderRadius: '7px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#E85D04'; e.currentTarget.style.color = '#E85D04' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#666' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            {pdfOpen
              ? <><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></>
              : <><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></>}
          </svg>
        </button>

        {/* Séparateur */}
        <div style={{ width: '1px', height: '20px', background: '#1e1e1e', flexShrink: 0 }}/>

        {/* Fichier info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '24px', height: '24px', background: 'rgba(232,93,4,0.12)',
            border: '1px solid rgba(232,93,4,0.25)', borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#E85D04" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <span style={{
            color: '#d0d0d0', fontSize: '.83rem', fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {doc.filename}
          </span>
          <span style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            color: '#555', fontSize: '.72rem', padding: '2px 7px',
            borderRadius: '999px', flexShrink: 0,
          }}>
            {doc.page_count} p.
          </span>
        </div>

        {/* Nouveau cours */}
        <button
          onClick={handleNewDoc}
          style={{
            background: 'none', border: '1px solid #2a2a2a', color: '#555',
            fontSize: '.78rem', cursor: 'pointer', padding: '5px 12px',
            borderRadius: '7px', transition: 'all .15s', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: '5px',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#f5f5f5' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouveau cours
        </button>
      </div>

      {/* ── Corps split ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Panneau gauche — PDF */}
        <div style={{
          width: pdfOpen ? '38%' : '0',
          minWidth: pdfOpen ? '260px' : '0',
          flexShrink: 0,
          transition: 'width .28s ease, min-width .28s ease',
          overflow: 'hidden',
          borderRight: pdfOpen ? '1px solid #1a1a1a' : 'none',
          background: '#080808',
          position: 'relative',
        }}>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              title="Aperçu PDF"
            />
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: '12px', color: '#2a2a2a',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="8" y1="13" x2="16" y2="13"/>
                <line x1="8" y1="17" x2="13" y2="17"/>
              </svg>
              <span style={{ fontSize: '.78rem', color: '#333' }}>Aperçu non disponible</span>
            </div>
          )}
        </div>

        {/* Panneau droit — Tabs + Contenu */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Tabs */}
          <div style={{
            height: '48px', flexShrink: 0,
            background: '#0d0d0d', borderBottom: '1px solid #1a1a1a',
            display: 'flex', alignItems: 'center', padding: '0 20px', gap: '2px',
          }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.key && tab.key === 'summary'
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    if (tab.key === 'quiz') navigate(`/quiz?doc=${doc.id}`)
                    else if (tab.key === 'chat') navigate(`/chat?doc=${doc.id}`)
                    else setActiveTab(tab.key)
                  }}
                  style={{
                    position: 'relative',
                    background: isActive ? 'rgba(232,93,4,0.08)' : 'none',
                    border: isActive ? '1px solid rgba(232,93,4,0.2)' : '1px solid transparent',
                    color: isActive ? '#f5f5f5' : '#555',
                    fontSize: '.82rem',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#bbb' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#555' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                       stroke={isActive ? '#E85D04' : 'currentColor'} strokeWidth="1.8"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d={tab.icon}/>
                  </svg>
                  {tab.label}
                  {isActive && (
                    <span style={{
                      position: 'absolute', bottom: '-1px', left: '50%',
                      transform: 'translateX(-50%)',
                      width: '24px', height: '2px',
                      background: '#E85D04', borderRadius: '2px',
                    }}/>
                  )}
                </button>
              )
            })}
          </div>

          {/* Contenu scrollable */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '28px 32px',
            /* scrollbar custom */
          }}>
            <style>{`
              ::-webkit-scrollbar { width: 5px; }
              ::-webkit-scrollbar-track { background: transparent; }
              ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 999px; }
              ::-webkit-scrollbar-thumb:hover { background: #444; }
            `}</style>
            {activeTab === 'summary' && <SummaryView docId={doc.id} />}
          </div>

        </div>
      </div>
    </div>
  )
}
