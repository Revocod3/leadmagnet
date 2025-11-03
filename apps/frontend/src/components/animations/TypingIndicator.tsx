import { motion } from 'framer-motion';

export const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-4">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-sm ring-2 ring-brand-green-500/20 dark:ring-brand-green-400/30">
        <img src="/assets/images/favicon.webp" alt="OVP" className="w-full h-full object-cover" />
      </div>

      {/* Typing animation */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-brand-cream-100 dark:bg-brand-cream-200/20 rounded-2xl shadow-sm border border-brand-cream-200/50 dark:border-brand-cream-300/30">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 bg-brand-green-500 dark:bg-brand-green-400 rounded-full"
            animate={{
              y: [0, -8, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
};
