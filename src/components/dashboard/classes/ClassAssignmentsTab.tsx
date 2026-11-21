'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Users,
  X,
  Loader2,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  InContextGradingDrawer,
  InContextGradingSubmission,
  RubricCriterionItem,
} from '@/components/dashboard/grading/InContextGradingDrawer';

const defaultRubricCriteria: RubricCriterionItem[] = [
  {
    id: 'crit-01',
    name: 'Kỹ năng trích xuất & làm sạch dữ liệu số',
    maxPoints: 40,
    levels: [
      { id: 'lvl-1a', levelName: 'Xuất sắc', scorePercent: 100, description: 'Phân tích thấu đáo, số liệu minh chứng rõ ràng và chuẩn xác.' },
      { id: 'lvl-1b', levelName: 'Đạt yêu cầu', scorePercent: 75, description: 'Có phân tích số liệu nhưng chưa phân loại đa chiều.' },
      { id: 'lvl-1c', levelName: 'Cần hoàn thiện', scorePercent: 40, description: 'Chưa chỉ rõ căn cứ số liệu phân tích.' },
    ],
  },
  {
    id: 'crit-02',
    name: 'Tính khả thi & tính an toàn của giải pháp số',
    maxPoints: 40,
    levels: [
      { id: 'lvl-2a', levelName: 'Xuất sắc', scorePercent: 100, description: 'Giải pháp thực tế, có lộ trình và công cụ triển khai cụ thể.' },
      { id: 'lvl-2b', levelName: 'Đạt yêu cầu', scorePercent: 75, description: 'Giải pháp hợp lý nhưng còn mang tính khái quát.' },
      { id: 'lvl-2c', levelName: 'Cần hoàn thiện', scorePercent: 40, description: 'Giải pháp chưa bám sát vấn đề thực tế phát hiện.' },
    ],
  },
  {
    id: 'crit-03',
    name: 'Tuân thủ an toàn thông tin & đạo đức công nghệ',
    maxPoints: 20,
    levels: [
      { id: 'lvl-3a', levelName: 'Xuất sắc', scorePercent: 100, description: 'Nắm vững quy chuẩn bảo vệ dữ liệu cá nhân và bảo mật 2FA.' },
      { id: 'lvl-3b', levelName: 'Đạt yêu cầu', scorePercent: 75, description: 'Khái niệm đúng nhưng cần bổ sung biện pháp kỹ thuật sâu.' },
      { id: 'lvl-3c', levelName: 'Cần hoàn thiện', scorePercent: 40, description: 'Còn thiếu sót về quy định bảo mật số.' },
    ],
  },
];

interface AssignmentItem {
  id: string;
  assessment_id: string;
  deadline?: string | null;
  created_at?: string;
  assessments?: {
    id: string;
    title: string;
    duration_minutes?: number;
    passing_score?: number;
  };
}

interface AvailableAssessmentItem {
  id: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  passing_score?: number;
  assessment_items?: Array<{ id: string }>;
}

interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: 'PENDING' | 'GRADED' | 'NOT_SUBMITTED';
  score?: number;
  submittedAt?: string;
  assignmentId: string;
  assignmentTitle: string;
  textResponse?: string;
  evidenceUrl?: string;
}

interface ClassAssignmentsTabProps {
  classId: string;
  classNameStr: string;
  classCode: string;
  role: 'EVALUATOR' | 'LEARNER';
  currentUserId: string;
}

