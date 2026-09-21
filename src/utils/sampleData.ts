export interface SampleImage {
  id: string;
  name: string;
  emotionPreview: string;
  emoji: string;
  url: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sample-happy',
    name: 'Sonrisa Radiante',
    emotionPreview: 'Felicidad / Alegría',
    emoji: '😊',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-surprise',
    name: 'Gesto de Asombro',
    emotionPreview: 'Sorpresa / Admiración',
    emoji: '😮',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-calm',
    name: 'Expresión Serena',
    emotionPreview: 'Calma / Paz',
    emoji: '😌',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-focus',
    name: 'Pensativo y Atento',
    emotionPreview: 'Concentración / Curiosidad',
    emoji: '🧐',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
  },
];
