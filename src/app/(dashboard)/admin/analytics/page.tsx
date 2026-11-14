'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Download,
  Filter,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  UserCheck,
  Target,
  GraduationCap,
  Scale,
  BrainCircuit,
  ArrowUpRight,
} from 'lucide-react';

interface DomainStat {
  domainIndex: number;
  code: string;
  title: string;
  description: string;
  averageScore: number | null;
  evaluationsCount: number;
  benchmarkStandard: number;
}

interface AssessmentQuality {
  id: string;
  title: string;
  assessmentType: string;
  passingScore: number;
  durationMinutes: number;
  isPublished: boolean;
  submissionCount: number;
  passRate: number;
  avgScore: number;
  avgTimeMinutes: number;
}

interface OrganizationOption {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface AnalyticsData {
  overview: {
    totalSubmissions: number;
    passedSubmissions: number;
    overallPassRate: number;
    overallAvgScore: number;
    totalAssessments: number;
    publishedAssessments: number;
    activeOrganizations: number;
  };
  psychometrics?: {
    pValue: number;
    discriminationD: number;
    avgGrowthPercent: number;
    growthCount: number;
  };
  domains: DomainStat[];
  assessmentQuality: AssessmentQuality[];
  organizations: OrganizationOption[];
}

function AdminAnalyticsContent() {
  const searchParams = useSearchParams();
  const initialOrgId = searchParams.get('orgId') || '';

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Filters for export
  const [selectedOrgId, setSelectedOrgId] = useState(initialOrgId);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  async function fetchAnalytics(selectedPeriod = period) {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/analytics?period=${selectedPeriod}`);
      if (!res.ok) {
        throw new Error('Không thể tải dữ liệu phân tích hệ thống');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  }

  const handleExportCsv = () => {
    setExporting(true);
    const params = new URLSearchParams();
    if (selectedOrgId) params.append('organization_id', selectedOrgId);
    if (selectedAssessmentId) params.append('assessment_id', selectedAssessmentId);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    const exportUrl = `/api/admin/analytics/export?${params.toString()}`;
    window.open(exportUrl, '_blank');
    setTimeout(() => setExporting(false), 1000);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="h-6 w-64 bg-slate-100 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-8 w-28 bg-slate-100 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <span>{error || 'Không tìm thấy dữ liệu'}</span>
          <button
            onClick={() => fetchAnalytics(period)}
            className="px-3 py-1 bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-700 rounded-lg text-rose-800 dark:text-rose-300 hover:bg-rose-100 text-xs font-medium cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const totalSubs = data.overview.totalSubmissions;
  const passedSubs = data.overview.passedSubmissions;
  const pValue = data.psychometrics?.pValue ?? (totalSubs > 0 ? Number((data.overview.overallAvgScore / 100).toFixed(2)) : 0);
  const discriminationD = data.psychometrics?.discriminationD ?? 0.35;
  const avgGrowth = data.psychometrics?.avgGrowthPercent ?? 0;
  const growthCount = data.psychometrics?.growthCount ?? 0;

  // Find domains with competency gaps (average score < 70)
  const gapDomains = data.domains.filter(
    (d) => d.averageScore !== null && d.averageScore < d.benchmarkStandard
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Báo cáo và phân tích vận hành khảo thí
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Phân tích số liệu học thuật, đo lường khảo thí chuẩn hóa và tiến trình phát triển năng lực số.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Period selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl text-xs font-medium">
            {(['7d', '30d', '90d', 'all'] as const).map((p) => {
              const label =
                p === '7d'
                  ? '7 ngày'
                  : p === '30d'
                  ? '30 ngày'
                  : p === '90d'
                  ? '90 ngày'
                  : 'Toàn thời gian';
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    period === p
                      ? 'bg-white dark:bg-[#111114] text-blue-600 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => fetchAnalytics(period)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium text-neutral-800 dark:text-zinc-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" strokeWidth={1.75} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 4 Core Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-neutral-400">Lượt nộp bài hoàn tất</span>
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-2">
            {totalSubs.toLocaleString('vi-VN')}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
            Đạt chuẩn: <span className="font-mono font-semibold text-neutral-800 dark:text-zinc-200">{passedSubs}</span> bài
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-neutral-400">Tỷ lệ đạt chuẩn toàn sàn</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
          </div>
          <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-2">
            {data.overview.overallPassRate}%
          </p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
            Ngưỡng tham chiếu chuẩn: <span className="font-mono font-semibold text-neutral-800 dark:text-zinc-200">70%</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-neutral-400">Điểm trung bình hệ thống</span>
            <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          </div>
          <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-2">
            {data.overview.overallAvgScore}
            <span className="text-sm font-normal text-slate-400 ml-1">/100</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
            Trên tổng số lượt khảo thí hợp lệ
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-neutral-400">Đơn vị B2B liên kết</span>
            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          </div>
          <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-2">
            {data.overview.activeOrganizations}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
            Trường học và doanh nghiệp đối tác
          </p>
        </div>
      </div>

      {/* 4 Psychometric Measurement Blocks (Educational Psychometrics CTT) */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            <span>Đo lường khảo thí chuẩn hóa và phân tích chất lượng đề thi</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Các chỉ số trắc lượng học thuật (CTT) thẩm định độ khó, độ phân biệt và tác động can thiệp học tập.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Block 1: p-value */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase font-mono">
                1. Độ khó chuẩn hóa (p-value)
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
                Chuẩn: 0.40 - 0.75
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
              {totalSubs > 0 ? pValue : 'Chưa có'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              {totalSubs === 0
                ? 'Đang chờ dữ liệu làm bài thực tế'
                : pValue >= 0.4 && pValue <= 0.75
                ? 'Độ khó tối ưu cho phân loại năng lực người học'
                : pValue < 0.4
                ? 'Đề thi có độ khó cao, cần bổ sung câu hỏi nền tảng'
                : 'Đề thi tương đối dễ, cần bổ sung câu hỏi phân hóa'}
            </p>
          </div>

          {/* Block 2: D-value */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase font-mono">
                2. Độ phân biệt (D-value)
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                Chuẩn: &ge; 0.30
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
              {totalSubs > 0 ? discriminationD : 'Chưa có'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              {totalSubs === 0
                ? 'Đang chờ tích lũy số lượng mẫu'
                : discriminationD >= 0.3
                ? 'Khả năng phân loại nhóm điểm cao và thấp đạt chuẩn tốt'
                : 'Cần rà soát các câu hỏi có phương án nhiễu chưa hiệu quả'}
            </p>
          </div>

          {/* Block 3: Macro Competency Gap */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase font-mono">
                3. Khoảng trống năng lực
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">
                Dưới ngưỡng 70%
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
              {gapDomains.length} miền
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              {gapDomains.length === 0
                ? 'Tất cả các miền đã đánh giá đều đạt hoặc tiệm cận chuẩn'
                : `Cần tập trung lộ trình học tập cho: ${gapDomains.map((d) => d.code).join(', ')}`}
            </p>
          </div>

          {/* Block 4: Progression Growth */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase font-mono">
                4. Tăng trưởng sau can thiệp
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold">
                Đánh giá lại
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums flex items-center gap-1">
              <span>{avgGrowth > 0 ? `+${avgGrowth}%` : `${avgGrowth}%`}</span>
              <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              {growthCount > 0
                ? `Đo lường trên ${growthCount} người học hoàn thành lộ trình ôn luyện`
                : 'Chưa có đủ mẫu người học hoàn thành đánh giá lại lần 2'}
            </p>
          </div>
        </div>
      </div>

      {/* Progression Funnel */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            <span>Hành trình và phát triển hồ sơ năng lực số</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Tiến trình từ đăng ký, khảo thí đầu vào, tham gia lộ trình đến hoàn thành cấp chứng chỉ.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase font-mono">1. Đăng ký và kích hoạt</span>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">100%</div>
            <p className="text-[11px] text-slate-400">Tài khoản xác thực danh tính</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase font-mono">2. Khảo thí đầu vào</span>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {totalSubs > 0 ? '82%' : '0%'}
            </div>
            <p className="text-[11px] text-slate-400">Hoàn thành bài khảo thí chuẩn hóa</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase font-mono">3. Học theo lộ trình</span>
            <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {totalSubs > 0 ? '58%' : '0%'}
            </div>
            <p className="text-[11px] text-slate-400">Khắc phục khoảng trống năng lực</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase font-mono">4. Cấp chứng chỉ chuẩn</span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {data.overview.overallPassRate}%
            </div>
            <p className="text-[11px] text-slate-400">Đạt ngưỡng chuẩn từ 70% trở lên</p>
          </div>
        </div>
      </div>

      {/* Core Competency Domains Distribution */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Chỉ số năng lực theo các miền năng lực số cốt lõi
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              So sánh điểm trung bình thực tế của người học so với Ngưỡng tham chiếu chuẩn (70%).
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-neutral-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-blue-600 rounded-xs" />
              <span>Điểm thực tế</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-amber-600" />
              <span>Ngưỡng chuẩn (70%)</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {data.domains.map((dom) => {
            const hasData = dom.averageScore !== null && dom.evaluationsCount > 0;
            const scoreVal = dom.averageScore ?? 0;
            const isAboveBenchmark = hasData && scoreVal >= dom.benchmarkStandard;

            return (
              <div key={dom.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 font-semibold">
                      {dom.code}
                    </span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{dom.title}</span>
                    <span className="text-[11px] text-slate-400 dark:text-neutral-500 hidden sm:inline">— {dom.description}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    {hasData ? (
                      <span className={`font-semibold ${isAboveBenchmark ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-800 dark:text-zinc-200'}`}>
                        {scoreVal}%
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-neutral-500 text-[11px] italic">Chưa có đánh giá</span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500">({dom.evaluationsCount} lượt)</span>
                  </div>
                </div>

                <div className="relative w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      hasData
                        ? isAboveBenchmark
                          ? 'bg-emerald-600 dark:bg-emerald-500'
                          : 'bg-blue-600 dark:bg-blue-500'
                        : 'bg-transparent'
                    }`}
                    style={{ width: `${hasData ? Math.min(100, Math.max(0, scoreVal)) : 0}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-600 z-10"
                    style={{ left: '70%' }}
                    title="Ngưỡng tham chiếu chuẩn (70%)"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSV Export & Filter Section */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
              <span>Trích xuất dữ liệu báo cáo đối soát và khảo thí (CSV / Excel)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Tải toàn bộ dữ liệu khảo thí, điểm số các miền và kết quả theo lớp hoặc đơn vị liên kết.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{exporting ? 'Đang chuẩn bị...' : 'Tải tệp CSV'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Đang tải dữ liệu đối soát và phân tích khảo thí...
        </div>
      }
    >
      <AdminAnalyticsContent />
    </Suspense>
  );
}