export function ClassAssignmentsTab({
  classId,
  classNameStr,
  classCode,
  role,
  currentUserId,
}: ClassAssignmentsTabProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [availableAssessments, setAvailableAssessments] = useState<AvailableAssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<InContextGradingSubmission | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch class details with assignments and real submissions
      const res = await fetch(`/api/classes/${classId}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.group?.assignments || []);
        
        // Transform members and map real submissions
        const members = data.group?.members || [];
        const realSubs: Array<{
          id: string;
          user_id: string;
          assessment_id: string;
          class_assignment_id?: string | null;
          status: string;
          total_score?: number | null;
          percentage?: number | null;
          submitted_at?: string | null;
        }> = data.group?.submissions || [];

        const subList: StudentSubmission[] = [];
        
        (data.group?.assignments || []).forEach((asg: AssignmentItem) => {
          members.forEach((m: { user_id: string; profiles?: { nickname?: string; email?: string } }) => {
            const matchedSub = realSubs.find(
              (s) => s.user_id === m.user_id && (s.class_assignment_id === asg.id || s.assessment_id === asg.assessment_id)
            );

            let status: 'PENDING' | 'GRADED' | 'NOT_SUBMITTED' = 'NOT_SUBMITTED';
            let score: number | undefined;

            if (matchedSub) {
              if (matchedSub.status === 'EVALUATED') {
                status = 'GRADED';
                score = matchedSub.total_score ?? (matchedSub.percentage ?? undefined);
              } else if (matchedSub.status === 'SUBMITTED' || matchedSub.status === 'EVALUATING') {
                status = 'PENDING';
              }
            }

            subList.push({
              id: matchedSub ? matchedSub.id : `sub-${m.user_id}-${asg.id}`,
              studentId: m.user_id,
              studentName: m.profiles?.nickname || 'Học viên',
              studentEmail: m.profiles?.email || 'learner@nexa.edu.vn',
              status,
              score,
              submittedAt: matchedSub?.submitted_at || undefined,
              assignmentId: asg.id,
              assignmentTitle: asg.assessments?.title || 'Bài khảo thí',
            });
          });
        });
        setSubmissions(subList);
      }

      // Fetch user's personal assessment bank
      if (role === 'EVALUATOR') {
        const assessRes = await fetch('/api/personal/assessments');
        if (assessRes.ok) {
          const assessData = await assessRes.json();
          setAvailableAssessments(assessData.assessments || []);
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching assignments data:', err);
    } finally {
      setLoading(false);
    }
  }, [classId, role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError(null);
    if (!selectedAssessmentId) {
      setAssignError('Vui lòng chọn bài khảo thí để giao.');
      return;
    }

    try {
      setIsAssigning(true);
      const res = await fetch(`/api/evaluator/classes/${classId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: selectedAssessmentId,
          deadline: deadline ? new Date(deadline).toISOString() : null,
        }),
      });

      if (res.ok) {
        setShowAssignModal(false);
        setSelectedAssessmentId('');
        setDeadline('');
        setToastMessage('Đã giao bài khảo thí vào nhóm thành công!');
        setTimeout(() => setToastMessage(null), 3000);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setAssignError(err.error || 'Không thể giao đề cho nhóm');
      }
    } catch {
      setAssignError('Đã xảy ra lỗi kết nối khi giao đề');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleOpenGrading = (sub: StudentSubmission) => {
    setActiveSubmission({
      id: sub.id,
      studentId: sub.studentId,
      studentName: sub.studentName,
      studentEmail: sub.studentEmail,
      assignmentTitle: sub.assignmentTitle,
      groupName: classNameStr,
      groupCode: classCode,
      submittedAt: sub.submittedAt || new Date().toISOString(),
      status: sub.status === 'GRADED' ? 'EVALUATED' : 'SUBMITTED',
      prompt: 'Thực hiện bài kiểm tra trắc nghiệm và câu hỏi tình huống năng lực số.',
      textResponse: sub.textResponse || 'Học viên đã nộp bài giải trình trên hệ thống.',
      evidenceUrl: sub.evidenceUrl || null,
      score: sub.score || 0,
      maxScore: 100,
      rubricCriteria: defaultRubricCriteria,
    });
    setIsDrawerOpen(true);
  };

  const handleSaveGrade = (submissionId: string, totalScore: number) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId ? { ...s, status: 'GRADED', score: totalScore } : s
      )
    );
    setIsDrawerOpen(false);
    setToastMessage('Đã lưu kết quả chấm điểm thành công!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRemind = (studentName: string) => {
    alert(`Đã gửi lời nhắc nộp bài khảo thí đến ${studentName}`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Danh Sách Bài Khảo Thí Được Giao</h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            {role === 'EVALUATOR'
              ? 'Giao đề khảo thí từ kho cá nhân, quản lý hạn nộp và theo dõi tiến độ nộp bài của học viên.'
              : 'Các bài khảo thí bạn được giao hoàn thành trong nhóm học tập này.'}
          </p>
        </div>

        {role === 'EVALUATOR' && (
          <button
            type="button"
            onClick={() => {
              setAssignError(null);
              setShowAssignModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>Giao đề mới</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 dark:text-neutral-500 flex items-center justify-center gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          <span>Đang nạp danh sách bài khảo thí...</span>
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-[#111114] space-y-3">
          <FileText className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" strokeWidth={1.75} />
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Chưa có bài khảo thí nào được giao cho nhóm này.</p>
          {role === 'EVALUATOR' && (
            <button
              type="button"
              onClick={() => {
                setAssignError(null);
                setShowAssignModal(true);
              }}
              className="px-4 py-2 text-xs bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Giao bài khảo thí đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((asg) => {
            const asm = asg.assessments;
            const deadlineText = asg.deadline
              ? new Date(asg.deadline).toLocaleString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Không giới hạn thời gian';

            const asgSubmissions = submissions.filter((s) => s.assignmentId === asg.id);

            return (
              <div
                key={asg.id}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-slate-300 dark:hover:border-zinc-700 transition-all space-y-4 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                        {asm?.title || 'Bài khảo thí'}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-neutral-400 flex-wrap">
                      <span>
                        Thời lượng: <strong className="font-mono text-neutral-800 dark:text-zinc-200">{asm?.duration_minutes || 45} phút</strong>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
                        <span>Hạn nộp: <strong className="font-mono text-neutral-800 dark:text-zinc-200">{deadlineText}</strong></span>
                      </span>
                    </div>
                  </div>

                  {role === 'LEARNER' ? (
                    <Link
                      href={`/assessments/${asg.assessment_id}`}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      <span>Vào làm bài thi</span>
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/personal/grading?assessmentId=${asg.assessment_id}&classId=${classId}`}
                        className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 text-neutral-800 dark:text-zinc-200 text-xs font-semibold border border-slate-200 dark:border-zinc-750 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Mở Bàn chấm bài cho bài khảo thí này"
                      >
                        <span>Bàn chấm</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      </Link>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 font-mono text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                        Đang mở
                      </span>
                    </div>
                  )}
                </div>

                {/* Evaluator: Submissions List for this assignment */}
                {role === 'EVALUATOR' && asgSubmissions.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block font-mono">
                      Bài nộp của học viên ({asgSubmissions.length})
                    </span>
                    <div className="rounded-xl border border-slate-100 dark:border-zinc-850 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-850">
                      {asgSubmissions.slice(0, 5).map((sub) => (
                        <div
                          key={sub.id}
                          className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/70 dark:hover:bg-zinc-850/50 transition-colors"
                        >
                          <div>
                            <span className="font-bold text-neutral-900 dark:text-neutral-100">{sub.studentName}</span>
                            <span className="text-slate-400 dark:text-neutral-500 ml-2 text-[11px] font-mono">({sub.studentEmail})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                                sub.status === 'GRADED'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : sub.status === 'PENDING'
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-zinc-700'
                              }`}
                            >
                              {sub.status === 'GRADED'
                                ? `Đã chấm (${sub.score}đ)`
                                : sub.status === 'PENDING'
                                ? 'Chờ chấm'
                                : 'Chưa nộp'}
                            </span>

                            {sub.status === 'NOT_SUBMITTED' ? (
                              <button
                                type="button"
                                onClick={() => handleRemind(sub.studentName)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer font-medium"
                              >
                                Nhắc nhở
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenGrading(sub)}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-900 font-semibold cursor-pointer"
                              >
                                Chấm điểm
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                  <span>Giao Bài Khảo Thí Vào Nhóm</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Chọn đề từ kho đề đánh giá cá nhân của bạn
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-neutral-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            {assignError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{assignError}</span>
              </div>
            )}

            {availableAssessments.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/50 space-y-3">
                <Layers className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Kho đề cá nhân đang trống
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Bạn chưa có bài khảo thí nào trong mục "Đề đánh giá của tôi". Hãy tạo đề mới để bắt đầu giao cho nhóm.
                  </p>
                </div>
                <Link
                  href="/personal/assessments/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo đề đánh giá mới</span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1.5">
                    Chọn bài khảo thí từ kho đề của bạn *
                  </label>
                  <select
                    required
                    value={selectedAssessmentId}
                    onChange={(e) => setSelectedAssessmentId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600 font-sans"
                  >
                    <option value="">-- Chọn đề từ kho cá nhân ({availableAssessments.length} đề) --</option>
                    {availableAssessments.map((a) => {
                      const itemCount = a.assessment_items?.length ?? 0;
                      return (
                        <option key={a.id} value={a.id}>
                          {a.title} — {a.duration_minutes || 45} phút {itemCount > 0 ? `(${itemCount} câu)` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1.5">
                    Hạn nộp bài (Tùy chọn)
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1 block">
                    Để trống nếu không giới hạn thời gian nộp bài.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigning || !selectedAssessmentId}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    {isAssigning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang giao đề...</span>
                      </>
                    ) : (
                      <span>Xác nhận giao đề</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* In-Context Grading Drawer */}
      <InContextGradingDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        submission={activeSubmission}
        onSaveGrade={handleSaveGrade}
      />
    </div>
  );
}
