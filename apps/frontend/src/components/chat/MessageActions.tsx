import { Copy, ThumbsUp, ThumbsDown, RefreshCw, Check } from 'lucide-react';
import { useState } from 'react';

interface MessageActionsProps {
  messageText: string;
  isUserMessage?: boolean;
  onRegenerate?: () => void | Promise<void>;
}

export const MessageActions = ({ messageText, isUserMessage = false, onRegenerate }: MessageActionsProps) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying text:', err);
    }
  };

  const handleThumbsUp = () => {
    setLiked(liked === 'up' ? null : 'up');
  };

  const handleThumbsDown = () => {
    setLiked(liked === 'down' ? null : 'down');
  };

  return (
    <div
      className={`flex gap-2 mt-2.5 pt-2.5 px-2.5 ${isUserMessage ? 'justify-end pr-0 pl-2.5' : 'justify-start pl-2.5 pr-0'
        }`}
    >
      {/* Copy */}
      <button
        onClick={handleCopy}
        className={`p-1.5 transition-all duration-200 rounded-lg ${copied
            ? 'text-brand-green-500 bg-brand-green-50 dark:bg-brand-green-500/10'
            : 'text-foreground/60 hover:text-foreground hover:bg-surface/50'
          }`}
        title={copied ? '¡Copiado!' : 'Copiar'}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>

      {/* Thumbs Up */}
      <button
        onClick={handleThumbsUp}
        className={`p-1.5 transition-all duration-200 rounded-lg hover:bg-surface/50 ${liked === 'up'
          ? 'text-brand-green-500'
          : 'text-foreground/60 hover:text-foreground'
          }`}
        title="Me gusta"
      >
        <ThumbsUp className={`w-4 h-4 ${liked === 'up' ? 'fill-current' : ''}`} />
      </button>

      {/* Thumbs Down */}
      <button
        onClick={handleThumbsDown}
        className={`p-1.5 transition-all duration-200 rounded-lg hover:bg-surface/50 ${liked === 'down'
          ? 'text-red-500'
          : 'text-foreground/60 hover:text-foreground'
          }`}
        title="No me gusta"
      >
        <ThumbsDown className={`w-4 h-4 ${liked === 'down' ? 'fill-current' : ''}`} />
      </button>

      {/* Regenerate */}
      {!isUserMessage && onRegenerate && (
        <button
          onClick={async () => {
            const button = document.activeElement as HTMLButtonElement;
            button?.querySelector('svg')?.classList.add('animate-spin');
            await onRegenerate();
            button?.querySelector('svg')?.classList.remove('animate-spin');
          }}
          className="p-1.5 text-foreground/60 hover:text-foreground hover:bg-surface/50 transition-all duration-200 rounded-lg group"
          title="Regenerar respuesta"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
        </button>
      )}
    </div>
  );
};
