import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Camera, CameraOff, RefreshCw, Sparkles, Image as ImageIcon } from 'lucide-react';
import { DetectedFace } from '../types';

export interface CameraViewHandle {
  capture: () => string | null;
}

interface CameraViewProps {
  onCaptureFrame: (imageDataUrl: string) => void;
  isAnalyzing: boolean;
  detectedFaces: DetectedFace[];
  currentImageSource: string | null;
  onClearStaticImage: () => void;
  onRequestSample: () => void;
}

export const CameraView = forwardRef<CameraViewHandle, CameraViewProps>(({
  isAnalyzing,
  detectedFaces,
  currentImageSource,
  onClearStaticImage,
  onRequestSample,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Initialize camera safely
  const startCamera = useCallback(async () => {
    setCameraError(null);

    // Stop existing stream if running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('El acceso a la cámara no está habilitado en este navegador o iframe. Puedes subir una foto para analizar.');
      setCameraActive(false);
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Error al solicitar cámara:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permiso de cámara denegado. Permite el acceso o utiliza una foto o ejemplo.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No se encontró ninguna cámara conectada. Puedes subir una foto.');
      } else {
        setCameraError('No se pudo iniciar la cámara en este entorno. Puedes usar una foto o ejemplo.');
      }
      setCameraActive(false);
    }
  }, [facingMode]);

  // Bind media stream to video element whenever stream changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play().catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('Video play error:', err);
        }
      });
    };
  }, [stream]);

  // Mount/unmount lifecycle for stream
  useEffect(() => {
    if (!currentImageSource) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode, currentImageSource, startCamera]);

  // Capture current frame from canvas
  const captureCurrentFrame = useCallback((): string | null => {
    if (currentImageSource) {
      return currentImageSource;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return null;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    if (facingMode === 'user') {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    try {
      return canvas.toDataURL('image/jpeg', 0.88);
    } catch (err) {
      console.error('Error generating canvas data URL:', err);
      return null;
    }
  }, [currentImageSource, facingMode]);

  useImperativeHandle(ref, () => ({
    capture: captureCurrentFrame,
  }));

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div
      id="camera-container"
      className="relative w-full aspect-4/3 sm:aspect-16/10 max-h-[500px] bg-stone-950 rounded-3xl overflow-hidden shadow-xs border border-[#ede4d6] flex items-center justify-center select-none"
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* 1. Static Image Display (If uploaded or sample chosen) */}
      {currentImageSource ? (
        <div className="relative w-full h-full flex items-center justify-center bg-stone-950">
          <img
            src={currentImageSource}
            alt="Rostro para análisis"
            className="w-full h-full object-contain"
          />

          <div className="absolute top-4 left-4 z-20">
            <button
              type="button"
              onClick={onClearStaticImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#fffdfa]/95 backdrop-blur-md text-stone-800 shadow-sm hover:bg-white transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-amber-600" />
              <span>Volver a la cámara</span>
            </button>
          </div>
        </div>
      ) : (
        /* 2. Live Camera Feed */
        <div className="relative w-full h-full flex items-center justify-center">
          {cameraActive && !cameraError ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
              <div className="w-14 h-14 rounded-2xl bg-stone-900 flex items-center justify-center text-stone-400 mb-3">
                <CameraOff className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                {cameraError ? 'Cámara no disponible' : 'Cámara pausada'}
              </h3>
              <p className="text-xs text-stone-400 mb-4 leading-relaxed">
                {cameraError || 'Activa la cámara o sube una fotografía para comenzar.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-white text-stone-900 text-xs font-semibold rounded-xl hover:bg-amber-50 transition-colors shadow-sm cursor-pointer"
                >
                  Reintentar Cámara
                </button>
                <button
                  type="button"
                  onClick={onRequestSample}
                  className="px-4 py-2 bg-stone-850 hover:bg-stone-800 text-stone-200 text-xs font-medium rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-stone-700"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Probar con Foto
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. BIOMETRIC OVAL GUIDE: Centered oval framing so the camera detects faces as an oval */}
      {!currentImageSource && cameraActive && !cameraError && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
          {/* Subtle vignette darkening outside */}
          <div className="relative w-[55%] sm:w-[46%] aspect-3/4 max-w-[280px] rounded-[50%] border-2 border-dashed border-red-500 shadow-[0_0_0_9999px_rgba(28,25,23,0.35)] flex items-center justify-center transition-all duration-300">
            {/* Soft oval scanning label */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-stone-900/85 backdrop-blur-xs text-red-200 text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-red-500/40 whitespace-nowrap">
              Encuadre de Óvalo Facial
            </div>

            {/* Pulsing oval halo */}
            <div className="absolute inset-0 rounded-[50%] border border-red-500/60 animate-pulse" />
          </div>

          <p className="absolute bottom-4 text-[11px] font-medium text-amber-50/90 bg-stone-900/80 backdrop-blur-xs px-3 py-1 rounded-full border border-red-500/30 shadow-xs">
            Coloca tu rostro dentro del óvalo
          </p>
        </div>
      )}

      {/* 4. DETECTED FACE OVERLAY: Rendered ONLY as an OVAL */}
      {detectedFaces && detectedFaces.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-15">
          {detectedFaces.map((face, index) => {
            const [ymin, xmin, ymax, xmax] = face.box_2d || [0, 0, 0, 0];
            const top = `${ymin / 10}%`;
            const left = `${xmin / 10}%`;
            const height = `${(ymax - ymin) / 10}%`;
            const width = `${(xmax - xmin) / 10}%`;

            return (
              <div
                key={`face-oval-${index}`}
                style={{
                  top,
                  left,
                  width,
                  height,
                  borderRadius: '50%', // Strictly rendered as an oval!
                }}
                className="absolute border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.55)] transition-all duration-300 flex items-center justify-center"
              >
                {/* Floating emotion pill above the oval */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-stone-900/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium shadow-md border border-red-500/70 flex items-center gap-1.5">
                  <span className="text-sm">{face.emoji}</span>
                  <span className="font-semibold">{face.primaryEmotion}</span>
                  <span className="text-amber-300 font-mono text-[11px] ml-0.5">
                    {face.confidence}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Scanning / Analyzing Loading Animation */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-stone-950/65 backdrop-blur-[3px] z-25 flex flex-col items-center justify-center text-white">
          <div className="relative w-16 h-16 mb-3 flex items-center justify-center">
            {/* Animated oval scanner */}
            <div className="w-14 h-18 rounded-[50%] border-2 border-red-500/40 animate-ping absolute" />
            <div className="w-14 h-18 rounded-[50%] border-2 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <Sparkles className="w-6 h-6 text-red-400 animate-pulse" />
          </div>
          <p className="text-xs font-semibold tracking-wider uppercase text-amber-200">
            Analizando Óvalo Facial...
          </p>
          <span className="text-[11px] text-stone-300 mt-1">
            Reconociendo emociones y micro-expresiones
          </span>
        </div>
      )}

      {/* 6. Top controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {!currentImageSource && cameraActive && !cameraError && (
          <button
            type="button"
            onClick={toggleFacingMode}
            title="Cambiar cámara frontal / trasera"
            className="w-8 h-8 rounded-full bg-stone-900/75 hover:bg-stone-900 text-white backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {!currentImageSource && cameraActive && !cameraError && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900/75 backdrop-blur-md text-white text-[11px] font-medium shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>En vivo</span>
          </div>
        )}
      </div>
    </div>
  );
});

CameraView.displayName = 'CameraView';
