'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Info,
  Filter,
  Search,
  Users,
  Award,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { CompetencyRadarChart } from '@/components/dashboard/learner/CompetencyRadarChart';

interface CandidateRow {
  id: string;
  candidateCode: string;
  name: string;
  email: string;
  assessmentTitle: string;
  objectiveScore: number;
  practicalScore: number | string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  submittedAt: string;
}

interface DomainStat {
  code: string;
  name: string;
  avg: number;
  benchmark: number;
}

interface AssessmentFilterOption {
  id: string;
  title: string;
}

interface ClassFilterOption {
  id: string;
  name: string;
  class_code: string;
}

export default function EvaluatorAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Filter States
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Data
  const [assessments, setAssessments] = useState<AssessmentFilterOption[]>([]);
  const [classes, setClasses] = useState<ClassFilterOption[]>([]);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [domainStats, setDomainStats] = useState<DomainStat[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [passedCount, setPassedCount] = useState(0);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedAssessmentId) params.set('assessmentId', selectedAssessmentId);
      if (selectedClassId) params.set('classId', selectedClassId);

      const res = await fetch(`/api/evaluator/analytics?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments || []);
        setClasses(data.classes || []);
        setCandidates(data.candidates || []);
        setDomainStats(data.domainStats || []);
        setTotalCount(data.totalCount || 0);
        setPassedCount(data.passedCount || 0);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAssessmentId, selectedClassId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.candidateCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assessmentTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = async (format: 'csv' | 'json') => {
    setDownloading(format);
    try {
      if (format === 'csv') {
        const headers = [
          'Mã thí sinh',
          'Họ và tên',
          'Email',
          'Bài khảo thí',
          'Điểm trắc nghiệm',
          'Điểm thực hành',
          'Tổng điểm',
          'Tỷ lệ %',
          'Kết quả',
          'Thời gian nộp',
        ];

        const rows = filteredCandidates.map((c) => [
          `"${c.candidateCode}"`,
          `"${c.name}"`,
          `"${c.email}"`,
          `"${c.assessmentTitle}"`,
          c.objectiveScore,
          `"${c.practicalScore}"`,
          c.totalScore,
          `${c.percentage}%`,
          `"${c.isPassed ? 'Đạt chuẩn' : 'Chưa đạt'}"`,
          `"${new Date(c.submittedAt).toLocaleString('vi-VN')}"`,
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `nexa_bang_diem_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const blob = new Blob([JSON.stringify(filteredCandidates, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `nexa_bang_diem_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setTimeout(() => setDownloading(null), 800);
    }
  };

  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              PHÂN TÍCH &amp; BÁO CÁO KHẢO THÍ
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Thống Kê Năng Lực &amp; Bảng Điểm Nhóm Khảo Thí
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Lọc kết quả khảo thí theo từng Nhóm hoặc Đề thi, tra cứu bảng điểm chi tiết và xuất báo cáo chuẩn hóa.
          </p>
        </div>

        {/* Quick Summary Chips */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-md bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Bài nộp</span>
            <span className="text-lg font-bold font-mono text-slate-900">{totalCount}</span>
          </div>

          <div className="px-3.5 py-2 rounded-md bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[10px] text-emerald-600 font-semibold block uppercase">Tỷ lệ đạt</span>
            <span className="text-lg font-bold font-mono text-emerald-700">{passRate}%</span>
          </div>
        </div>
      </div>

      {/* Context Filter Bar */}
      <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold shrink-0">
            <Filter className="w-4 h-4 text-sky-600" />
            <span>Bộ lọc:</span>
          </div>

          {/* Filter 1: Assessment Dropdown */}
          <select
            value={selectedAssessmentId}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
            className="p-2 border border-slate-200 rounded-md bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">-- Tất cả bài khảo thí --</option>
            {assessments.map((asm) => (
              <option key={asm.id} value={asm.id}>
                {asm.title}
              </option>
            ))}
          </select>

          {/* Filter 2: Group Dropdown */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="p-2 border border-slate-200 rounded-md bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
          >
            <option value="">-- Tất cả các nhóm --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.class_code})
              </option>
            ))}
          </select>
        </div>

        {/* Search Candidate */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã thí sinh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Domain Heatmap & Competency Radar Overview Cards */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Phân Bố Điểm Trung Bình Theo 5 Miền Năng Lực Số (DigComp 3.0)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Đối sánh trực quan giữa năng lực thực tế của nhóm/đề thi đang chọn và mốc chuẩn đạt yêu cầu (70%).
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Mốc chuẩn đạt: 70.0%</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Pure SVG Radar Chart */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-50/50 rounded-md border border-slate-100">
            <CompetencyRadarChart
              data={domainStats.map((d) => ({
                code: d.code,
                name: d.name,
                score: d.avg,
                target: d.benchmark,
              }))}
            />
          </div>

          {/* Right Column: Detailed Progress Bars */}
          <div className="lg:col-span-7 space-y-2.5">
            {domainStats.map((d) => {
              const isBelow = d.avg < d.benchmark;

              return (
                <div
                  key={d.code}
                  className="p-3 rounded-md bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="sm:w-1/3">
                    <div className="font-bold text-slate-800 line-clamp-1">{d.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{d.code}</div>
                  </div>

                  <div className="sm:w-1/2 flex items-center gap-3">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isBelow ? 'bg-amber-500' : 'bg-sky-600'
                        }`}
                        style={{ width: `${Math.min(100, d.avg)}%` }}
                      />
                    </div>
                    <span className="font-bold font-mono text-slate-800 w-12 text-right">
                      {d.avg}%
                    </span>
                  </div>

                  <div className="sm:w-1/6 text-right text-[11px] shrink-0">
                    {isBelow ? (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                        Cần bồi dưỡng
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                        Đạt chuẩn
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Candidate Gradebook Detailed Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Bảng Điểm Thí Sinh Chi Tiết ({filteredCandidates.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload('csv')}
              disabled={downloading === 'csv' || filteredCandidates.length === 0}
              className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{downloading === 'csv' ? 'Đang xuất...' : 'Xuất Excel / CSV'}</span>
            </button>

            <button
              onClick={() => handleDownload('json')}
              disabled={downloading === 'json' || filteredCandidates.length === 0}
              className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
            <span>Đang nạp bảng điểm...</span>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
            <p className="text-xs font-medium text-slate-700">Chưa có dữ liệu bài nộp phù hợp bộ lọc</p>
            <p className="text-[11px] text-slate-400">Hãy chọn lại đề thi hoặc mở rộng bộ lọc lớp học.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Thí sinh</th>
                  <th className="py-3 px-4">Bài khảo thí</th>
                  <th className="py-3 px-4 text-center">Trắc nghiệm</th>
                  <th className="py-3 px-4 text-center">Thực hành</th>
                  <th className="py-3 px-4 text-center">Tổng điểm</th>
                  <th className="py-3 px-4 text-center">Kết quả</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {c.candidateCode} &bull; {c.email}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <span className="line-clamp-1 text-slate-800">{c.assessmentTitle}</span>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        {new Date(c.submittedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono tabular-nums text-emerald-700 font-semibold">
                      {c.objectiveScore}đ
                    </td>

                    <td className="py-3 px-4 text-center font-mono tabular-nums text-sky-700">
                      {typeof c.practicalScore === 'number' ? `${c.practicalScore}đ` : c.practicalScore}
                    </td>

                    <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-slate-900">
                      {c.totalScore}/{c.maxScore} ({c.percentage}%)
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {c.isPassed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Đạt chuẩn</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span>Cần bồi dưỡng</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/evaluator/grading?submissionId=${c.id}`}
                        className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Soi bài</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Dữ liệu bảng điểm đã được đối chiếu chuẩn xác với CSDL khảo thí.</span>
          </div>
          <span className="font-mono">Đang hiển thị {filteredCandidates.length} kết quả</span>
        </div>
      </div>
    </div>
  );
}
