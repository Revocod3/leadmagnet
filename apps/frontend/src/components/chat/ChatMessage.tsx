import { motion } from 'framer-motion';
import { Download, Star } from 'lucide-react';
import { MessageActions } from './MessageActions';
import { TypewriterText } from './TypewriterText';
import type { FlowMessage, DiagnosticState } from '../../hooks/useDiagnosticFlow';

interface ChatMessageProps {
  message: FlowMessage;
  state: DiagnosticState;
  isLatest: boolean;
  onDownloadPDF?: () => void;
  isGeneratingPDF?: boolean;
  onRateExperience?: () => void;
}

export const ChatMessage = ({
  message,
  state,
  isLatest,
  onDownloadPDF,
  isGeneratingPDF = false,
  onRateExperience
}: ChatMessageProps) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start relative'}`}
    >
      {/* Avatar for assistant - subtle and minimal */}
      {!isUser && (
        <div className="absolute left-0 top-0 z-10 w-6 h-6 md:w-7 md:h-7 rounded-full overflow-hidden shadow-sm border border-neutral-200/50 dark:border-neutral-700/50 bg-white dark:bg-neutral-800">
          <img src="/assets/images/favicon.webp" alt="OVP" className="w-full h-full object-cover opacity-90" />
        </div>
      )}

      {/* Message Content Wrapper */}
      <div className={`flex flex-col ${isUser ? 'items-end max-w-[88%] sm:max-w-[80%] md:max-w-[75%]' : 'max-w-[92%] sm:max-w-[85%] md:max-w-[80%] ml-2.5 md:ml-3'}`}>
        {/* Message Bubble */}
        <div
          className={`${isUser
            ? 'text-white rounded-2xl px-4 py-2.5 md:px-5 md:py-3 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] border border-white/20'
            : 'backdrop-blur-xl bg-white/90 dark:bg-white/10 text-neutral-900 dark:text-neutral-100 rounded-2xl px-4 py-3 md:px-5 md:py-4 shadow-lg border border-white/30 dark:border-white/20'
            }`}
          style={isUser ? {
            backgroundColor: '#9DAC67',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)'
          } : undefined}
        >
          {/* Render diagnosis content with enhanced presentation */}
          {message.type === 'diagnosis_ready' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3 font-semibold leading-tight"
            >
              {/* Contenido del diagnóstico - Ya viene formateado en HTML desde el backend */}
              <div
                className="diagnosis-content space-y-3 font-semibold leading-tight"
                dangerouslySetInnerHTML={{ __html: message.content }}
              />
            </motion.div>
          ) : (
            /* Render normal messages with Markdown and typewriter effect */
            <div className="text-[16px] leading-tight font-semibold">
              {!isUser ? (
                /* Siempre usar TypewriterText para mensajes del asistente */
                <TypewriterText
                  text={message.content}
                  speed={20}
                  className="font-semibold"
                  shouldAnimate={isLatest}
                />
              ) : (
                /* Solo mensajes de usuario en texto plano */
                <div className="whitespace-pre-wrap break-words font-semibold">
                  {message.content}
                </div>
              )}
            </div>
          )}

          {/* Show 2 buttons when diagnosis is ready */}
          {message.type === 'diagnosis_ready' && state.diagnosisContent && onDownloadPDF && (
            <div className="mt-8 flex flex-col gap-3">
              {/* Primary CTA - Subscription Button */}
              <a
                href="https://objetivovientreplano.com/suscripcion/"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full py-4 sm:py-5 px-4 sm:px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-800 text-white font-bold text-sm sm:text-base md:text-lg flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 transform hover:-translate-y-1 hover:scale-[1.02] relative overflow-hidden"
              >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                  <span className="hidden sm:inline">✨</span>
                  <span className="text-center leading-tight">
                    <span className="hidden sm:inline">Transforma tu salud digestiva</span>
                    <span className="sm:hidden">Comenzar ahora</span>
                  </span>
                  <span className="text-lg sm:text-xl group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </a>

              {/* Secondary CTA - Download PDF Button */}
              <button
                onClick={onDownloadPDF}
                disabled={isGeneratingPDF}
                className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl bg-white dark:bg-neutral-800 border-2 border-brand-green-500 dark:border-brand-green-400 hover:bg-brand-green-50 dark:hover:bg-neutral-700 text-brand-green-700 dark:text-brand-green-400 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:scale-95"
              >
                {isGeneratingPDF ? (
                  <div className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    <span className="hidden xs:inline">Generando PDF...</span>
                    <span className="xs:hidden">Generando...</span>
                  </div>
                ) : (
                  <>
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="hidden sm:inline">Descargar mi diagnóstico en PDF</span>
                    <span className="sm:hidden">Descargar PDF</span>
                    <span className="hidden xs:inline text-xs bg-brand-green-100 dark:bg-brand-green-900 px-2 py-0.5 rounded-full ml-1">Gratis</span>
                  </>
                )}
              </button>

              {/* Tertiary CTA - Rate Experience Button (only shown if callback provided) */}
              {onRateExperience && (
                <button
                  onClick={onRateExperience}
                  className="w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl bg-transparent border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
                >
                  <Star className="w-4 h-4 flex-shrink-0" />
                  <span>Valorar mi experiencia</span>
                </button>
              )}
            </div>
          )}

          {/* Show question details if available */}
          {message.question?.questionDetails && (
            <p className="mt-2 text-sm opacity-80 whitespace-pre-wrap">
              {message.question.questionDetails}
            </p>
          )}
        </div>

        {/* Message Actions */}
        {!isUser && (
          <MessageActions
            messageText={message.content}
            isUserMessage={false}
          />
        )}
      </div>

      {/* Avatar for user */}
      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs md:text-sm font-semibold shadow-sm">
          {state.userName?.charAt(0).toUpperCase() || 'U'}
        </div>
      )}
    </motion.div>
  );
};
