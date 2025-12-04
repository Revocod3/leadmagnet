import { motion } from 'framer-motion';
import type { FlowBlock } from '../../config/diagnostic-flow-config';

interface BlockProgressBarProps {
  currentBlock: FlowBlock;
  currentQuestionIndex: number;
  totalQuestionsInBlock: number;
}

export const BlockProgressBar = ({
  currentBlock,
  currentQuestionIndex,
  totalQuestionsInBlock
}: BlockProgressBarProps) => {
  const progress = ((currentQuestionIndex + 1) / totalQuestionsInBlock) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-800/50 px-4 py-2.5"
    >
      <div className="max-w-2xl mx-auto">
        {/* Info line */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-base">{currentBlock.emoji}</span>
            <span
              className="text-xs font-semibold"
              style={{ color: currentBlock.color }}
            >
              {currentBlock.name}
            </span>
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {currentQuestionIndex + 1}/{totalQuestionsInBlock}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ backgroundColor: currentBlock.color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
};
