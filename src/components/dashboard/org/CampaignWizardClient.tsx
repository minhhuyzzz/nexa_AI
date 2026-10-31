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
  assessors: AssessorOption[];
}

const STEPS = [
  { id: 1, label: 'Thông tin đợt' },
  { id: 2, label: 'Chọn đề thi' },
  { id: 3, label: 'Chọn lớp học' },
  { id: 4, label: 'Phân công chấm' },
  { id: 5, label: 'Xác nhận & Phát hành' },
];

export function CampaignWizardClient({
  orgId,
  orgSlug,
  orgName,
  assessments,
  classes,
  assessors,
}: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 10));
  const [endsAt, setEndsAt] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [passingScore, setPassingScore] = useState(70);

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessments[0]?.id || ''
  );
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedAssessorIds, setSelectedAssessorIds] = useState<string[]>([]);

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

  const toggleAssessor = (id: string) => {
    setSelectedAssessorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      if (!title.trim() || title.trim().length < 3) {
        setErrorMsg('Vui lòng nhập tên đợt đánh giá (tối thiểu 3 ký tự).');
        return false;
      }
      if (new Date(endsAt) <= new Date(startsAt)) {
        setErrorMsg('Ngày kết thúc phải sau ngày bắt đầu.');
        return false;
      }
    }
    if (step === 2) {
      if (!selectedAssessmentId) {
        setErrorMsg('Vui lòng chọn 1 đề thi đánh giá năng lực.');
        return false;
      }
    }
    if (step === 3) {
      if (selectedClassIds.length === 0) {
        setErrorMsg('Vui lòng chọn ít nhất 1 lớp học tham gia đợt khảo thí.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(STEPS.length, prev + 1));
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleCreateCampaign = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          assessmentId: selectedAssessmentId,
          classIds: selectedClassIds,
          assessorIds: selectedAssessorIds,
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href={`/org/${orgSlug}/campaigns`} className="hover:text-slate-800 transition-colors">
              Đợt đánh giá
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Khởi tạo đợt mới (Campaign Wizard)</span>
          </div>
          <h1 className="text-base font-bold text-slate-900 mt-1">
            Điều Phối Đợt Đánh Giá Năng Lực Chuẩn Hóa
          </h1>
        </div>
        <Link
          href={`/org/${orgSlug}/campaigns`}
          className="text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded border border-slate-200 bg-white"
        >
          Hủy bỏ
        </Link>
      </div>

      {/* Visual Stepper */}
      <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
        <div className="grid grid-cols-5 gap-2">
          {STEPS.map((s) => {
            const isPassed = currentStep > s.id;
            const isCurrent = currentStep === s.id;

            return (
              <div key={s.id} className="text-center">
                <div
                  className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                    isPassed
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-sky-600 text-white ring-2 ring-sky-200'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isPassed ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : `0${s.id}`}
                </div>
                <div
                  className={`text-[11px] font-medium mt-1.5 truncate ${
                    isCurrent ? 'text-sky-700 font-semibold' : isPassed ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Wizard Steps Form */}
      <div className="p-6 rounded-md border border-slate-200 bg-white shadow-xs min-h-[380px] flex flex-col justify-between">
        {/* Step 1: Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bước 1: Thông tin cơ bản đợt đánh giá</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập định danh và khoảng thời gian mở thi cho đơn vị {orgName}.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên đợt đánh giá <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Khảo sát Năng lực số Đầu vào Sinh viên K24"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả mục tiêu</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả mục đích đợt thi, đối tượng khảo sát và yêu cầu cần chuẩn bị..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chuẩn đạt (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Assessment Selection */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bước 2: Chọn đề thi khảo thí</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nội dung bài thi sẽ được khóa phiên bản (Version Lock) nhằm đảm bảo tính công bằng và toàn vẹn học thuật.
              </p>
            </div>

            {assessments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-md">
                Chưa có đề thi nào khả dụng trong hệ thống. Vui lòng tạo đề thi trước.
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {assessments.map((a) => {
                  const isSelected = selectedAssessmentId === a.id;
                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAssessmentId(a.id)}
                      className={`p-3.5 rounded-md border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{a.title}</span>
                            {a.version && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                v{a.version}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
                              {a.duration_minutes} phút
                            </span>
                            <span>Chuẩn đạt: {a.passing_score}%</span>
                            {a.visibility === 'PUBLIC' && (
                              <span className="text-sky-600">Mẫu chuẩn hệ thống</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Class Selection */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Bước 3: Chọn các lớp học tham gia</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bài thi sẽ tự động được giao vào danh sách bài tập của toàn bộ sinh viên/học viên thuộc các lớp được chọn.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-500">
                Đã chọn: <span className="text-sky-700 font-bold">{selectedClassIds.length}</span> lớp ({totalStudentsTargeted} học viên)
              </div>
            </div>

            {classes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-md">
                Tổ chức chưa có lớp học nào. Vui lòng tạo lớp học trước khi giao bài.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                {classes.map((cls) => {
                  const checked = selectedClassIds.includes(cls.id);
                  return (
                    <div
                      key={cls.id}
                      onClick={() => toggleClass(cls.id)}
                      className={`p-3 rounded-md border cursor-pointer transition-all flex items-center justify-between ${
                        checked
                          ? 'border-sky-600 bg-sky-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 text-sky-600 rounded border-slate-300 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{cls.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            Mã: {cls.class_code}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {cls.memberCount} thành viên
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Assessor Assignment */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Bước 4: Phân công người chấm bài</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chỉ định giảng viên hoặc chuyên viên khảo thí được quyền xem và chấm bài thi tự luận/thực hành của đợt này.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-500">
                Đã chọn: <span className="text-sky-700 font-bold">{selectedAssessorIds.length}</span> người chấm
              </div>
            </div>

            {assessors.length === 0 ? (
              <div className="p-4 rounded bg-slate-50 border border-slate-200 text-xs text-slate-500">
                Chưa có thêm giảng viên/chuyên viên nào trong tổ chức. Quản trị viên đợt thi sẽ tự động đảm nhiệm vai trò chấm bài.
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {assessors.map((a) => {
                  const checked = selectedAssessorIds.includes(a.userId);
                  return (
                    <div
                      key={a.userId}
                      onClick={() => toggleAssessor(a.userId)}
                      className={`p-3 rounded-md border cursor-pointer transition-all flex items-center justify-between ${
                        checked
                          ? 'border-sky-600 bg-sky-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 text-sky-600 rounded border-slate-300 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{a.name}</div>
                          <div className="text-[11px] text-slate-500">{a.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {a.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Review & Publish */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bước 5: Xác nhận &amp; Phát hành</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Vui lòng kiểm tra lại toàn bộ thông số trước khi hệ thống giao bài nguyên tử cho các lớp học.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Tên đợt thi:</span>
                  <span className="font-bold text-slate-900">{title}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Thời gian triển khai:</span>
                  <span className="font-mono text-slate-800">
                    {new Date(startsAt).toLocaleDateString('vi-VN')} → {new Date(endsAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Đề thi khảo sát:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedAssessment?.title} (v{selectedAssessment?.version || '1.0'})
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Quy mô giao bài:</span>
                  <span className="font-mono text-slate-800">
                    {selectedClassIds.length} lớp học (~{totalStudentsTargeted} học viên)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Người chấm được phân công:</span>
                  <span className="font-mono text-slate-800">
                    {selectedAssessorIds.length} chuyên viên
                  </span>
                </div>
              </div>

              <div className="p-3 rounded bg-sky-50/60 border border-sky-200 text-sky-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" strokeWidth={1.75} />
                <span className="text-[11px]">
                  Sau khi xác nhận, toàn bộ bài tập sẽ được phát hành tới sinh viên và đợt thi chuyển sang trạng thái <strong>ACTIVE</strong>.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls Footer */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-100 mt-6">
          <button
            type="button"
            disabled={currentStep === 1 || submitting}
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Quay lại</span>
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleCreateCampaign}
              className="flex items-center gap-1.5 px-5 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                  <span>Đang khởi tạo đợt thi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Khởi tạo &amp; Phát hành đợt thi</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
