'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  BookOpen,
  Award,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Zap,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';
import {
  RadarDataItem,
  SkillGap,
  PathwayStep,
  CompetencyAnalysisOutput,
} from '@/features/ai-gateway/types/competency.types';

function CompetencyAnalysisContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('submissionId');

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CompetencyAnalysisOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch or trigger analysis
  const fetchAnalysis = useCallback(async () => {
    if (!submissionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. First check if cached analysis exists
      const res = await fetch(`/api/ai/analyze-competency?submissionId=${submissionId}`);
      const data = await res.json();

      if (res.ok && data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.warn('Could not load cached analysis:', err);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleTriggerAnalysis = async () => {
    if (!submissionId) return;

    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/analyze-competency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Phân tích năng lực thất bại');
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper function to calculate SVG coordinates for 5-axis Radar Chart
  const renderRadarChart = (data: RadarDataItem[]) => {
    const size = 320;
    const center = size / 2;
    const radius = 100;
    const numAxes = 5;
    const angleStep = (Math.PI * 2) / numAxes;

    // Helper to get point at specific axis and percentage
    const getPoint = (index: number, val: number) => {
      // Rotate by -PI/2 so axis 0 starts at top (12 o'clock)
      const angle = index * angleStep - Math.PI / 2;
      const r = (val / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y };
    };

    // Candidate polygon points
    const candidatePoints = data
      .map((d, i) => {
        const pt = getPoint(i, d.score);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');

    // Benchmark polygon points (fixed at 70%)
    const benchmarkPoints = data
      .map((d, i) => {
        const pt = getPoint(i, d.benchmark || 70);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');

    const rings = [25, 50, 75, 100];

    return (
      <div className="flex flex-col items-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full max-w-[340px] h-auto overflow-visible"
        >
          {/* Background concentric rings */}
          {rings.map((ring) => {
            const ringPoints = Array.from({ length: numAxes })
              .map((_, i) => {
                const pt = getPoint(i, ring);
                return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
              })
              .join(' ');
            return (
              <polygon
                key={ring}
                points={ringPoints}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="1"
              />
            );
          })}

          {/* Radial axis lines */}
          {Array.from({ length: numAxes }).map((_, i) => {
            const pt = getPoint(i, 100);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={pt.x}
                y2={pt.y}
                stroke="#CBD5E1"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            );
          })}

          {/* Benchmark Polygon (Dashed slate) */}
          <polygon
            points={benchmarkPoints}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Candidate Polygon (Academic Sky Blue) */}
          <polygon
            points={candidatePoints}
            fill="#0284C7"
            fillOpacity="0.25"
            stroke="#0284C7"
            strokeWidth="2"
          />

          {/* Candidate Vertex Dots */}
          {data.map((d, i) => {
            const pt = getPoint(i, d.score);
            return (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="3.5"
                fill="#0284C7"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Domain Axis Labels */}
          {data.map((d, i) => {
            const labelPt = getPoint(i, 122);
            return (
              <text
                key={i}
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] font-sans font-semibold fill-slate-700"
              >
                {d.domainName.length > 18 ? d.domainName.slice(0, 18) + '...' : d.domainName}
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-sky-600/30 border border-sky-600 inline-block" />
            <span className="text-slate-700 font-medium">Bạn đạt được</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-slate-400 border-t border-dashed border-slate-500 inline-block" />
            <span className="text-slate-500">Chuẩn NEXA (70.0)</span>
          </div>
        </div>
      </div>
    );
  };

  if (!submissionId) {
    return (
      <div className="p-12 rounded-md bg-white border border-slate-200 text-center max-w-md mx-auto mt-12 space-y-4">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" strokeWidth={1.5} />
        <div>
          <h2 className="text-base font-bold text-slate-900">Thiếu thông tin bài thi</h2>
          <p className="text-xs text-slate-500 mt-1">
            Vui lòng hoàn thành bài đánh giá hoặc chọn bài thi từ lịch sử để xem chẩn đoán năng lực.
          </p>
        </div>
        <Link
          href="/personal/assessments"
          className="px-4 py-2 bg-sky-600 text-white rounded-md text-xs font-medium hover:bg-sky-700 transition-colors inline-block"
        >
          Đến danh sách bài thi
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              BÁO CÁO PHÂN TÍCH NĂNG LỰC SỐ CHUYÊN SÂU
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Chẩn đoán Khoảng trống Năng lực &amp; Lộ trình 4 Bước
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Đánh giá đa chiều theo 5 Miền năng lực số và định hướng lộ trình học tập cá nhân hóa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/personal/learning-path"
            className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
            Đến Lộ trình học liệu
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-md border border-slate-200">
          <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" strokeWidth={1.75} />
          <p className="text-xs text-slate-500">Đang tải hồ sơ năng lực số...</p>
        </div>
      ) : !analysis ? (
        /* On-Demand Trigger State (Rule 6 compliant) */
        <div className="p-8 rounded-md bg-white border border-slate-200 shadow-xs text-center max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mx-auto">
            <Sparkles className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Kích hoạt Phân tích Năng lực AI theo Yêu cầu
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Hệ thống tuân thủ nguyên tắc On-Demand AI: Chỉ gọi AI khi bạn bấm nút. AI sẽ đối soát toàn bộ kết quả bài làm của bạn qua 5 Miền năng lực cốt lõi, chỉ rõ các kỹ năng dưới 60% và tạo lập lộ trình học liệu 4 bước.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleTriggerAnalysis}
              disabled={analyzing}
              className="px-6 py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50"
            >
              <Sparkles
                className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`}
                strokeWidth={1.75}
              />
              {analyzing ? 'AI đang phân tích 5 Miền năng lực...' : 'Phân tích Năng lực & Đề xuất Lộ trình'}
            </button>
            <p className="text-[11px] text-slate-400 mt-2">
              Chi phí: 1 AI credit (Gói miễn phí kèm 10 credits)
            </p>
          </div>
        </div>
      ) : (
        /* Full Analysis Display (Apps 2, 3, 4, 5) */
        <div className="space-y-6">
          {/* Top Row: Radar Chart + Overall Level */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* App 2: Radar Chart Card */}
            <div className="lg:col-span-1 p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Biểu đồ Radar 5 Miền Năng lực
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                    5 MIỀN NĂNG LỰC
                  </span>
                </div>
                {renderRadarChart(analysis.radarData)}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                {analysis.radarData.map((d) => (
                  <div
                    key={d.domainCode}
                    className="p-2 rounded bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <span className="text-slate-500 truncate mr-1">{d.domainName}:</span>
                    <span
                      className={`font-bold ${
                        d.score >= 70 ? 'text-sky-600' : 'text-amber-600'
                      }`}
                    >
                      {d.score.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Level & Pedagogical Feedback */}
            <div className="lg:col-span-2 space-y-4">
              {/* Level Badge Card */}
              <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1 font-mono uppercase">
                    PROFICIENCY LEVEL
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                      {analysis.overallLevel === 'FOUNDATION'
                        ? 'Basic'
                        : analysis.overallLevel === 'HIGHLY_SPECIALIZED'
                        ? 'Highly Advanced'
                        : analysis.overallLevel}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold">
                      Chuẩn Năng Lực Số
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {analysis.overallSummary}
                  </p>
                </div>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <TrendingUp className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
                    Điểm mạnh vượt trội
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {analysis.strengths}
                  </p>
                </div>

                <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
                    Điểm cần bồi dưỡng thêm
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {analysis.weaknesses}
                  </p>
                </div>
              </div>

              {/* Pedagogical Advice */}
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                  Lời khuyên Sư phạm từ Chuyên gia Khảo thí AI
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {analysis.pedagogicalFeedback}
                </p>
              </div>
            </div>
          </div>

          {/* App 3: Competency Gaps (< 60%) Section */}
          <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Khoảng trống Năng lực Cần Khắc phục (Tỷ lệ &lt; 60%)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các kỹ năng thành phần có tỷ lệ điểm dưới chuẩn cần tập trung bổ khuyết ngay.
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {analysis.skillGaps.length} LỖ HỔNG PHÁT HIỆN
              </span>
            </div>

            {analysis.skillGaps.length === 0 ? (
              <div className="p-6 text-center rounded border border-slate-200 bg-slate-50 text-xs text-slate-500">
                Xuất sắc! Bạn không có kỹ năng nào dưới 60%.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.skillGaps.map((gap) => (
                  <div
                    key={gap.skillCode}
                    className="p-4 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          Kỹ năng {gap.skillCode}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              gap.priority === 'HIGH'
                                ? 'bg-rose-600'
                                : gap.priority === 'MEDIUM'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span className="font-semibold text-slate-700">{gap.priority}</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mb-1">{gap.skillName}</h4>
                      <div className="text-xs text-amber-600 font-semibold mb-2">
                        Đạt: {gap.percentage.toFixed(1)}% (&lt; 60%)
                      </div>

                      <div className="space-y-1.5 text-[11px] text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-700">Nguyên nhân: </span>
                          {gap.rootCause}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">Rủi ro: </span>
                          {gap.riskImpact}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <Link
                        href="/personal/learning-path"
                        className="text-xs font-medium text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
                      >
                        Học module bổ khuyết
                        <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* App 6: AI-Recommended Remediation Courses */}
          {(() => {
            const coursesToDisplay = analysis.recommendedCourses || [];

            return (
              <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                      <h3 className="text-sm font-bold text-slate-900">
                        Khóa Học &amp; Chuyên Đề Bồi Dưỡng Đề Xuất Bởi AI
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Được AI chọn lọc trực tiếp từ kho học liệu chuẩn hóa để giải quyết các khoảng trống năng lực số đã phát hiện.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200 font-semibold self-start sm:self-auto font-mono">
                    {coursesToDisplay.length} KHÓA HỌC PHÙ HỢP
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coursesToDisplay.map((course) => (
                    <div
                      key={course.id}
                      className="p-4 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                            Kỹ năng {course.competencyId}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {course.level}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug line-clamp-2">
                          {course.title}
                        </h4>

                        <div className="text-[11px] text-slate-500 mb-2 flex items-center justify-between">
                          <span>{course.provider}</span>
                          <span className="font-mono">{course.durationMinutes} phút</span>
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-2">
                          {course.description}
                        </p>

                        <div className="p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-700 leading-snug">
                          <span className="font-semibold text-sky-700">Lý do đề xuất: </span>
                          {course.recommendationReason}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 font-mono">
                          {course.format}
                        </span>
                        <Link
                          href={course.actionUrl || `/personal/learning-path?courseId=${course.id}`}
                          className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium inline-flex items-center gap-1 shadow-xs transition-colors"
                        >
                          Vào học ngay
                          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* App 5: 4-Step Actionable Learning Pathway */}
          <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                <h3 className="text-sm font-bold text-slate-900">
                  Lộ trình 4 Bước Phát triển Năng lực Cá nhân hóa
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Thực hiện tuần tự 4 bước để bổ khuyết lỗ hổng kỹ năng, nhận điểm thưởng và sẵn sàng chứng chỉ.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {analysis.learningPathway.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-4 rounded-md border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                        BƯỚC {step.stepNumber}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
                        {step.durationHours}h
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mb-1">{step.title}</h4>
                    <div className="text-[11px] text-sky-700 mb-2">
                      {step.targetSkill}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                      {step.objective}
                    </p>

                    <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-700 leading-snug">
                      <span className="font-semibold text-slate-800">Hành động: </span>
                      {step.actionText}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <Link
                      href="/personal/learning-path"
                      className="w-full py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                      Bắt đầu học ngay
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompetencyAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center bg-white rounded-md border border-slate-200">
          <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" strokeWidth={1.75} />
          <p className="text-xs text-slate-500">Đang chuẩn bị hồ sơ phân tích năng lực số...</p>
        </div>
      }
    >
      <CompetencyAnalysisContent />
    </Suspense>
  );
}

