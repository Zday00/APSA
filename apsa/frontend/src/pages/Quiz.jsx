import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import QuizCard from '../components/QuizCard'

export default function Quiz() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const docId = params.get('doc')

  const [questions, setQuestions] = useState([])
  const [quizMeta, setQuizMeta] = useState(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const generateQuiz = async () => {
    if (!docId) return
    setLoading(true)
    setResult(null)
    setAnswers([])
    setCurrent(0)
    try {
      const { data } = await client.post('/quiz/generate', { doc_id: Number(docId), num_questions: 10 })
      setQuestions(data.questions)
      setQuizMeta({ quiz_id: data.quiz_id, doc_id: data.doc_id })
    } catch (e) {
      alert(e.response?.data?.detail || 'Erreur lors de la génération du quiz.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { generateQuiz() }, [docId])

  const handleAnswer = (letter) => {
    const newAnswers = [...answers]
    newAnswers[current] = letter
    setAnswers(newAnswers)

    if (current < questions.length - 1) {
      setTimeout(() => setCurrent(current + 1), 600)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { data } = await client.post('/quiz/submit', {
        quiz_id: quizMeta.quiz_id,
        doc_id: quizMeta.doc_id,
        answers,
        questions,
      })
      setResult(data)
      setCurrent(0)
    } catch (e) {
      alert('Erreur lors de la soumission.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500">Génération du quiz en cours...</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl font-bold text-blue-600">{result.score}%</div>
          <p className="text-gray-600">{result.correct_count} / {result.total_questions} bonnes réponses</p>
        </div>

        <div className="space-y-3">
          {result.corrections.map((c, i) => (
            <div key={i} className={`rounded-xl p-4 text-sm border ${c.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="font-medium">{c.question}</p>
              <p className="mt-1 text-xs">Ta réponse : {c.user_answer} {c.is_correct ? '✓' : '✗'}</p>
              {!c.is_correct && <p className="mt-1 text-xs text-red-700">Bonne réponse : {c.correct_answer} — {c.explanation}</p>}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={generateQuiz} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            Nouveau quiz
          </button>
          <button onClick={() => navigate(-1)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
            Retour
          </button>
        </div>
      </div>
    )
  }

  if (!questions.length) return null

  const allAnswered = answers.filter(Boolean).length === questions.length

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
      <QuizCard
        question={questions[current]}
        questionIndex={current}
        total={questions.length}
        onAnswer={handleAnswer}
        selectedAnswer={answers[current]}
        showResult={false}
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors
                ${i === current ? 'bg-blue-600' : answers[i] ? 'bg-green-400' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        {allAnswered && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? 'Envoi...' : 'Soumettre'}
          </button>
        )}
      </div>
    </div>
  )
}
