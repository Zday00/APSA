import { useSearchParams } from 'react-router-dom'
import ChatWidget from '../components/ChatWidget'

export default function Chat() {
  const [params] = useSearchParams()
  const docId = params.get('doc')

  if (!docId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-500">
        Aucun document sélectionné. Retourne sur la page d'accueil pour en uploader un.
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Chatbot contextuel</h1>
      <p className="text-sm text-gray-500">Les réponses sont basées uniquement sur ton cours.</p>
      <ChatWidget docId={Number(docId)} />
    </div>
  )
}
