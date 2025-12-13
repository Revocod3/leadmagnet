import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

export const RatingModal = ({ isOpen, onClose, onSubmit }: RatingModalProps) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment);
      onClose();
      // Reset
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error al enviar valoración:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800"
          >
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                  {t('rating.title', '¿Cómo fue tu experiencia?')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('rating.subtitle', 'Tu opinión nos ayuda a mejorar Clara.')}
                </p>
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-3 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="group relative focus:outline-none"
                    disabled={isSubmitting}
                  >
                    <Star
                      className={`w-8 h-8 transition-all duration-200 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-amber-400 text-amber-400 scale-110'
                          : 'fill-transparent text-neutral-300 dark:text-neutral-700 group-hover:text-neutral-400'
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>

              {/* Comment (Optional) */}
              <AnimatePresence>
                {rating > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('rating.commentPlaceholder', 'Cuéntanos más (opcional)...')}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 mb-6 text-sm bg-neutral-50 dark:bg-neutral-800 
                               border border-neutral-200 dark:border-neutral-700 rounded-xl
                               text-neutral-900 dark:text-white placeholder-neutral-400
                               focus:outline-none focus:ring-2 focus:ring-brand-green-500/20 focus:border-brand-green-500
                               resize-none transition-all"
                      rows={3}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 
                           bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800 
                           rounded-xl transition-colors"
                >
                  {t('rating.cancel', 'Ahora no')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={rating === 0 || isSubmitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white 
                           bg-brand-green-600 hover:bg-brand-green-700 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           rounded-xl shadow-sm shadow-brand-green-600/20 
                           transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </span>
                  ) : (
                    t('rating.submit', 'Enviar')
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
