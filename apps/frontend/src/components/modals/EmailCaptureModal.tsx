import { useState } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  userName?: string;
}

export const EmailCaptureModal = ({ isOpen, onClose, onSubmit, userName }: EmailCaptureModalProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Por favor ingresa un correo válido');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedEmail);
      // Modal will be closed by parent component after successful submission
    } catch (err) {
      setError('Hubo un error. Por favor, intenta nuevamente.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Close Button */}
          {!isSubmitting && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors z-10"
            >
              <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
          )}

          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center border-b border-neutral-200 dark:border-neutral-700">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-green-500 to-brand-green-600 mb-4 shadow-lg"
            >
              <Mail className="w-8 h-8 text-white" />
            </motion.div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              ¡Un último paso!
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {userName ? `${userName}, i` : 'I'}ngresa tu correo para recibir tu diagnóstico en PDF
            </p>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-8 py-6">
            {/* Email Input */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="tu@email.com"
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-4 py-3 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-brand-green-500 dark:focus:border-brand-green-400 focus:ring-4 focus:ring-brand-green-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  autoFocus
                />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                >
                  <span>⚠️</span>
                  {error}
                </motion.p>
              )}
            </div>

            {/* Benefits */}
            <div className="mb-6 p-4 bg-gradient-to-br from-brand-green-50 to-green-100 dark:from-brand-green-900/20 dark:to-green-800/20 rounded-xl border border-brand-green-200 dark:border-brand-green-700">
              <p className="text-xs font-semibold text-brand-green-900 dark:text-brand-green-200 mb-2">
                Recibirás:
              </p>
              <ul className="text-xs text-brand-green-800 dark:text-brand-green-300 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-brand-green-600">✓</span>
                  Tu diagnóstico personalizado en PDF
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-green-600">✓</span>
                  Consejos exclusivos para tu salud digestiva
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-green-600">✓</span>
                  Acceso a contenido premium
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-brand-green-500 to-brand-green-600 hover:from-brand-green-600 hover:to-brand-green-700 text-white font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span>Descargar diagnóstico</span>
                  <span>→</span>
                </>
              )}
            </button>

            {/* Privacy Note */}
            <p className="mt-4 text-xs text-center text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1">
              <span>🔒</span>
              <span>Tus datos están 100% protegidos</span>
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
