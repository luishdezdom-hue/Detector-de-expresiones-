import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Smile,
  Zap,
  Activity,
  ArrowLeft,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AnalysisResult } from '../types';
import {
  calculateReportStats,
  generateSampleWeeklyHistory,
  ReportStats,
} from '../utils/reportAnalytics';
import { soundFx } from '../utils/sound';

interface EmotionReportsProps {
  history: AnalysisResult[];
  onLoadSampleHistory: (samples: AnalysisResult[]) => void;
  onBackToCamera: () => void;
}

export const EmotionReports: React.FC<EmotionReportsProps> = ({
  history,
  onLoadSampleHistory,
  onBackToCamera,
}) => {
  const [reportMode, setReportMode] = useState<'weekly' | 'daily'>('weekly');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Compute statistics based on current mode
  const stats: ReportStats = useMemo(() => {
    return calculateReportStats(history, reportMode);
  }, [history, reportMode]);

  // Export to PDF handler
  const handleExportPDF = async () => {
    const reportElement = document.getElementById('printable-report-card');
    if (!reportElement) return;

    soundFx.playClick();
    setIsExporting(true);
    setExportSuccess(false);

    try {
      // 1. Capture report element with high resolution
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#fffdfa',
        windowWidth: 1200,
      });

      // 2. Generate PDF using jsPDF (A4 standard)
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Subsequent pages if content overflows A4
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `Reporte_Emocional_${reportMode === 'weekly' ? 'Semanal' : 'Diario'}_${dateStr}.pdf`;
      pdf.save(fileName);

      soundFx.playSuccess();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePopulateSampleHistory = () => {
    soundFx.playClick();
    const samples = generateSampleWeeklyHistory();
    onLoadSampleHistory(samples);
  };

  // Custom tooltips for recharts
  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-stone-900/95 backdrop-blur-xs text-stone-100 p-3 rounded-xl text-xs shadow-lg border border-stone-700/80 pointer-events-none">
          <p className="font-bold text-amber-200 mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px] my-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* 1. Header Toolbar with Controls */}
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
              <FileText className="w-5 h-5 text-amber-600" />
              <span>Reportes y Estadísticas Emocionales</span>
            </h2>
            <p className="text-xs text-stone-500">
              Análisis biométrico semanal y diario de micro-expresiones faciales
            </p>
          </div>
        </div>

        {/* Action Buttons: Mode Selector + PDF Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-xl bg-[#f7efe3] p-1 border border-[#e8dbca]">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setReportMode('weekly');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                reportMode === 'weekly'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              Semanal
            </button>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setReportMode('daily');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                reportMode === 'daily'
                  ? 'bg-stone-900 text-stone-50 shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              Diario
            </button>
          </div>

          {/* Export to PDF Button */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              isExporting
                ? 'bg-stone-400 text-white cursor-not-allowed'
                : 'bg-stone-900 hover:bg-stone-800 text-amber-50 hover:shadow-md active:scale-95'
            }`}
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                <span>Generando PDF...</span>
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>¡PDF Descargado!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-amber-400" />
                <span>Exportar a PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notice if history is sparse */}
      {history.length < 3 && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">
                Tienes pocos registros acumulados en el historial ({history.length} escaneos).
              </p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Puedes cargar un conjunto de datos semanal de muestra para visualizar todos los gráficos y probar la exportación de inmediato.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePopulateSampleHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-semibold transition-colors cursor-pointer shrink-0 text-xs shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Cargar datos de la semana</span>
          </button>
        </div>
      )}

      {/* 2. PRINTABLE REPORT CARD (Target for HTML2Canvas & PDF Generation) */}
      <div
        id="printable-report-card"
        className="bg-[#fffdf9] rounded-3xl border border-[#ede4d6] p-6 sm:p-8 shadow-xs space-y-7"
      >
        {/* Document Header for PDF */}
        <div className="border-b border-[#ede4d6] pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
                {reportMode === 'weekly' ? 'Reporte Semanal Consolidado' : 'Reporte Diario de Estado'}
              </span>
              <span className="text-xs text-stone-400 font-mono">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Análisis y Evolución Emocional Facial
            </h1>
            <p className="text-xs text-stone-500 mt-1 max-w-xl">
              Monitoreo continuo de micro-expresiones con red convolucional CNN (Keras / TensorFlow),
              identificación de bienestar, picos de estrés y distribución de valencia afectiva.
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0 bg-[#fbf7f2] p-3 rounded-2xl border border-[#eadbc9]">
            <p className="text-[11px] text-stone-500 font-medium">Muestras analizadas</p>
            <p className="text-xl font-extrabold text-stone-900 font-mono">
              {stats.totalScans}{' '}
              <span className="text-xs font-normal text-stone-500">capturas</span>
            </p>
          </div>
        </div>

        {/* 3. KEY HIGHLIGHT CARDS (Specific user requirements) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* REQUISITO 1: DÍA CON MÁS EMOCIONES POSITIVAS */}
          <div className="bg-gradient-to-br from-emerald-50/80 to-[#fbf7f2] rounded-2xl p-5 border border-emerald-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                  <Smile className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Día con más emociones positivas
                  </span>
                  <h3 className="text-xl font-extrabold text-stone-900">
                    {stats.bestDay.dayName}
                  </h3>
                </div>
              </div>
              <span className="text-2xl">{stats.bestDay.dominantEmoji}</span>
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">Porcentaje de positividad:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {stats.bestDay.positivePercentage}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-emerald-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.bestDay.positivePercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed pt-1">
                Predominaron expresiones de <strong>{stats.bestDay.dominantEmotion}</strong> con
                relajación muscular periorbital y alta valencia de bienestar.
              </p>
            </div>
          </div>

          {/* REQUISITO 2: HORAS DE MAYOR ESTRÉS */}
          <div className="bg-gradient-to-br from-rose-50/80 to-[#fbf7f2] rounded-2xl p-5 border border-rose-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shadow-2xs">
                  <Clock className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                    Horas de mayor estrés
                  </span>
                  <h3 className="text-xl font-extrabold text-stone-900">
                    {stats.peakStressHours.timeRange} hrs
                  </h3>
                </div>
              </div>
              <span className="text-2xl">⏳</span>
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">Proporción de expresiones desafiantes:</span>
                <span className="font-mono font-bold text-rose-700 text-sm">
                  {stats.peakStressHours.stressPercentage}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-rose-100 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.peakStressHours.stressPercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed pt-1">
                {stats.peakStressHours.description} Se sugiere programar pausas de respiración en este intervalo.
              </p>
            </div>
          </div>
        </div>

        {/* 4. REQUISITO 3: EVOLUCIÓN EMOCIONAL SEMANAL (Gráfico interactivo Recharts) */}
        <div className="bg-[#fbf7f2] rounded-2xl p-5 border border-[#eadbc9]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-700" />
                <span>Evolución Emocional Semanal</span>
              </h3>
              <p className="text-xs text-stone-500">
                Seguimiento diacrónico de estados positivos, neutros y niveles de estrés
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-medium text-stone-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Positivas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                Neutras / Foco
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Estrés / Fatiga
              </span>
            </div>
          </div>

          <div className="w-full h-64 sm:h-72 min-w-0 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={240}>
              <AreaChart
                data={stats.dailyEvolution}
                margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e7decb" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="shortDay"
                  tick={{ fill: '#57534e', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#d6c7b2' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#78716c', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="positive"
                  name="Positivas"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPositive)"
                />
                <Area
                  type="monotone"
                  dataKey="neutral"
                  name="Neutras"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNeutral)"
                />
                <Area
                  type="monotone"
                  dataKey="stress"
                  name="Estrés"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorStress)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Distribución de Estrés por Franjas Horarias + Desglose de Emociones */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
          {/* Hourly Stress Bar Chart */}
          <div className="md:col-span-6 bg-[#fbf7f2] rounded-2xl p-4 sm:p-5 border border-[#eadbc9] flex flex-col justify-between">
            <div className="mb-3">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-rose-500" />
                <span>Niveles de Tensión por Franja Horaria</span>
              </h4>
              <p className="text-[11px] text-stone-500">
                Frecuencia de detección de expresiones estresoras a lo largo del día
              </p>
            </div>

            <div className="w-full h-48 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.hourlyStress}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid stroke="#e7decb" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="hourLabel"
                    tick={{ fill: '#57534e', fontSize: 10 }}
                    axisLine={{ stroke: '#d6c7b2' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#78716c', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val} eventos`, 'Expresiones de Estrés']}
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="stressCount" radius={[6, 6, 0, 0]}>
                    {stats.hourlyStress.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.hourLabel === stats.peakStressHours.timeRange ? '#dc2626' : '#f87171'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Emociones más detectadas y Balance */}
          <div className="md:col-span-6 bg-[#fbf7f2] rounded-2xl p-4 sm:p-5 border border-[#eadbc9] flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-amber-700" />
                <span>Balance y Frecuencia de Emociones</span>
              </h4>
              <p className="text-[11px] text-stone-500 mb-3">
                Distribución porcentual de las expresiones dominantes en el periodo
              </p>

              <div className="space-y-2.5">
                {stats.topEmotions.map((item, idx) => (
                  <div key={`top-emo-${idx}`} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-stone-800 flex items-center gap-1.5 truncate">
                        <span>{item.emoji}</span>
                        <span className="truncate">{item.emotion}</span>
                      </span>
                      <span className="font-mono font-bold text-stone-700 shrink-0 ml-2">
                        {item.percentage}% ({item.count})
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-stone-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Ratio Pill summary */}
            <div className="pt-4 border-t border-[#eadbc9]/80 mt-3 flex items-center justify-between text-xs font-medium">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {stats.positiveRatio}% Bienestar
              </span>
              <span className="text-sky-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                {stats.neutralRatio}% Foco/Calma
              </span>
              <span className="text-rose-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {stats.stressRatio}% Tensión
              </span>
            </div>
          </div>
        </div>

        {/* 6. Footer Notes for PDF authenticity */}
        <div className="pt-4 border-t border-[#ede4d6] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400">
          <span>Generado automáticamente con Detector de Emociones Faciales (CNN Keras/TensorFlow)</span>
          <span className="font-mono">ID de Reporte: REP-{Date.now().toString(36).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
