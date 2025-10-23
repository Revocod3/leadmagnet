import { useState } from 'react';
import { Mail, User, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface IntroScreenProps {
  onComplete: (name: string, email: string) => void;
}

export const IntroScreen = ({ onComplete }: IntroScreenProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '' });
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors = { name: '', email: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Por favor ingresa tu nombre';
      isValid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Por favor ingresa tu correo';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Por favor ingresa un correo válido';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete(name, email);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream-100 via-brand-cream-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />

      {/* Floating Shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-brand-green-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-green-100/20 rounded-full blur-3xl" />

      {/* Content */}
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
                Descubre tu camino hacia un bienestar digestivo óptimo
              </motion.p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
              {/* Name Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-neutral-700 mb-2"
                >
                  Tu nombre
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="María García"
                    className={`
                      w-full pl-12 pr-4 py-3.5 rounded-xl
                      bg-neutral-50 border-2
                      text-neutral-900 placeholder:text-neutral-400
                      transition-all duration-200
                      ${errors.name
                        ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10'
                        : focusedField === 'name'
                          ? 'border-brand-green-500 ring-4 ring-brand-green-500/10'
                          : 'border-transparent hover:border-neutral-200'
                      }
                      focus:outline-none
                    `}
                  />
                </div>
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-error flex items-center gap-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-error" />
                    {errors.name}
                  </motion.p>
                )}
              </motion.div>

              {/* Email Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-neutral-700 mb-2"
                >
                  Tu correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="maria@ejemplo.com"
                    className={`
                      w-full pl-12 pr-4 py-3.5 rounded-xl
                      bg-neutral-50 border-2
                      text-neutral-900 placeholder:text-neutral-400
                      transition-all duration-200
                      ${errors.email
                        ? 'border-error focus:border-error focus:ring-4 focus:ring-error/10'
                        : focusedField === 'email'
                          ? 'border-brand-green-500 ring-4 ring-brand-green-500/10'
                          : 'border-transparent hover:border-neutral-200'
                      }
                      focus:outline-none
                    `}
                  />
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-error flex items-center gap-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-error" />
                    {errors.email}
                  </motion.p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 px-6 py-4 rounded-xl bg-gradient-to-r from-brand-green-500 to-brand-green-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <span>Comenzar mi diagnóstico</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              {/* Privacy Notice */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 flex items-start gap-3 p-4 bg-brand-green-50 rounded-xl border border-brand-green-100"
              >
                <Shield className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Tu información está protegida y es completamente confidencial.
                  Solo se usará para personalizar tu experiencia.
                </p>
              </motion.div>
            </form>
          </div>

          {/* Footer Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center mt-8 text-sm text-neutral-500"
          >
            100% gratuito • Sin compromiso • Resultados inmediatos
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};
