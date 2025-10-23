import { MessageSquare, ClipboardList, ArrowRight, Zap, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChoiceScreenProps {
  onSelect: (choice: 'chat' | 'quiz') => void;
}

export const ChoiceScreen = ({ onSelect }: ChoiceScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-cream-50 to-white relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
              Elige tu método preferido
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Selecciona cómo te gustaría realizar tu diagnóstico personalizado
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Chat Option */}
            <motion.button
              onClick={() => onSelect('chat')}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white rounded-2xl p-8 shadow-soft hover:shadow-soft-lg border border-neutral-200 hover:border-brand-green-300 transition-all duration-300 text-left"
            >
              {/* Badge */}
              <div className="absolute -top-3 -right-3">
                <div className="bg-gradient-to-r from-brand-green-500 to-brand-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Recomendado
                </div>
              </div>

              {/* Icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-green-100 to-brand-green-200 mb-6 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="w-7 h-7 text-brand-green-700" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                Chat IA Personalizado
              </h3>
              <p className="text-neutral-600 mb-6 leading-relaxed">
                Conversación natural y adaptativa con nuestro asistente especializado
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {[
                  'Análisis profundo y detallado',
                  'Respuestas en tiempo real',
                  'Recomendaciones personalizadas',
                  'Soporte con imágenes',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-neutral-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex items-center gap-2 text-brand-green-600 font-semibold group-hover:gap-3 transition-all">
                <span>Iniciar chat</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </motion.button>

            {/* Quiz Option */}
            <motion.button
              onClick={() => onSelect('quiz')}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white rounded-2xl p-8 shadow-soft hover:shadow-soft-lg border border-neutral-200 hover:border-brand-green-300 transition-all duration-300 text-left"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 mb-6 group-hover:scale-110 transition-transform duration-300">
                <ClipboardList className="w-7 h-7 text-neutral-700" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                Cuestionario Rápido
              </h3>
              <p className="text-neutral-600 mb-6 leading-relaxed">
                Responde preguntas específicas para un diagnóstico estructurado
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {[
                  'Solo 5-7 minutos',
                  'Preguntas claras y directas',
                  'Progreso visible',
                  'Resultados inmediatos',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-neutral-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex items-center gap-2 text-neutral-700 font-semibold group-hover:gap-3 transition-all">
                <span>Comenzar test</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </motion.button>
          </div>

          {/* Bottom Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 flex items-center justify-center gap-2 text-sm text-neutral-500"
          >
            <Brain className="w-4 h-4" />
            <span>Ambas opciones usan tecnología IA avanzada para tu diagnóstico</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
