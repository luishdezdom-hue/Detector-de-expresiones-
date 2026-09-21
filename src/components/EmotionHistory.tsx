import React from 'react';
import { History, Trash2, Clock } from 'lucide-react';
import { AnalysisResult } from '../types';

interface EmotionHistoryProps {
  history: AnalysisResult[];
  onSelectResult: (item: AnalysisResult) => void;
  onClearHistory: () => void;
  selectedId: string | null;
}

export const EmotionHistory: React.FC<EmotionHistoryProps> = ({
  history,
  onSelectResult,
  onClearHistory,
  selectedId,
}) => {
  if (history.length === 0) {
    return null;
  }

  // Format time (HH:MM:SS)
  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="bg-[#fffdf9] rounded-2xl border border-[#ede4d6] p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-700" />
          <h3 className="text-sm font-semibold text-stone-800">
            Historial de Detecciones ({history.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={onClearHistory}
          className="text-xs text-stone-400 hover:text-rose-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          <span>Limpiar</span>
        </button>
      </div>

      {/* Horizontal scrolling strip */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {history.map((item) => {
          const face = item.detectedFaces[0];
          const isSelected = item.id === selectedId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectResult(item)}
              className={`shrink-0 flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-100/70 border-amber-300 ring-1 ring-amber-300 shadow-2xs'
                  : 'bg-[#fbf7f2] hover:bg-[#f3e9db] border-[#eadbc9]'
              }`}
            >
              {/* Thumbnail */}
              {item.imageUrl ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-950 shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={face?.primaryEmotion || 'Captura'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#ebdcc9] flex items-center justify-center text-lg shrink-0">
                  {face?.emoji || '😐'}
                </div>
              )}

              {/* Info */}
              <div className="pr-1.5 min-w-[70px]">
                <div className="flex items-center gap-1">
                  <span className="text-xs">{face?.emoji}</span>
                  <span className="text-xs font-semibold text-stone-800 truncate max-w-[80px]">
                    {face?.primaryEmotion || 'Sin rostro'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{formatTime(item.capturedAt)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
