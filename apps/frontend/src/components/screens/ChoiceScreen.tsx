interface ChoiceScreenProps {
  onSelect: (choice: 'chat' | 'quiz') => void;
}

export const ChoiceScreen = ({ onSelect }: ChoiceScreenProps) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9998] p-5 bg-gradient-to-br from-[#FAF6ED] via-[#F4E8D8] to-[#D3D379] opacity-100 transition-opacity duration-500">
      <div className="max-w-[1000px] w-full animate-slide-in-up">
        {/* Title */}
        <h2 className="text-4xl font-semibold text-ovp-text-dark text-center mb-3">
          ¿Cómo prefieres hacer tu diagnóstico?
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-gray-500 text-center mb-10">
          Elige la opción que mejor se adapte a ti:
        </p>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mx-auto max-w-[800px]">
          {/* Quiz Card */}
          <div
            onClick={() => onSelect('quiz')}
            className="relative bg-white rounded-2xl p-10 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-[0_12px_35px_rgba(151,170,121,0.2)]"
          >
            <div className="text-6xl mb-5 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
              ⚡
            </div>
            <h3 className="text-2xl font-semibold text-ovp-text-dark mb-2">
              Test Rápido
            </h3>
            <p className="text-base text-gray-500 mb-6">
              Quiz de 5-7 preguntas clave
            </p>
            <ul className="list-none p-0 m-0 mb-8 w-full">
              <li className="py-2.5 text-gray-700 text-sm border-b border-gray-200">
                ✓ Solo 3-5 minutos
              </li>
              <li className="py-2.5 text-gray-700 text-sm border-b border-gray-200">
                ✓ Resultados inmediatos
              </li>
              <li className="py-2.5 text-gray-700 text-sm">
                ✓ Ideal para comenzar
              </li>
            </ul>
            <button className="w-full py-3.5 px-6 bg-white border-2 border-primary text-primary rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-primary hover:text-white hover:scale-105">
              Elegir Test Rápido
            </button>
          </div>

          {/* Chat Card - Featured */}
          <div
            onClick={() => onSelect('chat')}
            className="relative bg-gradient-to-br from-[#FAF6ED] to-[#F4E8D8] border-3 border-primary rounded-2xl p-10 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-[0_12px_35px_rgba(151,170,121,0.2)]"
          >
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-5 py-1.5 rounded-full text-sm font-semibold shadow-[0_2px_10px_rgba(211,211,121,0.3)]">
              Recomendado
            </div>

            <div className="text-6xl mb-5 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
              💬
            </div>
            <h3 className="text-2xl font-semibold text-ovp-text-dark mb-2">
              Chat IA Personalizado
            </h3>
            <p className="text-base text-gray-500 mb-6">
              Conversación profunda y adaptativa
            </p>
            <ul className="list-none p-0 m-0 mb-8 w-full">
              <li className="py-2.5 text-gray-700 text-sm border-b border-gray-200">
                ✓ Diagnóstico completo
              </li>
              <li className="py-2.5 text-gray-700 text-sm border-b border-gray-200">
                ✓ Respuestas personalizadas
              </li>
              <li className="py-2.5 text-gray-700 text-sm">
                ✓ Análisis profesional
              </li>
            </ul>
            <button className="w-full py-3.5 px-6 bg-gradient-to-r from-primary to-primary-light text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(151,170,121,0.3)] hover:scale-105 hover:shadow-[0_6px_20px_rgba(151,170,121,0.4)]">
              Elegir Chat IA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
