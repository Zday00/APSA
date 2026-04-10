export default function QuizCard({ question, questionIndex, total, onAnswer, selectedAnswer, showResult }) {
  const letters = ['A', 'B', 'C', 'D']

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
      {/* Barre de progression */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Question {questionIndex + 1} / {total}</span>
          <span>{Math.round(((questionIndex + 1) / total) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${((questionIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <p className="text-base font-medium text-gray-800">{question.question}</p>

      <div className="space-y-2">
        {question.choices.map((choice, i) => {
          const letter = letters[i]
          let style = 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
          if (showResult) {
            if (letter === question.correct_answer) style = 'border-green-400 bg-green-50 text-green-800'
            else if (letter === selectedAnswer) style = 'border-red-400 bg-red-50 text-red-800'
            else style = 'border-gray-200 opacity-50'
          } else if (selectedAnswer === letter) {
            style = 'border-blue-500 bg-blue-50'
          }

          return (
            <button
              key={i}
              onClick={() => !showResult && onAnswer(letter)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${style}`}
            >
              <span className="font-bold mr-2">{letter}.</span>
              {choice.replace(/^[ABCD]\.\s*/, '')}
            </button>
          )
        })}
      </div>

      {showResult && question.explanation && selectedAnswer !== question.correct_answer && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <span className="font-semibold">Explication : </span>{question.explanation}
        </div>
      )}
    </div>
  )
}
