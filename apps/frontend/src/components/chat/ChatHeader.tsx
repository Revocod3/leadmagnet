import { Moon, Sun } from 'lucide-react';

interface ChatHeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const ChatHeader = ({ isDarkMode, onToggleDarkMode }: ChatHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
      {/* Gradiente sutil de arriba hacia abajo */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/95 via-neutral-50/60 to-transparent dark:from-neutral-900/95 dark:via-neutral-900/60 dark:to-transparent pointer-events-none" />

      <div className="container-narrow py-3 flex items-center justify-between pointer-events-auto relative z-10">
        {/* Left: ChatOVP + "En Línea" Bubble */}
        <div className="backdrop-blur-xl bg-white/90 dark:bg-neutral-800/90 rounded-full px-4 py-2 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50">
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
              ChatOVP
            </span>
            <span className="text-[10px] font-medium text-brand-green-500 flex items-center gap-1.5 online-pulse">
              <span className="w-2 h-2 bg-brand-green-500 rounded-full online-pulse"></span>
              En Línea
            </span>
          </div>
        </div>

        {/* Right: Theme Toggle Bubble */}
        <button
          onClick={onToggleDarkMode}
          className="backdrop-blur-xl bg-white/90 dark:bg-neutral-800/90 rounded-full p-2.5 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
          aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          ) : (
            <Moon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          )}
        </button>
      </div>
    </header>
  );
};
