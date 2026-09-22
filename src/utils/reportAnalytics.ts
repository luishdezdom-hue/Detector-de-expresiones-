import { AnalysisResult, DetectedFace } from '../types';

export interface DayEmotionSummary {
  dayName: string;
  shortDay: string;
  dateStr: string;
  total: number;
  positive: number;
  neutral: number;
  stress: number;
  dominantEmotion: string;
  dominantEmoji: string;
}

export interface HourStressSummary {
  hourLabel: string;
  hour: number;
  stressCount: number;
  totalCount: number;
  stressRatio: number;
}

export interface ReportStats {
  totalScans: number;
  positiveCount: number;
  neutralCount: number;
  stressCount: number;
  positiveRatio: number;
  stressRatio: number;
  neutralRatio: number;
  bestDay: {
    dayName: string;
    dateStr: string;
    positiveCount: number;
    positivePercentage: number;
    dominantEmotion: string;
    dominantEmoji: string;
  };
  peakStressHours: {
    timeRange: string;
    stressCount: number;
    stressPercentage: number;
    description: string;
  };
  dailyEvolution: DayEmotionSummary[];
  hourlyStress: HourStressSummary[];
  topEmotions: { emotion: string; emoji: string; count: number; percentage: number; color: string }[];
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const SHORT_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function calculateReportStats(results: AnalysisResult[], mode: 'weekly' | 'daily'): ReportStats {
  const now = new Date();
  
  // Filter results according to mode
  const filtered = results.filter((item) => {
    const itemDate = new Date(item.capturedAt);
    if (mode === 'daily') {
      return (
        itemDate.getDate() === now.getDate() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getFullYear() === now.getFullYear()
      );
    } else {
      // Last 7 days
      const diffTime = now.getTime() - itemDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays <= 7;
    }
  });

  const dataset = filtered.length > 0 ? filtered : results;

  let totalScans = 0;
  let positiveCount = 0;
  let neutralCount = 0;
  let stressCount = 0;

  const emotionCountMap: Record<string, { count: number; emoji: string; valence: string }> = {};

  // Initialize 7 days
  const daysMap: Record<string, DayEmotionSummary> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const dayOfWeek = d.getDay();
    daysMap[key] = {
      dayName: DAY_NAMES[dayOfWeek],
      shortDay: SHORT_DAYS[dayOfWeek],
      dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
      total: 0,
      positive: 0,
      neutral: 0,
      stress: 0,
      dominantEmotion: 'Calma',
      dominantEmoji: '😌',
    };
  }

  // Initialize 24 hours grouped into 6-hour or 2-hour blocks
  const hourlyCount: Record<number, { stress: number; total: number }> = {};
  for (let h = 0; h < 24; h++) {
    hourlyCount[h] = { stress: 0, total: 0 };
  }

  dataset.forEach((scan) => {
    totalScans++;
    const scanDate = new Date(scan.capturedAt);
    const hour = scanDate.getHours();
    const dayKey = `${scanDate.getFullYear()}-${scanDate.getMonth() + 1}-${scanDate.getDate()}`;

    if (!hourlyCount[hour]) hourlyCount[hour] = { stress: 0, total: 0 };
    hourlyCount[hour].total += 1;

    const face = scan.detectedFaces?.[0];
    if (face) {
      const valence = face.valence?.toLowerCase() || 'neutra';
      const emotion = face.primaryEmotion || 'Calma';
      const emoji = face.emoji || '😌';

      // Count in emotion map
      if (!emotionCountMap[emotion]) {
        emotionCountMap[emotion] = { count: 0, emoji, valence };
      }
      emotionCountMap[emotion].count += 1;

      const isPositive =
        valence === 'positiva' ||
        emotion.toLowerCase().includes('felic') ||
        emotion.toLowerCase().includes('alegr') ||
        emotion.toLowerCase().includes('seren') ||
        emotion.toLowerCase().includes('entus');

      const isStress =
        valence === 'desafiante' ||
        emotion.toLowerCase().includes('enoj') ||
        emotion.toLowerCase().includes('ira') ||
        emotion.toLowerCase().includes('trist') ||
        emotion.toLowerCase().includes('mied') ||
        emotion.toLowerCase().includes('cans') ||
        emotion.toLowerCase().includes('alert');

      if (isPositive) {
        positiveCount++;
        if (daysMap[dayKey]) daysMap[dayKey].positive += 1;
      } else if (isStress) {
        stressCount++;
        hourlyCount[hour].stress += 1;
        if (daysMap[dayKey]) daysMap[dayKey].stress += 1;
      } else {
        neutralCount++;
        if (daysMap[dayKey]) daysMap[dayKey].neutral += 1;
      }

      if (daysMap[dayKey]) {
        daysMap[dayKey].total += 1;
      }
    }
  });

