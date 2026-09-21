import React, { useRef } from 'react';
import { Camera, Play, Pause, Upload, Volume2, VolumeX, Sparkles, Image as ImageIcon } from 'lucide-react';
import { soundFx } from '../utils/sound';

interface IntuitiveControlsProps {
  onTriggerScan: () => void;
  isAnalyzing: boolean;
  isAutoScan: boolean;
  onToggleAutoScan: () => void;
  onUploadImage: (imageDataUrl: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSamples: () => void;
  autoScanCountdown: number;
}

export const IntuitiveControls: React.FC<IntuitiveControlsProps> = ({
  onTriggerScan,
  isAnalyzing,
  isAutoScan,
  onToggleAutoScan,
  onUploadImage,
  soundEnabled,
  onToggleSound,
  onOpenSamples,
  autoScanCountdown,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playClick();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUploadImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="w-full bg-[#fffdf9] rounded-2xl border border-[#ede4d6] p-4 sm:p-5 shadow-xs transition-all">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        {/* Main Action Button: Escanear Emoción */}
        <button
          type="button"
          id="btn-scan-emotion"
          disabled={isAnalyzing}
          onClick={() => {
            soundFx.playClick();
            onTriggerScan();
          }}
          className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-medium text-sm sm:text-base text-white transition-all cursor-pointer select-none active:scale-[0.98] ${
            isAnalyzing
              ? 'bg-stone-300 cursor-not-allowed'
              : 'bg-stone-900 hover:bg-stone-800 shadow-sm hover:shadow-md text-amber-50'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              <span>Detectando emociones...</span>
            </>
          ) : (
            <>
              <Camera className="w-5 h-5 text-amber-400" />
              <span className="font-semibold">Escanear Emoción</span>
              <Sparkles className="w-4 h-4 text-amber-300 ml-0.5 opacity-90" />
            </>
          )}
        </button>

        {/* Secondary Intuitive Controls */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {/* Auto-Scan Toggle Button */}
          <button
            type="button"
            id="btn-auto-scan"
            onClick={() => {
              soundFx.playClick();
              onToggleAutoScan();
            }}
            title={isAutoScan ? 'Detener escaneo automático' : 'Activar escaneo continuo cada 4 segundos'}
            className={`flex items-center gap-2 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
              isAutoScan
                ? 'bg-amber-100 border-amber-300 text-amber-950 shadow-xs'
                : 'bg-[#fbf7f2] hover:bg-[#f3e9db] border-[#eadbc9] text-stone-700'
            }`}
          >
            {isAutoScan ? (
              <>
                <Pause className="w-4 h-4 text-amber-700" />
                <span className="hidden xs:inline">Auto</span>
                <span className="w-4 h-4 rounded-full bg-amber-700 text-white text-[10px] flex items-center justify-center font-mono font-bold">
                  {autoScanCountdown}s
                </span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-stone-500" />
                <span>Modo Auto</span>
              </>
            )}
          </button>

          {/* Upload Image Button */}
          <button
            type="button"
            id="btn-upload-photo"
            onClick={() => {
              soundFx.playClick();
              fileInputRef.current?.click();
            }}
            title="Subir imagen desde tu galería o archivo"
            className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium bg-[#fbf7f2] hover:bg-[#f3e9db] border border-[#eadbc9] text-stone-700 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-stone-500" />
            <span>Subir</span>
          </button>

          {/* Sample Faces Button */}
          <button
            type="button"
            id="btn-sample-faces"
            onClick={() => {
              soundFx.playClick();
              onOpenSamples();
            }}
            title="Probar rostros y emociones de muestra"
            className="flex items-center gap-1.5 px-3 py-3 rounded-xl text-xs sm:text-sm font-medium bg-[#fbf7f2] hover:bg-[#f3e9db] border border-[#eadbc9] text-stone-700 transition-all cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-stone-500" />
            <span className="hidden sm:inline">Ejemplos</span>
          </button>

          {/* Sound Mute/Unmute */}
          <button
            type="button"
            id="btn-toggle-sound"
            onClick={() => {
              soundFx.playClick();
              onToggleSound();
            }}
            title={soundEnabled ? 'Silenciar sonidos de detección' : 'Activar sonido de detección'}
            className="p-3 rounded-xl text-stone-600 hover:text-stone-900 bg-[#fbf7f2] hover:bg-[#f3e9db] border border-[#eadbc9] transition-all cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-700" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
