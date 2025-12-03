import { useRef, useEffect, useState } from 'react';
import { X, ArrowUp, RotateCcw, SwitchCamera } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string, message?: string) => void;
}

export const CameraModal = ({ isOpen, onClose, onCapture }: CameraModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setMessage('');
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage, facingMode]);

  const startCamera = async () => {
    try {
      // Stop existing stream first
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
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

        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(imageDataUrl);
        stopCamera();

        // Focus input after capture
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setMessage('');
  };

  const handleSend = () => {
    if (capturedImage) {
      onCapture(capturedImage, message.trim() || undefined);
      handleClose();
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setMessage('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <button
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <span className="text-white font-medium">
          {capturedImage ? 'Vista previa' : 'Cámara'}
        </span>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white text-lg mb-6">{error}</p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-neutral-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : capturedImage ? (
          /* Preview mode with message input */
          <div className="flex-1 flex flex-col">
            {/* Captured image */}
            <div className="flex-1 flex items-center justify-center p-4 bg-neutral-900">
              <img
                src={capturedImage}
                alt="Captured"
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            </div>

            {/* Message input area */}
            <div className="p-4 bg-neutral-900 border-t border-neutral-800">
              <div className="flex items-end gap-3">
                {/* Retake button */}
                <button
                  onClick={handleRetake}
                  className="flex-shrink-0 p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
                  title="Volver a tomar"
                >
                  <RotateCcw className="w-5 h-5 text-white" />
                </button>

                {/* Text input */}
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe algo..."
                    rows={1}
                    className="w-full px-4 py-3 bg-neutral-800 text-white rounded-2xl resize-none placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-green-500 text-[16px] max-h-24"
                    style={{ minHeight: '48px' }}
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={handleSend}
                  className="flex-shrink-0 p-3 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                  title="Enviar"
                >
                  <ArrowUp className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Camera mode */
          <>
            <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Camera controls */}
            <div className="p-6 bg-black flex items-center justify-center gap-6">
              {/* Switch camera */}
              <button
                onClick={handleSwitchCamera}
                className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                title="Cambiar cámara"
              >
                <SwitchCamera className="w-6 h-6 text-white" />
              </button>

              {/* Capture button */}
              <button
                onClick={handleCapture}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg border-4 border-neutral-400"
                title="Capturar"
              >
                <div className="w-16 h-16 rounded-full bg-white border-2 border-neutral-300" />
              </button>

              {/* Placeholder for symmetry */}
              <div className="w-14 h-14" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
