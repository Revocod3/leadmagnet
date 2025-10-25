import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface IntroScreenProps {
  onComplete: (name: string, email: string, leadId?: string) => void;
}

export const IntroScreen = ({ onComplete }: IntroScreenProps) => {
  useEffect(() => {
    // Read URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const nombre = urlParams.get('nombre');
    const email = urlParams.get('email');
    const leadId = urlParams.get('leadId') || urlParams.get('lead_id');

    // If both name and email are present, auto-complete
    if (nombre && email) {
      onComplete(nombre, email, leadId || undefined);
    }
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream-100 via-brand-cream-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />

      {/* Floating Shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-brand-green-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-green-100/20 rounded-full blur-3xl" />

      {/* Content - Loading State */}
      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-soft-lg border border-white/20 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-10 pb-8 text-center">
              {/* Logo/Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-block w-20 h-20 mb-6"
              >
                <img src="/assets/images/favicon.webp" alt="Objetivo Vientre Plano" className="w-full h-full object-contain drop-shadow-2xl" />
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
                Preparando tu experiencia personalizada...
              </motion.p>

              {/* Loading Spinner */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex justify-center"
              >
                <div className="w-12 h-12 border-4 border-brand-green-200 border-t-brand-green-500 rounded-full animate-spin" />
              </motion.div>
            </div>
          </div>

          {/* Footer Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8 text-sm text-neutral-500"
          >
            100% gratuito • Sin compromiso • Resultados inmediatos
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};
