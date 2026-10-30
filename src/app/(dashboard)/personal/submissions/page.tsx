'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  ArrowRight,
  RotateCcw,
  FileText,
  Upload,
  Link as LinkIcon,
  ChevronRight,
  ChevronDown,
  X,
  UploadCloud,
  Trash2,
  Paperclip,
  Check,
  Table,
  FileArchive,
  Image as ImageIcon,
  Send,
  GraduationCap,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface AssignmentItem {
  id: string;
  assessmentId: string;
  itemId?: string;
  title: string;
  groupName: string;
  groupShortCode: string;
  groupAvatarBg: string;
  dueDate: string;
  dueDayOfWeek: string;
  dateKey: string; // YYYY-MM-DD
  status: 'upcoming' | 'overdue' | 'completed';
  submittedAt?: string;
  score?: number;
  maxScore?: number;
  instructions: string;
  allowedFormats: string;
  evaluatorFeedback?: string;
  submittedFile?: {
    name: string;
    size: string;
    storagePath?: string;
  };
  studentNote?: string;
}

export default function LearnerSubmissionsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'action_required' | 'overdue' | 'upcoming' | 'completed'>('action_required');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);

  const fetchRealAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAssignments([]);
        return;
      }

      // 1. Lấy danh sách nhóm lớp người dùng tham gia hoặc chủ nhiệm
      const { data: memberRows } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('user_id', user.id);

      const classIds = (memberRows || []).map((m: any) => m.class_id);

      const { data: createdClasses } = await supabase
        .from('evaluator_classes')
        .select('id')
        .or(`evaluator_id.eq.${user.id},owner_user_id.eq.${user.id}`);

      (createdClasses || []).forEach((c: any) => {
        if (!classIds.includes(c.id)) classIds.push(c.id);
      });

      if (classIds.length === 0) {
        setAssignments([]);
        return;
      }

      // 2. Lấy các bài tập được giao cho các lớp này
      const { data: assignmentsData } = await supabase
        .from('class_assignments')
        .select(`
          id,
          class_id,
          assessment_id,
          deadline,
          created_at,
          evaluator_classes (
            id,
            name,
            class_code
          ),
          assessments (
            id,
            title,
            passing_score,
            assessment_items (
              id,
              prompt
            )
          )
        `)
        .in('class_id', classIds);

      // 3. Lấy các bài nộp của người dùng
      const { data: userSubmissions } = await supabase
        .from('assessment_submissions')
        .select(`
          id,
          assessment_id,
          class_assignment_id,
          status,
          grading_status,
          total_score,
          max_score,
          submitted_at,
          evaluator_notes,
          submission_answers (
            id,
            item_id,
            text_response,
            evidence_url
          )
        `)
        .eq('user_id', user.id);

      const subByAssignmentId = new Map<string, any>();
      const subByAssessmentId = new Map<string, any>();

      (userSubmissions || []).forEach((s: any) => {
        if (s.class_assignment_id) {
          subByAssignmentId.set(s.class_assignment_id, s);
        }
        if (s.assessment_id) {
          subByAssessmentId.set(s.assessment_id, s);
        }
      });

      const mapped: AssignmentItem[] = (assignmentsData || []).map((ca: any) => {
        const cls = Array.isArray(ca.evaluator_classes) ? ca.evaluator_classes[0] : ca.evaluator_classes;
        const asm = Array.isArray(ca.assessments) ? ca.assessments[0] : ca.assessments;
        const items = asm?.assessment_items || [];
        const firstItem = items[0];

        const existingSub = subByAssignmentId.get(ca.id) || subByAssessmentId.get(ca.assessment_id);
        const isDone = existingSub && (existingSub.status === 'SUBMITTED' || existingSub.status === 'EVALUATED');

        const endDate = ca.deadline ? new Date(ca.deadline) : new Date(Date.now() + 7 * 86400000);
        const isOverdue = !isDone && endDate < new Date();

        let submittedFile = undefined;
        let studentNote = undefined;
        if (existingSub && existingSub.submission_answers?.length > 0) {
          const ans = existingSub.submission_answers[0];
          studentNote = ans.text_response || undefined;
          if (ans.evidence_url) {
            const rawFileName = ans.evidence_url.split('/').pop() || 'minh_chung.pdf';
            const cleanFileName = rawFileName.replace(/^\w+_\d+_/, '');
            submittedFile = {
              name: cleanFileName || 'Tệp minh chứng đã nộp',
              size: 'Đã lưu trữ',
              storagePath: ans.evidence_url,
            };
          }
        }

        let submittedAtFormatted = undefined;
        if (existingSub?.submitted_at) {
          const d = new Date(existingSub.submitted_at);
          submittedAtFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }

        return {
          id: ca.id,
          assessmentId: ca.assessment_id,
          itemId: firstItem?.id,
          title: asm?.title || 'Nhiệm vụ thực hành',
          groupName: cls?.name ? `${cls.name} (${cls.class_code})` : 'Nhóm học tập',
          groupShortCode: (cls?.name || 'NH').slice(0, 2).toUpperCase(),
          groupAvatarBg: 'bg-sky-600',
          dueDate: `${endDate.getDate()} thg ${endDate.getMonth() + 1}`,
          dueDayOfWeek: `thứ ${endDate.getDay() === 0 ? 'CN' : endDate.getDay() + 1}`,
          dateKey: endDate.toISOString().split('T')[0],
          status: isDone ? 'completed' : isOverdue ? 'overdue' : 'upcoming',
          submittedAt: submittedAtFormatted,
          score: existingSub?.total_score,
          maxScore: existingSub?.max_score,
          evaluatorFeedback: existingSub?.evaluator_notes || undefined,
          submittedFile,
          studentNote,
          instructions: firstItem?.prompt || 'Hoàn thành bài đánh giá hoặc nộp minh chứng theo yêu cầu của người đánh giá.',
          allowedFormats: 'PDF (.pdf), Word (.docx), Excel (.xlsx), ZIP (.zip)',
        };
      });

      setAssignments(mapped);
    } catch (err) {
      console.error('Error fetching real assignments:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRealAssignments();
  }, [fetchRealAssignments]);

  // Submission Form State inside Drawer
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [stagedFile, setStagedFile] = useState<{ name: string; size: string } | null>(null);
  const [studentNote, setStudentNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessTurnIn, setIsSuccessTurnIn] = useState(false);
  const [isResubmittingMode, setIsResubmittingMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter items
  const filteredList = assignments
    .filter((item) => {
      let matchesTab = true;
      if (activeTab === 'action_required') {
        matchesTab = item.status === 'overdue' || item.status === 'upcoming';
      } else {
        matchesTab = item.status === activeTab;
      }
      const matchesDate = !selectedDate || item.dateKey === selectedDate;
      return matchesTab && matchesDate;
    })
    .sort((a, b) => {
      // Prioritize overdue items on top
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      return 0;
    });

  // Group by date
  const groupedByDate: Record<string, AssignmentItem[]> = {};
  filteredList.forEach((item) => {
    const key = `${item.dueDate} ${item.dueDayOfWeek}`;
    if (!groupedByDate[key]) groupedByDate[key] = [];
    groupedByDate[key].push(item);
  });

  const countUpcoming = assignments.filter((a) => a.status === 'upcoming').length;
  const countOverdue = assignments.filter((a) => a.status === 'overdue').length;
  const countCompleted = assignments.filter((a) => a.status === 'completed').length;

  const handleOpenAssignment = (item: AssignmentItem) => {
    setSelectedAssignment(item);
    setStagedFile(null);
    setStudentNote(item.studentNote || '');
    setIsSuccessTurnIn(false);
    setIsResubmittingMode(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let sizeStr = '';
    if (file.size < 1048576) {
      sizeStr = (file.size / 1024).toFixed(1) + ' KB';
    } else {
      sizeStr = (file.size / 1048576).toFixed(1) + ' MB';
    }

    setRawFile(file);
    setStagedFile({
      name: file.name,
      size: sizeStr,
    });
  };

  const handleTurnIn = async () => {
    if (!selectedAssignment || (!stagedFile && !studentNote.trim())) return;

    setIsSubmitting(true);
    try {
      let evidenceStoragePath: string | null = null;

      // 1. Tải file minh chứng lên Supabase Storage qua API an toàn
      if (rawFile) {
        const formData = new FormData();
        formData.append('file', rawFile);
        formData.append('itemId', selectedAssignment.itemId || 'item');
        formData.append('submissionId', selectedAssignment.id);

        const uploadRes = await fetch('/api/evidence/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || 'Tải tệp minh chứng thất bại');
        }

        const uploadData = await uploadRes.json();
        evidenceStoragePath = uploadData.storagePath;
      }

      // 2. Ghi nhận bài nộp thật vào cơ sở dữ liệu
      const submitRes = await fetch(`/api/assessments/${selectedAssignment.assessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classAssignmentId: selectedAssignment.id,
          timeSpentSeconds: 60,
          answers: [
            {
              itemId: selectedAssignment.itemId || '00000000-0000-0000-0000-000000000000',
              textResponse: studentNote.trim(),
              evidenceUrl: evidenceStoragePath,
            },
          ],
        }),
      });

      if (!submitRes.ok) {
        const errJson = await submitRes.json();
        throw new Error(errJson.error || 'Nộp bài thất bại');
      }

      await fetchRealAssignments();
      setIsSuccessTurnIn(true);
      setIsResubmittingMode(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi nộp bài');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
      return <Table className="w-4 h-4 text-emerald-600" />;
    }
    if (['zip', 'rar', '7z'].includes(ext || '')) {
      return <FileArchive className="w-4 h-4 text-amber-600" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4 text-sky-600" strokeWidth={1.75} />;
    }
    return <FileText className="w-4 h-4 text-sky-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Header - Microsoft Teams Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              QUẢN LÝ NHIỆM VỤ
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Nhiệm Vụ &amp; Cổng Nộp Bài
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi thời hạn bài tập được giao từ các nhóm đánh giá, nộp tệp bài làm và nhận phản hồi đánh giá năng lực từ người đánh giá.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Teams Navigation Tabs */}
      <div className="flex items-center gap-2 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('action_required')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'action_required'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Cần xử lý ({countOverdue + countUpcoming})
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'overdue'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Quá hạn ({countOverdue})
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Sắp tới ({countUpcoming})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'completed'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Đã nộp ({countCompleted})
        </button>
      </div>

      {/* Grouped List by Date */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
            <p className="text-xs">Đang tải danh sách bài tập...</p>
          </div>
        ) : Object.keys(groupedByDate).length === 0 ? (
          <div className="p-12 text-center rounded-md border border-slate-200 bg-white shadow-xs">
            <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Không có bài tập nào cần nộp
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
              {activeTab === 'action_required'
                ? 'Tuyệt vời! Bạn không còn bài tập nào cần xử lý lúc này.'
                : activeTab === 'upcoming'
                ? 'Hiện tại bạn không có bài tập nào sắp đến hạn. Khi tham gia các nhóm học tập và được giao bài tập, hạn nộp sẽ hiển thị tại đây.'
                : activeTab === 'overdue'
                ? 'Bạn không có bài tập nào bị quá hạn.'
                : 'Bạn chưa có bài nộp nào hoàn thành trong các nhóm học tập.'}
            </p>
            <Link
              href="/personal/groups"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 transition-colors shadow-xs"
            >
              <span>Vào Nhóm của tôi</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([dateLabel, items]) => (
            <div key={dateLabel} className="space-y-2">
              {/* Date Header */}
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="font-extrabold">
                  {dateLabel.split(' ')[0]} {dateLabel.split(' ')[1]} {dateLabel.split(' ')[2]}
                </span>
                <span className="text-slate-400 font-normal">{dateLabel.split(' ')[3]}</span>
              </div>

              {/* Items in this date */}
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenAssignment(item)}
                    className="p-3.5 rounded-md border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {/* Class Initial Badge */}
                      <div
                        className={`w-9 h-9 rounded-md ${item.groupAvatarBg} text-white font-bold flex items-center justify-center shrink-0 tracking-wider shadow-inner text-xs`}
                      >
                        {item.groupShortCode}
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-sm hover:text-sky-600 transition-colors leading-snug">
                          {item.title}
                        </h3>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.groupName}
                          {item.submittedAt && (
                            <span className="text-slate-400 ml-2">
                              &bull; Đã gửi vào {item.submittedAt}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill on the Right */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      {item.status === 'completed' ? (
                        <div className="flex items-center gap-2">
                          {item.score !== undefined && (
                            <span className="font-bold text-slate-900 text-xs">
                              {item.score}/{item.maxScore}đ
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200/80 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Đã nộp bài
                          </span>
                        </div>
                      ) : item.status === 'overdue' ? (
                        <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-semibold text-[11px] border border-amber-200/80 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Cần bổ sung
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium text-[11px] border border-slate-200">
                          Chưa nộp bài
                        </span>
                      )}

                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assignment Detail Drawer / Modal (Teams Style with File Turn-in) */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-2xl w-full shadow-sm space-y-5 text-slate-900 text-xs max-h-[90vh] overflow-y-auto">
            {/* Top Bar with Back and Status */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1 text-xs"
              >
                &larr; Quay lại danh sách
              </button>

              <div className="text-[11px]">
                {selectedAssignment.submittedAt ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Đã nộp bài vào {selectedAssignment.submittedAt}
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">Chưa nộp bài</span>
                )}
              </div>
            </div>

            {/* Success notification banner after turning in */}
            {isSuccessTurnIn && (
              <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-xs">
                    Nộp bài thành công! Người đánh giá đã nhận được tệp bài làm của bạn.
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-mono">
                  Đã chuyển sang mục &ldquo;Đã hoàn thành&rdquo;
                </span>
              </div>
            )}

            {/* Title & Metadata */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {selectedAssignment.title}
                </h2>
                <div className="text-right shrink-0">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">
                    Điểm số
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {selectedAssignment.score !== undefined
                      ? `${selectedAssignment.score}/${selectedAssignment.maxScore}đ`
                      : 'Chưa chấm'}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-1">
                Lớp: <span className="font-semibold text-slate-700">{selectedAssignment.groupName}</span>
                <span className="mx-2">&bull;</span>
                Hạn chót: <span className="font-semibold text-slate-700">{selectedAssignment.dueDate} {selectedAssignment.dueDayOfWeek}</span>
              </div>
            </div>

            {/* Evaluator Instructions */}
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="font-bold text-slate-800 text-xs">
                Hướng dẫn làm bài từ người đánh giá:
              </div>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {selectedAssignment.instructions}
              </p>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                <span className="font-semibold text-slate-700">Định dạng chấp nhận:</span> {selectedAssignment.allowedFormats}
              </div>
            </div>

            {/* Evaluator Feedback (if already evaluated) */}
            {selectedAssignment.evaluatorFeedback && (
              <div className="p-3.5 rounded-md bg-sky-50/40 border border-sky-200/80 space-y-1">
                <div className="font-bold text-sky-900 text-xs">
                  Nhận xét đánh giá từ Người đánh giá:
                </div>
                <p className="text-slate-700 leading-relaxed italic">
                  &ldquo;{selectedAssignment.evaluatorFeedback}&rdquo;
                </p>
              </div>
            )}

            {/* Course Recommendation Banner (When score is below 70) */}
            {selectedAssignment.score !== undefined && selectedAssignment.score < 70 && (
              <div className="p-3.5 rounded-md bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <GraduationCap className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
                    <span>Đề xuất chuyên đề bồi dưỡng nâng cao điểm số</span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white text-amber-800 border border-amber-200">
                    Điểm: {selectedAssignment.score}/100đ
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Kết quả bài thi này của bạn đạt dưới chuẩn (&lt; 70đ). Hệ thống đề xuất bạn hoàn thành khóa học thực hành sau để bổ khuyết tiêu chí này.
                </p>
                <div className="pt-1 flex items-center justify-between gap-2">
                  <Link
                    href="/personal/learning-path?courseId=CRS-402"
                    className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold inline-flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <span>Vào học khóa bồi dưỡng</span>
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </Link>
                  <Link
                    href="/personal/competency/analysis"
                    className="text-[11px] text-sky-600 hover:underline font-medium"
                  >
                    Xem chẩn đoán AI toàn diện
                  </Link>
                </div>
              </div>
            )}

            {/* SUBMITTED WORK SECTION (If completed and not currently re-submitting) */}
            {selectedAssignment.submittedFile && !isResubmittingMode && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 text-xs">
                    Công việc của tôi đã nộp:
                  </div>
                  <button
                    onClick={() => setIsResubmittingMode(true)}
                    className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold underline inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Nộp lại tệp bài khác</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-md border border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {getFileIcon(selectedAssignment.submittedFile.name)}
                    <div>
                      <div className="font-semibold text-slate-900">
                        {selectedAssignment.submittedFile.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {selectedAssignment.submittedFile.size} &bull; Đã xác thực lưu trữ máy chủ NEXA
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Đã nộp thành công
                  </span>
                </div>

                {selectedAssignment.studentNote && (
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">Ghi chú gửi kèm:</span> {selectedAssignment.studentNote}
                  </div>
                )}
              </div>
            )}

            {/* FILE UPLOAD & TURN-IN SECTION (When upcoming, overdue, or re-submitting) */}
            {(selectedAssignment.status === 'upcoming' ||
              selectedAssignment.status === 'overdue' ||
              isResubmittingMode ||
              !selectedAssignment.submittedFile) && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Đính kèm tệp bài làm của bạn
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Tối đa 25MB (Excel, Word, PDF, ZIP)
                  </span>
                </div>

                {/* Staged file preview or Upload Button */}
                {stagedFile ? (
                  <div className="p-3.5 rounded-md border border-sky-200 bg-sky-50/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {getFileIcon(stagedFile.name)}
                      <div>
                        <div className="font-semibold text-slate-900">
                          {stagedFile.name}
                        </div>
                        <div className="text-[10px] text-sky-700">
                          {stagedFile.size} &bull; Sẵn sàng nộp
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStagedFile(null)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hủy chọn tệp này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-5 rounded-md border-2 border-dashed border-slate-200 hover:border-sky-500 bg-slate-50/60 hover:bg-sky-50/30 transition-all text-center cursor-pointer space-y-1.5"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.docx,.doc,.pdf,.zip,.rar,.png,.jpg"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto text-sky-600 shadow-2xs">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      Chọn tệp bài làm từ máy tính
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Nhấp vào đây để chọn tệp {selectedAssignment.allowedFormats}
                    </p>
                  </div>
                )}

                {/* Optional Note to Evaluator */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Ghi chú gửi người đánh giá (tùy chọn):
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Em đã cập nhật lại Pivot Table ở Sheet 2 theo đúng hướng dẫn..."
                    value={studentNote}
                    onChange={(e) => setStudentNote(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Bottom Action buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedAssignment(null);
                  setIsResubmittingMode(false);
                }}
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Đóng
              </button>

              {(selectedAssignment.status === 'upcoming' ||
                selectedAssignment.status === 'overdue' ||
                isResubmittingMode ||
                !selectedAssignment.submittedFile) ? (
                <button
                  type="button"
                  onClick={handleTurnIn}
                  disabled={!stagedFile || isSubmitting}
                  className={`px-5 py-2 rounded-md font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs ${
                    selectedAssignment.status === 'overdue'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-sky-600 hover:bg-sky-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? (
                    <span>Đang nộp bài...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {selectedAssignment.status === 'overdue'
                          ? 'Nộp bổ sung bài làm'
                          : isResubmittingMode
                          ? 'Xác nhận nộp lại bài'
                          : 'Nộp bài ngay (Turn in)'}
                      </span>
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
