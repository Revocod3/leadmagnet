import { motion, AnimatePresence } from 'framer-motion';
import { PRO_MAINTENANCE_MESSAGE } from '../../config/pro-maintenance';

interface ProMaintenanceModalProps {
  isOpen: boolean;
}

const paragraphs = PRO_MAINTENANCE_MESSAGE.trim().split('\n\n');
const supportEmail = 'info@objetivovientreplano.com';

export const ProMaintenanceModal = ({ isOpen }: ProMaintenanceModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop (no close) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white/95 dark:bg-neutral-850 rounded-2xl shadow-xl max-w-xl w-full p-6 md:p-7 backdrop-blur border border-white/50 dark:border-white/10"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Aviso"
        >
          <div className="absolute inset-x-0 -top-6 mx-auto h-16 w-16 rounded-2xl bg-white/70 dark:bg-neutral-800/70 border border-white/60 dark:border-white/10 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.45)] flex items-center justify-center backdrop-blur pointer-events-none" aria-hidden="true">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-green-500 to-brand-green-600 text-white flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3.5 3.5M12 3a9 9 0 100 18 9 9 0 000-18z" />
              </svg>
            </div>
          </div>

          <div className="mb-5 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-green-50 text-brand-green-800 dark:bg-brand-green-900/40 dark:text-brand-green-100 px-3 py-1 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-brand-green-500" />
              Chat Pro en mantenimiento
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-white">Ajustando capacidad para ti</h2>
          </div>

          <div className="space-y-3 text-neutral-700 dark:text-neutral-200 text-base leading-relaxed">
            {paragraphs.map((paragraph, index) => {
              if (paragraph.includes(supportEmail)) {
                return (
                  <p key={index}>
                    Si tienes cualquier consulta urgente, puedes escribirnos a:{' '}
                    <a
                      href={`mailto:${supportEmail}`}
                      className="font-semibold text-brand-green-600 hover:text-brand-green-700 underline"
                    >
                      {supportEmail}
                    </a>
                  </p>
                );
              }

              return <p key={index}>{paragraph}</p>;
            })}
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            En progreso hoy - acceso temporalmente pausado.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
