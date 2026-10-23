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
} from 'lucide-react';
import {
  InContextGradingDrawer,
  InContextGradingSubmission,
  RubricCriterionItem,
} from '@/components/dashboard/evaluator/InContextGradingDrawer';

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
  const [availableAssessments, setAvailableAssessments] = useState<Array<{ id: string; title: string; duration_minutes: number }>>([]);
  const [loading, setLoading] = useState(true);

  // Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<InContextGradingSubmission | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch class details with assignments
      const res = await fetch(`/api/evaluator/classes/${classId}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.group?.assignments || []);
        
        // Transform members and mock/real submissions
        const members = data.group?.members || [];
        const subList: StudentSubmission[] = [];
        
        (data.group?.assignments || []).forEach((asg: AssignmentItem) => {
          members.forEach((m: { user_id: string; profiles?: { nickname?: string; email?: string } }) => {
            subList.push({
              id: `sub-${m.user_id}-${asg.id}`,
              studentId: m.user_id,
              studentName: m.profiles?.nickname || 'Học viên',
              studentEmail: m.profiles?.email || 'learner@nexa.edu.vn',
              status: 'NOT_SUBMITTED',
              assignmentId: asg.id,
              assignmentTitle: asg.assessments?.title || 'Bài khảo thí',
            });
          });
        });
        setSubmissions(subList);
      }

      if (role === 'EVALUATOR') {
        const assessRes = await fetch('/api/admin/assessments');
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
    if (!selectedAssessmentId) return;

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
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Không thể giao đề');
      }
    } catch {
      alert('Đã xảy ra lỗi khi giao đề');
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

  const handleRemind = (name: string) => {
    setToastMessage(`Đã gửi thông báo nhắc nhở nộp bài đến: ${name}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-sky-50 border border-sky-200 text-sky-800 rounded-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Danh Sách Bài Khảo Thí Được Giao</h3>
          <p className="text-xs text-slate-500">
            {role === 'EVALUATOR'
              ? 'Giao đề khảo thí, quản lý hạn nộp và theo dõi tiến độ làm bài của học viên.'
              : 'Các bài khảo thí bạn được giao trong nhóm học tập này.'}
          </p>
        </div>

        {role === 'EVALUATOR' && (
          <button
            type="button"
            onClick={() => setShowAssignModal(true)}
            className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Giao đề mới</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-sky-600" strokeWidth={1.75} />
          <span>Đang nạp danh sách bài khảo thí...</span>
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-md bg-white space-y-2">
          <p className="text-xs text-slate-500">Chưa có bài khảo thí nào được giao cho nhóm này.</p>
          {role === 'EVALUATOR' && (
            <button
              type="button"
              onClick={() => setShowAssignModal(true)}
              className="px-3 py-1 text-xs bg-sky-600 text-white font-semibold rounded hover:bg-sky-700 cursor-pointer"
            >
              Giao bài khảo thí đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((asg) => {
            const asm = asg.assessments;
            const deadlineText = asg.deadline
              ? new Date(asg.deadline).toLocaleString('vi-VN')
              : 'Không giới hạn';

            return (
              <div
                key={asg.id}
                className="p-4 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                      <h4 className="font-bold text-sm text-slate-900">{asm?.title || 'Bài khảo thí'}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Thời lượng: <strong className="font-mono text-slate-700">{asm?.duration_minutes || 45} phút</strong></span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
                        <span>Hạn nộp: <strong className="font-mono text-slate-700">{deadlineText}</strong></span>
                      </span>
                    </div>
                  </div>

                  {role === 'LEARNER' ? (
                    <Link
                      href={`/assessments/${asg.assessment_id}`}
                      className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <span>Vào làm bài thi</span>
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </Link>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded bg-slate-100 font-mono text-slate-700 font-semibold border border-slate-200">
                      Đang hoạt động
                    </span>
                  )}
                </div>

                {/* Evaluator: Submissions List for this assignment */}
                {role === 'EVALUATOR' && submissions.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Danh sách bài nộp của học viên
                    </span>
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded">
                      {submissions
                        .filter((s) => s.assignmentId === asg.id)
                        .slice(0, 5)
                        .map((sub) => (
                          <div
                            key={sub.id}
                            className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                          >
                            <div>
                              <span className="font-bold text-slate-800">{sub.studentName}</span>
                              <span className="text-slate-400 ml-2 text-[11px] font-mono">({sub.studentEmail})</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sub.status === 'GRADED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {sub.status === 'GRADED' ? `Đã chấm (${sub.score}đ)` : 'Chưa nộp'}
                              </span>

                              {sub.status === 'NOT_SUBMITTED' ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemind(sub.studentName)}
                                  className="px-2 py-0.5 rounded text-[11px] border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                                >
                                  Nhắc nhở
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenGrading(sub)}
                                  className="px-2 py-0.5 rounded text-[11px] bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-semibold cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAssignSubmit}
            className="bg-white border border-slate-200 rounded-md shadow-md max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                <span>Giao Bài Khảo Thí Vào Nhóm</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Chọn bài khảo thí *
                </label>
                <select
                  required
                  value={selectedAssessmentId}
                  onChange={(e) => setSelectedAssessmentId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-md text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                >
                  <option value="">-- Chọn bài khảo thí từ kho --</option>
                  {availableAssessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.duration_minutes} phút)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Hạn nộp bài (Tùy chọn)
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-3.5 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isAssigning || !selectedAssessmentId}
                className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isAssigning ? 'Đang giao...' : 'Xác nhận giao đề'}
              </button>
            </div>
          </form>
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
