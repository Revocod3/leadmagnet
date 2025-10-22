import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const IntroScreen = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<'chat' | 'quiz' | null>(null);

  const handleStart = () => {
    if (selectedOption === 'chat') {
      navigate('/chat');
    } else if (selectedOption === 'quiz') {
      navigate('/quiz');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Objetivo Vientre Plano
          </h1>
          <p className="text-lg text-gray-600">
            Descubre tu diagnóstico personalizado para lograr un vientre plano
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={() => setSelectedOption('chat')}
            className={`w-full p-6 rounded-xl border-2 transition-all duration-200 ${
              selectedOption === 'chat'
                ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 text-3xl mr-4">💬</div>
              <div className="text-left flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Diagnóstico por Chat
                </h3>
                <p className="text-gray-600">
                  Conversa con nuestro asistente virtual y obtén un diagnóstico personalizado
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedOption('quiz')}
            className={`w-full p-6 rounded-xl border-2 transition-all duration-200 ${
              selectedOption === 'quiz'
                ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 text-3xl mr-4">📋</div>
              <div className="text-left flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Diagnóstico por Cuestionario
                </h3>
                <p className="text-gray-600">
                  Responde a preguntas específicas para obtener tu diagnóstico
                </p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={handleStart}
          disabled={!selectedOption}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
            selectedOption
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Comenzar Diagnóstico
        </button>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🔒 Tu información es confidencial y segura</p>
        </div>
      </div>
    </div>
  );
};
