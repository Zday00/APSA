import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import client from '../api/client'

const LENGTHS = [
  { key: 'short',    label: 'Court',    desc: '~150 mots' },
  { key: 'medium',   label: 'Moyen',    desc: '~350 mots' },
  { key: 'detailed', label: 'Détaillé', desc: '~700 mots' },
]

/* Skeleton animé */
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -600px 0 }
          100% { background-position:  600px 0 }
        }
      `}</style>
      {[90, 78, 85, 65, 80, 72, 60].map((w, i) => (
        <div key={i} style={{
          height: '13px', width: `${w}%`, borderRadius: '6px',
          background: 'linear-gradient(90deg, #141414 25%, #1e1e1e 50%, #141414 75%)',
          backgroundSize: '600px 100%',
          animation: 'shimmer 1.4s infinite linear',
        }}/>
      ))}
    </div>
  )
}

export default function SummaryView({ docId }) {
  const [length,   setLength]   = useState('medium')
  const [summary,  setSummary]  = useState(null)
  const [keywords, setKeywords] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await client.get(`/summary/${docId}?length=${length}`)
      setSummary(data.summary)
      setKeywords(data.keywords || [])
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors de la génération.')
    } finally {
      setLoading(false)
    }
  }, [docId, length])

  useEffect(() => { fetchSummary() }, [fetchSummary])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Contrôles ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

        {/* Sélecteur de longueur */}
        <div style={{
          display: 'flex', gap: '4px',
          background: '#111', border: '1px solid #1e1e1e',
          borderRadius: '10px', padding: '3px',
        }}>
          {LENGTHS.map(l => (
            <button
              key={l.key}
              onClick={() => setLength(l.key)}
              title={l.desc}
              style={{
                background: length === l.key ? '#1e1e1e' : 'none',
                border: length === l.key ? '1px solid #2a2a2a' : '1px solid transparent',
                color: length === l.key ? '#f5f5f5' : '#555',
                fontSize: '.8rem',
                fontWeight: length === l.key ? 600 : 400,
                cursor: 'pointer', padding: '5px 14px', borderRadius: '7px',
                transition: 'all .15s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (length !== l.key) e.currentTarget.style.color = '#999' }}
              onMouseLeave={e => { if (length !== l.key) e.currentTarget.style.color = '#555' }}
            >
              {l.label}
              {length === l.key && (
                <span style={{
                  position: 'absolute', bottom: '2px', left: '50%',
                  transform: 'translateX(-50%)',
                  width: '16px', height: '2px',
                  background: '#E85D04', borderRadius: '2px',
                }}/>
              )}
            </button>
          ))}
        </div>

        {/* Bouton générer / regénérer */}
        <button
          onClick={fetchSummary}
          disabled={loading}
          style={{
            marginLeft: 'auto',
            background: loading ? '#1a1a1a' : '#E85D04',
            border: 'none', color: '#fff',
            fontSize: '.82rem', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '8px 18px', borderRadius: '9px',
            transition: 'background .15s',
            display: 'flex', alignItems: 'center', gap: '7px',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#d0520a' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#E85D04' }}
        >
          {loading ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5"
                   style={{ animation: 'spin .7s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
              Génération…
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
              </svg>
              {summary ? 'Regénérer' : 'Générer'}
            </>
          )}
        </button>
      </div>

      {/* ── Erreur ── */}
      {error && (
        <div style={{
          background: 'rgba(232,93,4,0.06)', border: '1px solid rgba(232,93,4,0.2)',
          borderRadius: '10px', padding: '12px 16px',
          color: '#E85D04', fontSize: '.83rem',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── Skeleton ── */}
      {loading && <Skeleton />}

      {/* ── Résultat ── */}
      {summary && !loading && (
        <>
          {/* Keywords */}
          {keywords.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {keywords.map(kw => (
                <span key={kw} style={{
                  background: 'rgba(232,93,4,0.08)',
                  border: '1px solid rgba(232,93,4,0.2)',
                  color: '#E85D04', fontSize: '.72rem', fontWeight: 500,
                  padding: '3px 10px', borderRadius: '999px',
                }}>
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Contenu markdown */}
          <div style={{
            background: '#0d0d0d', border: '1px solid #1a1a1a',
            borderRadius: '14px', padding: '24px 28px',
            /* top border orange subtil */
            boxShadow: 'inset 0 1px 0 rgba(232,93,4,0.15)',
          }}>
            <style>{`
              .apsa-summary { color: #d0d0d0; font-size: .88rem; line-height: 1.75; }
              .apsa-summary h1,.apsa-summary h2,.apsa-summary h3 {
                color: #f5f5f5; font-weight: 600; margin: 1.2em 0 .5em;
                letter-spacing: -.015em;
              }
              .apsa-summary h1 { font-size: 1.1rem; }
              .apsa-summary h2 { font-size: 1rem; }
              .apsa-summary h3 { font-size: .92rem; color: #ccc; }
              .apsa-summary p  { margin: 0 0 .9em; }
              .apsa-summary ul,.apsa-summary ol { padding-left: 1.4em; margin: 0 0 .9em; }
              .apsa-summary li { margin-bottom: .35em; }
              .apsa-summary strong { color: #f5f5f5; font-weight: 600; }
              .apsa-summary em { color: #aaa; }
              .apsa-summary code {
                background: #1a1a1a; border: 1px solid #2a2a2a;
                color: '#E85D04'; padding: '2px 6px'; border-radius: '5px';
                font-size: '.82em';
              }
              .apsa-summary blockquote {
                border-left: 2px solid #E85D04;
                margin: 0 0 .9em; padding: .5em 0 .5em 1em;
                color: #888;
              }
              .apsa-summary hr {
                border: none; border-top: 1px solid #1e1e1e; margin: 1.2em 0;
              }
            `}</style>
            <div className="apsa-summary">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
