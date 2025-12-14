import { motion, AnimatePresence } from 'framer-motion';
import { PRO_MAINTENANCE_MESSAGE } from '../../config/pro-maintenance';
import { Sparkles, Server, Mail, Clock, ShieldCheck } from 'lucide-react';

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
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Aviso de Mantenimiento"
        >
          {/* Decorative Background Elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-green-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          {/* Scrollable Container */}
          <div className="overflow-y-auto custom-scrollbar">
            {/* Header Section */}
            <div className="relative bg-gradient-to-b from-brand-green-50/50 to-transparent px-5 pt-6 pb-4 dark:from-brand-green-900/20">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl shadow-brand-green-900/5 ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
                <div className="relative">
                  <div className="absolute -inset-1 animate-pulse rounded-full bg-brand-green-500/20 blur-sm" />
                  <Server className="relative h-8 w-8 text-brand-green-600 dark:text-brand-green-400" />
                  <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 ring-2 ring-white dark:ring-neutral-800">
                    <Sparkles className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-brand-green-200 bg-brand-green-50 px-2.5 py-0.5 text-[10px] font-medium text-brand-green-700 dark:border-brand-green-800 dark:bg-brand-green-900/30 dark:text-brand-green-300 uppercase tracking-wide">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green-400 opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-green-500"></span>
                  </span>
                  Mejorando tu experiencia
                </div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Actualización en Curso
                </h2>
              </div>
            </div>

            {/* Content Section */}
            <div className="relative px-5 pb-6">
              <div className="space-y-3 text-center text-sm text-neutral-600 dark:text-neutral-300">
                {paragraphs.map((paragraph, index) => {
                  if (paragraph.includes(supportEmail)) {
                    return (
                      <div key={index} className="mt-4 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                        <div className="flex flex-col items-center gap-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white font-medium">
                            <Mail className="h-3.5 w-3.5" />
                            <span>Soporte Prioritario</span>
                          </div>
                          <p className="text-neutral-500 dark:text-neutral-400">
                            Si tienes una consulta urgente:
                          </p>
                          <a
                            href={`mailto:${supportEmail}`}
                            className="font-semibold text-brand-green-600 hover:text-brand-green-700 hover:underline dark:text-brand-green-400 text-sm"
                          >
                            {supportEmail}
                          </a>
                        </div>
                      </div>
                    );
                  }
                  return <p key={index} className="leading-relaxed">{paragraph}</p>;
                })}
              </div>

              {/* Footer Status */}
              <div className="mt-6 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-green-500" />
                    <span>Datos seguros y protegidos</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                    <Clock className="h-3 w-3" />
                    <span>Finalización estimada: Hoy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
