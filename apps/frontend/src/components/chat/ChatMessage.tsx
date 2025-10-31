import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { MessageActions } from './MessageActions';
import { TypewriterText } from './TypewriterText';
import type { FlowMessage, DiagnosticState } from '../../hooks/useDiagnosticFlow';

interface ChatMessageProps {
  message: FlowMessage;
  state: DiagnosticState;
  isLatest: boolean;
  onDownloadPDF?: () => void;
  isGeneratingPDF?: boolean;
}

export const ChatMessage = ({
  message,
  state,
  onDownloadPDF,
  isGeneratingPDF = false
}: ChatMessageProps) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden shadow-sm ring-2 ring-brand-green-500/20 dark:ring-brand-green-400/30">
          <img src="/assets/images/favicon.webp" alt="OVP" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Message Content Wrapper */}
      <div className={`flex flex-col ${isUser ? 'items-end max-w-[85%] sm:max-w-[75%]' : 'max-w-[85%] sm:max-w-[75%]'}`}>
        {/* Message Bubble */}
        <div
          className={`${isUser
            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-2xl px-5 py-3'
            : 'bg-transparent text-foreground'
            }`}
        >
          {/* Render diagnosis content with enhanced presentation */}
          {message.type === 'diagnosis_ready' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Contenido del diagnóstico - Ya viene formateado en HTML desde el backend */}
              <div
                className="diagnosis-content space-y-4"
                dangerouslySetInnerHTML={{ __html: message.content }}
              />
            </motion.div>
          ) : (
            /* Render normal messages with Markdown and typewriter effect */
            <div className="text-[15px] leading-relaxed">
              {!isUser ? (
                /* Siempre usar TypewriterText para mensajes del asistente */
                <TypewriterText
                  text={message.content}
                  speed={20}
                  className=""
                />
              ) : (
                /* Solo mensajes de usuario en texto plano */
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              )}
            </div>
          )}

          {/* Show 2 buttons when diagnosis is ready */}
          {message.type === 'diagnosis_ready' && state.diagnosisContent && onDownloadPDF && (
            <div className="mt-8 flex flex-col gap-4">
              {/* Primary CTA - Subscription Button */}
              <a
                href="https://objetivovientreplano.com/suscripcion/"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full py-5 px-6 rounded-2xl bg-gradient-to-r from-brand-green-500 via-brand-green-600 to-brand-green-700 hover:from-brand-green-600 hover:via-brand-green-700 hover:to-brand-green-800 text-white font-bold text-lg flex flex-col items-center justify-center gap-3 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-[1.02] relative overflow-hidden"
              >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <span>Transforma tu salud digestiva</span>
                  <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </a>

              {/* Secondary CTA - Download PDF Button */}
              <button
                onClick={onDownloadPDF}
                disabled={isGeneratingPDF}
                className="w-full py-4 px-6 rounded-xl bg-white dark:bg-neutral-800 border-2 border-brand-green-500 hover:bg-brand-green-50 dark:hover:bg-neutral-700 text-brand-green-700 dark:text-brand-green-400 font-semibold text-base flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {isGeneratingPDF ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Generando tu diagnóstico en PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Descargar mi diagnóstico en PDF
                    <span className="text-xs bg-brand-green-100 dark:bg-brand-green-900 px-2 py-0.5 rounded-full">Gratis</span>
                  </>
                )}
              </button>
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
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
          {state.userName?.charAt(0).toUpperCase() || 'U'}
        </div>
      )}
    </motion.div>
  );
};
