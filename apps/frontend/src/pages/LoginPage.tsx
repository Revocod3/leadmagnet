import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth';
import { motion, AnimatePresence } from 'framer-motion';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      if (response.success && response.data) {
        // Save auth data
        setAuth(response.data.token, response.data.user as any);

        // Redirect to Clara PRO
        navigate('/chat');
      } else {
        setError('Credenciales inválidas');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const googleAuthUrl = authService.getGoogleAuthUrl();
    window.location.href = googleAuthUrl;
  };

  // Check for auth error from URL
  const authError = searchParams.get('error');

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row">
      {/* MOBILE HEADER - Solo logo en móvil */}
      <div className="lg:hidden bg-gradient-to-r from-[#A2AE5A] to-[#97AA79] py-6 px-4 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(255, 255, 255, 0.4)',
                '0 0 0 20px rgba(255, 255, 255, 0)',
                '0 0 0 0 rgba(255, 255, 255, 0)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
            className="w-14 h-14 rounded-full bg-white shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white/30"
          >
            <img
              src="/assets/images/favicon.webp"
              alt="OVP"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* LEFT SIDE - Branded Section - Solo visible en desktop */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex relative lg:w-1/2 bg-gradient-to-br from-[#A2AE5A] via-[#97AA79] to-[#99AB75] overflow-hidden items-center justify-center p-16"
      >
        {/* Efectos de fondo animados - círculos flotantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              y: [0, -30, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-white/8"
          />
          <motion.div
            animate={{
              y: [0, 30, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
            className="absolute -bottom-1/3 -left-1/4 w-[400px] h-[400px] rounded-full bg-white/6"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          {/* Logo circular con animación de respiración */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="inline-block mb-8"
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(255, 255, 255, 0.4)',
                  '0 0 0 20px rgba(255, 255, 255, 0)',
                  '0 0 0 0 rgba(255, 255, 255, 0)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
              className="w-32 h-32 rounded-full bg-white shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white/30"
            >
              <img
                src="/assets/images/favicon.webp"
                alt="Objetivo Vientre Plano"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </motion.div>

          {/* Título y descripción */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold text-white mb-4 leading-tight tracking-tight"
          >
            Objetivo Vientre Plano
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <p className="text-lg text-white/95 leading-relaxed font-light">
              Conoce a Clara, nuestra experta en bienestar digestivo.
            </p>

            {/* Badge decorativo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm text-white font-semibold">
                Cambia tu vida aquí
              </span>
            </motion.div>
          </motion.div>


        </div>
      </motion.div>

      {/* RIGHT SIDE - Formulario */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex-1 lg:w-1/2 bg-white flex items-start lg:items-center justify-center p-4 lg:p-8 overflow-y-auto"
      >
        <div className="w-full max-w-md py-2">
          {/* Encabezado del formulario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <h2 className="text-lg lg:text-3xl font-bold text-gray-900 mb-2">
              ¡Bienvenido a Clara PRO!
            </h2>
            <p className="text-gray-600 text-xs lg:text-base">
              Ingresa tus credenciales para acceder
            </p>
          </motion.div>

          {/* Error messages */}
          <AnimatePresence>
            {(error || authError) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  {error ||
                    (authError === 'auth_failed'
                      ? 'Error de autenticación'
                      : 'Ocurrió un error inesperado')}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Login */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleGoogleLogin}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mb-3 py-2.5 px-3 border-2 border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-gray-700 text-xs lg:text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continuar con Google</span>
          </motion.button>

          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500 font-medium">O</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A2AE5A] focus:border-transparent transition-all text-sm"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A2AE5A] focus:border-transparent transition-all text-sm"
                placeholder="Tu contraseña"
                minLength={6}
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-[#A2AE5A] to-[#97AA79] text-white py-2.5 rounded-lg font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Cargando...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </motion.button>
          </motion.form>

          {/* Link a Registro Externo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-gray-600 mb-2">
              ¿No tienes cuenta todavía?
            </p>
            <a
              href="/pricing"
              className="inline-block w-full py-2.5 px-4 border-2 border-[#A2AE5A] text-[#A2AE5A] rounded-lg font-semibold text-sm hover:bg-[#A2AE5A] hover:text-white transition-all"
            >
              Suscríbete a Clara PRO →
            </a>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-3 text-center text-[10px] lg:text-xs text-gray-500 leading-relaxed"
          >
            Al continuar, aceptas nuestros{' '}
            <a
              href="/terms"
              className="text-[#A2AE5A] hover:underline font-medium"
            >
              Términos de Servicio
            </a>{' '}
            y{' '}
            <a
              href="/privacy"
              className="text-[#A2AE5A] hover:underline font-medium"
            >
              Política de Privacidad
            </a>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
