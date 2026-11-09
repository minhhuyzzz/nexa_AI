'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarRange,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Users,
  Award,
  Loader2,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  CheckSquare,
  Square,
} from 'lucide-react';

export interface AssessmentOption {
  id: string;
  title: string;
  duration_minutes: number;
  passing_score: number;
  version?: string;
  visibility?: string;
}

export interface ClassOption {
  id: string;
  name: string;
  class_code: string;
  memberCount: number;
}

export interface AssessorOption {
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  orgId: string;
  orgSlug: string;
  orgName: string;
  assessments: AssessmentOption[];
  classes: ClassOption[];
  assessors?: AssessorOption[];
  initialAssessmentId?: string;
  initialClassId?: string;
}

const QUICK_TITLE_SUGGESTIONS = [
  'Đánh giá đầu vào',
  'Khảo sát giữa kỳ',
  'Đánh giá định kỳ Q1',
  'Đánh giá định kỳ Q2',
  'Khảo thí 5 miền năng lực số',
  'Thi thực hành cuối khóa',
];

export function CampaignWizardClient({
  orgId,
  orgSlug,
  orgName,
  assessments,
  classes,
  assessors = [],
  initialAssessmentId,
  initialClassId,
}: Props) {
  const router = useRouter();

  // Form state
  const targetInitialClass = classes.find(c => c.id === initialClassId);
  const initialAsm = assessments.find(a => a.id === initialAssessmentId) || assessments[0];
  const [title, setTitle] = useState(initialAsm ? (targetInitialClass ? `${initialAsm.title} - ${targetInitialClass.name}` : initialAsm.title) : '');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 10));
  const [endsAt, setEndsAt] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [passingScore, setPassingScore] = useState(70);

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    initialAssessmentId || assessments[0]?.id || ''
  );
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(
    initialClassId ? [initialClassId] : classes.length > 0 ? [classes[0].id] : []
  );

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);
  const totalStudentsTargeted = classes
    .filter((c) => selectedClassIds.includes(c.id))
    .reduce((sum, c) => sum + c.memberCount, 0);

  const toggleClass = (id: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllClasses = () => {
    if (selectedClassIds.length === classes.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(classes.map((c) => c.id));
    }
  };

  const handleCreateCampaign = async () => {
    setErrorMsg(null);

    const effectiveTitle = title.trim() || (selectedAssessment ? `${selectedAssessment.title}${targetInitialClass ? ' - ' + targetInitialClass.name : ''}` : 'Đợt khảo thí');
    if (effectiveTitle.length < 2) {
      setErrorMsg('Vui lòng nhập tên đợt đánh giá hợp lệ.');
      return;
    }

    if (!selectedAssessmentId) {
      setErrorMsg('Vui lòng chọn 1 đề thi đánh giá năng lực.');
      return;
    }

    if (selectedClassIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 lớp/nhóm học viên tham gia.');
      return;
    }

    if (new Date(endsAt) <= new Date(startsAt)) {
      setErrorMsg('Ngày kết thúc phải diễn ra sau ngày bắt đầu.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/organizations/${orgId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: effectiveTitle,
          description: description.trim() || undefined,
          assessmentId: selectedAssessmentId,
          classIds: selectedClassIds,
          assessorIds: [],
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          passingScore,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo đợt đánh giá');
      }

      router.push(`/org/${orgSlug}/campaigns`);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi hệ thống');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/org/${orgSlug}/campaigns`}
              className="text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-100 text-xs inline-flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Đợt đánh giá</span>
            </Link>
            <span className="text-slate-300 dark:text-zinc-700">/</span>
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Khởi tạo đợt khảo thí
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Tạo đợt đánh giá năng lực số
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Giao đề thi tập trung cho các lớp hoặc phòng ban trực thuộc tổ chức {orgName}.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Blocks (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Block 1: Thông tin đợt */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center font-mono">
                1
              </span>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Thông tin đợt đánh giá
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Tên đợt đánh giá <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Đợt đánh giá kỹ năng số đầu vào K66, Khảo sát Q1/2026..."
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400"
                />

                {/* Quick suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500">Gợi ý nhanh:</span>
                  {QUICK_TITLE_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setTitle(sug)}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-neutral-300 transition"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Mô tả / Mục tiêu khảo thí (tùy chọn)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Ghi chú mục đích của đợt đánh giá, đối tượng áp dụng hoặc yêu cầu bổ sung..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Block 2: Chọn đề đánh giá */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center font-mono">
                  2
                </span>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Chọn đề đánh giá đã phát hành
                </h2>
              </div>
              <Link
                href={`/org/${orgSlug}/assessments`}
                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <span>Xem thư viện đề</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {assessments.length === 0 ? (
              <div className="p-6 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 text-center space-y-2">
                <p className="text-xs text-slate-500">Chưa có đề đánh giá nào khả dụng.</p>
                <Link
                  href={`/org/${orgSlug}/assessments/new`}
                  className="inline-block px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition"
                >
                  Tạo đề đánh giá mới
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {assessments.map((ass) => {
                  const isSelected = ass.id === selectedAssessmentId;
                  return (
                    <div
                      key={ass.id}
                      onClick={() => {
                        setSelectedAssessmentId(ass.id);
                        const cls = classes.find(c => selectedClassIds.includes(c.id));
                        setTitle(cls ? `${ass.title} - ${cls.name}` : ass.title);
                      }}
                      className={`p-3.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500/20'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 dark:border-zinc-700'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {ass.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 font-mono">
                            <span>{ass.duration_minutes} phút</span>
                            <span>&bull;</span>
                            <span>Chuẩn đạt: {ass.passing_score}%</span>
                            {ass.visibility === 'PUBLIC' && (
                              <>
                                <span>&bull;</span>
                                <span className="text-blue-600 font-sans font-medium">Chuẩn quốc tế</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 shrink-0 font-mono">
                          ĐÃ CHỌN
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Block 3: Chọn lớp / nhóm tham gia */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center font-mono">
                  3
                </span>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Chọn lớp / nhóm tham gia
                </h2>
              </div>

              {classes.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllClasses}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  {selectedClassIds.length === classes.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả lớp'}
                </button>
              )}
            </div>

            {classes.length === 0 ? (
              <div className="p-6 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 text-center space-y-2">
                <p className="text-xs text-slate-500">Tổ chức chưa tạo lớp học hoặc nhóm đơn vị nào.</p>
                <Link
                  href={`/org/${orgSlug}/classes`}
                  className="inline-block px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition"
                >
                  Đến trang tạo lớp
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {classes.map((cls) => {
                  const isChecked = selectedClassIds.includes(cls.id);
                  return (
                    <div
                      key={cls.id}
                      onClick={() => toggleClass(cls.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between gap-2.5 ${
                        isChecked
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500/20'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 dark:text-zinc-700 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {cls.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">Mã: {cls.class_code}</p>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono tabular-nums text-slate-500 shrink-0">
                        {cls.memberCount} học viên
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Block 4: Thời gian & Chuẩn đạt */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center font-mono">
                4
              </span>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Thời gian mở bài &amp; Chuẩn đạt
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Ngày bắt đầu mở bài
                </label>
                <input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Hạn chót kết thúc
                </label>
                <input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Điểm chuẩn đạt (/100)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value) || 70)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-mono font-bold text-xs"
                  />
                  <span className="text-xs font-mono text-slate-400 shrink-0">điểm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Summary & Publish Action (4 cols) */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 pb-2">
              Tóm tắt đợt khảo thí
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Tên đợt:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100 text-right">
                  {title.trim() || 'Chưa đặt tên'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Đề đánh giá:</span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200 text-right truncate max-w-[160px]">
                  {selectedAssessment?.title || 'Chưa chọn đề'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Thời lượng làm bài:</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedAssessment?.duration_minutes || 45} phút
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lớp tham gia:</span>
                <span className="font-mono font-bold text-blue-600">
                  {selectedClassIds.length} lớp học
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Quy mô dự kiến:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {totalStudentsTargeted} học viên
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Thời gian mở:</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">
                  {startsAt} &rarr; {endsAt}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ngưỡng đạt:</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {passingScore}/100đ
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Trạng thái khởi tạo:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {new Date(startsAt) > new Date() ? 'SCHEDULED (Sắp diễn ra)' : 'ACTIVE (Đang diễn ra)'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={submitting || !title.trim() || !selectedAssessmentId || selectedClassIds.length === 0}
                onClick={handleCreateCampaign}
                className="w-full h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang phát hành đợt...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Phát hành đợt đánh giá</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-neutral-500 text-center leading-relaxed">
              Sau khi phát hành, đề thi sẽ tự động xuất hiện trong không gian Cá nhân của toàn bộ học viên thuộc các lớp được chọn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
