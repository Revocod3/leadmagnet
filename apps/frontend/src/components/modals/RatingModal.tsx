import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';

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
      alert('Hubo un error al enviar tu valoración. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setComment('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                {t('rating.title')}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('rating.subtitle')}
              </p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  disabled={isSubmitting}
                >
                  <svg
                    className={`w-12 h-12 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-neutral-200 dark:fill-neutral-700 text-neutral-200 dark:text-neutral-700'
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Rating text */}
            {rating > 0 && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4"
              >
                {t(`rating.ratings.${rating}`)}
              </motion.p>
            )}

            {/* Comment */}
            <div className="mb-6">
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                {t('rating.comment')}
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('rating.commentPlaceholder')}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl
                         bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white
                         placeholder-neutral-400 dark:placeholder-neutral-500
                         focus:outline-none focus:ring-2 focus:ring-brand-green-500 dark:focus:ring-brand-green-400
                         resize-none transition-colors"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 text-right">
                {comment.length}/500
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300
                         hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
              >
                {t('rating.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="flex-1 bg-brand-green-600 hover:bg-brand-green-700 text-white
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? t('rating.submitting') : t('rating.submit')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
