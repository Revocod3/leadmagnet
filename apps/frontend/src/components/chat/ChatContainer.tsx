import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiagnosticFlow } from '../../hooks/useDiagnosticFlow';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';
import { useSessionStore } from '../../stores/sessionStore';
import { Moon, Sun, Mic, Download, ArrowLeft, MoreVertical, Plus, ArrowUp, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraModal } from '../modals/CameraModal';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { ShareModal } from '../modals/ShareModal';
import { MessageActions } from './MessageActions';

export const ChatContainer = () => {
  const navigate = useNavigate();
  const { clearSession } = useSessionStore();
  const [inputMessage, setInputMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState('');
  const [shareModalText, setShareModalText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const {
    messages,
    state,
    isProcessing,
    initialize,
    processMessage,
  } = useDiagnosticFlow();

  const { generatePDF } = usePDFGenerator();
  const { isListening, transcript, startListening, stopListening, isSupported: isSpeechSupported } = useSpeechToText();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize
  useEffect(() => {
    if (messages.length === 0) {
      initialize();
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  // Handle speech-to-text transcript
  useEffect(() => {
    if (transcript) {
      setInputMessage((prev) => prev + (prev ? ' ' : '') + transcript);
    }
  }, [transcript]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    const messageToSend = inputMessage;
    setInputMessage('');

    // If we have a selected image and we're on question 17, send it with the message
    if (selectedImage && state.currentQuestionIndex === 16) {
      const base64Data = selectedImage.split(',')[1];
      if (base64Data) {
        const imageData = {
          base64: base64Data,
          mimeType: 'image/jpeg',
        };
        await processMessage(messageToSend, imageData);
        setSelectedImage(null);
      } else {
        await processMessage(messageToSend);
      }
    } else {
      await processMessage(messageToSend);
    }
  };

  const handleDownloadPDF = () => {
    if (!state.diagnosisContent) return;

    setIsGeneratingPDF(true);
    try {
      const success = generatePDF({
        userName: state.userName || 'Usuario',
        diagnosisContent: state.diagnosisContent,
        language: state.language,
      });

      if (success) {
        console.log('PDF generado exitosamente');
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, intenta nuevamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setSelectedImage(imageDataUrl);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        setSelectedImage(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setImageViewerUrl(imageUrl);
  };

  const handleShareMessage = (text: string) => {
    setShareModalText(text);
  };

  const handleBackToStart = () => {
    sessionStorage.removeItem('userData');
    clearSession();
    navigate('/', { replace: true });
    window.location.href = '/';
  };

  return (
    <>
      <div className={`flex flex-col h-screen ${isDarkMode ? 'dark' : ''} bg-gradient-to-br from-background via-background to-blue-50 dark:to-neutral-900 transition-colors duration-200`}>
        {/* Header */}
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="container-narrow py-3 flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              onClick={handleBackToStart}
              className="p-2 rounded-lg hover:bg-surface transition-colors"
              title="Volver al inicio"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>

            {/* Center: Title */}
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-green-500 animate-pulse-soft" />
              <span className="text-sm font-medium text-foreground">
                Asistente de Diagnóstico
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-surface transition-colors"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-foreground" />
                ) : (
                  <Moon className="w-5 h-5 text-foreground" />
                )}
              </button>
              <button className="p-2 rounded-lg hover:bg-surface transition-colors">
                <MoreVertical className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto smooth-scroll">
          <div className="container-narrow py-8">
            {/* Empty State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green-400 to-brand-green-600 flex items-center justify-center mb-6"
                >
                  <span className="text-3xl">✨</span>
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Comencemos tu diagnóstico
                </h2>
                <p className="text-secondary max-w-md">
                  Estoy aquí para ayudarte a entender mejor tu salud digestiva
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    {/* Avatar for assistant */}
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-green-500 flex items-center justify-center text-white text-sm font-semibold">
                        AI
                      </div>
                    )}

                    {/* Message Content Wrapper */}
                    <div className="flex flex-col max-w-[85%] sm:max-w-[75%]">
                      {/* Message Bubble */}
                      <div
                        className={`${message.role === 'user'
                          ? 'bg-brand-green-500 text-white'
                          : 'bg-surface border border-border'
                          } rounded-2xl px-5 py-3 shadow-sm`}
                      >
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </p>

                        {/* Show download button for diagnosis */}
                        {message.type === 'diagnosis' && state.diagnosisContent && (
                          <button
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPDF}
                            className="mt-4 w-full py-2.5 px-4 rounded-lg bg-brand-green-600 hover:bg-brand-green-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGeneratingPDF ? (
                              <>
                                <span className="animate-spin">⏳</span>
                                Generando PDF...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                Descargar diagnóstico
                              </>
                            )}
                          </button>
                        )}

                        {/* Show question details if available */}
                        {message.question?.questionDetails && (
                          <p className="mt-2 text-sm opacity-80 whitespace-pre-wrap">
                            {message.question.questionDetails}
                          </p>
                        )}
                      </div>

                      {/* Message Actions */}
                      <MessageActions
                        messageText={message.content}
                        onShare={() => handleShareMessage(message.content)}
                        isUserMessage={message.role === 'user'}
                      />
                    </div>

                    {/* Avatar for user */}
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-700 dark:bg-neutral-300 flex items-center justify-center text-white dark:text-neutral-900 text-sm font-semibold">
                        {state.userName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-green-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    AI
                  </div>
                  <div className="bg-surface border border-border rounded-2xl px-5 py-4 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse-soft" />
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse-soft [animation-delay:0.2s]" />
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse-soft [animation-delay:0.4s]" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>

        {/* Input Area - ChatGPT Style */}
        <footer className="sticky bottom-0 bg-background pb-safe">
          <div className="max-w-3xl mx-auto px-4 py-4">
            {/* Selected Image Preview */}
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex items-center gap-3 p-3 bg-surface rounded-xl border border-border"
              >
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={() => handleImageClick(selectedImage)}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Imagen seleccionada</p>
                  <p className="text-xs text-secondary">Se enviará con tu próximo mensaje</p>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-secondary"
                >
                  ✕
                </button>
              </motion.div>
            )}

            {/* Input Container */}
            <form onSubmit={handleSendMessage} className="relative bg-surface rounded-[26px] border border-border shadow-sm p-2 focus-within:border-neutral-400 dark:focus-within:border-neutral-500 transition-colors">
              {/* File input (hidden) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex items-end gap-2">
                {/* Plus Button with Menu */}
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      // Aquí puedes agregar un menú desplegable con opciones
                      // Por ahora abrimos la cámara y archivo
                      const menu = document.createElement('div');
                      menu.className = 'absolute bottom-full left-0 mb-2 bg-surface border border-border rounded-lg shadow-lg p-1 min-w-[200px]';
                      menu.innerHTML = `
                        <button class="w-full text-left px-3 py-2 rounded hover:bg-surface-hover text-foreground text-sm flex items-center gap-2" id="menu-file">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                          Subir imagen
                        </button>
                        <button class="w-full text-left px-3 py-2 rounded hover:bg-surface-hover text-foreground text-sm flex items-center gap-2" id="menu-camera">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                          </svg>
                          Tomar foto
                        </button>
                      `;
                      document.body.appendChild(menu);

                      document.getElementById('menu-file')?.addEventListener('click', () => {
                        fileInputRef.current?.click();
                        menu.remove();
                      });

                      document.getElementById('menu-camera')?.addEventListener('click', () => {
                        setIsCameraOpen(true);
                        menu.remove();
                      });

                      const closeMenu = (e: MouseEvent) => {
                        if (!menu.contains(e.target as Node)) {
                          menu.remove();
                          document.removeEventListener('click', closeMenu);
                        }
                      };

                      setTimeout(() => document.addEventListener('click', closeMenu), 100);
                    }}
                    className="p-2 text-secondary hover:text-foreground rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Más opciones"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pregunta lo que quieras"
                  rows={1}
                  className="flex-1 resize-none bg-transparent px-2 py-2 text-foreground placeholder:text-tertiary focus:outline-none text-[15px] max-h-[200px]"
                  style={{ minHeight: '24px' }}
                />

                {/* Right Side Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Image Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-secondary hover:text-foreground rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Subir imagen"
                  >
                    <Image className="w-5 h-5" />
                  </button>

                  {/* Voice Button */}
                  {isSpeechSupported && (
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`p-2 rounded-full transition-colors ${isListening
                        ? 'text-brand-green-500 bg-brand-green-50 dark:bg-brand-green-500/10'
                        : 'text-secondary hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      title={isListening ? 'Detener grabación' : 'Escribir por voz'}
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )}

                  {/* Send Button - Green Circle like ChatGPT */}
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isProcessing}
                    className={`p-2 rounded-full transition-all ${inputMessage.trim() && !isProcessing
                      ? 'text-white bg-brand-green-500 hover:bg-brand-green-600'
                      : 'text-secondary bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed'
                      }`}
                    title="Enviar mensaje"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>

            {/* Footer Note */}
            <p className="text-center text-xs text-tertiary mt-3">
              ChatGPT puede cometer errores. Comprueba la información importante.
            </p>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      <ImageViewerModal
        isOpen={!!imageViewerUrl}
        imageUrl={imageViewerUrl}
        onClose={() => setImageViewerUrl('')}
      />

      <ShareModal
        isOpen={!!shareModalText}
        text={shareModalText}
        onClose={() => setShareModalText('')}
      />
    </>
  );
};
