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
} from 'lucide-react';

interface DomainStat {
  domainIndex: number;
  code: string;
  title: string;
  description: string;
  averageScore: number;
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
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="h-6 w-64 bg-slate-100 rounded animate-pulse" />
          <div className="h-8 w-28 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-50 border border-slate-200 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <span>{error || 'Không tìm thấy dữ liệu'}</span>
          <button
            onClick={fetchAnalytics}
            className="px-3 py-1 bg-white border border-rose-300 rounded text-rose-800 hover:bg-rose-100 text-xs font-medium"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Báo cáo &amp; Phân tích Vận hành</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thống kê lượt khảo thí, tỷ lệ đạt chuẩn năng lực số, đánh giá chất lượng bộ đề và trích xuất dữ liệu báo cáo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
            <span>Làm mới số liệu</span>
          </button>
        </div>
      </div>

      {/* Overview Cards (Data-Truth) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-md bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Lượt nộp bài hoàn tất</span>
            <span className="w-2 h-2 rounded-full bg-sky-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {data.overview.totalSubmissions.toLocaleString('vi-VN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Đạt chuẩn: <span className="font-mono text-slate-700">{data.overview.passedSubmissions}</span> bài
          </p>
        </div>

        <div className="p-4 rounded-md bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Tỷ lệ đạt chuẩn hệ thống</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {data.overview.overallPassRate}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Ngưỡng đỗ chuẩn: <span className="font-mono text-slate-700">70%</span>
          </p>
        </div>

        <div className="p-4 rounded-md bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Điểm số trung bình toàn sàn</span>
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {data.overview.overallAvgScore}
            <span className="text-sm font-normal text-slate-400">/100</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Trên tổng số lượt khảo thí hợp lệ
          </p>
        </div>

        <div className="p-4 rounded-md bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Đơn vị B2B liên kết</span>
            <Building2 className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {data.overview.activeOrganizations}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Trường học & Doanh nghiệp đối tác
          </p>
        </div>
      </div>

      {/* 5 DigComp Domains Distribution Section */}
      <div className="p-5 rounded-md bg-white border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Chỉ số Năng lực theo 5 Miền DigComp (European Digital Competence Framework)
            </h2>
            <p className="text-xs text-slate-500">
              So sánh điểm trung bình thực tế của người học so với Ngưỡng tham chiếu chuẩn Châu Âu (70%).
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-sky-600 rounded-xs" />
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
            const hasData = dom.evaluationsCount > 0;
            const isAboveBenchmark = dom.averageScore >= dom.benchmarkStandard;

            return (
              <div key={dom.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      {dom.code}
                    </span>
                    <span className="font-medium text-slate-800">{dom.title}</span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">— {dom.description}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    {hasData ? (
                      <span className={`font-semibold ${isAboveBenchmark ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {dom.averageScore}%
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Chưa có bài thi</span>
                    )}
                    <span className="text-[10px] text-slate-400">({dom.evaluationsCount} đánh giá)</span>
                  </div>
                </div>

                {/* Progress bar with 70% benchmark tick */}
                <div className="relative w-full h-3 bg-slate-100 rounded overflow-hidden">
                  {/* Actual Score bar */}
                  <div
                    className={`h-full transition-all duration-300 ${
                      hasData
                        ? isAboveBenchmark
                          ? 'bg-emerald-600'
                          : 'bg-sky-600'
                        : 'bg-transparent'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, dom.averageScore))}%` }}
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

      {/* Assessment Quality Analysis Table */}
      <div className="p-5 rounded-md bg-white border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Độ tin cậy & Chất lượng bộ đề khảo thí
            </h2>
            <p className="text-xs text-slate-500">
              Thống kê tỷ lệ hoàn tất, tỷ lệ đạt và thời gian làm bài thực tế để phát hiện đề thi quá khó hoặc câu hỏi bất thường.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {data.assessmentQuality.length} bộ đề
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Tên bộ đề</th>
                <th className="py-2.5 px-3">Loại khảo thí</th>
                <th className="py-2.5 px-3 text-right">Lượt làm</th>
                <th className="py-2.5 px-3 text-right">Điểm TB</th>
                <th className="py-2.5 px-3 text-right">Tỷ lệ đạt</th>
                <th className="py-2.5 px-3 text-right">Thời gian TB</th>
                <th className="py-2.5 px-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.assessmentQuality.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Chưa có đề khảo thí nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                data.assessmentQuality.map((asm) => (
                  <tr key={asm.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs truncate">
                      {asm.title}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                        {asm.assessmentType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {asm.submissionCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                      {asm.submissionCount > 0 ? `${asm.avgScore}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {asm.submissionCount > 0 ? (
                        <span
                          className={
                            asm.passRate >= 70
                              ? 'text-emerald-700 font-medium'
                              : 'text-amber-700'
                          }
                        >
                          {asm.passRate}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {asm.submissionCount > 0 ? `${asm.avgTimeMinutes} phút` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {asm.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Công khai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          Bản nháp
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Research & Accreditation Data Export Tool */}
      <div className="p-5 rounded-md bg-white border border-slate-200 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold text-slate-900">
              Xuất Báo Cáo Khảo Thí &amp; Dữ Liệu Tổng Hợp (Excel / CSV)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Xuất tập dữ liệu kết quả thi theo đơn vị trường học hoặc bài khảo thí để phục vụ lưu trữ và đối soát.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Lọc Tổ chức */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Đơn vị / Trường học
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
            >
              <option value="">Tất cả đơn vị (Toàn hệ thống)</option>
              {data.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.code})
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Bộ đề */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Bộ đề khảo thí
            </label>
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
            >
              <option value="">Tất cả bộ đề</option>
              {data.assessmentQuality.map((asm) => (
                <option key={asm.id} value={asm.id}>
                  {asm.title}
                </option>
              ))}
            </select>
          </div>

          {/* Từ ngày */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
            />
          </div>

          {/* Đến ngày */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-500">
            Định dạng tệp: <span className="font-mono text-slate-800">CSV (UTF-8 with BOM)</span> tương thích trực tiếp Excel tiếng Việt và bộ mã SPSS.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{exporting ? 'Đang kết xuất dữ liệu...' : 'Tải file CSV cho SPSS / Excel'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
