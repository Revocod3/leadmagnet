import { Copy, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
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
        className="p-1.5 text-foreground/60 hover:text-foreground hover:bg-surface/50 transition-all duration-200 rounded-lg"
        title={copied ? 'Copiado!' : 'Copiar'}
      >
        <Copy className="w-4 h-4" />
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
          onClick={onRegenerate}
          className="p-1.5 text-foreground/60 hover:text-foreground hover:bg-surface/50 transition-all duration-200 rounded-lg"
          title="Regenerar respuesta"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
