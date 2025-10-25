import { MessageSquare, ClipboardList, ArrowRight, Zap, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChoiceScreenProps {
  onSelect: (choice: 'chat' | 'quiz') => void;
}

export const ChoiceScreen = ({ onSelect }: ChoiceScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #99AB75 0%, #A0AD5E 50%, #A5B26C 100%)'
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.15, 0.2, 0.15],
        }}
        transition={{
          duration: 8,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        className="absolute -top-48 -left-48 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(153, 171, 117, 0.3) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }}
      />

      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.15, 0.2, 0.15],
        }}
        transition={{
          duration: 8,
          ease: "easeInOut",
          repeat: Infinity,
          delay: 4,
        }}
        className="absolute -bottom-48 -right-48 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(165, 178, 108, 0.3) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }}
      />

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              Elige tu método preferido
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Selecciona cómo te gustaría realizar tu diagnóstico personalizado
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.button
              onClick={() => onSelect('chat')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 text-left"
            >
              <div className="absolute -top-3 -right-3">
                <div
                  className="text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1"
                  style={{ background: 'linear-gradient(135deg, #99AB75, #A0AD5E)' }}
                >
                  <Zap className="w-3 h-3" />
                  Recomendado
                </div>
              </div>

              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300"
                style={{ background: 'linear-gradient(135deg, rgba(153, 171, 117, 0.15), rgba(160, 173, 94, 0.25))' }}
              >
                <MessageSquare className="w-7 h-7" style={{ color: '#7A8A4F' }} />
              </div>

              <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                Chat IA Personalizado
              </h3>
              <p className="text-neutral-600 mb-6 leading-relaxed">
                Conversación natural y adaptativa con nuestro asistente especializado
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  'Análisis profundo y detallado',
                  'Respuestas en tiempo real',
                  'Recomendaciones personalizadas',
                  'Soporte con imágenes',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-neutral-700">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#A0AD5E' }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <div
                className="flex items-center gap-2 font-semibold group-hover:gap-3 transition-all"
                style={{ color: '#7A8A4F' }}
              >
                <span>Iniciar chat</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </motion.button>

            <motion.button
              onClick={() => onSelect('quiz')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 text-left"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 mb-6 group-hover:scale-110 transition-transform duration-300">
                <ClipboardList className="w-7 h-7 text-neutral-700" />
              </div>

              <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                Cuestionario Rápido
              </h3>
              <p className="text-neutral-600 mb-6 leading-relaxed">
                Responde preguntas específicas para un diagnóstico estructurado
              </p>

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

              <div className="flex items-center gap-2 text-neutral-700 font-semibold group-hover:gap-3 transition-all">
                <span>Comenzar test</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 flex items-center justify-center gap-2 text-sm text-white/90"
          >
            <Brain className="w-4 h-4" />
            <span>Ambas opciones usan tecnología IA avanzada para tu diagnóstico</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
