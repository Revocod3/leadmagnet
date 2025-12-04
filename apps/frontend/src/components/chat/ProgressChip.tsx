import { motion } from 'framer-motion';
import type { FlowBlock } from '../../config/diagnostic-flow-config';

interface ProgressChipProps {
  currentBlock: FlowBlock;
  currentQuestionIndex: number;
  totalQuestionsInBlock: number;
}

export const ProgressChip = ({
  currentBlock,
  currentQuestionIndex,
  totalQuestionsInBlock
}: ProgressChipProps) => {
  const progress = ((currentQuestionIndex + 1) / totalQuestionsInBlock) * 100;
  const currentQuestion = currentQuestionIndex + 1;

  // Tamaño del círculo
  const size = 32;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="backdrop-blur-xl bg-white/90 dark:bg-neutral-800/90 rounded-full pl-1.5 pr-3 py-1.5 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50 flex items-center gap-2"
    >
      <span
        className="text-xs font-semibold whitespace-nowrap ml-2"
        style={{ color: currentBlock.color }}
      >
        {currentBlock.name}
      </span>
      {/* Circular Progress */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg
          className="absolute transform -rotate-90"
          width={size}
          height={size}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-neutral-200 dark:text-neutral-700"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={currentBlock.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </svg>
        {/* Number inside */}
        <span
          className="text-[10px] font-bold z-10"
          style={{ color: currentBlock.color }}
        >
          {currentQuestion}/{totalQuestionsInBlock}
        </span>
      </div>

      {/* Block name */}
    </motion.div>
  );
};
