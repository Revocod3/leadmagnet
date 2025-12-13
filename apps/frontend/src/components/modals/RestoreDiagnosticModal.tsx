import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, MessageCircle } from 'lucide-react';

interface RestoreDiagnosticModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onRestart: () => void;
}

export const RestoreDiagnosticModal = ({ isOpen, onContinue, onRestart }: RestoreDiagnosticModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800"
          >
            <div className="p-6 sm:p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-green-100 to-brand-green-200 dark:from-brand-green-900/30 dark:to-brand-green-800/30 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-brand-green-600 dark:text-brand-green-400" />
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                  Diagnóstico en progreso
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Detectamos que tienes un diagnóstico sin terminar. ¿Qué deseas hacer?
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {/* Continue Button */}
                <button
                  onClick={onContinue}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-green-600 to-brand-green-700 hover:from-brand-green-700 hover:to-brand-green-800 text-white font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-brand-green-600/20 hover:shadow-brand-green-600/30 transform hover:-translate-y-0.5 active:scale-95"
                >
                  <span>Continuar donde lo dejé</span>
                </button>

                {/* Restart Button */}
                <button
                  onClick={onRestart}
                  className="w-full py-3 px-6 rounded-xl bg-transparent border-2 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-base flex items-center justify-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Empezar de nuevo</span>
                </button>
              </div>

              {/* Info text */}
              <p className="mt-4 text-xs text-center text-neutral-500 dark:text-neutral-500">
                Si empiezas de nuevo, perderás todo el progreso anterior
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
