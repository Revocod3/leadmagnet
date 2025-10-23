import { Copy, Share2, Heart } from 'lucide-react';
import { useState } from 'react';

interface MessageActionsProps {
  messageText: string;
  onShare: () => void;
  isUserMessage?: boolean;
}

export const MessageActions = ({ messageText, onShare, isUserMessage = false }: MessageActionsProps) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying text:', err);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
  };

  return (
    <div
      className={`flex gap-3 mt-2.5 pt-2.5 px-2.5 opacity-60 hover:opacity-100 transition-opacity duration-300 ${isUserMessage ? 'justify-end pr-0 pl-2.5' : 'justify-start pl-2.5 pr-0'
        }`}
    >
      {/* Copy */}
      <button
        onClick={handleCopy}
        className="p-1 text-foreground/70 hover:text-foreground transition-colors duration-200 rounded hover:bg-surface/50"
        title={copied ? 'Copiado!' : 'Copiar'}
      >
        <Copy className="w-4 h-4" />
      </button>

      {/* Share */}
      <button
        onClick={onShare}
        className="p-1 text-foreground/70 hover:text-foreground transition-colors duration-200 rounded hover:bg-surface/50"
        title="Compartir"
      >
        <Share2 className="w-4 h-4" />
      </button>

      {/* Like */}
      <button
        onClick={handleLike}
        className={`p-1 transition-colors duration-200 rounded ${liked
            ? 'text-brand-green-500'
            : 'text-foreground/70 hover:text-foreground'
          }`}
        title={liked ? 'Me gusta' : 'Dar me gusta'}
      >
        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
};
