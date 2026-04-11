import { useState, useRef, useEffect } from 'react'
import client from '../api/client'
import ReactMarkdown from 'react-markdown'

export default function ChatWidget({ docId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [loadingTts, setLoadingTts] = useState(null)   // index du message en cours de chargement TTS
  const [playingIdx, setPlayingIdx] = useState(null)   // index du message en cours de lecture
  const bottomRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const audioRef = useRef(null)                        // référence à l'objet Audio en cours

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      const { data } = await client.post('/chat', {
        doc_id: docId,
        message: text,
        history: messages,
      })
      setMessages([...history, { role: 'assistant', content: data.response }])
    } catch (e) {
      setMessages([...history, { role: 'assistant', content: 'Erreur : impossible d\'obtenir une réponse.' }])
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())
        setLoading(true)
        try {
          const formData = new FormData()
          formData.append('file', blob, 'voice.webm')
          const { data } = await client.post(`/chat/voice?doc_id=${docId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          setMessages((prev) => [
            ...prev,
            { role: 'user', content: data.transcription },
            { role: 'assistant', content: data.response },
          ])
        } finally {
          setLoading(false)
        }
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch {
      alert('Impossible d\'accéder au micro.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const speakText = async (text, idx) => {
    // Si un audio tourne déjà, on l'arrête
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlayingIdx(null)
      // Si on reclique sur le même message, on s'arrête juste
      if (playingIdx === idx) return
    }

    setLoadingTts(idx)
    try {
      // Appel au backend — reçoit un blob MP3
      const response = await client.post('/tts', { text }, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const audio = new Audio(url)
      audioRef.current = audio
      setPlayingIdx(idx)
      audio.play()
      // Quand la lecture est terminée, on remet l'état à zéro
      audio.onended = () => {
        setPlayingIdx(null)
        audioRef.current = null
        URL.revokeObjectURL(url)
      }
    } catch {
      // Silencieux — le bouton reprend son état normal
    } finally {
      setLoadingTts(null)
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Pose une question sur ton cours...
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
              ${m.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}
            >
              {m.role === 'assistant'
                ? <ReactMarkdown className="prose prose-sm max-w-none">{m.content}</ReactMarkdown>
                : m.content}
              {/* Bouton écouter — uniquement sur les messages de l'assistant */}
              {m.role === 'assistant' && (
                <button
                  onClick={() => speakText(m.content, i)}
                  className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                  title={playingIdx === i ? 'Arrêter' : 'Écouter'}
                >
                  {loadingTts === i ? (
                    // Chargement en cours
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : playingIdx === i ? (
                    // En cours de lecture → icône stop
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="1"/>
                    </svg>
                  ) : (
                    // Icône speaker par défaut
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                    </svg>
                  )}
                  {loadingTts === i ? 'Chargement...' : playingIdx === i ? 'Arrêter' : 'Écouter'}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3 flex items-center gap-2">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`p-2.5 rounded-xl transition-colors ${recording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          title={recording ? 'Arrêter' : 'Parler'}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zm7 9a1 1 0 0 1 2 0 9 9 0 0 1-18 0 1 1 0 0 1 2 0 7 7 0 0 0 14 0z" />
          </svg>
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Pose ta question..."
          className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-blue-400"
          disabled={loading || recording}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
