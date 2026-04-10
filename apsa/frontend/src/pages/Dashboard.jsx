import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import ProgressChart from '../components/ProgressChart'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    client.get('/analytics/me')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Mon tableau de bord</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Documents', value: data?.doc_count ?? 0 },
          { label: 'Quiz passés', value: data?.quiz_count ?? 0 },
          { label: 'Score moyen', value: data?.avg_score ? `${data.avg_score}%` : '—' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Graphique */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Évolution des scores</h2>
        <ProgressChart data={data?.score_history ?? []} />
      </div>

      {/* Documents */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Mes documents</h2>
        </div>
        {data?.documents?.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">Aucun document pour l'instant.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data?.documents?.map((doc) => (
              <div key={doc.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-sm text-gray-800">{doc.filename}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{doc.page_count} pages · {doc.quiz_count} quiz</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-blue-600">{doc.avg_score}%</span>
                  <button
                    onClick={() => navigate(`/chat?doc=${doc.id}`)}
                    className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    Chatbot
                  </button>
                  <button
                    onClick={() => navigate(`/quiz?doc=${doc.id}`)}
                    className="text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                  >
                    Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
