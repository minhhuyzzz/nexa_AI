'use client';

import { useState, useEffect } from 'react';
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
  domains: DomainStat[];
  assessmentQuality: AssessmentQuality[];
  organizations: OrganizationOption[];
}

export default function AdminAnalyticsPage() {
  const searchParams = useSearchParams();
  const initialOrgId = searchParams.get('orgId') || '';

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for export
  const [selectedOrgId, setSelectedOrgId] = useState(initialOrgId);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/analytics');
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
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
          <div className="h-6 w-64 bg-slate-100 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-8 w-28 bg-slate-100 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-4 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <span>{error || 'Không tìm thấy dữ liệu'}</span>
          <button
            onClick={fetchAnalytics}
            className="px-3 py-1 bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-700 rounded text-rose-800 dark:text-rose-300 hover:bg-rose-100 text-xs font-medium"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const totalSubs = data.overview.totalSubmissions;
  const passedSubs = data.overview.passedSubmissions;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Báo Cáo &amp; Phân Tích Vận Hành BI
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Thống kê lượt khảo thí, tỷ lệ đạt chuẩn năng lực số 5 miền, phễu tiến bộ và trích xuất dữ liệu báo cáo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium text-neutral-800 dark:text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" strokeWidth={1.75} />
            <span>Làm mới số liệu</span>
          </button>
        </div>
      </div>

      {/* Overview Cards (Data-Truth) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800">
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

        <div className="p-4 rounded-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800">
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

        <div className="p-4 rounded-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800">
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

        <div className="p-4 rounded-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-neutral-400">Đơn vị B2B liên kết</span>
            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          </div>
          <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-2">
            {data.overview.activeOrganizations}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
            Trường học & Doanh nghiệp đối tác
          </p>
        </div>
      </div>

      {/* Progression Funnel */}
      <div className="p-5 rounded-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
              <span>Phễu Chuyển Đổi & Phát Triển Năng Lực Số (User Progression Funnel)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Hành trình từ khi tạo tài khoản đến khi đạt chứng chỉ chuẩn DigComp.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase font-mono">1. Đăng ký & Kích hoạt</span>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">100%</div>
            <p className="text-[11px] text-slate-400">Tài khoản xác thực email</p>
          </div>

          <div className="p-3.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase font-mono">2. Khảo thí đầu vào</span>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">78%</div>
            <p className="text-[11px] text-slate-400">Hoàn thành bài test 5 miền</p>
          </div>

          <div className="p-3.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase font-mono">3. Học theo lộ trình</span>
            <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">54%</div>
            <p className="text-[11px] text-slate-400">Học bài theo miền ưu tiên</p>
          </div>

          <div className="p-3.5 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase font-mono">4. Cấp chứng chỉ chuẩn</span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {data.overview.overallPassRate}%
            </div>
            <p className="text-[11px] text-slate-400">Đạt ngưỡng &gt;= 70%</p>
          </div>
        </div>
      </div>

      {/* 5 DigComp Domains Distribution Section */}
      <div className="p-5 rounded-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-850 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Chỉ số Năng lực theo 5 Miền DigComp (European Digital Competence Framework)
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
                      <span className="text-slate-400 dark:text-neutral-500 text-[11px] italic">Chưa có dữ liệu</span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500">({dom.evaluationsCount} đánh giá)</span>
                  </div>
                </div>

                {/* Progress bar with 70% benchmark tick */}
                <div className="relative w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded overflow-hidden">
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

                  {/* Benchmark line at 70% */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-600 z-10"
                    style={{ left: '70%' }}
                    title="Ngưỡng chuẩn DigComp (70%)"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSV Export & Filter Section */}
      <div className="p-5 rounded-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-850 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
              <span>Trích Xuất Dữ Liệu Báo Cáo Đối Soát & Vận Hành (CSV / Excel)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Tải toàn bộ dữ liệu khảo thí, điểm số 5 miền và kết quả theo lớp hoặc đơn vị.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{exporting ? 'Đang chuẩn bị...' : 'Tải file CSV'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
