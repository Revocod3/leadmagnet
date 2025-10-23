interface ImageViewerModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

export const ImageViewerModal = ({ isOpen, imageUrl, onClose }: ImageViewerModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] bg-black/95 flex items-center justify-center p-4 cursor-pointer animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-9 text-white text-5xl font-bold cursor-pointer transition-colors duration-200 hover:text-gray-300"
        aria-label="Cerrar"
      >
        &times;
      </button>

      <img
        src={imageUrl}
        alt="Vista ampliada"
        className="max-w-[90%] max-h-[90%] object-contain animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
