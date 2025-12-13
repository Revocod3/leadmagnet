import { motion } from 'framer-motion';
import type { FlowOption } from '../../config/diagnostic-flow-config';

interface QuickReplyChipsProps {
  options: FlowOption[];
  onSelect: (option: FlowOption) => void;
  disabled?: boolean;
  blockColor?: string;
}

export const QuickReplyChips = ({
  options,
  onSelect,
  disabled = false,
  blockColor = '#3B82F6'
}: QuickReplyChipsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-2 mt-3 ml-8 md:ml-9"
    >
      {options.map((option, index) => (
        <motion.div
          key={option.value}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <button
            onClick={() => !disabled && onSelect(option)}
            disabled={disabled}
            className={`
              group relative text-left px-4 py-3 rounded-2xl w-full
              bg-white dark:bg-neutral-800
              border-2 transition-all duration-200
              ${disabled
                ? 'opacity-50 cursor-not-allowed border-neutral-200 dark:border-neutral-700'
                : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] border-neutral-200 dark:border-neutral-700 hover:shadow-md'
              }
            `}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = blockColor;
                e.currentTarget.style.backgroundColor = `${blockColor}08`;
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.backgroundColor = '';
              }
            }}
          >
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {option.label}
            </span>

            {/* Indicador de hover sutil */}
            {!disabled && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: blockColor }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            )}
          </button>
        </motion.div>
      ))}

      {/* Hint de texto libre */}
      {!disabled && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: options.length * 0.05 + 0.2 }}
          className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 ml-1"
        >
          <span className="px-1 py-0.5 bg-brand-green-500/20 dark:bg-brand-green-500/35 box-decoration-clone">
            O escribe tu respuesta con tus propias palabras
          </span>
        </motion.p>
      )}
    </motion.div>
  );
};
