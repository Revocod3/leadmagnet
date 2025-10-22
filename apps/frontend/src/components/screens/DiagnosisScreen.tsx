import { useNavigate } from 'react-router-dom';

export const DiagnosisScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tu Diagnóstico Personalizado
            </h1>
            <p className="text-gray-600">
              Basado en tus respuestas, aquí está tu diagnóstico completo
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen del Diagnóstico</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                Gracias por completar el cuestionario. Tu diagnóstico personalizado está siendo
                generado por nuestro asistente de IA.
              </p>
              <p>
                En breve implementaremos la conexión completa con el backend para mostrarte
                recomendaciones específicas y un plan personalizado para lograr un vientre plano.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600 mb-1">85%</div>
              <div className="text-sm text-gray-600">Score de Salud</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">Bueno</div>
              <div className="text-sm text-gray-600">Estado General</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-600 mb-1">3-4</div>
              <div className="text-sm text-gray-600">Semanas estimadas</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Volver al inicio
            </button>
            <button
              onClick={() => alert('Funcionalidad de descarga en desarrollo')}
              className="flex-1 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
            >
              Descargar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
