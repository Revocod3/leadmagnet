import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface IntroScreenProps {
  onComplete: (name: string, email?: string, leadId?: string) => void;
}

export const IntroScreen = ({ onComplete }: IntroScreenProps) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Read URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const nombre = urlParams.get('nombre');
    const email = urlParams.get('email');
    const leadId = urlParams.get('leadId') || urlParams.get('lead_id');

    // If name is present, auto-complete (email is now optional)
    if (nombre) {
      console.log('🔍 Parámetros URL detectados:', { nombre, email: email || 'NO PROPORCIONADO', leadId });
      setIsLoading(true);

      // Small delay to show loading state
      setTimeout(() => {
        onComplete(nombre, email || undefined, leadId || undefined);
      }, 500);
    }
  }, [onComplete]);

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

      {/* Content - Loading State */}
      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-10 pb-8 text-center">
              {/* Logo Circular */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
                className="inline-block mb-6"
              >
                <div className="relative w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center overflow-hidden">
                  <img
                    src="/assets/images/favicon.webp"
                    alt="Objetivo Vientre Plano"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3 tracking-tight"
              >
                Diagnóstico Gratuito
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-neutral-600 text-base sm:text-lg leading-relaxed"
              >
                {isLoading ? 'Cargando tu diagnóstico personalizado...' : 'Preparando tu experiencia personalizada...'}
              </motion.p>

              {/* Loading Spinner - Simple y elegante */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 flex justify-center"
                >
                  <div
                    className="w-10 h-10 border-3 rounded-full animate-spin"
                    style={{
                      borderWidth: '3px',
                      borderStyle: 'solid',
                      borderColor: '#e5e7eb',
                      borderTopColor: '#A0AD5E'
                    }}
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8 text-sm text-white/90"
          >
            100% gratuito • Sin compromiso • Resultados inmediatos
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
};