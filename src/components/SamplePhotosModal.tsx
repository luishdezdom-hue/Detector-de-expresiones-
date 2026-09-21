import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { SAMPLE_IMAGES, SampleImage } from '../utils/sampleData';

interface SamplePhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleImage) => void;
}

export const SamplePhotosModal: React.FC<SamplePhotosModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-[#fffdf9] rounded-2xl border border-[#ede4d6] shadow-xl max-w-lg w-full overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-[#ede4d6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h3 className="text-base font-semibold text-stone-900">
              Rostros de Muestra para Probar
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-[#fbf7f2] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs text-stone-600 mb-4">
            Selecciona cualquiera de estas expresiones para probar el reconocimiento de emociones al instante sin necesidad de activar tu cámara:
          </p>

          <div className="grid grid-cols-2 gap-3">
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  onSelectSample(sample);
                  onClose();
                }}
                className="group relative rounded-xl border border-[#eadbc9] overflow-hidden text-left hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer bg-[#fbf7f2]"
              >
                <div className="aspect-4/3 w-full overflow-hidden bg-stone-950">
                  <img
                    src={sample.url}
                    alt={sample.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{sample.emoji}</span>
                    <span className="text-xs font-semibold text-stone-800 truncate">
                      {sample.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block mt-0.5">
                    {sample.emotionPreview}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-[#fbf7f2] border-t border-[#ede4d6] text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
