import React from 'react';
import { Sparkles, HeartHandshake, Eye, CheckCircle2, Info } from 'lucide-react';
import { AnalysisResult, DetectedFace } from '../types';

interface EmotionCardProps {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
}

export const EmotionCard: React.FC<EmotionCardProps> = ({ result, isAnalyzing }) => {
  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-100" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-slate-100 rounded-md w-1/3" />
            <div className="h-3.5 bg-slate-100 rounded-md w-1/4" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
          <div className="h-24 bg-slate-50 rounded-xl mt-4" />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3.5">
          <Eye className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          Listo para analizar
        </h3>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Mira a la cámara y pulsa <span className="font-semibold text-slate-700">"Escanear Emoción"</span> o activa el <span className="font-semibold text-slate-700">Modo Auto</span> para detectar expresiones en tiempo real.
        </p>
      </div>
    );
  }

  if (result.faceCount === 0 || !result.detectedFaces || result.detectedFaces.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200/80 p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              No se distinguió ningún rostro con claridad
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {result.overallAtmosphere ||
                'Asegúrate de mirar de frente a la cámara con iluminación clara y sin sombras excesivas.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const primaryFace: DetectedFace = result.detectedFaces[0];

  // Helper color tags based on valence
  const getValenceStyle = (valence: string) => {
    switch (valence.toLowerCase()) {
      case 'positiva':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'desafiante':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-sky-50 text-sky-700 border-sky-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Primary Emotion Result Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        {/* Header with Emoji and Emotion Name */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shadow-2xs">
              {primaryFace.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {primaryFace.primaryEmotion}
                </h3>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${getValenceStyle(
                    primaryFace.valence
                  )}`}
                >
                  {primaryFace.valence}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Intensidad: <strong className="text-slate-700 font-medium">{primaryFace.intensity}</strong></span>
                <span>•</span>
                <span>Certeza: <strong className="text-slate-700 font-medium">{primaryFace.confidence}%</strong></span>
              </p>
            </div>
          </div>

          {/* Confidence Gauge Badge */}
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {primaryFace.confidence}%
            </div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Confianza
            </span>
          </div>
        </div>

        {/* Confidence Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, primaryFace.confidence))}%` }}
            />
          </div>
        </div>

        {/* Secondary Emotions Distribution */}
        {primaryFace.secondaryEmotions && primaryFace.secondaryEmotions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2.5">
              Matices y emociones secundarias
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {primaryFace.secondaryEmotions.map((sec, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/80 rounded-xl px-3 py-2 border border-slate-100 flex items-center justify-between"
                >
                  <span className="text-xs text-slate-700 font-medium truncate">
                    {sec.emotion}
                  </span>
                  <span className="text-xs font-mono text-slate-500 font-semibold ml-2">
                    {sec.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facial Cues / Detected Features */}
        {primaryFace.facialCues && primaryFace.facialCues.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Rasgos y micro-expresiones detectadas</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {primaryFace.facialCues.map((cue, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-normal"
                >
                  {cue}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empathetic Interpretation & Recommendation */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
          {/* Interpretation */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-800">
                Lectura Emocional
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {primaryFace.interpretation}
            </p>
          </div>

          {/* Recommendation */}
          {primaryFace.recommendation && (
            <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/80">
              <div className="flex items-center gap-2 mb-1">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-xs font-semibold text-emerald-900">
                  Consejo Positivo
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {primaryFace.recommendation}
              </p>
            </div>
          )}
        </div>

        {/* If multiple faces were detected */}
        {result.faceCount > 1 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Rostros detectados en escena:</span>
            <span className="font-semibold text-slate-700">{result.faceCount} personas</span>
          </div>
        )}
      </div>
    </div>
  );
};
