import { X, MessageCircle, Mail, Copy } from 'lucide-react';
import { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  text: string;
  onClose: () => void;
}

export const ShareModal = ({ isOpen, text, onClose }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleEmail = () => {
    const subject = 'Compartido desde Objetivo Vientre Plano';
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying text:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-ovp-dark-secondary rounded-2xl max-w-md w-full p-6 shadow-2xl animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Compartir Mensaje
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </header>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-32 overflow-y-auto">
            {text}
          </p>
        </div>

        {/* Share Options */}
        <div className="flex items-center justify-around gap-4">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            title="Compartir en WhatsApp"
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">WhatsApp</span>
          </button>

          {/* Twitter */}
          <button
            onClick={handleTwitter}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            title="Compartir en Twitter"
          >
            <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
              </svg>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Twitter</span>
          </button>

          {/* Email */}
          <button
            onClick={handleEmail}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            title="Compartir por Email"
          >
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Email</span>
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            title="Copiar texto"
          >
            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Copy className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {copied ? 'Copiado!' : 'Copiar'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
