import { useState, useRef, useCallback, useEffect } from 'react';
import { CameraView, CameraViewHandle } from './components/CameraView';
import { IntuitiveControls } from './components/IntuitiveControls';
import { ResultsPage } from './components/ResultsPage';
import { EmotionEducation } from './components/EmotionEducation';
import { EmotionHistory } from './components/EmotionHistory';
import { SamplePhotosModal } from './components/SamplePhotosModal';
import { AnalysisResult, DetectedFace, UserFeedback } from './types';
import { soundFx } from './utils/sound';
import { SampleImage } from './utils/sampleData';
import { runCnnEmotionInference } from './utils/cnnEngine';
import {
  Smile,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  History,
  Camera,
  BookOpen,
  Cpu,
} from 'lucide-react';

const LOCAL_STORAGE_HISTORY_KEY = 'facial_emotion_scan_history_v2';

export default function App() {
  const [activePage, setActivePage] = useState<'camera' | 'results' | 'education'>('camera');
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [targetEducationEmotionId, setTargetEducationEmotionId] = useState<string>('felicidad');

  // Auto scan state
  const [isAutoScan, setIsAutoScan] = useState<boolean>(false);
  const [autoScanCountdown, setAutoScanCountdown] = useState<number>(4);
  const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Sample modal state
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);

  // History drawer/modal state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Current image source (if static photo uploaded or sample chosen)
  const [currentImageSource, setCurrentImageSource] = useState<string | null>(null);

  // Active detected faces to overlay on camera/image
  const [activeFaces, setActiveFaces] = useState<DetectedFace[]>([]);

  // Guide toggle
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Ref to the camera view for direct capture
  const cameraRef = useRef<CameraViewHandle | null>(null);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
    } catch (err) {
      console.warn('Could not save history to localStorage', err);
    }
  }, [history]);

  // Core analysis function: combines multimodal vision + client-side TensorFlow / Keras CNN
  const analyzeImage = useCallback(async (imageDataUrl: string) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      // 1. Fetch visual feature detection & micro-expression classification
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageDataUrl }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${response.status})`);
      }

      const data = await response.json();
      const detectedFaces: DetectedFace[] = data.detectedFaces || [];

      // 2. Run Convolutional Neural Network (CNN) TensorFlow / Keras pipeline for feature tensors
      if (detectedFaces.length > 0) {
        try {
          const primaryEmotionHint = detectedFaces[0].primaryEmotion;
          const cnnDetails = await runCnnEmotionInference(imageDataUrl, primaryEmotionHint);
          detectedFaces[0].cnnDetails = cnnDetails;
        } catch (cnnErr) {
          console.warn('CNN Keras execution notice:', cnnErr);
        }
      }

      const newResult: AnalysisResult = {
        id: `scan-${Date.now()}`,
        faceCount: data.faceCount || 0,
        overallAtmosphere: data.overallAtmosphere || '',
        detectedFaces,
        capturedAt: Date.now(),
        imageUrl: imageDataUrl,
      };

      setCurrentResult(newResult);
      setActiveFaces(newResult.detectedFaces);

      // Play success audio
      if (newResult.detectedFaces && newResult.detectedFaces.length > 0) {
        soundFx.playSuccess();
      }

      // Add to session history
      setHistory((prev) => [newResult, ...prev.slice(0, 14)]);

      // Stop auto-scan when redirecting to results page
      setIsAutoScan(false);

      // Redirect to results page
      setActivePage('results');
    } catch (err: any) {
      console.error('Error in analyzeImage:', err);
      setErrorMessage(err.message || 'No se pudo completar el análisis facial. Intenta de nuevo.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  // Handle saving user feedback for a scan
  const handleSaveFeedback = useCallback((resultId: string, feedback: UserFeedback) => {
    setCurrentResult((prev) => {
      if (!prev || prev.id !== resultId) return prev;
      return { ...prev, feedback };
    });

    setHistory((prevList) =>
      prevList.map((item) => (item.id === resultId ? { ...item, feedback } : item))
    );
  }, []);

  // Trigger capture from camera
  const handleTriggerScan = useCallback(() => {
    if (isAnalyzing) return;

    if (currentImageSource) {
      analyzeImage(currentImageSource);
      return;
    }

    if (cameraRef.current) {
      const frame = cameraRef.current.capture();
      if (frame) {
        analyzeImage(frame);
      } else {
        setErrorMessage('La cámara no está lista o no tiene permisos. Selecciona una foto de muestra o sube una imagen.');
        setIsSampleModalOpen(true);
      }
    }
  }, [isAnalyzing, currentImageSource, analyzeImage]);

  // Manage Auto-scan countdown loop
  useEffect(() => {
    if (!isAutoScan || activePage !== 'camera') {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
        autoScanTimerRef.current = null;
      }
      setAutoScanCountdown(4);
      return;
    }

    autoScanTimerRef.current = setInterval(() => {
      setAutoScanCountdown((prev) => {
        if (prev <= 1) {
          if (!isAnalyzing) {
            handleTriggerScan();
          }
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
      }
    };
  }, [isAutoScan, activePage, isAnalyzing, handleTriggerScan]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.setEnabled(next);
  };

  const toggleAutoScan = () => {
    setIsAutoScan((prev) => !prev);
  };

  const handleUploadImage = (imageDataUrl: string) => {
    setCurrentImageSource(imageDataUrl);
    setIsAutoScan(false);
    analyzeImage(imageDataUrl);
  };

  const handleClearStaticImage = () => {
    setCurrentImageSource(null);
    setActiveFaces([]);
  };

  // Select sample image via server-side proxy
  const handleSelectSample = async (sample: SampleImage) => {
    setIsAutoScan(false);
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const proxyRes = await fetch('/api/proxy-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sample.url }),
      });

      if (!proxyRes.ok) {
        throw new Error('No se pudo obtener la imagen de muestra');
      }

      const proxyData = await proxyRes.json();
      setCurrentImageSource(proxyData.dataUrl);
      analyzeImage(proxyData.dataUrl);
    } catch (err: any) {
      console.warn('Fallback to direct url for sample:', err);
      setCurrentImageSource(sample.url);
      analyzeImage(sample.url);
    }
  };

  // Open past scan from history in the results page
  const handleSelectHistoryItem = (item: AnalysisResult) => {
    setCurrentResult(item);
    setActiveFaces(item.detectedFaces);
    setActivePage('results');
    setIsHistoryOpen(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
    } catch {
      // ignore
    }
  };

  const handleNavigateToEducation = (emotionId: string = 'felicidad') => {
    setTargetEducationEmotionId(emotionId);
    setActivePage('education');
  };

  return (
    <div className="min-h-screen bg-[#edf4fa] text-stone-800 flex flex-col antialiased selection:bg-sky-200 selection:text-sky-950">
      {/* 1. Header with warm pastel aesthetic */}
      <header className="w-full bg-[#fffdfa]/90 backdrop-blur-md border-b border-[#ede4d6] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100/70 border border-amber-200/80 flex items-center justify-center text-amber-800 shadow-2xs">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-stone-900 leading-tight flex items-center gap-2">
                <span>Detector de Emociones</span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                  <Cpu className="w-3 h-3 text-amber-700" />
                  CNN Keras / TF
                </span>
              </h1>
              <p className="text-[11px] text-stone-500">
                Análisis biológico de micro-expresiones faciales
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setActivePage('camera');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activePage === 'camera'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'bg-[#f7efe3] text-stone-700 hover:bg-[#f1e5d4] border border-[#e8dbca]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Cámara</span>
            </button>

            {currentResult && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setActivePage('results');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activePage === 'results'
                    ? 'bg-stone-900 text-stone-50 shadow-xs'
                    : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100/70'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Resultados</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setActivePage('education');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activePage === 'education'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'bg-orange-50 text-orange-950 border border-orange-200 hover:bg-orange-100/70'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-orange-600" />
              <span>Saber Más</span>
            </button>

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setIsHistoryOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-stone-700 hover:text-stone-950 bg-[#f7efe3] hover:bg-[#f1e5d4] border border-[#e8dbca] transition-colors cursor-pointer"
                title="Ver historial de escaneos"
              >
                <History className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Historial</span>
                <span className="w-4 h-4 rounded-full bg-[#ebdcc9] text-stone-800 text-[10px] flex items-center justify-center font-mono font-bold">
                  {history.length}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowGuide((prev) => !prev)}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-stone-700 hover:text-stone-950 bg-[#f7efe3] hover:bg-[#f1e5d4] border border-[#e8dbca] transition-colors cursor-pointer"
              title="Instrucciones"
            >
              <HelpCircle className="w-4 h-4 text-stone-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Guide Banner */}
      {showGuide && (
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-3 text-xs text-amber-950 transition-all">
          <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-950 block mb-0.5">
                  ¿Cómo funciona el escaneo de óvalo facial con CNN y TensorFlow/Keras?
                </strong>
                <p className="text-amber-900 leading-relaxed">
                  1. Sitúa tu rostro dentro de la <strong>guía ovalada</strong> con buena luz frontal.
                  2. La red convolucional (Keras/TensorFlow) extrae los tensores de 48x48 y la matriz de activación por clase (FACS).
                  3. Accederás de inmediato a la <strong>página de resultados</strong> con el desglose de probabilidades, campos de retroalimentación para calibrar el modelo y enlaces para aprender más sobre cada emoción.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="text-amber-800 hover:text-amber-950 text-xs font-semibold px-2 py-1 rounded cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 w-full">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start justify-between gap-3 text-rose-900 text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-700 hover:text-rose-950 font-semibold cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* History Slide-down Strip */}
      {isHistoryOpen && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 w-full">
          <EmotionHistory
            history={history}
            onSelectResult={handleSelectHistoryItem}
            onClearHistory={handleClearHistory}
            selectedId={currentResult?.id || null}
          />
        </div>
      )}

      {/* 2. Main Multi-Page Screen Switcher */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col items-center">
        {activePage === 'camera' && (
          /* APARTADO 1: CÁMARA Y ESCANEO CON ÓVALO */
          <div className="w-full space-y-4 max-w-2xl mx-auto animate-in fade-in duration-200">
            {/* Camera View with Oval framing */}
            <CameraView
              ref={cameraRef}
              onCaptureFrame={analyzeImage}
              isAnalyzing={isAnalyzing}
              detectedFaces={activeFaces}
              currentImageSource={currentImageSource}
              onClearStaticImage={handleClearStaticImage}
              onRequestSample={() => setIsSampleModalOpen(true)}
            />

            {/* Intuitive Controls under the camera */}
            <IntuitiveControls
              onTriggerScan={handleTriggerScan}
              isAnalyzing={isAnalyzing}
              isAutoScan={isAutoScan}
              onToggleAutoScan={toggleAutoScan}
              onUploadImage={handleUploadImage}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
              onOpenSamples={() => setIsSampleModalOpen(true)}
              autoScanCountdown={autoScanCountdown}
            />
          </div>
        )}

        {activePage === 'results' && currentResult && (
          /* APARTADO 2: PÁGINA DEDICADA DE RESULTADOS CON CNN, RETROALIMENTACIÓN Y GUÍA */
          <ResultsPage
            result={currentResult}
            onBackToCamera={() => {
              setCurrentImageSource(null);
              setActiveFaces([]);
              setActivePage('camera');
            }}
            onViewHistory={() => setIsHistoryOpen(true)}
            onExploreEmotion={(emotionId) => handleNavigateToEducation(emotionId)}
            onSaveFeedback={handleSaveFeedback}
          />
        )}

        {activePage === 'education' && (
          /* APARTADO 3: SECCIÓN PARA SABER MÁS SOBRE LAS EMOCIONES */
          <EmotionEducation
            initialEmotionId={targetEducationEmotionId}
            onGoToCamera={() => {
              setCurrentImageSource(null);
              setActiveFaces([]);
              setActivePage('camera');
            }}
          />
        )}
      </main>

      {/* Sample Photos Modal */}
      <SamplePhotosModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={handleSelectSample}
      />
    </div>
  );
}
