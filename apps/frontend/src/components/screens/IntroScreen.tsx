import { useState } from 'react';

interface IntroScreenProps {
  onComplete: (name: string, email: string) => void;
}

export const IntroScreen = ({ onComplete }: IntroScreenProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '' });

  const validateForm = () => {
    const newErrors = { name: '', email: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Por favor ingresa tu nombre';
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
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-5 bg-gradient-to-br from-[#F4E8D8] to-[#E8D5C4]">
      <div className="bg-white rounded-3xl p-10 max-w-[480px] w-[90%] shadow-2xl animate-slide-in-up">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="max-w-[200px] h-auto mx-auto">
            <span className="text-2xl font-bold text-primary">
              Objetivo Vientre Plano
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-semibold text-ovp-text-dark text-center mb-3">
          Bienvenido/a a tu Diagnóstico Gratuito
        </h1>

        {/* Subtitle */}
        <p className="text-base text-gray-500 text-center mb-8 leading-relaxed">
          Para comenzar tu diagnóstico personalizado, necesitamos algunos datos:
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="mb-6">
            <label
              htmlFor="user-name-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Tu nombre
            </label>
            <input
              type="text"
              id="user-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: María"
              autoComplete="given-name"
              className={`w-full px-4 py-3.5 border-2 rounded-xl text-base transition-all duration-300 ${
                errors.name
                  ? 'border-red-500 animate-shake'
                  : 'border-gray-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(151,170,121,0.1)]'
              } focus:outline-none`}
            />
            {errors.name && (
              <span className="block text-red-500 text-sm mt-1.5 animate-fade-in">
                {errors.name}
              </span>
            )}
          </div>

          {/* Email Input */}
          <div className="mb-6">
            <label
              htmlFor="user-email-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Tu correo electrónico
            </label>
            <input
              type="email"
              id="user-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: maria@email.com"
              autoComplete="email"
              className={`w-full px-4 py-3.5 border-2 rounded-xl text-base transition-all duration-300 ${
                errors.email
                  ? 'border-red-500 animate-shake'
                  : 'border-gray-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(151,170,121,0.1)]'
              } focus:outline-none`}
            />
            {errors.email && (
              <span className="block text-red-500 text-sm mt-1.5 animate-fade-in">
                {errors.email}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full px-4 py-4 bg-gradient-to-r from-primary to-primary-light text-white border-none rounded-xl text-lg font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(151,170,121,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(151,170,121,0.4)] active:translate-y-0"
          >
            Comenzar Diagnóstico ✨
          </button>
        </form>

        {/* Privacy Note */}
        <p className="text-center text-sm text-gray-400 mt-5">
          🔒 Tus datos están seguros y son confidenciales
        </p>
      </div>
    </div>
  );
};
