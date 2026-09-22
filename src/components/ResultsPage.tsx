import React from 'react';
import {
  ArrowLeft,
  Sparkles,
  HeartHandshake,
  Eye,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
  Cpu,
  Layers,
  BookOpen,
  ArrowRight,
  Activity,
  Compass,
  BarChart3,
  MessageSquareHeart,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { AnalysisResult, DetectedFace, UserFeedback } from '../types';
import { FeedbackSection } from './FeedbackSection';
import { soundFx } from '../utils/sound';

interface ResultsPageProps {
  result: AnalysisResult;
  onBackToCamera: () => void;
  onViewHistory: () => void;
  onViewReports?: () => void;
  onOpenChat?: () => void;
  onExploreEmotion?: (emotionId: string) => void;
  onSaveFeedback?: (resultId: string, feedback: UserFeedback) => void;
}

// Custom Tooltip component for Recharts RadarChart
const CustomRadarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;
    return (
      <div className="bg-stone-900/95 backdrop-blur-xs text-stone-100 px-3 py-2 rounded-xl text-xs shadow-lg border border-stone-700/80 pointer-events-none">
        <p className="font-bold text-amber-200">{data.fullLabel || data.emotion}</p>
        <p className="font-mono text-xs text-stone-300 mt-1 flex items-center gap-1.5">
          <span>Probabilidad CNN:</span>
          <span className="font-bold text-red-400 text-sm">{data.probabilidad}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  onBackToCamera,
  onViewHistory,
  onViewReports,
  onOpenChat,
  onExploreEmotion,
  onSaveFeedback,
}) => {
  const hasFaces = result.detectedFaces && result.detectedFaces.length > 0;
  const primaryFace: DetectedFace | undefined = hasFaces ? result.detectedFaces[0] : undefined;

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Canonical order for emotions around the radar chart
  const canonicalOrder = ['felicidad', 'calma', 'sorpresa', 'atencion', 'tristeza', 'enojo', 'miedo'];
  const rawProbabilities = primaryFace?.cnnDetails?.classProbabilities || [];
  const radarData = [...rawProbabilities]
    .sort((a, b) => {
      const idxA = canonicalOrder.indexOf(a.emotion.toLowerCase());
      const idxB = canonicalOrder.indexOf(b.emotion.toLowerCase());
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    })
    .map((cls) => {
      const shortLabel = cls.label.split(' / ')[0];
      return {
        emotion: `${cls.emoji} ${shortLabel}`,
        fullLabel: `${cls.emoji} ${cls.label}`,
        probabilidad: cls.probability,
        fullMark: 100,
        color: cls.color,
      };
    });

  const getValenceStyle = (valence: string) => {
    switch (valence?.toLowerCase()) {
      case 'positiva':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'desafiante':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-sky-50 text-sky-800 border-sky-200';
    }
  };

  const getEmotionIdForGuide = (emotionName: string): string => {
    const lower = (emotionName || '').toLowerCase();
    if (lower.includes('felic') || lower.includes('alegr')) return 'felicidad';
    if (lower.includes('calm') || lower.includes('seren') || lower.includes('neutr')) return 'calma';
    if (lower.includes('sorpr') || lower.includes('asomb')) return 'sorpresa';
    if (lower.includes('aten') || lower.includes('curio') || lower.includes('conc')) return 'curiosidad';
    if (lower.includes('trist') || lower.includes('nost')) return 'tristeza';
    if (lower.includes('enoj') || lower.includes('ira')) return 'enojo';
    if (lower.includes('mied') || lower.includes('aler')) return 'miedo';
    return 'felicidad';
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-6 px-4 space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation Bar of the Results Page */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fffdf9] p-4 rounded-2xl border border-[#ede4d6] shadow-xs">
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            onBackToCamera();
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-stone-900 text-amber-50 hover:bg-stone-800 transition-all shadow-xs cursor-pointer active:scale-98"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Cámara</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-1 bg-[#fbf7f2] px-2.5 py-1.5 rounded-lg border border-[#eadbc9] font-mono text-stone-700">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>{formatTime(result.capturedAt)}</span>
          </div>

          <button
            type="button"
            onClick={onViewHistory}
            className="px-3 py-1.5 rounded-lg border border-[#eadbc9] text-stone-700 hover:bg-[#fbf7f2] transition-colors font-medium cursor-pointer"
          >
            Ver Historial
          </button>

          {onViewReports && (
            <button
              type="button"
              onClick={onViewReports}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 text-emerald-950 hover:bg-emerald-100 transition-colors font-medium cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Reportes</span>
            </button>
          )}

          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/80 text-rose-950 hover:bg-rose-100 transition-colors font-medium cursor-pointer"
            >
              <MessageSquareHeart className="w-3.5 h-3.5 text-rose-600" />
              <span>Asistente</span>
            </button>
          )}
        </div>
      </div>

      {!hasFaces || !primaryFace ? (
        /* No face detected in image */
        <div className="bg-[#fffdf9] rounded-3xl border border-amber-200/90 p-8 shadow-xs text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 mb-2">
            No se identificó ningún rostro con claridad
          </h2>
          <p className="text-xs text-stone-600 mb-6 leading-relaxed">
            {result.overallAtmosphere ||
              'Asegúrate de colocar tu rostro centrado en el óvalo de la cámara con buena iluminación frontal.'}
          </p>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onBackToCamera();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 text-amber-50 text-sm font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Intentar de nuevo</span>
          </button>
        </div>
      ) : (
        /* Face and emotions detected successfully */
        <div className="space-y-6">
          {/* Main Card with Oval Face Portrait & Key Emotion */}
          <div className="bg-[#fffdf9] rounded-3xl border border-[#ede4d6] p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
              {/* Left Column: Captured Face in an OVAL frame */}
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                <div className="relative">
                  {/* Outer glowing halo for the oval */}
                  <div className="absolute -inset-2 rounded-[50%] bg-red-500/25 blur-md pointer-events-none" />

                  {/* Oval Portrait Frame */}
                  <div className="relative w-48 sm:w-56 aspect-3/4 rounded-[50%] overflow-hidden border-4 border-red-500 shadow-md bg-stone-950 flex items-center justify-center">
                    {result.imageUrl ? (
                      <img
                        src={result.imageUrl}
                        alt="Rostro analizado"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Eye className="w-12 h-12 text-stone-500" />
                    )}

                    {/* Oval scan line watermark */}
                    <div className="absolute inset-0 rounded-[50%] border-2 border-white/20 pointer-events-none" />
                  </div>

                  {/* Emoji Floating Badge */}
                  <div className="absolute -bottom-2 right-2 w-12 h-12 rounded-2xl bg-[#fffdf9] shadow-md border border-[#ede4d6] flex items-center justify-center text-2xl">
                    {primaryFace.emoji}
                  </div>
                </div>

                <span className="text-[11px] text-stone-400 font-medium mt-3">
                  Óvalo Facial Procesado
                </span>
              </div>

              {/* Right Column: Emotion Headline and Gauge */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getValenceStyle(
                        primaryFace.valence
                      )}`}
                    >
                      {primaryFace.valence}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#fbf7f2] text-stone-700 border border-[#eadbc9]">
                      Intensidad: {primaryFace.intensity}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-amber-700" />
                      <span>Modelo CNN Keras</span>
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                    {primaryFace.primaryEmotion}
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Clasificación convolucional de micro-expresiones faciales
                  </p>
                </div>

                {/* Confidence Bar */}
                <div className="bg-[#fbf7f2] rounded-2xl p-4 border border-[#eadbc9]">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-stone-700">Nivel de Certeza:</span>
                    <span className="font-mono font-bold text-stone-900 text-sm">
                      {primaryFace.confidence}%
                    </span>
                  </div>
                  <div className="w-full bg-[#ebdcc9] h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.max(15, primaryFace.confidence))}%` }}
                    />
                  </div>
                </div>

                {/* Secondary Emotions Chips with pastel colors */}
                {primaryFace.secondaryEmotions && primaryFace.secondaryEmotions.length > 0 && (
                  <div>
                    <h4 className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-2">
                      Componentes emocionales secundarios:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {primaryFace.secondaryEmotions.map((sec, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs"
                        >
                          <span className="font-medium text-stone-800">{sec.emotion}</span>
                          <span className="font-mono font-bold text-amber-800 text-[11px]">
                            {sec.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CNN & TensorFlow / Keras Architecture Diagnostics Card */}
          {primaryFace.cnnDetails && (
            <div className="bg-[#fffdf9] rounded-3xl border border-[#ede4d6] p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ede4d6]/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100/70 text-amber-900 border border-amber-200 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <span>Red Neuronal Convolucional (CNN) - TensorFlow / Keras</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                        {primaryFace.cnnDetails.inferenceTimeMs} ms
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500">
                      {primaryFace.cnnDetails.architecture} • Tensor {primaryFace.cnnDetails.inputShape}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-medium text-stone-500">
                  <span className="px-2.5 py-1 rounded-lg bg-[#fbf7f2] border border-[#eadbc9] font-mono text-stone-700">
                    Softmax 7 Clases
                  </span>
                </div>
              </div>

              {/* Radar Chart & Probability Distribution Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-1">
                {/* Radar Chart Column (Recharts) */}
                <div className="lg:col-span-6 min-w-0 w-full bg-[#fbf7f2] rounded-2xl p-4 sm:p-5 border border-[#eadbc9] flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-red-500" />
                        <span>Gráfico de Radar - Espectro Emocional</span>
                      </h4>
                    </div>
                    <span className="text-[10px] font-medium text-stone-500 bg-white/80 px-2 py-0.5 rounded-md border border-[#eadbc9]">
                      Recharts
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 w-full mb-1">
                    Visualización radial de las probabilidades estimadas por la red convolucional.
                  </p>

                  <div className="w-full h-72 sm:h-80 min-w-0 min-h-[280px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={260}>
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="62%"
                        data={radarData}
                        margin={{ top: 15, right: 28, bottom: 15, left: 28 }}
                      >
                        <PolarGrid stroke="#e5dcd0" strokeDasharray="3 3" />
                        <PolarAngleAxis
                          dataKey="emotion"
                          tick={{ fill: '#44403c', fontSize: 11, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={{ fill: '#78716c', fontSize: 10 }}
                          stroke="#d6c7b2"
                        />
                        <Radar
                          name="Probabilidad CNN"
                          dataKey="probabilidad"
                          stroke="#ef4444"
                          fill="#ef4444"
                          fillOpacity={0.32}
                          strokeWidth={2}
                          dot={{ r: 3.5, fill: '#ef4444', strokeWidth: 1.5, stroke: '#ffffff' }}
                          activeDot={{ r: 5.5, fill: '#b91c1c', stroke: '#ffffff', strokeWidth: 2 }}
                        />
                        <Tooltip content={<CustomRadarTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 7-Class Probability Matrix Column */}
                <div className="lg:col-span-6 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-stone-700 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-700" />
                      Distribución de activación de tensores por clase:
                    </span>
                    <span className="text-[11px] text-stone-400 font-normal">
                      Normalización Softmax
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {primaryFace.cnnDetails.classProbabilities.map((cls, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-2xl border text-xs flex flex-col justify-between gap-1 transition-all"
                        style={{
                          backgroundColor: cls.bgLight,
                          borderColor: cls.borderLight,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{cls.emoji}</span>
                            <span className="font-bold text-stone-800">{cls.label}</span>
                          </div>
                          <span
                            className="font-mono font-extrabold text-xs"
                            style={{ color: cls.color }}
                          >
                            {cls.probability}%
                          </span>
                        </div>

                        {/* Mini progress bar */}
                        <div className="w-full bg-white/70 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(4, cls.probability))}%`,
                              backgroundColor: cls.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Details & Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Detected Facial Features */}
            <div className="bg-[#fffdf9] rounded-3xl border border-[#ede4d6] p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Rasgos y Micro-expresiones FACS</span>
              </div>
              <p className="text-xs text-stone-500">
                Puntos anatómicos clave procesados en el óvalo facial:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {primaryFace.facialCues.map((cue, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#fbf7f2] text-stone-700 border border-[#eadbc9] text-xs font-medium"
                  >
                    {cue}
                  </span>
                ))}
              </div>
            </div>

            {/* Empathetic Interpretation */}
            <div className="bg-[#fffdf9] rounded-3xl border border-[#ede4d6] p-6 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Lectura Emocional y Contextual</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed pt-1">
                {primaryFace.interpretation}
              </p>
            </div>
          </div>

          {/* Positive Wellness Recommendation */}
          {primaryFace.recommendation && (
            <div className="bg-amber-50/70 rounded-3xl border border-amber-200/90 p-6 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950 mb-1">
                  Recomendación positiva para tu momento
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {primaryFace.recommendation}
                </p>
              </div>
            </div>
          )}

          {/* Educational Callout: Saber más sobre esta emoción */}
          {onExploreEmotion && (
            <div className="bg-gradient-to-r from-amber-100/70 via-orange-100/60 to-yellow-100/70 rounded-3xl border border-amber-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/80 border border-amber-200 text-amber-900 text-[11px] font-semibold">
                  <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>Sección Educativa</span>
                </div>
                <h4 className="text-base font-bold text-stone-900">
                  ¿Quieres saber más sobre la expresión de "{primaryFace.primaryEmotion}"?
                </h4>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Explora las unidades de acción muscular (FACS), el impacto biológico de esta emoción y cómo regularla de forma constructiva.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onExploreEmotion(getEmotionIdForGuide(primaryFace.primaryEmotion));
                }}
                className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#fffdf9] hover:bg-white text-stone-900 border border-[#ede4d6] font-semibold text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-98"
              >
                <span>Aprender más</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
              </button>
            </div>
          )}

          {/* User Feedback Section: Campos de retroalimentación */}
          <FeedbackSection
            initialFeedback={result.feedback}
            detectedEmotion={primaryFace.primaryEmotion}
            onSaveFeedback={(feedback) => {
              if (onSaveFeedback) {
                onSaveFeedback(result.id, feedback);
              }
            }}
          />

          {/* Bottom Action: Scan another face */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onBackToCamera();
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-stone-900 text-amber-50 font-semibold text-sm hover:bg-stone-800 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Escanear Otro Rostro</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
