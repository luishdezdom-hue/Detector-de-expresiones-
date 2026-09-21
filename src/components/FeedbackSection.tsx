import React, { useState } from 'react';
import {
  MessageSquareHeart,
  ThumbsUp,
  MinusCircle,
  ThumbsDown,
  Star,
  CheckCircle2,
  Sparkles,
  Send,
  RotateCcw,
} from 'lucide-react';
import { UserFeedback } from '../types';
import { soundFx } from '../utils/sound';

interface FeedbackSectionProps {
  initialFeedback?: UserFeedback;
  detectedEmotion: string;
  onSaveFeedback: (feedback: UserFeedback) => void;
}

const EMOTION_OPTIONS = [
  { label: 'Felicidad / Alegría', emoji: '😊' },
  { label: 'Calma / Serenidad', emoji: '😌' },
  { label: 'Sorpresa / Asombro', emoji: '😮' },
  { label: 'Atención / Concentración', emoji: '🧐' },
  { label: 'Tristeza / Nostalgia', emoji: '😢' },
  { label: 'Enojo / Frustración', emoji: '😠' },
  { label: 'Alerta / Cautela', emoji: '😨' },
  { label: 'Cansancio / Agotamiento', emoji: '🥱' },
  { label: 'Entusiasmo / Pasión', emoji: '🤩' },
];

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  initialFeedback,
  detectedEmotion,
  onSaveFeedback,
}) => {
  const [accuracy, setAccuracy] = useState<'exact' | 'close' | 'different'>(
    initialFeedback?.accuracy || 'exact'
  );
  const [realEmotion, setRealEmotion] = useState<string>(
    initialFeedback?.realEmotion || detectedEmotion || 'Felicidad / Alegría'
  );
  const [intensityScore, setIntensityScore] = useState<number>(
    initialFeedback?.intensityScore || 4
  );
  const [notes, setNotes] = useState<string>(initialFeedback?.notes || '');
  const [isSaved, setIsSaved] = useState<boolean>(!!initialFeedback);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playSuccess();

    const feedbackData: UserFeedback = {
      id: initialFeedback?.id || `fb-${Date.now()}`,
      accuracy,
      realEmotion,
      intensityScore,
      notes: notes.trim(),
      submittedAt: Date.now(),
    };

    onSaveFeedback(feedbackData);
    setIsSaved(true);
  };

  const handleReset = () => {
    soundFx.playClick();
    setIsSaved(false);
  };

  return (
    <div className="bg-[#fffdf9] rounded-3xl border border-[#ede4d6] p-6 sm:p-7 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100/70 border border-amber-200 text-amber-900 flex items-center justify-center">
            <MessageSquareHeart className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Retroalimentación del Usuario
            </h3>
            <p className="text-xs text-stone-500">
              Tu experiencia humana ayuda a validar y calibrar los resultados del modelo CNN
            </p>
          </div>
        </div>

        {isSaved && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-stone-500 hover:text-stone-800 font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Modificar</span>
          </button>
        )}
      </div>

      {isSaved ? (
        /* Saved Feedback Summary State */
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-amber-950 font-bold text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>¡Muchas gracias por tu retroalimentación!</span>
          </div>

          <p className="text-xs text-amber-900 leading-relaxed">
            Has calificado la detección como{' '}
            <strong className="font-semibold">
              {accuracy === 'exact'
                ? 'Muy precisa'
                : accuracy === 'close'
                ? 'Aproximada'
                : 'Diferente a lo sentido'}
            </strong>{' '}
            con una intensidad de <strong className="font-semibold">{intensityScore}/5</strong> (emoción indicada: {realEmotion}).
          </p>

          {notes && (
            <div className="p-3 bg-white/90 rounded-xl border border-amber-200/70 text-xs text-stone-700 italic">
              "{notes}"
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-amber-800 pt-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Datos guardados en tu sesión local para calibrar el historial emocional.</span>
          </div>
        </div>
      ) : (
        /* Form State */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question 1: Accuracy */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-800 block">
              1. ¿Qué tan acertada fue la emoción detectada por el modelo?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setAccuracy('exact');
                }}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  accuracy === 'exact'
                    ? 'bg-amber-100 border-amber-300 text-amber-950 shadow-2xs font-semibold ring-1 ring-amber-300'
                    : 'bg-[#fbf7f2] border-[#eadbc9] text-stone-700 hover:bg-[#f3e9db]'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5 text-amber-700" />
                <span>Muy precisa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setAccuracy('close');
                }}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  accuracy === 'close'
                    ? 'bg-orange-100 border-orange-300 text-orange-950 shadow-2xs font-semibold ring-1 ring-orange-300'
                    : 'bg-[#fbf7f2] border-[#eadbc9] text-stone-700 hover:bg-[#f3e9db]'
                }`}
              >
                <MinusCircle className="w-3.5 h-3.5 text-orange-600" />
                <span>Aproximada</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setAccuracy('different');
                }}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  accuracy === 'different'
                    ? 'bg-rose-100 border-rose-300 text-rose-950 shadow-2xs font-semibold ring-1 ring-rose-300'
                    : 'bg-[#fbf7f2] border-[#eadbc9] text-stone-700 hover:bg-[#f3e9db]'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                <span>Diferente</span>
              </button>
            </div>
          </div>

          {/* Question 2: Real Emotion Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-800 block">
              2. ¿Qué emoción sentías tú en el momento del escaneo?
            </label>
            <select
              value={realEmotion}
              onChange={(e) => setRealEmotion(e.target.value)}
              className="w-full text-xs font-medium text-stone-800 bg-[#fbf7f2] border border-[#eadbc9] rounded-2xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 cursor-pointer"
            >
              {EMOTION_OPTIONS.map((opt, i) => (
                <option key={i} value={opt.label}>
                  {opt.emoji} {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Question 3: Intensity Stars */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-stone-800">
                3. Intensidad real de tu emoción:
              </label>
              <span className="text-stone-500 font-medium">
                {intensityScore === 1 && 'Sutil / Leve'}
                {intensityScore === 2 && 'Suave'}
                {intensityScore === 3 && 'Moderada'}
                {intensityScore === 4 && 'Clara y definida'}
                {intensityScore === 5 && 'Muy intensa'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setIntensityScore(star);
                  }}
                  className="p-1 rounded-lg hover:bg-amber-100/50 transition-colors cursor-pointer"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= intensityScore
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Question 4: Notes (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-800 block">
              4. Comentarios o contexto personal (opcional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ejemplo: 'Estaba concentrado trabajando', 'Tenía una leve sonrisa pero me sentía cansado'..."
              rows={2}
              maxLength={300}
              className="w-full text-xs text-stone-800 bg-[#fbf7f2] border border-[#eadbc9] rounded-2xl p-3 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-50 font-semibold text-xs transition-colors cursor-pointer shadow-xs active:scale-98"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>Guardar Retroalimentación</span>
          </button>
        </form>
      )}
    </div>
  );
};
