import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

export function WelcomePage() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan');
  // Success if we have a plan parameter (coming from Stripe) or explicit success=true
  const success = !!plan || searchParams.get('success') === 'true';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {success ? (
          <>
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 bg-gradient-to-br from-[#9FB870] to-[#8BA55D] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              ¡Gracias por tu compra! 🎉
            </h1>
            
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Tu membresía PRO ya está activa. Hemos enviado un correo a tu email con las instrucciones para acceder a tu cuenta.
            </p>

            <div className="bg-[#f0f7e6] dark:bg-[#9FB870]/10 rounded-xl p-4 mb-6">
              <p className="text-sm text-[#5a7a2d] dark:text-[#9FB870]">
                <strong>📧 Revisa tu bandeja de entrada</strong><br/>
                (también la carpeta de spam)
              </p>
            </div>

            <div className="space-y-3">
              <a
                href="/login"
                className="block w-full py-3 px-4 bg-gradient-to-r from-[#9FB870] to-[#8BA55D] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Ir al inicio de sesión
              </a>
              
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Si ya tienes cuenta con Google, puedes acceder directamente
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
              Algo salió mal
            </h1>
            
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              No pudimos procesar tu solicitud. Por favor intenta de nuevo o contacta con soporte.
            </p>

            <a
              href="/"
              className="inline-block py-3 px-6 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-medium rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
            >
              Volver al inicio
            </a>
          </>
        )}
      </motion.div>
    </div>
  );
}
