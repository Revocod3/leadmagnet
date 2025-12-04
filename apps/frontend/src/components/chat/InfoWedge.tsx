import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

interface InfoWedgeProps {
  content: string;
  blockColor: string;
  blockColorLight: string;
  blockEmoji?: string;
}

export const InfoWedge = ({
  content,
  blockColor,
  blockColorLight,
  blockEmoji
}: InfoWedgeProps) => {
  // Dividir el contenido en párrafos
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }}
      className="my-6 mx-2 md:mx-4"
    >
      <div
        className="relative overflow-hidden rounded-2xl p-5 md:p-6"
        style={{
          background: `linear-gradient(135deg, ${blockColorLight}40 0%, ${blockColorLight}20 100%)`,
          borderLeft: `4px solid ${blockColor}`,
        }}
      >
        {/* Decoración de fondo sutil */}
        <div
          className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-2xl"
          style={{ backgroundColor: blockColor }}
        />

        {/* Header con icono */}
        <div className="flex items-start gap-3 mb-4">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${blockColor}20` }}
          >
            <Lightbulb
              className="w-4 h-4"
              style={{ color: blockColor }}
            />
          </motion.div>

          {blockEmoji && (
            <span className="absolute top-4 right-4 text-2xl opacity-30">
              {blockEmoji}
            </span>
          )}
        </div>

        {/* Contenido */}
        <div className="space-y-3">
          {paragraphs.map((paragraph, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className={`
                text-sm md:text-base leading-relaxed
                ${index === 0
                  ? 'font-semibold text-neutral-800 dark:text-neutral-100'
                  : 'text-neutral-600 dark:text-neutral-300'
                }
              `}
            >
              {paragraph}
            </motion.p>
          ))}
        </div>

        {/* Firma sutil */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 pt-3 border-t border-neutral-200/50 dark:border-neutral-700/50"
        >
          <p
            className="text-xs font-medium opacity-60"
            style={{ color: blockColor }}
          >
            — Método Objetivo Vientre Plano
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};
