import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UploadZone from '../components/UploadZone'
import SummaryView from '../components/SummaryView'

export default function Home() {
  const [doc, setDoc] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const navigate = useNavigate()

  const handleUpload = (data) => {
    setDoc(data)
    setActiveTab('summary')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Assistant Pédagogique IA</h1>
        <p className="text-gray-500">Upload ton cours PDF et obtiens résumés, quiz et chatbot instantanément</p>
      </div>

      <UploadZone onUploadSuccess={handleUpload} />

      {doc && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-medium text-green-800">{doc.filename}</p>
              <p className="text-sm text-green-600">{doc.page_count} page{doc.page_count > 1 ? 's' : ''} importée{doc.page_count > 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {['summary', 'quiz', 'chat'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === 'quiz') navigate(`/quiz?doc=${doc.id}`)
                  else if (tab === 'chat') navigate(`/chat?doc=${doc.id}`)
                  else setActiveTab(tab)
                }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
                  ${activeTab === tab && tab === 'summary'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {tab === 'summary' ? 'Résumé' : tab === 'quiz' ? 'Quiz QCM' : 'Chatbot'}
              </button>
            ))}
          </div>

          {activeTab === 'summary' && <SummaryView docId={doc.id} />}
        </div>
      )}
    </div>
  )
}
