import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquareHeart,
  Send,
  Sparkles,
  Wind,
  Smile,
  HeartHandshake,
  ArrowLeft,
  Bot,
  User,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { AnalysisResult, DetectedFace } from '../types';
import { soundFx } from '../utils/sound';

export interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: number;
  actionType?: 'support' | 'breathing' | 'motivation' | 'general';
  showBreathingPrompt?: boolean;
}

interface EmotionChatbotProps {
  currentResult: AnalysisResult | null;
  onBackToCamera: () => void;
}

interface EmotionPreset {
  id: string;
  name: string;
  emoji: string;
  badgeColor: string;
  borderColor: string;
  tag: string;
  initialMessage: string;
  suggestedPrompts: string[];
}

const PRESET_EMOTIONS: EmotionPreset[] = [
  {
    id: 'tristeza',
    name: 'Tristeza',
    emoji: '😔',
    badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    borderColor: 'border-indigo-400',
    tag: 'Apoyo y Escucha Empática',
    initialMessage:
      'Percibo tristeza o melancolía en tu expresión. Quiero que sepas que todas tus emociones son válidas y está bien no estar bien. Estoy aquí para acompañarte sin juzgar. ¿Te gustaría desahogarte o prefieres que conversemos de algo reconfortante?',
    suggestedPrompts: [
      'Necesito desahogarme un poco',
      'Me siento con desánimo hoy',
      'Dame unas palabras de consuelo',
      '¿Qué puedo hacer cuando me siento triste?',
    ],
  },
  {
    id: 'estres',
    name: 'Estrés',
    emoji: '😰',
    badgeColor: 'bg-rose-50 text-rose-900 border-rose-200',
    borderColor: 'border-rose-400',
    tag: 'Ejercicios de Respiración Guiada',
    initialMessage:
      'Detecto signos de estrés o tensión en tus micro-expresiones faciales. La tensión suele acumularse en la mandíbula y los hombros. ¿Te gustaría que hagamos una pausa guiada de respiración 4-7-8 para calmar tu sistema nervioso?',
    suggestedPrompts: [
      'Guiar ejercicio de respiración 4-7-8',
      'Siento mucha tensión y sobrecarga',
      'Técnicas rápidas para bajar el ritmo',
      '¿Cómo relajar la mandíbula y hombros?',
    ],
  },
  {
    id: 'felicidad',
    name: 'Felicidad',
    emoji: '😊',
    badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    borderColor: 'border-emerald-400',
    tag: 'Mensajes Motivadores y Vitalidad',
    initialMessage:
      '¡Qué gran energía percibo en tu rostro! La sonrisa y la mirada despejada reflejan bienestar y optimismo. Es el momento perfecto para fijar metas, celebrar tus logros y potenciar tu día. ¿Qué te hace sentir tan bien hoy?',
    suggestedPrompts: [
      'Dame un mensaje motivador para hoy',
      '¿Cómo aprovechar esta energía positiva?',
      'Quiero inspirar a mi equipo',
      'Reflexión sobre la gratitud',
    ],
  },
  {
    id: 'calma',
    name: 'Calma / Neutral',
    emoji: '😌',
    badgeColor: 'bg-sky-50 text-sky-900 border-sky-200',
    borderColor: 'border-sky-400',
    tag: 'Atención Plena y Claridad',
    initialMessage:
      'Veo un estado de calma, serenidad y balance en tus facciones. Mantener la mente despejada es un gran pilar para la concentración. ¿En qué te gustaría enfocarte o de qué quieres conversar?',
    suggestedPrompts: [
      '¿Cómo mantener este equilibrio mental?',
      'Un ejercicio de atención plena (mindfulness)',
      'Consejo para mantener el foco en el trabajo',
      '¿Qué revelan mis facciones serenas?',
    ],
  },
];