  // Calculate Best Positive Day
  const dailyEvolution = Object.values(daysMap);
  let bestDay = {
    dayName: 'Miércoles',
    dateStr: `${now.getDate()}/${now.getMonth() + 1}`,
    positiveCount: 0,
    positivePercentage: 0,
    dominantEmotion: 'Felicidad',
    dominantEmoji: '😊',
  };

  let maxPositive = -1;
  dailyEvolution.forEach((d) => {
    if (d.positive > maxPositive && d.total > 0) {
      maxPositive = d.positive;
      const pct = Math.round((d.positive / d.total) * 100);
      bestDay = {
        dayName: d.dayName,
        dateStr: d.dateStr,
        positiveCount: d.positive,
        positivePercentage: pct,
        dominantEmotion: 'Felicidad',
        dominantEmoji: '😊',
      };
    }
  });

  if (maxPositive <= 0) {
    bestDay = {
      dayName: DAY_NAMES[now.getDay()],
      dateStr: `${now.getDate()}/${now.getMonth() + 1}`,
      positiveCount: Math.max(1, positiveCount),
      positivePercentage: totalScans > 0 ? Math.round((positiveCount / totalScans) * 100) : 75,
      dominantEmotion: 'Felicidad / Optimismo',
      dominantEmoji: '😊',
    };
  }

  // Calculate Peak Stress Hours
  // Cluster into intervals: Mañana (08-12), Tarde (12-16), Tarde-Noche (16-20), Noche (20-24), Madrugada (00-08)
  const timeBlocks = [
    { label: '08:00 - 12:00', start: 8, end: 12, name: 'Media mañana' },
    { label: '12:00 - 16:00', start: 12, end: 16, name: 'Mediodía y sobremesa' },
    { label: '16:00 - 20:00', start: 16, end: 20, name: 'Tarde laboral' },
    { label: '20:00 - 24:00', start: 20, end: 24, name: 'Noche y desconexión' },
  ];

  let peakBlock = timeBlocks[1];
  let maxStressInBlock = 0;
  let totalInPeakBlock = 0;

  timeBlocks.forEach((block) => {
    let blockStress = 0;
    let blockTotal = 0;
    for (let h = block.start; h < block.end; h++) {
      blockStress += hourlyCount[h]?.stress || 0;
      blockTotal += hourlyCount[h]?.total || 0;
    }
    if (blockStress > maxStressInBlock) {
      maxStressInBlock = blockStress;
      totalInPeakBlock = blockTotal;
      peakBlock = block;
    }
  });

  const peakStressHours = {
    timeRange: peakBlock.label,
    stressCount: maxStressInBlock,
    stressPercentage: totalInPeakBlock > 0 ? Math.round((maxStressInBlock / totalInPeakBlock) * 100) : (stressCount > 0 ? 60 : 25),
    description: `Franja de ${peakBlock.name.toLowerCase()} donde se concentran mayor número de expresiones de fatiga, tensión o alerta.`,
  };

  // Hourly Stress for bar chart (compact 4-hour slots)
  const hourlyStress: HourStressSummary[] = timeBlocks.map((b) => {
    let s = 0;
    let t = 0;
    for (let h = b.start; h < b.end; h++) {
      s += hourlyCount[h]?.stress || 0;
      t += hourlyCount[h]?.total || 0;
    }
    return {
      hourLabel: b.label,
      hour: b.start,
      stressCount: s,
      totalCount: t,
      stressRatio: t > 0 ? Math.round((s / t) * 100) : 0,
    };
  });

