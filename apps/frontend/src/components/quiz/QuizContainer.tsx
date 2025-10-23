import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const mockQuestions = [
  {
    id: 1,
    question: '¿Con qué frecuencia experimentas dolor abdominal?',
    options: ['Nunca', 'Rara vez', 'A veces', 'Frecuentemente', 'Siempre'],
  },
  {
    id: 2,
    question: '¿Cómo describirías tu digestión?',
    options: ['Excelente', 'Buena', 'Regular', 'Mala', 'Muy mala'],
  },
  {
    id: 3,
    question: '¿Cuántas comidas al día consumes?',
    options: ['1-2', '3', '4', '5', 'Más de 5'],
  },
];

interface QuizContainerProps {
  onRestart?: () => void;
}

export const QuizContainer = ({ onRestart }: QuizContainerProps) => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleAnswer = (answer: string) => {
    const question = mockQuestions[currentQuestion];
    if (question) {
      setAnswers({ ...answers, [question.id]: answer });
    }
  };

  const handleNext = () => {
    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Navigate to diagnosis
      navigate('/diagnosis');
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      // Reset everything and go back to intro
      if (onRestart) {
        onRestart();
      } else {
        navigate('/');
      }
    }
  };

  const question = mockQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / mockQuestions.length) * 100;

  if (!question) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ovp-bg-light via-[#F4E8D8] to-[#E8D5C4] p-4 animate-fade-in">
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-slide-in-up">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                Pregunta {currentQuestion + 1} de {mockQuestions.length}
              </span>
              <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-brand-green h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-ovp-text-dark mb-8 animate-fade-in">
            {question.question}
          </h2>

          <div className="space-y-3 mb-8">
            {question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left animate-fade-in ${
                  answers[question.id] === option
                    ? 'border-primary bg-primary/10 shadow-lg scale-[1.02]'
                    : 'border-gray-200 hover:border-primary hover:bg-gray-50'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="font-medium text-gray-900">{option}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200 hover:-translate-y-0.5"
            >
              {currentQuestion === 0 ? 'Volver al inicio' : 'Anterior'}
            </button>
            <button
              onClick={handleNext}
              disabled={!answers[question.id]}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                answers[question.id]
                  ? 'bg-brand-green hover:bg-brand-green/90 text-black shadow-lg hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              {currentQuestion === mockQuestions.length - 1 ? 'Ver Diagnóstico' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