export const EmotionChatbot: React.FC<EmotionChatbotProps> = ({
  currentResult,
  onBackToCamera,
}) => {
  // Determine starting emotion from previous face analysis if available
  const initialEmotionId = (() => {
    if (!currentResult?.detectedFaces?.[0]) return 'tristeza';
    const primary = currentResult.detectedFaces[0].primaryEmotion.toLowerCase();
    const valence = (currentResult.detectedFaces[0].valence || '').toLowerCase();

    if (primary.includes('trist') || primary.includes('pena') || primary.includes('melanc')) {
      return 'tristeza';
    }
    if (
      primary.includes('estr') ||
      primary.includes('tensi') ||
      primary.includes('ansie') ||
      primary.includes('enoj') ||
      primary.includes('ira') ||
      primary.includes('fatig') ||
      valence === 'desafiante'
    ) {
      return 'estres';
    }
    if (
      primary.includes('felic') ||
      primary.includes('alegr') ||
      primary.includes('entus') ||
      valence === 'positiva'
    ) {
      return 'felicidad';
    }
    return 'calma';
  })();

  const [activeEmotionId, setActiveEmotionId] = useState<string>(initialEmotionId);
  const activePreset = PRESET_EMOTIONS.find((p) => p.id === activeEmotionId) || PRESET_EMOTIONS[0];

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-init-1',
      sender: 'assistant',
      text: activePreset.initialMessage,
      timestamp: Date.now(),
      actionType:
        activeEmotionId === 'tristeza'
          ? 'support'
          : activeEmotionId === 'estres'
          ? 'breathing'
          : 'motivation',
      showBreathingPrompt: activeEmotionId === 'estres',
    },
  ]);

  const [inputVal, setInputVal] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Breathing Exercise Interactive Widget State
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<'Inhala' | 'Retén' | 'Exhala'>('Inhala');
  const [breathingSeconds, setBreathingSeconds] = useState<number>(4);
  const [breathingCycles, setBreathingCycles] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle emotion preset change
  const handleSelectEmotion = (presetId: string) => {
    soundFx.playClick();
    setActiveEmotionId(presetId);
    const newPreset = PRESET_EMOTIONS.find((p) => p.id === presetId) || PRESET_EMOTIONS[0];

    // Add notification and initial message for the new emotion
    setMessages((prev) => [
      ...prev,
      {
        id: `switch-${Date.now()}`,
        sender: 'assistant',
        text: `Cambiando sintonía a: ${newPreset.emoji} ${newPreset.name} (${newPreset.tag}).\n\n${newPreset.initialMessage}`,
        timestamp: Date.now(),
        actionType:
          presetId === 'tristeza'
            ? 'support'
            : presetId === 'estres'
            ? 'breathing'
            : 'motivation',
        showBreathingPrompt: presetId === 'estres',
      },
    ]);
  };

  // Breathing Exercise Loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBreathingActive) {
      // 4-7-8 Breathing Technique: Inhale 4s, Hold 7s, Exhale 8s
      timer = setInterval(() => {
        setBreathingSeconds((prevSec) => {
          if (prevSec <= 1) {
            setBreathingPhase((prevPhase) => {
              if (prevPhase === 'Inhala') {
                return 'Retén';
              } else if (prevPhase === 'Retén') {
                return 'Exhala';
              } else {
                setBreathingCycles((c) => c + 1);
                return 'Inhala';
              }
            });

            // Set duration for the next phase
            if (breathingPhase === 'Inhala') return 7; // Next is Retén (7s)
            if (breathingPhase === 'Retén') return 8; // Next is Exhala (8s)
            return 4; // Next is Inhala (4s)
          }
          return prevSec - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isBreathingActive, breathingPhase]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputVal).trim();
    if (!messageText || isTyping) return;

    soundFx.playClick();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputVal('');
    setIsTyping(true);

    // If user asked explicitly for breathing, activate widget
    const lower = messageText.toLowerCase();
    const wantsBreathing =
      lower.includes('respir') ||
      lower.includes('4-7-8') ||
      lower.includes('relajar') ||
      lower.includes('calmar');

    if (wantsBreathing && activeEmotionId === 'estres') {
      setIsBreathingActive(true);
    }

    try {
      // Format chat history for endpoint
      const historyPayload = messages.slice(-5).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          detectedEmotion: activePreset.name,
          emotionValence:
            activeEmotionId === 'tristeza' || activeEmotionId === 'estres'
              ? 'Desafiante'
              : activeEmotionId === 'felicidad'
              ? 'Positiva'
              : 'Equilibrada',
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error('Error en respuesta del servidor');
      }

      const data = await res.json();
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: Date.now(),
        actionType: data.actionType || 'general',
        showBreathingPrompt: activeEmotionId === 'estres' || wantsBreathing,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.warn('Fallback response for chat:', err);

      // Local graceful fallback response
      let fallbackText = '';
      if (activeEmotionId === 'tristeza') {
        fallbackText =
          'Te escucho con atención y respeto. La tristeza muchas veces nos señala que algo importante nos ha conmovido o que necesitamos descanso emocional. No te apresures en sentirte mejor; date el permiso de procesarlo paso a paso. Estoy aquí para acompañarte.';
      } else if (activeEmotionId === 'estres') {
        fallbackText =
          'Siento esa tensión. Recuerda que no tienes que resolver todo en este segundo. Tomemos una respiración profunda juntos: llena los pulmones lentamente, suelta la presión del cuello y deja ir el aire por la boca como un suspiro.';
      } else if (activeEmotionId === 'felicidad') {
        fallbackText =
          '¡Esa es la actitud! Disfruta al máximo este estado. Cuando estamos alegres, nuestro cerebro crea mejores conexiones y nos sentimos con mayor fuerza. ¡Aprovéchala para dar un paso adelante en tus propósitos!';
      } else {
        fallbackText =
          'Gracias por compartirlo. Mantener la claridad y el balance emocional te ayuda a tomar mejores decisiones en tu día a día.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-fallback-${Date.now()}`,
          sender: 'assistant',
          text: fallbackText,
          timestamp: Date.now(),
          actionType:
            activeEmotionId === 'tristeza'
              ? 'support'
              : activeEmotionId === 'estres'
              ? 'breathing'
              : 'motivation',
          showBreathingPrompt: activeEmotionId === 'estres',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full space-y-5 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#fffdf9] p-4 sm:p-5 rounded-3xl border border-[#ede4d6] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCamera}
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-[#fbf7f2] border border-[#eadbc9] transition-colors cursor-pointer"
            title="Volver a la cámara"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
              <MessageSquareHeart className="w-5 h-5 text-rose-500" />
              <span>Asistente Conversacional Inteligente</span>
            </h2>
            <p className="text-xs text-stone-500">
              Respuestas calibradas según la emoción facial detectada en tiempo real
            </p>
          </div>
        </div>

        {/* Emotion Indicator Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-stone-500 hidden sm:inline">
            Emoción activa:
          </span>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs ${activePreset.badgeColor}`}
          >
            <span className="text-base">{activePreset.emoji}</span>
            <span>{activePreset.name}</span>
          </div>
        </div>
      </div>

      {/* 2. Emotion Context Selector Chips */}
      <div className="bg-[#fffdf9] p-3.5 rounded-2xl border border-[#ede4d6] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Sintonizar Contexto Emocional:</span>
        </span>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {PRESET_EMOTIONS.map((preset) => {
            const isSelected = preset.id === activeEmotionId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectEmotion(preset.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  isSelected
                    ? `${preset.badgeColor} border-current shadow-2xs scale-105`
                    : 'bg-[#fbf7f2] text-stone-700 border-[#eadbc9] hover:bg-[#f5ecdf]'
                }`}
              >
                <span>{preset.emoji}</span>
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. INTERACTIVE BREATHING EXERCISE WIDGET (Appears for Estrés or when requested) */}
      {(activeEmotionId === 'estres' || isBreathingActive) && (
        <div className="bg-gradient-to-br from-rose-50/90 via-[#fffdf9] to-amber-50/80 p-5 rounded-3xl border border-rose-200/90 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-2xs">
                <Wind className="w-5 h-5 text-rose-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <span>Ejercicio de Respiración Antiestrés (4-7-8)</span>
                  <span className="text-[10px] font-semibold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-md">
                    Guía Activa
                  </span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  Reduce el cortisol y la tensión muscular facial mediante control respiratorio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsBreathingActive(!isBreathingActive);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                {isBreathingActive ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Iniciar Guía</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setBreathingPhase('Inhala');
                  setBreathingSeconds(4);
                  setBreathingCycles(0);
                }}
                className="p-1.5 rounded-xl bg-white border border-[#eadbc9] text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                title="Reiniciar ciclo"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Visual Breathing Circle animation */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative flex items-center justify-center w-36 h-36">
              {/* Outer pulsing ring */}
              <div
                className={`absolute inset-0 rounded-full border-2 border-rose-300 transition-all duration-1000 ${
                  isBreathingActive && breathingPhase === 'Inhala'
                    ? 'scale-125 border-rose-400 opacity-80'
                    : isBreathingActive && breathingPhase === 'Retén'
                    ? 'scale-120 border-amber-400 opacity-90'
                    : 'scale-95 border-rose-200 opacity-40'
                }`}
              />
              {/* Inner glowing sphere */}
              <div
                className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-1000 shadow-md ${
                  breathingPhase === 'Inhala'
                    ? 'bg-rose-500 text-white scale-110'
                    : breathingPhase === 'Retén'
                    ? 'bg-amber-500 text-white scale-105'
                    : 'bg-emerald-500 text-white scale-90'
                }`}
              >
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  {breathingPhase}
                </span>
                <span className="text-2xl font-black font-mono mt-0.5">
                  {breathingSeconds}s
                </span>
              </div>
            </div>

            {/* Instruction Steps */}
            <div className="space-y-1.5 text-xs max-w-xs">
              <div
                className={`p-2 rounded-xl border transition-all ${
                  breathingPhase === 'Inhala'
                    ? 'bg-rose-100/90 border-rose-300 text-rose-950 font-bold shadow-2xs'
                    : 'bg-white/70 border-[#eadbc9] text-stone-600'
                }`}
              >
                1. <strong>Inhala</strong> por la nariz suavemente (4s)
              </div>
              <div
                className={`p-2 rounded-xl border transition-all ${
                  breathingPhase === 'Retén'
                    ? 'bg-amber-100/90 border-amber-300 text-amber-950 font-bold shadow-2xs'
                    : 'bg-white/70 border-[#eadbc9] text-stone-600'
                }`}
              >
                2. <strong>Retén</strong> el aire y relaja los hombros (7s)
              </div>
              <div
                className={`p-2 rounded-xl border transition-all ${
                  breathingPhase === 'Exhala'
                    ? 'bg-emerald-100/90 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                    : 'bg-white/70 border-[#eadbc9] text-stone-600'
                }`}
              >
                3. <strong>Exhala</strong> por la boca vaciando el pecho (8s)
              </div>
              <div className="text-[11px] text-stone-400 text-right pt-0.5">
                Ciclos completados: <span className="font-mono font-bold text-stone-700">{breathingCycles}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CHAT CONVERSATION WINDOW */}
      <div className="bg-[#fffdf9] rounded-3xl border border-[#ede4d6] shadow-xs flex flex-col h-[480px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-stone-900 text-stone-50 rounded-tr-xs shadow-xs'
                      : 'bg-[#fbf7f2] text-stone-800 border border-[#eadbc9] rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Special contextual action triggers inside bot message */}
                  {!isUser && msg.actionType === 'breathing' && (
                    <div className="mt-2.5 pt-2 border-t border-[#eadbc9]/80 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playClick();
                          setIsBreathingActive(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Wind className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hacer ejercicio de respiración</span>
                      </button>
                    </div>
                  )}

                  {!isUser && msg.actionType === 'support' && (
                    <div className="mt-2.5 pt-2 border-t border-[#eadbc9]/80 flex items-center gap-1 text-[11px] text-indigo-700 font-medium">
                      <HeartHandshake className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Espacio seguro para desahogo y escucha compasiva</span>
                    </div>
                  )}

                  {!isUser && msg.actionType === 'motivation' && (
                    <div className="mt-2.5 pt-2 border-t border-[#eadbc9]/80 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Refuerzo positivo y motivación activa</span>
                    </div>
                  )}

                  <span className="text-[10px] text-stone-400 mt-1 block text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-start gap-2.5 justify-start animate-in fade-in duration-150">
              <div className="w-8 h-8 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#fbf7f2] border border-[#eadbc9] rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-stone-500 flex items-center gap-2 shadow-2xs">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>El asistente está calibrando su respuesta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Reply Chips */}
        <div className="px-4 py-2 bg-[#fbf7f2] border-t border-[#ede4d6] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-stone-500 shrink-0">Sugerencias:</span>
          {activePreset.suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] bg-white hover:bg-stone-100 text-stone-700 px-3 py-1 rounded-full border border-[#eadbc9] whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 bg-[#fffdf9] border-t border-[#ede4d6]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Escribe un mensaje en sintonía con ${activePreset.name}...`}
              className="flex-1 bg-[#fbf7f2] text-stone-900 placeholder:text-stone-400 px-4 py-2.5 rounded-xl border border-[#eadbc9] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputVal.trim() || isTyping}
              className={`p-2.5 rounded-xl text-white transition-all cursor-pointer shadow-xs ${
                inputVal.trim() && !isTyping
                  ? 'bg-stone-900 hover:bg-stone-800 active:scale-95'
                  : 'bg-stone-300 cursor-not-allowed'
              }`}
              title="Enviar mensaje"
            >
              <Send className="w-4 h-4 text-amber-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