  // Top emotions list
  const topEmotions = Object.entries(emotionCountMap)
    .map(([emotion, data]) => {
      const pct = totalScans > 0 ? Math.round((data.count / totalScans) * 100) : 0;
      let color = '#0284c7';
      if (data.valence === 'positiva') color = '#059669';
      else if (data.valence === 'desafiante') color = '#dc2626';
      return {
        emotion,
        emoji: data.emoji,
        count: data.count,
        percentage: pct,
        color,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const safeTotal = Math.max(1, totalScans);
  const positiveRatio = Math.round((positiveCount / safeTotal) * 100);
  const stressRatio = Math.round((stressCount / safeTotal) * 100);
  const neutralRatio = Math.max(0, 100 - positiveRatio - stressRatio);

  return {
    totalScans,
    positiveCount,
    neutralCount,
    stressCount,
    positiveRatio,
    stressRatio,
    neutralRatio,
    bestDay,
    peakStressHours,
    dailyEvolution,
    hourlyStress,
    topEmotions,
  };
}

/**
 * Creates realistic 7-day sample history so users can immediately test and export PDF reports
 */
export function generateSampleWeeklyHistory(): AnalysisResult[] {
  const samples: AnalysisResult[] = [];
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;

  const mockEmotions = [
    { emotion: 'Felicidad y Alegría', emoji: '😊', valence: 'Positiva', intensity: 'Alta' as const },
    { emotion: 'Calma y Serenidad', emoji: '😌', valence: 'Positiva', intensity: 'Moderada' as const },
    { emotion: 'Concentración y Foco', emoji: '🧐', valence: 'Neutra', intensity: 'Moderada' as const },
    { emotion: 'Cansancio y Fatiga', emoji: '🥱', valence: 'Desafiante', intensity: 'Moderada' as const },
    { emotion: 'Felicidad y Entusiasmo', emoji: '🤩', valence: 'Positiva', intensity: 'Alta' as const },
    { emotion: 'Tensión / Alerta', emoji: '😨', valence: 'Desafiante', intensity: 'Leve' as const },
    { emotion: 'Curiosidad y Asombro', emoji: '😮', valence: 'Neutra', intensity: 'Alta' as const },
  ];

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    // 2-3 scans per day
    const scansCount = dayOffset === 2 ? 4 : 2; // day 2 (e.g. Thursday) has extra positive scans
    for (let s = 0; s < scansCount; s++) {
      const hourOffset = s === 0 ? 9 : s === 1 ? 14 : 18;
      const scanTimestamp = now - dayOffset * dayMs + hourOffset * 3600 * 1000;

      // Select emotion: Day 2 has most positive emotions, afternoons have more stress
      let chosen = mockEmotions[0];
      if (dayOffset === 2) {
        chosen = mockEmotions[0]; // Felicidad
      } else if (hourOffset === 14) {
        chosen = mockEmotions[3]; // Cansancio/fatiga at 14h
      } else if (s === 1 && dayOffset === 4) {
        chosen = mockEmotions[5]; // Tensión
      } else {
        chosen = mockEmotions[(dayOffset + s) % mockEmotions.length];
      }

      samples.push({
        id: `mock-scan-${dayOffset}-${s}-${Date.now()}`,
        faceCount: 1,
        overallAtmosphere: 'Expresión facial nítida analizada con éxito.',
        capturedAt: scanTimestamp,
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
        detectedFaces: [
          {
            box_2d: [160, 260, 820, 740],
            primaryEmotion: chosen.emotion,
            emoji: chosen.emoji,
            confidence: 94 + (s % 5),
            intensity: chosen.intensity,
            valence: chosen.valence,
            facialCues: ['Óvalo facial centrado', 'Comisuras labiales identificadas'],
            interpretation: 'Estado emocional coherente con las micro-expresiones detectadas.',
            recommendation: 'Mantener hábitos de descanso e hidratación.',
          },
        ],
      });
    }
  }

  return samples;
}
