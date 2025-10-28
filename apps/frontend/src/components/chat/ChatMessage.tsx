import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
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

// Helper function to enhance diagnosis HTML with better CTAs
const enhanceDiagnosisHTML = (html: string): string => {
  // Replace links with styled buttons
  const enhancedHTML = html.replace(
    /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi,
    (_match, href, text) => {
      // Check if it's the main CTA
      if (text.includes('Comenzar') || text.includes('transformación') || text.includes('AHORA')) {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-green-500 to-brand-green-600 hover:from-brand-green-600 hover:to-brand-green-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 no-underline my-3 text-center">${text} <span>→</span></a>`;
      }
      // Secondary links
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-4 py-2 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 no-underline">${text} <span class="text-xs">→</span></a>`;
    }
  );

  return enhancedHTML;
};

export const ChatMessage = ({
  message,
  state,
  isLatest,
  onDownloadPDF,
  isGeneratingPDF = false
}: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const shouldAnimate = isLatest && !isUser;

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
              {/* Header del diagnóstico */}
              <div className="bg-gradient-to-r from-brand-green-500 to-brand-green-600 text-white rounded-xl p-4">
                <h3 className="text-lg font-bold mb-2">
                  🎯 Tu Diagnóstico Personalizado
                </h3>
                <p className="text-sm opacity-90">
                  Basado en el análisis de tus {state.currentQuestionIndex} respuestas
                </p>
              </div>

              {/* Contenido del diagnóstico */}
              <div
                className="prose prose-sm dark:prose-invert max-w-none space-y-4"
                dangerouslySetInnerHTML={{ __html: enhanceDiagnosisHTML(message.content) }}
              />

              {/* Urgency Box */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                      Oferta por tiempo limitado
                    </p>
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                      Tu descuento del 30% expira en 48 horas. No volverá a estar disponible.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Stats sociales */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
                  <p className="text-2xl font-bold text-brand-green-600">+500</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Este mes</p>
                </div>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
                  <p className="text-2xl font-bold text-brand-green-600">87%</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Satisfacción</p>
                </div>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
                  <p className="text-2xl font-bold text-brand-green-600">24/7</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Soporte</p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Render normal messages with Markdown and typewriter effect */
            <div className="text-[15px] leading-relaxed">
              {shouldAnimate ? (
                <TypewriterText
                  text={message.content}
                  speed={20}
                  className="whitespace-pre-wrap break-words"
                />
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-3 last:mb-0 whitespace-pre-wrap break-words">
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic">{children}</em>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-3 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-3 space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="ml-2">{children}</li>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 no-underline"
                      >
                        {children}
                        <span className="text-xs">→</span>
                      </a>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}

          {/* Show 2 buttons when diagnosis is ready */}
          {message.type === 'diagnosis_ready' && state.diagnosisContent && onDownloadPDF && (
            <div className="mt-6 flex flex-col gap-3">
              {/* Download PDF Button */}
              <button
                onClick={onDownloadPDF}
                disabled={isGeneratingPDF}
                className="w-full py-3 px-5 rounded-lg bg-brand-green-600 hover:bg-brand-green-700 text-white font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPDF ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Descargar mi diagnóstico
                  </>
                )}
              </button>

              {/* Subscription Button */}
              <a
                href="https://objetivovientreplano.com/suscripcion/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span>✨</span>
                Descubrir el Método Completo
                <span>→</span>
              </a>
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
