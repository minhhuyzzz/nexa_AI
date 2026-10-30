'use client';

import { useState } from 'react';
import {
  FileCheck,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Loader2,
  Award,
} from 'lucide-react';

export interface SubmissionItem {
  id: string;
  assessment_id: string;
  user_id: string;
  status: 'SUBMITTED' | 'EVALUATED';
  total_score: number;
  percentage: number;
  is_passed: boolean;
  submitted_at: string;
  time_spent_seconds?: number;
  assessments?: {
    id: string;
    title: string;
    passing_score: number;
  } | null;
  profiles?: {
    id: string;
    email: string;
    nickname: string;
    full_name?: string;
  } | null;
}

interface Props {
  organizationId: string;
  organizationName: string;
  submissions: SubmissionItem[];
}

export function OrgGradingClientView({
  organizationId,
  organizationName,
  submissions: initialSubmissions,
}: Props) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialSubmissions);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUBMITTED' | 'EVALUATED'>('ALL');
  const [search, setSearch] = useState('');

  // Selected Submission Modal
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [inputScore, setInputScore] = useState<number>(75);
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [isAiGrading, setIsAiGrading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    suggestedScore: number;
    evidenceQuote: string;
    confidence: number;
  } | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [gradeSuccess, setGradeSuccess] = useState<string | null>(null);

  const filtered = submissions.filter((s) => {
    if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
    const nameMatch =
      s.profiles?.nickname?.toLowerCase().includes(search.toLowerCase()) ||
      s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.profiles?.email?.toLowerCase().includes(search.toLowerCase());
    const testMatch = s.assessments?.title?.toLowerCase().includes(search.toLowerCase());
    return nameMatch || testMatch;
  });

  const handleOpenGradeModal = (sub: SubmissionItem) => {
    setSelectedSub(sub);
    setInputScore(sub.total_score || 70);
    setAiSuggestion(null);
    setGradeError(null);
    setGradeSuccess(null);
  };

  const handleAiSuggest = async () => {
    if (!selectedSub) return;
    setIsAiGrading(true);
    setGradeError(null);

    try {
      const res = await fetch('/api/ai/grade-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: selectedSub.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI gợi ý chấm điểm không khả dụng lúc này');
      }

      const score = Number(data.suggestedScore) || 75;
      setInputScore(score);
      setAiSuggestion({
        suggestedScore: score,
        evidenceQuote: data.evidenceQuote || 'Minh chứng bài làm đáp ứng tiêu chí đánh giá.',
        confidence: Number(data.confidenceScore) || 90,
      });
    } catch (err) {
      setGradeError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi gọi AI');
    } finally {
      setIsAiGrading(false);
    }
  };

  const handleApproveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setIsSubmittingGrade(true);
    setGradeError(null);

    try {
      const res = await fetch(`/api/organizations/${organizationId}/grading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSub.id,
          totalScore: Number(inputScore),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Phê duyệt điểm thi thất bại');
      }

      setGradeSuccess(data.message || 'Đã công bố điểm chính thức thành công');

      // Update local state
      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === selectedSub.id
            ? {
                ...item,
                status: 'EVALUATED',
                total_score: Number(inputScore),
                percentage: Number(inputScore),
                is_passed: Number(inputScore) >= (item.assessments?.passing_score || 70),
              }
            : item
        )
      );

      setTimeout(() => {
        setSelectedSub(null);
      }, 1500);
    } catch (err) {
      setGradeError(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên học viên hoặc bài thi..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
          />
        </div>

        <div className="flex items-center gap-1.5 border border-slate-200 bg-white rounded-md p-0.5">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-sky-50 text-sky-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterStatus('SUBMITTED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              filterStatus === 'SUBMITTED'
                ? 'bg-amber-50 text-amber-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chờ chấm
          </button>
          <button
            onClick={() => setFilterStatus('EVALUATED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              filterStatus === 'EVALUATED'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã duyệt điểm
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Không tìm thấy bài nộp nào phù hợp với bộ lọc.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Thí sinh</th>
                <th className="py-2.5 px-4">Đề thi</th>
                <th className="py-2.5 px-4">Thời gian nộp</th>
                <th className="py-2.5 px-4">Điểm số</th>
                <th className="py-2.5 px-4">Trạng thái</th>
                <th className="py-2.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">
                      {s.profiles?.nickname || s.profiles?.full_name || 'Học viên'}
                    </div>
                    <div className="font-mono text-slate-500 text-[11px]">{s.profiles?.email}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {s.assessments?.title || 'Bài thi chuẩn'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px] tabular-nums">
                    {new Date(s.submitted_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold tabular-nums text-slate-900">
                    {s.status === 'EVALUATED' ? `${s.total_score}đ` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        s.status === 'EVALUATED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          s.status === 'EVALUATED' ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                      />
                      {s.status === 'EVALUATED' ? 'Đã duyệt' : 'Chờ chấm'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenGradeModal(s)}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-semibold transition-colors"
                    >
                      {s.status === 'EVALUATED' ? 'Xem lại' : 'Chấm bài'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Human-in-the-Loop Grading Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-md shadow-xs p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Bàn Chấm Bài & Phê Duyệt Điểm</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thí sinh: {selectedSub.profiles?.nickname || 'Học viên'} (
                  {selectedSub.profiles?.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            {/* Assessment info */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Đề thi:</span>
                <span className="font-semibold text-slate-800">
                  {selectedSub.assessments?.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chuẩn đạt:</span>
                <span className="font-mono tabular-nums text-slate-800">
                  {selectedSub.assessments?.passing_score || 70}%
                </span>
              </div>
            </div>

            {/* AI On-Demand HITL Button */}
            <div className="p-3.5 rounded-md border border-sky-100 bg-sky-50/40 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                  <span>Trợ lý AI Gợi Ý Điểm Rubric (HITL)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  AI chỉ đưa ra điểm nháp gợi ý; giảng viên giữ quyền quyết định cuối cùng.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={isAiGrading}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {isAiGrading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                    <span>Đang chấm...</span>
                  </>
                ) : (
                  <span>Gợi ý điểm</span>
                )}
              </button>
            </div>

            {/* AI Suggestion preview */}
            {aiSuggestion && (
              <div className="p-3 rounded-md bg-emerald-50/60 border border-emerald-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-900">Điểm AI đề xuất:</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-700 text-sm">
                    {aiSuggestion.suggestedScore} / 100
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 italic">
                  &quot;{aiSuggestion.evidenceQuote}&quot;
                </p>
                <div className="text-[10px] text-slate-400 text-right">
                  Độ tin cậy: {aiSuggestion.confidence}%
                </div>
              </div>
            )}

            {gradeError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" strokeWidth={1.75} />
                <span>{gradeError}</span>
              </div>
            )}

            {gradeSuccess && (
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" strokeWidth={1.75} />
                <span>{gradeSuccess}</span>
              </div>
            )}

            {/* Form to submit final approved grade */}
            <form onSubmit={handleApproveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Điểm số chính thức phê duyệt (0 - 100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={inputScore}
                  onChange={(e) => setInputScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded border border-slate-200"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGrade}
                  className="px-4 py-1.5 text-xs text-white bg-sky-600 hover:bg-sky-700 rounded font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingGrade && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                  )}
                  <span>Phê duyệt & Công bố điểm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
