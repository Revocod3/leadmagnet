import { useRef, useEffect, useState } from 'react';
import { X, Camera as CameraIcon } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraModal = ({ isOpen, onClose, onCapture }: CameraModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setError('');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageDataUrl);
        handleClose();
      }
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-ovp-dark rounded-2xl overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-white text-lg mb-4">{error}</p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-brand-green text-black rounded-xl font-semibold hover:bg-brand-green/90 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-4">
              <button
                onClick={handleCapture}
                className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                title="Capturar Foto"
              >
                <CameraIcon className="w-8 h-8 text-black" />
              </button>

              <button
                onClick={handleClose}
                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                title="Cancelar"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
