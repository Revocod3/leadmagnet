import { useState } from 'react';
import { motion } from 'framer-motion';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';
import { trackMetaCompleteRegistration } from '../../services/analytics';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const { token, setAuth } = useAuthStore();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor, ingresa tu nombre');
      return;
    }

    if (!birthDate) {
      setError('Por favor, ingresa tu fecha de nacimiento');
      return;
    }

    if (!token) {
      setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.completeOnboarding(
        { name: name.trim(), birthDate },
        token
      );

      if (result.success && result.data) {
        // Update auth store with new user data and token
        setAuth(result.data.token, result.data.user as any);

        // Track Meta Pixel CompleteRegistration event
        trackMetaCompleteRegistration();

        onComplete();
      } else {
        setError(result.error || 'Error al completar el registro');
      }
    } catch (err) {
      setError('Error de conexión. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="px-8 pt-10 pb-6 text-center">
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
                className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3 tracking-tight"
              >
                Antes de empezar
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-neutral-600 text-base leading-relaxed"
              >
                Me gustaría conocerte un poco mejor para personalizar tu experiencia
              </motion.p>
            </div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onSubmit={handleSubmit}
              className="px-8 pb-10"
            >
              {/* Name Field */}
              <div className="mb-5">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-neutral-700 mb-2"
                >
                  ¿Cómo te llamas?
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#A0AD5E] focus:ring-2 focus:ring-[#A0AD5E]/20 outline-none transition-all text-neutral-900 placeholder:text-neutral-400"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {/* Birth Date Field */}
              <div className="mb-6">
                <label
                  htmlFor="birthDate"
                  className="block text-sm font-medium text-neutral-700 mb-2"
                >
                  ¿Cuál es tu fecha de nacimiento?
                </label>
                <input
                  type="date"
                  id="birthDate"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#A0AD5E] focus:ring-2 focus:ring-[#A0AD5E]/20 outline-none transition-all text-neutral-900"
                  disabled={isLoading}
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Esto nos ayuda a personalizar mejor tus recomendaciones
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #99AB75 0%, #A0AD5E 100%)',
                  boxShadow: '0 4px 14px rgba(160, 173, 94, 0.3)'
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div
                      className="w-5 h-5 border-2 rounded-full animate-spin"
                      style={{
                        borderColor: 'rgba(255,255,255,0.3)',
                        borderTopColor: 'white'
                      }}
                    />
                    Guardando...
                  </span>
                ) : (
                  'Continuar'
                )}
              </button>
            </motion.form>
          </div>

          {/* Footer Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8 text-sm text-white/90"
          >
            Tu información está segura y protegida
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
};
