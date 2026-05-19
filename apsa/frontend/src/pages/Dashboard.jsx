import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import ProgressChart from '../components/ProgressChart'

const DOCS_PER_PAGE = 6

const STATS = (data) => [
  { label: 'Documents',   value: data?.doc_count  ?? 0 },
  { label: 'Quiz passés', value: data?.quiz_count  ?? 0 },
  { label: 'Score moyen', value: data?.avg_score ? `${data.avg_score}%` : '—' },
]

export default function Dashboard() {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [confirmId, setConfirmId] = useState(null)
  const navigate                  = useNavigate()

  const deleteDocument = async () => {
    const docId = confirmId
    setConfirmId(null)
    await client.delete(`/upload/${docId}`)
    setData((prev) => {
      const documents = prev.documents.filter((d) => d.id !== docId)
      const newTotal = Math.ceil(
        documents.filter((d) => d.filename.toLowerCase().includes(search.toLowerCase())).length / DOCS_PER_PAGE
      )
      if (page > newTotal && newTotal > 0) setPage(newTotal)
      return { ...prev, documents, doc_count: prev.doc_count - 1 }
    })
  }

  const exportCSV = () => {
    const docsMap = Object.fromEntries((data?.documents ?? []).map((d) => [d.id, d.filename]))
    const history = data?.score_history ?? []

    const rows = [
      ['Document', 'Score (%)', 'Date'],
      ...history.map((h) => [
        `"${(docsMap[h.document_id] ?? 'Inconnu').replace(/"/g, '""')}"`,
        h.score,
        new Date(h.date).toLocaleDateString('fr-FR'),
      ]),
    ]

    const csv = '﻿' + rows.map((r) => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `apsa_resultats_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    client.get('/analytics/me')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredDocs = (data?.documents ?? []).filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filteredDocs.length / DOCS_PER_PAGE)
  const pagedDocs = filteredDocs.slice((page - 1) * DOCS_PER_PAGE, page * DOCS_PER_PAGE)

  if (loading) {
    return (
      <div style={{ height: 'calc(100vh - 58px)', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '3px solid #1e1e1e', borderTopColor: '#E85D04',
          animation: 'spin .8s linear infinite',
        }}/>
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    )
  }

  return (
    <>
    {confirmId && (
      <div
        onClick={() => setConfirmId(null)}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#111', border: '1px solid #222', borderRadius: 14,
            padding: '28px 28px 22px', maxWidth: 360, width: '90%',
            boxShadow: '0 24px 60px rgba(0,0,0,.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="14" height="14" fill="#ef4444" viewBox="0 0 24 24">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
              </svg>
            </div>
            <h3 style={{ color: '#f0f0f0', fontSize: '.95rem', fontWeight: 600, margin: 0 }}>
              Supprimer le document
            </h3>
          </div>
          <p style={{ color: '#666', fontSize: '.82rem', margin: '0 0 22px', lineHeight: 1.5 }}>
            Cette action est irréversible. Le document et tous ses quiz associés seront définitivement supprimés.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setConfirmId(null)}
              style={{
                padding: '7px 18px', borderRadius: 8, fontSize: '.82rem', cursor: 'pointer',
                background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#bbb' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888' }}
            >
              Annuler
            </button>
            <button
              onClick={deleteDocument}
              style={{
                padding: '7px 18px', borderRadius: 8, fontSize: '.82rem', cursor: 'pointer',
                background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', color: '#ef4444',
                transition: 'all .15s', fontWeight: 500,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.25)'; e.currentTarget.style.borderColor = '#ef4444' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,.3)' }}
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    )}
    <div style={{ minHeight: 'calc(100vh - 58px)', background: '#0a0a0a', padding: '32px 24px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <h1 style={{ color: '#f5f5f5', fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
          Tableau de bord
        </h1>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {STATS(data).map((s) => (
            <div key={s.label} style={{
              background: '#0d0d0d', border: '1px solid #1a1a1a',
              borderRadius: 14, padding: '20px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#E85D04', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '.78rem', color: '#555', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Graphique */}
        <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, padding: '20px 20px 12px' }}>
          <h2 style={{ color: '#d0d0d0', fontSize: '.88rem', fontWeight: 600, margin: '0 0 16px' }}>
            Évolution des scores
          </h2>
          <ProgressChart data={data?.score_history ?? []} />
        </div>

        {/* Documents */}
        <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ color: '#d0d0d0', fontSize: '.88rem', fontWeight: 600, margin: 0, flex: 1, minWidth: 100 }}>
              Mes documents
            </h2>

            {/* Recherche */}
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: '.8rem',
                background: '#141414', border: '1px solid #252525', color: '#f0f0f0',
                outline: 'none', width: 200, transition: 'border-color .15s',
              }}
              onFocus={e => e.target.style.borderColor = '#E85D04'}
              onBlur={e => e.target.style.borderColor = '#252525'}
            />

            {/* Export CSV */}
            {(data?.score_history?.length ?? 0) > 0 && (
              <button
                onClick={exportCSV}
                title="Exporter l'historique des quiz en CSV"
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: '.8rem', cursor: 'pointer',
                  background: '#141414', border: '1px solid #2a2a2a', color: '#888',
                  display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E85D04'; e.currentTarget.style.color = '#E85D04' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888' }}
              >
                <svg style={{ width: 12, height: 12 }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 3h14v2H5v-2z"/>
                </svg>
                Exporter CSV
              </button>
            )}
          </div>

          {!filteredDocs.length ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#333', fontSize: '.85rem' }}>
              {search ? `Aucun document correspondant à "${search}".` : 'Aucun document pour l\'instant.'}
            </div>
          ) : (
            <>
              <div>
                {pagedDocs.map((doc, i) => (
                  <div
                    key={doc.id}
                    style={{
                      padding: '14px 20px',
                      borderTop: i > 0 ? '1px solid #141414' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#111'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ color: '#e0e0e0', fontSize: '.85rem', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.filename}
                      </p>
                      <p style={{ color: '#444', fontSize: '.75rem', margin: '3px 0 0' }}>
                        {doc.page_count} pages · {doc.quiz_count} quiz
                        {doc.avg_score != null && ` · ${doc.avg_score}% moy.`}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {[
                        { label: 'Résumé', action: () => navigate(`/home?doc=${doc.id}`) },
                        { label: 'Chat',   action: () => navigate(`/chat?doc=${doc.id}`) },
                        { label: 'Quiz',   action: () => navigate(`/quiz?doc=${doc.id}`) },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          onClick={btn.action}
                          style={{
                            fontSize: '.75rem', padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
                            background: '#141414', border: '1px solid #2a2a2a', color: '#888',
                            transition: 'all .15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#E85D04'; e.currentTarget.style.color = '#E85D04' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888' }}
                        >
                          {btn.label}
                        </button>
                      ))}
                      <button
                        onClick={() => setConfirmId(doc.id)}
                        title="Supprimer"
                        style={{
                          width: 28, height: 28, borderRadius: 7, cursor: 'pointer',
                          background: '#141414', border: '1px solid #2a2a2a', color: '#555',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .15s', fontSize: '.75rem',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#7f1d1d'; e.currentTarget.style.color = '#ef4444' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  borderTop: '1px solid #1a1a1a', padding: '12px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ color: '#444', fontSize: '.78rem' }}>
                    {filteredDocs.length} document{filteredDocs.length > 1 ? 's' : ''}
                    {search && ` · filtrés`}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{
                        width: 28, height: 28, borderRadius: 7,
                        cursor: page === 1 ? 'default' : 'pointer',
                        background: '#141414', border: '1px solid #2a2a2a',
                        color: page === 1 ? '#2a2a2a' : '#888',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', lineHeight: 1, transition: 'all .15s',
                      }}
                      onMouseEnter={e => { if (page !== 1) { e.currentTarget.style.borderColor = '#E85D04'; e.currentTarget.style.color = '#E85D04' }}}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = page === 1 ? '#2a2a2a' : '#888' }}
                    >‹</button>
                    <span style={{ color: '#555', fontSize: '.8rem', minWidth: 56, textAlign: 'center' }}>
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      style={{
                        width: 28, height: 28, borderRadius: 7,
                        cursor: page === totalPages ? 'default' : 'pointer',
                        background: '#141414', border: '1px solid #2a2a2a',
                        color: page === totalPages ? '#2a2a2a' : '#888',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', lineHeight: 1, transition: 'all .15s',
                      }}
                      onMouseEnter={e => { if (page !== totalPages) { e.currentTarget.style.borderColor = '#E85D04'; e.currentTarget.style.color = '#E85D04' }}}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = page === totalPages ? '#2a2a2a' : '#888' }}
                    >›</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
    </>
  )
}
