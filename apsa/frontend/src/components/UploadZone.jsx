import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import client from '../api/client'

export default function UploadZone({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [error,     setError]     = useState(null)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    if (!file.name.endsWith('.pdf')) {
      setError('Seuls les fichiers PDF sont acceptés.')
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await client.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      onUploadSuccess(data, file)
    } catch (e) {
      setError(e.response?.data?.detail || "Erreur lors de l'upload.")
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse-border { 0%,100% { opacity:.6 } 50% { opacity:1 } }
      `}</style>

      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#E85D04' : '#222'}`,
          borderRadius: '16px',
          padding: '44px 28px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: isDragActive
            ? 'rgba(232,93,4,0.05)'
            : uploading ? '#0d0d0d' : '#0d0d0d',
          transition: 'border-color .2s, background .2s, box-shadow .2s',
          opacity: uploading ? 0.75 : 1,
          boxShadow: isDragActive
            ? '0 0 0 4px rgba(232,93,4,0.1), inset 0 0 40px rgba(232,93,4,0.04)'
            : 'none',
          animation: isDragActive ? 'pulse-border 1.2s ease-in-out infinite' : 'none',
        }}
        onMouseEnter={e => {
          if (!isDragActive && !uploading)
            e.currentTarget.style.borderColor = '#333'
        }}
        onMouseLeave={e => {
          if (!isDragActive)
            e.currentTarget.style.borderColor = '#222'
        }}
      >
        <input {...getInputProps()} />

        {uploading ? (
          /* ── État upload en cours ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '36px', height: '36px',
              border: '3px solid #1a1a1a',
              borderTop: '3px solid #E85D04',
              borderRadius: '50%',
              animation: 'spin .75s linear infinite',
            }}/>
            <div style={{ width: '100%', maxWidth: '200px' }}>
              <div style={{
                height: '3px', background: '#1a1a1a', borderRadius: '999px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: 'linear-gradient(90deg, #E85D04, #F48C06)',
                  borderRadius: '999px',
                  transition: 'width .15s ease',
                }}/>
              </div>
              <p style={{ color: '#555', fontSize: '.8rem', marginTop: '8px', textAlign: 'center' }}>
                Traitement en cours{progress > 0 ? ` — ${progress}%` : '…'}
              </p>
            </div>
          </div>
        ) : (
          /* ── État idle / drag ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {/* Icône */}
            <div style={{
              width: '54px', height: '54px',
              background: isDragActive ? 'rgba(232,93,4,0.12)' : '#141414',
              border: `1px solid ${isDragActive ? 'rgba(232,93,4,0.35)' : '#1e1e1e'}`,
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .2s',
            }}>
              {isDragActive ? (
                /* Flèche vers le bas en mode drag */
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                     stroke="#E85D04" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              ) : (
                /* Nuage upload normal */
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                     stroke="#444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3-3 3"/>
                  <line x1="12" y1="10" x2="12" y2="21"/>
                </svg>
              )}
            </div>

            {/* Texte */}
            <div style={{ lineHeight: 1 }}>
              <p style={{
                color: isDragActive ? '#E85D04' : '#d0d0d0',
                fontWeight: 500, fontSize: '.92rem',
                marginBottom: '6px',
                transition: 'color .2s',
              }}>
                {isDragActive
                  ? 'Déposez votre PDF ici'
                  : 'Glissez votre PDF ou cliquez pour sélectionner'}
              </p>
              <p style={{ color: '#3a3a3a', fontSize: '.78rem' }}>
                PDF uniquement — max 10 MB, 100 pages
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p style={{
          marginTop: '12px', color: '#E85D04',
          fontSize: '.82rem', textAlign: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
