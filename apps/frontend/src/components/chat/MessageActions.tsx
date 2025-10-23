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
      className={`flex gap-3 mt-4 pt-3 px-2.5 border-t border-black/5 dark:border-white/10 opacity-100 transition-opacity duration-300 ${
        isUserMessage ? 'justify-end pr-0 pl-2.5' : 'justify-start pl-2.5 pr-0'
      }`}
    >
      {/* Copy */}
      <button
        onClick={handleCopy}
        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-115"
        title={copied ? 'Copiado!' : 'Copiar'}
      >
        <Copy className="w-4 h-4" />
      </button>

      {/* Share */}
      <button
        onClick={onShare}
        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-115"
        title="Compartir"
      >
        <Share2 className="w-4 h-4" />
      </button>

      {/* Like */}
      <button
        onClick={handleLike}
        className={`transition-all duration-200 hover:scale-115 ${
          liked
            ? 'text-brand-green dark:text-brand-green fill-brand-green'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
        title={liked ? 'Me gusta' : 'Dar me gusta'}
      >
        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
};
