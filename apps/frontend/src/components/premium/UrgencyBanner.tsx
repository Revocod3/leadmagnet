import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const UrgencyBanner = () => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const DURATION = 24 * 60 * 60 * 1000; // 24 hours
    const STORAGE_KEY = 'urgency_start_time';

    let startTime = localStorage.getItem(STORAGE_KEY);

    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem(STORAGE_KEY, startTime);
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - parseInt(startTime!, 10);
      const remaining = DURATION - elapsed;

      if (remaining <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((remaining / (1000 * 60)) % 60);
      const seconds = Math.floor((remaining / 1000) % 60);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;
  // Return empty placeholder of same height to prevent layout shift on hydration if needed, 
  // but since it's fixed, we return null until loaded to avoid flash of "00:00:00" or empty bar.
  if (!timeLeft) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-[#EF4444] text-white z-50 h-[28px] flex items-center justify-center shadow-sm px-8">
      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
        <span>Esta oferta es limitada y expira en:</span>
        <span className="font-mono font-bold tabular-nums bg-black/10 px-1 rounded-[3px] leading-none py-0.5">{timeLeft}</span>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Cerrar aviso"
      >
        <X className="w-3 h-3" strokeWidth={3} />
      </button>
    </div>
  );
};
