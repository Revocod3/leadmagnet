import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { useSession } from '../../hooks/useSession';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { Moon, Sun, Send, Mic, Camera, Paperclip } from 'lucide-react';
import { CameraModal } from '../modals/CameraModal';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { ShareModal } from '../modals/ShareModal';
import { MessageActions } from './MessageActions';

export const ChatContainer = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState('');
  const [shareModalText, setShareModalText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { messages, sendMessage, isSending } = useChat();
  const { session, createSession, isCreatingSession } = useSession();
  const { isListening, transcript, startListening, stopListening, isSupported: isSpeechSupported } = useSpeechToText();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create session if it doesn't exist
  useEffect(() => {
    if (!session && !isCreatingSession) {
      createSession({});
    }
  }, [session, isCreatingSession, createSession]);

  // Auto-scroll to bottom when new messages arrive
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const messageToSend = inputMessage;
    setInputMessage('');
    sendMessage(messageToSend);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle speech-to-text transcript
  useEffect(() => {
    if (transcript) {
      setInputMessage((prev) => prev + (prev ? ' ' : '') + transcript);
    }
  }, [transcript]);

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setSelectedImage(imageDataUrl);
    // You can send the image to the backend here
    // For now, we'll just store it
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

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header
        className="px-5 py-2.5 border-b transition-colors duration-300"
        style={{
          backgroundColor: 'var(--color-header-bg)',
          borderColor: 'var(--color-border)'
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a
            href="https://www.objetivovientreplano.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-transform duration-200 hover:scale-105"
          >
            <div className="h-10 flex items-center">
              <span className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Objetivo Vientre Plano
              </span>
            </div>
          </a>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full transition-colors duration-300 hover:bg-black/5 dark:hover:bg-white/10"
            title="Cambiar tema"
          >
            {isDarkMode ? (
              <Moon className="w-6 h-6" style={{ color: 'var(--color-text)' }} />
            ) : (
              <Sun className="w-6 h-6" style={{ color: 'var(--color-text)' }} />
            )}
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main
        className="flex-1 px-md-fluid py-md-fluid overflow-y-auto smooth-scroll"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-md-fluid">
          {messages.length === 0 && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[80%] message-bubble-ai">
                <p className="m-0">
                  ¡Hola! 👋 Soy tu asistente para el diagnóstico de vientre plano. ¿En qué puedo ayudarte hoy?
                </p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex animate-fade-in ${message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              <div className={`max-w-[80%] flex flex-col`}>
                <div
                  className={`${message.role === 'user'
                      ? 'message-bubble-user'
                      : 'message-bubble-ai'
                    }`}
                >
                  <p className="m-0">{message.content}</p>
                </div>

                {/* Message Actions */}
                <MessageActions
                  messageText={message.content}
                  onShare={() => handleShareMessage(message.content)}
                  isUserMessage={message.role === 'user'}
                />
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[80%] message-bubble-ai">
                <div className="flex gap-1">
                  <span className="animate-bounce">•</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>•</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer
        className="px-md-fluid py-sm-fluid border-t transition-colors duration-300"
        style={{
          backgroundColor: 'var(--color-input-bg)',
          borderColor: 'var(--color-border)'
        }}
      >
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            {/* Attachment Buttons */}
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                title="Adjuntar imagen"
              >
                <Paperclip className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
              </button>

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="p-2 rounded-full transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                title="Tomar foto"
              >
                <Camera className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              rows={1}
              className="flex-1 px-4 py-3 border rounded-3xl resize-none overflow-y-auto transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-green text-base-fluid"
              style={{
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-input-border)',
                maxHeight: 'clamp(100px, 30vh, 200px)',
                fontSize: '16px' // Evita zoom en iOS
              }}
            />

            {/* Voice Button */}
            {isSpeechSupported && (
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isListening
                    ? 'bg-brand-green text-black animate-pulse'
                    : 'hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title={isListening ? 'Detener grabación' : 'Escribir por voz'}
              >
                <Mic className="w-5 h-5" style={{ color: isListening ? '#000' : 'var(--color-text)' }} />
              </button>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="p-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: inputMessage.trim() ? '#95C11F' : '#e0e0e0',
                color: inputMessage.trim() ? '#000' : '#999'
              }}
              title="Enviar mensaje"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          {/* Selected Image Preview */}
          {selectedImage && (
            <div className="mt-3 flex items-center gap-2">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleImageClick(selectedImage)}
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </footer>

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
    </div>
  );
};
