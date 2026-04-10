import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import client from '../api/client'

const LENGTHS = [
  { key: 'short', label: 'Court' },
  { key: 'medium', label: 'Moyen' },
  { key: 'detailed', label: 'Détaillé' },
]

export default function SummaryView({ docId }) {
  const [length, setLength] = useState('medium')
  const [summary, setSummary] = useState(null)
  const [keywords, setKeywords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchSummary = async () => {
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
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {LENGTHS.map((l) => (
          <button
            key={l.key}
            onClick={() => setLength(l.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${length === l.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {l.label}
          </button>
        ))}
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="ml-auto px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Génération...' : summary ? 'Regénérer' : 'Générer le résumé'}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${80 + Math.random() * 20}%` }} />
          ))}
        </div>
      )}

      {summary && !loading && (
        <>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <span key={kw} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">{kw}</span>
              ))}
            </div>
          )}
          <div className="prose prose-sm max-w-none bg-white rounded-xl p-6 border border-gray-100">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </>
      )}
    </div>
  )
}
