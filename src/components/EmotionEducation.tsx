import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Brain,
  Activity,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Layers,
  Smile,
  Cpu,
} from 'lucide-react';
import { EMOTIONS_GUIDE_DATA } from '../data/emotionsGuide';
import { soundFx } from '../utils/sound';

interface EmotionEducationProps {
  initialEmotionId?: string;
  onGoToCamera: () => void;
}

export const EmotionEducation: React.FC<EmotionEducationProps> = ({
  initialEmotionId = 'felicidad',
  onGoToCamera,
}) => {
  const [selectedId, setSelectedId] = useState<string>(initialEmotionId);
  const currentEmotion =
    EMOTIONS_GUIDE_DATA.find((e) => e.id === selectedId) || EMOTIONS_GUIDE_DATA[0];

  return (
    <div className="w-full max-w-5xl mx-auto py-4 sm:py-6 px-4 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner with vibrant, gentle luminous warm pastel gradient */}
      <div className="bg-gradient-to-r from-amber-100/90 via-orange-100/80 to-yellow-100/90 rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-200/80 border border-amber-300 text-amber-950 text-xs font-semibold shadow-2xs">
              <BookOpen className="w-3.5 h-3.5 text-amber-800" />
              <span>Guía Científica de Expresiones y Neurociencia</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight">
              Aprende a comprender tus emociones y micro-expresiones
            </h2>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
              Descubre qué ocurre en tu cerebro y en tus músculos faciales cuando sientes cada emoción, cómo la red neuronal convolucional (CNN) las identifica y qué técnicas prácticas te ayudan a regularlas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onGoToCamera();
            }}
            className="self-start md:self-auto inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-50 font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-98"
          >
            <Smile className="w-4 h-4 text-amber-300" />
            <span>Probar con mi rostro</span>
            <ArrowRight className="w-4 h-4 text-amber-200" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Emotion Pills Navigator: Each emotion has its own luminous pastel color */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-700">
          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-700" />
            Selecciona una emoción para explorar en detalle:
          </span>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            7 emociones universales (FACS / Ekman)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {EMOTIONS_GUIDE_DATA.map((em) => {
            const isSelected = em.id === selectedId;
            return (
              <button
                key={em.id}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSelectedId(em.id);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? em.pillSelected || 'bg-emerald-100 border-emerald-400 shadow-sm ring-2 ring-emerald-400/50'
                    : em.pillUnselected || 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl transition-transform hover:scale-110">{em.emoji}</span>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse ring-2 ring-emerald-300" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{em.name}</h4>
                  <span className="text-[10px] text-slate-600 font-medium block truncate mt-0.5">
                    {em.colorName}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Detailed Card for Selected Emotion: Bathed in the emotion's luminous pastel theme */}
      <div
        className={`bg-gradient-to-br ${
          currentEmotion.themeGradient || 'from-emerald-50 via-teal-50 to-amber-50'
        } rounded-3xl border ${
          currentEmotion.borderAccent || 'border-emerald-300'
        } p-6 sm:p-8 shadow-xs space-y-6 sm:space-y-8 transition-all`}
      >
        {/* Title, Emoji Avatar and Tagline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/70 backdrop-blur-xs shadow-xs border ${
                currentEmotion.borderAccent || 'border-emerald-300'
              } flex items-center justify-center text-3xl sm:text-4xl transition-transform hover:scale-105`}
            >
              {currentEmotion.emoji}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {currentEmotion.name}
                </h3>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${currentEmotion.badgeBg} ${currentEmotion.badgeText}`}
                >
                  {currentEmotion.colorName}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 mt-1 font-medium">
                {currentEmotion.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Overview with Light Pastel Tinted Containers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column A: Función Evolutiva y Biología */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Brain className={`w-4 h-4 ${currentEmotion.accentColor || 'text-emerald-700'}`} />
              <span>Función Biológica y Adaptativa</span>
            </div>
            <div
              className={`p-4 rounded-2xl ${
                currentEmotion.innerCardBg || 'bg-emerald-100/50 border-emerald-200'
              } border text-xs sm:text-sm text-slate-800 leading-relaxed shadow-2xs`}
            >
              {currentEmotion.evolutionaryPurpose}
            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pt-2">
              <Activity className={`w-4 h-4 ${currentEmotion.accentColor || 'text-emerald-700'}`} />
              <span>Sensaciones Fisiológicas en el Cuerpo</span>
            </div>
            <ul className="space-y-2">
              {currentEmotion.physicalSensations.map((sens, idx) => (
                <li
                  key={idx}
                  className={`flex items-start gap-2.5 text-xs text-slate-800 bg-white/65 hover:bg-white/80 px-3.5 py-2.5 rounded-xl border ${
                    currentEmotion.borderAccent || 'border-emerald-200'
                  } shadow-2xs transition-colors`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      currentEmotion.accentColor ? 'bg-current opacity-80' : 'bg-emerald-600'
                    } mt-1 shrink-0`}
                  />
                  <span className="font-medium">{sens}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column B: FACS (Action Units) en la Cara & CNN */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Sparkles className={`w-4 h-4 ${currentEmotion.accentColor || 'text-emerald-700'}`} />
              <span>Micro-expresiones FACS (Unidades Musculares)</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Puntos anatómicos que las capas convolucionales de Keras/TensorFlow rastrean en el óvalo facial:
            </p>
            <div className="space-y-2.5">
              {currentEmotion.facsUnits.map((unit, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl bg-white/70 hover:bg-white/90 border ${
                    currentEmotion.borderAccent || 'border-emerald-200'
                  } text-xs space-y-1.5 shadow-2xs transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] border ${currentEmotion.badgeBg} ${currentEmotion.badgeText}`}
                    >
                      {unit.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 italic">
                      {unit.muscle}
                    </span>
                  </div>
                  <p className="text-slate-800 text-xs leading-normal pt-0.5 font-medium">
                    {unit.description}
                  </p>
                </div>
              ))}
            </div>

            <div
              className={`p-3.5 rounded-2xl ${
                currentEmotion.innerCardBg || 'bg-emerald-100/50 border-emerald-200'
              } border text-xs text-slate-800 shadow-2xs`}
            >
              <strong className="font-bold text-slate-900 block mb-0.5">
                Impacto en la cognición:
              </strong>
              <p className="font-medium text-slate-700 leading-relaxed">
                {currentEmotion.cognitiveEffects}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Wellness & Regulation Tips with Luminous Gradient Accent */}
        <div
          className={`p-5 sm:p-6 rounded-2xl ${
            currentEmotion.regulationBg ||
            'bg-gradient-to-r from-emerald-100/90 via-teal-100/70 to-amber-100/80 border-emerald-300'
          } border shadow-xs space-y-3.5`}
        >
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span>Estrategias de Regulación y Gestión Saludable</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {currentEmotion.regulationTips.map((tip, idx) => (
              <div
                key={idx}
                className={`${
                  currentEmotion.tipCardBg || 'bg-white/80 hover:bg-white border-emerald-200'
                } backdrop-blur-xs p-4 rounded-xl border text-xs text-slate-800 space-y-1.5 shadow-2xs transition-transform hover:-translate-y-0.5`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Paso {idx + 1}</span>
                </div>
                <p className="leading-relaxed text-slate-700 font-medium">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Educational Mini-Card on CNN & Keras Architecture: Eye-catching multi-pastel card */}
      <div className="bg-gradient-to-br from-violet-100/80 via-purple-50/90 to-sky-100/80 rounded-3xl border border-violet-300/80 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-200/80 text-violet-950 border border-violet-300 flex items-center justify-center font-bold text-xs shadow-2xs">
            <Cpu className="w-5 h-5 text-violet-700" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
              ¿Cómo clasifica las expresiones la Red Neuronal Convolucional (Keras / TensorFlow)?
            </h4>
            <p className="text-xs text-slate-600 font-medium">
              Arquitectura profunda Mini-Xception y procesamiento matricial de tensores
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
          {/* Step 1: Sky / Cyan Light Pastel */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-100/90 to-cyan-50/90 border border-sky-300/80 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-sky-950">
              <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-900 flex items-center justify-center text-[10px] font-mono font-bold shadow-2xs">
                1
              </span>
              <span>Extracción de Tensores</span>
            </div>
            <p className="leading-relaxed font-medium text-slate-700">
              El óvalo del rostro se normaliza a una matriz en escala de grises de 48x48 píxeles con valores escalados matemáticamente en el rango [-1, 1].
            </p>
          </div>

          {/* Step 2: Purple / Lavender Light Pastel */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-100/90 to-fuchsia-50/90 border border-purple-300/80 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-purple-950">
              <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-900 flex items-center justify-center text-[10px] font-mono font-bold shadow-2xs">
                2
              </span>
              <span>Capas Convolucionales 2D</span>
            </div>
            <p className="leading-relaxed font-medium text-slate-700">
              Filtros convolucionales 3x3 con ReLU y Batch Normalization aíslan gradientes de micro-arrugas nasolabiales, apertura ocular y tensión labial.
            </p>
          </div>

          {/* Step 3: Emerald / Mint Light Pastel */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-100/90 to-teal-50/90 border border-emerald-300/80 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px] font-mono font-bold shadow-2xs">
                3
              </span>
              <span>Capa Softmax de 7 Clases</span>
            </div>
            <p className="leading-relaxed font-medium text-slate-700">
              La capa densa final calcula un vector probabilístico normalizado con la función Softmax para clasificar el estado anímico con precisión biológica.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
