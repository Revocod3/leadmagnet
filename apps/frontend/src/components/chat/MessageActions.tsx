import { Copy, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { useState } from 'react';

interface MessageActionsProps {
  messageText: string;
  isUserMessage?: boolean;
}

export const MessageActions = ({ messageText, isUserMessage = false }: MessageActionsProps) => {
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
      className={`flex gap-0.5 mt-1.5 ${isUserMessage ? 'justify-end' : 'justify-start'
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
    </div>
  );
};
