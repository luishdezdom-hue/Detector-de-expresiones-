export interface SecondaryEmotion {
  emotion: string;
  percentage: number;
}

export interface CnnProbability {
  emotion: string;
  label: string;
  probability: number;
  emoji: string;
  color: string;
  bgLight: string;
  borderLight: string;
}

export interface CnnAnalysisDetails {
  framework: string; // "TensorFlow.js & Keras"
  architecture: string; // "Mini-Xception Residual CNN"
  inputShape: string; // "[1, 48, 48, 1]"
  inferenceTimeMs: number;
  classProbabilities: CnnProbability[];
  featureMapsSummary: string;
  dominantClass: string;
}

export interface UserFeedback {
  id: string;
  accuracy: 'exact' | 'close' | 'different';
  realEmotion: string;
  intensityScore: number; // 1 to 5
  notes?: string;
  submittedAt: number;
}

export interface DetectedFace {
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  primaryEmotion: string;
  emoji: string;
  confidence: number;
  intensity: 'Leve' | 'Moderada' | 'Alta' | string;
  valence: 'Positiva' | 'Neutra' | 'Desafiante' | string;
  secondaryEmotions?: SecondaryEmotion[];
  facialCues: string[];
  interpretation: string;
  recommendation: string;
  cnnDetails?: CnnAnalysisDetails;
}

export interface AnalysisResult {
  id: string;
  faceCount: number;
  overallAtmosphere: string;
  detectedFaces: DetectedFace[];
  capturedAt: number;
  imageUrl: string;
  feedback?: UserFeedback;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export interface EmotionGuideItem {
  id: string;
  name: string;
  emoji: string;
  colorName: string;
  badgeBg: string;
  badgeText: string;
  cardBg: string;
  borderAccent: string;
  tagline: string;
  evolutionaryPurpose: string;
  facsUnits: { code: string; muscle: string; description: string }[];
  physicalSensations: string[];
  cognitiveEffects: string;
  regulationTips: string[];
  themeGradient?: string;
  pillUnselected?: string;
  pillSelected?: string;
  accentColor?: string;
  innerCardBg?: string;
  regulationBg?: string;
  tipCardBg?: string;
}
