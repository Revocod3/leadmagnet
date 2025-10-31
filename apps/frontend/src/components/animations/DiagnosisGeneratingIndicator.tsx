import { motion } from 'framer-motion';
import { Sparkles, Brain, FileText, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Step {
  icon: any;
  text: string;
  duration: number;
}

const GENERATION_STEPS: Step[] = [
  { icon: Brain, text: 'Analizando tus respuestas...', duration: 2000 },
  { icon: Sparkles, text: 'Identificando patrones clave...', duration: 2500 },
  { icon: FileText, text: 'Generando tu diagnóstico personalizado...', duration: 3000 },
  { icon: CheckCircle2, text: 'Finalizando...', duration: 1000 }
];

export const DiagnosisGeneratingIndicator = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev; // Cap at 95% until complete
        return prev + 1;
      });
    }, 100);

    // Step through generation phases
    let totalDuration = 0;
    GENERATION_STEPS.forEach((step, index) => {
      totalDuration += step.duration;
      setTimeout(() => {
        setCurrentStep(index);
      }, totalDuration - step.duration);
    });

    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  const CurrentIcon = GENERATION_STEPS[currentStep]?.icon || Brain;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-start gap-4"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-sm ring-2 ring-brand-green-500/20 dark:ring-brand-green-400/30">
        <img src="/assets/images/favicon.webp" alt="OVP" className="w-full h-full object-cover" />
      </div>

      {/* Generation Card */}
      <div className="flex-1 max-w-md">
        <motion.div
          className="bg-gradient-to-br from-brand-green-50 to-green-100 dark:from-neutral-800 dark:to-neutral-700 rounded-2xl p-6 shadow-lg border border-brand-green-200 dark:border-neutral-600"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* Icon and Status */}
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              className="p-2 bg-brand-green-500 rounded-lg"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <CurrentIcon className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex-1">
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm font-semibold text-brand-green-900 dark:text-brand-green-100"
              >
                {GENERATION_STEPS[currentStep]?.text || 'Preparando...'}
              </motion.p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-white/50 dark:bg-neutral-900/50 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-green-500 to-brand-green-600 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{ width: '50%' }}
            />
          </div>

          {/* Progress percentage */}
          <p className="text-xs text-brand-green-700 dark:text-brand-green-300 text-right mt-2 font-medium">
            {progress}%
          </p>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mt-4">
            {GENERATION_STEPS.map((_step, index) => (
              <div
                key={index}
                className={`flex-1 h-1 rounded-full transition-all duration-500 ${index <= currentStep
                    ? 'bg-brand-green-500'
                    : 'bg-white/30 dark:bg-neutral-600/30'
                  }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Reassurance message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs text-neutral-600 dark:text-neutral-400 mt-3 text-center italic"
        >
          Estamos preparando un análisis detallado y personalizado para ti...
        </motion.p>
      </div>
    </motion.div>
  );
};
