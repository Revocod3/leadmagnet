import { useRef, useEffect } from 'react';
import { Plus, Mic, ArrowUp, Camera, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatFooterProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  isProcessing: boolean;
  onSendMessage: (e?: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isListening: boolean;
  onVoiceInput: () => void;
  isSpeechSupported: boolean;
  isPlusMenuOpen: boolean;
  setIsPlusMenuOpen: (open: boolean) => void;
  onCameraClick: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  isUploadingImage: boolean;
  onImageClick: (imageUrl: string) => void;
  showImageLimitMessage: boolean;
}

export const ChatFooter = ({
  inputMessage,
  setInputMessage,
  isProcessing,
  onSendMessage,
  onKeyDown,
  isListening,
  onVoiceInput,
  isSpeechSupported,
  isPlusMenuOpen,
  setIsPlusMenuOpen,
  onCameraClick,
  onFileSelect,
  selectedImage,
  setSelectedImage,
  isUploadingImage,
  onImageClick,
  showImageLimitMessage,
}: ChatFooterProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  // Close plus menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };

    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside as EventListener);
      document.addEventListener('touchstart', handleClickOutside as EventListener);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside as EventListener);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [isPlusMenuOpen, setIsPlusMenuOpen]);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
      {/* Gradiente sutil de abajo hacia arriba */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-50/95 via-neutral-50/60 to-transparent dark:from-neutral-900/95 dark:via-neutral-900/60 dark:to-transparent pointer-events-none" />

      <div className="max-w-3xl mx-auto px-2 sm:px-4 py-4 pb-6 pointer-events-auto relative z-10">
        {/* Mensaje de límite de imágenes alcanzado */}
        <AnimatePresence>
          {showImageLimitMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-purple-300 dark:border-purple-700 shadow-lg"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🔒</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-1">
                    Límite de imágenes alcanzado
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                    Ya has subido 1 imagen en esta sesión gratuita.
                  </p>
                  <a
                    href="/pricing"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                  >
                    <span>Desbloquea imágenes ilimitadas</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Image Preview - Clean minimal design */}
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 p-2 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-14 h-14 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => onImageClick(selectedImage)}
                />
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {isUploadingImage ? 'Enviando...' : 'Imagen lista'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {isUploadingImage ? 'Analizando imagen' : 'Toca enviar o añade un mensaje'}
                </p>
              </div>
              {!isUploadingImage && (
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-neutral-500 dark:text-neutral-400"
                  aria-label="Eliminar imagen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* File input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
        />

        {/* Container para botón + y input */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Plus Button - Separado e independiente, misma altura que input */}
          <div ref={plusMenuRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              className="h-[44px] w-[44px] flex items-center justify-center text-neutral-700 dark:text-neutral-300 rounded-full bg-white dark:bg-neutral-800 dark:border dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all shadow-md"
              title="Más opciones"
            >
              <Plus className="w-5 h-5" />
            </button>
            {isPlusMenuOpen && (
              <div className="absolute bottom-full left-0 mb-3 z-20">
                <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-xl p-1.5">
                  <button
                    type="button"
                    className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                    title="Subir imagen"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setIsPlusMenuOpen(false);
                    }}
                  >
                    <Image className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                    title="Tomar foto"
                    onClick={() => {
                      onCameraClick();
                      setIsPlusMenuOpen(false);
                    }}
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Input Container - Separado del botón + */}
          <form onSubmit={onSendMessage} className="flex-1 relative rounded-[26px] shadow-md px-3 sm:px-4 py-2 transition-all focus-within:shadow-lg bg-gradient-to-b from-white to-white/95 dark:from-neutral-800 dark:to-neutral-800/90 dark:border dark:border-neutral-700 min-h-[44px]">
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Escribe tu mensaje..."
                rows={1}
                className="flex-1 pl-1 sm:pl-2 resize-none bg-transparent text-neutral-900 dark:text-white border-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-0 focus:border-transparent focus-visible:outline-none text-[16px] max-h-[120px] py-1"
                style={{ minHeight: '24px' }}
              />

              {/* Right Side Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Voice Button */}
                {isSpeechSupported && (
                  <button
                    type="button"
                    onClick={onVoiceInput}
                    className={`p-2 rounded-full transition-colors ${isListening
                      ? 'text-brand-green-600 bg-brand-green-50 dark:bg-brand-green-500/10'
                      : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    title={isListening ? 'Detener grabación' : 'Escribir por voz'}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}

                {/* Send Button - Active when text OR image */}
                <button
                  type="submit"
                  disabled={(!inputMessage.trim() && !selectedImage) || isProcessing}
                  className={`p-2 rounded-full transition-all ${(inputMessage.trim() || selectedImage) && !isProcessing
                    ? 'text-white bg-neutral-900 dark:bg-white dark:text-black hover:bg-neutral-700 dark:hover:bg-neutral-200'
                    : 'text-neutral-400 bg-transparent cursor-not-allowed'
                    }`}
                  title="Enviar mensaje"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </footer>
  );
};
