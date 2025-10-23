import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';
import { Download } from 'lucide-react';

export const DiagnosisScreen = () => {
  const navigate = useNavigate();
  const { generatePDF } = usePDFGenerator();
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data - esto debería venir del estado/API
  const userName = sessionStorage.getItem('userData')
    ? JSON.parse(sessionStorage.getItem('userData')!).name
    : 'Usuario';

  const diagnosisContent = `**🎯 Tu Diagnóstico Personalizado**

Gracias por completar el cuestionario. Basándonos en tus respuestas, hemos identificado varios aspectos importantes sobre tu salud digestiva y bienestar general.

**💪 Áreas de Fortaleza**

• Muestras compromiso con tu bienestar al buscar activamente soluciones
• Tienes consciencia sobre los aspectos que necesitan mejora
• Demuestras disposición para hacer cambios en tu estilo de vida

**🎯 Áreas de Oportunidad**

• Digestión: Es importante prestar atención a cómo te sientes después de las comidas
• Energía: Trabajar en mantener niveles de energía estables durante el día
• Hábitos: Implementar rutinas consistentes que apoyen tu objetivo

**🌟 Recomendaciones Iniciales**

1. Enfócate en una alimentación consciente y equilibrada
2. Mantén horarios regulares de comida
3. Incorpora actividad física moderada de forma regular
4. Presta atención a las señales de tu cuerpo
5. Considera llevar un registro de tu progreso

**💡 Próximos Pasos**

Este diagnóstico es el primer paso hacia el cambio que buscas. Para resultados duraderos y personalizados, te recomendamos trabajar con un especialista que pueda guiarte en tu proceso de transformación.

Recuerda: Los cambios reales requieren tiempo, constancia y el apoyo adecuado. ¡Estás en el camino correcto!`;

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    try {
      const success = generatePDF({
        userName,
        diagnosisContent,
        language: 'es',
      });

      if (success) {
        // Opcional: Mostrar mensaje de éxito
        console.log('PDF generado exitosamente');
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, intenta nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ovp-bg-light via-[#F4E8D8] to-[#E8D5C4] p-4 animate-fade-in">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-slide-in-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green/20 mb-4 animate-zoom-in">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-3xl font-bold text-ovp-text-dark mb-2 animate-fade-in">
              Tu Diagnóstico Personalizado
            </h1>
            <p className="text-gray-600 animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
            <div className="bg-primary/10 rounded-xl p-4 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-2xl font-bold text-primary mb-1">85%</div>
              <div className="text-sm text-gray-600">Score de Salud</div>
            </div>
            <div className="bg-brand-green/10 rounded-xl p-4 text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="text-2xl font-bold text-brand-green mb-1">Bueno</div>
              <div className="text-sm text-gray-600">Estado General</div>
            </div>
            <div className="bg-accent/20 rounded-xl p-4 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="text-2xl font-bold text-ovp-text-dark mb-1">3-4</div>
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
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex-1 py-3 px-6 rounded-xl bg-brand-green hover:bg-brand-green/90 text-black font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Generando PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
