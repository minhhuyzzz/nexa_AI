'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ChevronLeft,
  Users,
  MessageSquare,
  CheckSquare,
  FileText,
  Plus,
  Copy,
  Check,
  Radio,
  ExternalLink,
  Search,
  Filter,
  Clock,
  Sparkles,
  ArrowRight,
  BellRing,
  CheckCircle2,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
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

interface StudentItem {
  id: string;
  name: string;
  email: string;
  submissionStatus: 'PENDING' | 'GRADED' | 'NOT_SUBMITTED';
  statusText: string;
  score?: number;
  feedback?: string;
  prompt: string;
  textResponse?: string;
  evidenceUrl?: string;
  submittedAt?: string;
  assignmentTitle: string;
}

interface GroupAssignmentItem {
  id: string;
  title: string;
  domain: string;
  dueDate: string;
  submittedCount: number;
  totalStudents: number;
  gradedCount: number;
  pendingCount: number;
}

export default function EvaluatorGroupDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const groupId = params.groupId as string;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'assignments' | 'posts' | 'files'>('students');
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [onlyPendingFilter, setOnlyPendingFilter] = useState(false);
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  // In-Context Grading Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSubmissionIndex, setActiveSubmissionIndex] = useState(0);

  const [groupInfo, setGroupInfo] = useState({
    id: groupId,
    code: 'NX-ROOM',
    name: 'Lớp học & Nhóm khảo thí',
    shortCode: 'NX',
    studentsCount: 0,
    activeExams: 1,
    createdAt: new Date().toLocaleDateString('vi-VN'),
  });

  const [assignments, setAssignments] = useState<GroupAssignmentItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);

  const fetchGroupData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch room details
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupId);
      let query = supabase.from('exam_rooms').select('*');
      if (isUUID) {
        query = query.or(`id.eq.${groupId},room_code.eq.${groupId}`);
      } else {
        query = query.eq('room_code', groupId);
      }

      const { data: roomData } = await query.maybeSingle();

      const roomId = roomData?.id || groupId;
      const roomCode = roomData?.room_code || (isUUID ? 'NX-ROOM' : groupId);
      const roomTitle = roomData?.title || 'Lớp học & Nhóm khảo thí';

      // 2. Fetch participants
      const { data: participants } = await supabase
        .from('room_participants')
        .select(`
          id,
          user_id,
          status,
          joined_at,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .eq('room_id', roomId);

      // 3. Fetch assessments
      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select('*')
        .limit(5);

      const mappedAssignments: GroupAssignmentItem[] = (assessmentsData || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        domain: 'Đa miền DigComp 3.0',
        dueDate: '23:59 hôm nay',
        submittedCount: participants ? participants.length : 0,
        totalStudents: participants ? participants.length : 0,
        gradedCount: 0,
        pendingCount: participants ? participants.length : 0,
      }));
      setAssignments(mappedAssignments);

      const mappedStudents: StudentItem[] = (participants || []).map((p: any) => {
        const prof = p.profiles;
        return {
          id: p.id,
          name: prof?.full_name || 'Học viên',
          email: prof?.email || 'learner@nexa.edu.vn',
          submissionStatus: p.status === 'COMPLETED' ? 'GRADED' : 'PENDING',
          statusText: p.status === 'COMPLETED' ? 'Đã chấm' : 'Chờ chấm',
          assignmentTitle: mappedAssignments[0]?.title || 'Khảo sát năng lực số chuẩn hóa',
          prompt: 'Thực hiện các câu hỏi khảo thí năng lực số và giải trình phương án.',
          submittedAt: p.joined_at,
        };
      });
      setStudents(mappedStudents);

      setGroupInfo({
        id: roomId,
        code: roomCode,
        name: roomTitle,
        shortCode: roomTitle.slice(0, 2).toUpperCase(),
        studentsCount: mappedStudents.length,
        activeExams: mappedAssignments.length,
        createdAt: roomData?.created_at ? new Date(roomData.created_at).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
      });
    } catch (err) {
      console.error('Error fetching group data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, groupId]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(groupInfo.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRemindStudent = (studentName: string) => {
    setReminderToast(`Đã gửi thông báo & email nhắc nhở nộp bài đến: ${studentName}`);
    setTimeout(() => setReminderToast(null), 3500);
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.email.toLowerCase().includes(searchStudent.toLowerCase());
    const matchesFilter = onlyPendingFilter ? s.submissionStatus === 'PENDING' : true;
    return matchesSearch && matchesFilter;
  });

  // Collect pending or gradable submissions for drawer
  const gradableSubmissions: InContextGradingSubmission[] = students
    .filter((s) => s.submissionStatus === 'PENDING' || s.submissionStatus === 'GRADED')
    .map((s) => ({
      id: `sub-${s.id}`,
      studentId: s.id,
      studentName: s.name,
      studentEmail: s.email,
      assignmentTitle: s.assignmentTitle,
      groupName: groupInfo.name,
      groupCode: groupInfo.code,
      submittedAt: s.submittedAt || new Date().toISOString(),
      status: s.submissionStatus === 'GRADED' ? 'EVALUATED' : 'SUBMITTED',
      prompt: s.prompt,
      textResponse: s.textResponse || 'Học viên chưa gửi văn bản trả lời.',
      evidenceUrl: s.evidenceUrl || null,
      score: s.score || 0,
      maxScore: 100,
      feedback: s.feedback || '',
      rubricCriteria: defaultRubricCriteria,
    }));

  const handleOpenGradingForStudent = (studentId: string) => {
    const idx = gradableSubmissions.findIndex((g) => g.studentId === studentId);
    if (idx !== -1) {
      setActiveSubmissionIndex(idx);
      setIsDrawerOpen(true);
    }
  };

  const handleOpenGradingForAssignment = () => {
    if (gradableSubmissions.length > 0) {
      setActiveSubmissionIndex(0);
      setIsDrawerOpen(true);
    }
  };

  const handleSaveGrade = (submissionId: string, score: number, feedback: string) => {
    const sub = gradableSubmissions.find((g) => g.id === submissionId);
    if (!sub) return;

    setStudents((prev) =>
      prev.map((st) =>
        st.id === sub.studentId
          ? {
              ...st,
              submissionStatus: 'GRADED',
              statusText: 'Đã chấm',
              score,
              feedback,
            }
          : st
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {reminderToast && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium shadow-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{reminderToast}</span>
        </div>
      )}

      {/* Back Button */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/evaluator/groups"
          className="hover:text-slate-900 inline-flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quản lý các nhóm đánh giá</span>
        </Link>
      </div>

      {/* Class Header Banner */}
      <div className="p-4 rounded-md border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs font-mono">
            {groupInfo.shortCode}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {groupInfo.code}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {groupInfo.studentsCount} học viên &bull; Tạo ngày: {groupInfo.createdAt}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {groupInfo.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                <span className="text-emerald-700 font-semibold">Đã chép mã</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                <span>Mã mời: {groupInfo.code}</span>
              </>
            )}
          </button>

          <Link
            href={`/evaluator/live-room?roomId=${groupInfo.id}`}
            className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Radio className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Mở phòng thi trực tiếp</span>
          </Link>
        </div>
      </div>

      {/* 2-Column Vertical Layout: Left Sub-Nav + Right Content */}
      <div className="flex flex-col md:flex-row gap-5 items-start">
        {/* Left Column: Vertical Sub-Navigation */}
        <aside className="w-full md:w-56 shrink-0 space-y-4">
          <nav className="p-1.5 bg-white rounded-md border border-slate-200 space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                activeTab === 'students'
                  ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Học viên &amp; Chấm bài</span>
              </div>
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                {students.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('assignments')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                activeTab === 'assignments'
                  ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Bài kiểm tra đã giao</span>
              </div>
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                {assignments.length}
              </span>
            </button>
          </nav>

          {/* Quick Metrics */}
          <div className="p-3.5 bg-white rounded-md border border-slate-200 text-xs space-y-3">
            <div className="font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Tiến độ khảo thí nhóm
            </div>
            <div className="space-y-2.5 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[11px]">Sĩ số tham gia</span>
                <span className="font-mono tabular-nums text-slate-900 font-bold">{groupInfo.studentsCount}</span>
                <span className="text-slate-500 text-xs ml-1">người học</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Bài nộp chờ chấm</span>
                <span className="font-mono tabular-nums text-amber-700 font-bold">
                  {students.filter((s) => s.submissionStatus === 'PENDING').length}
                </span>
                <span className="text-slate-500 text-xs ml-1">bài</span>
              </div>
              <div className="pt-1">
                <Link
                  href="/evaluator/grading"
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1 hover:underline"
                >
                  <span>Hàng đợi chấm toàn cục &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Dynamic Tab Content */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
              <p className="text-xs">Đang tải thông tin lớp học...</p>
            </div>
          ) : activeTab === 'students' ? (
            <div className="space-y-3">
              {/* Header Controls & Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md bg-white border border-slate-200 text-xs">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" strokeWidth={1.75} />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Tìm theo tên hoặc email học viên..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-600"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={onlyPendingFilter}
                      onChange={(e) => setOnlyPendingFilter(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                    />
                    <span className="font-medium">Chỉ hiện bài cần chấm</span>
                  </label>

                  <span className="text-slate-400">|</span>

                  <span className="text-slate-500 font-mono tabular-nums">
                    Hiển thị {filteredStudents.length} / {students.length}
                  </span>
                </div>
              </div>

              {/* Student Table */}
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 text-[11px] font-semibold">
                      <th className="py-2.5 px-3">HỌC VIÊN</th>
                      <th className="py-2.5 px-3">TRẠNG THÁI NỘP BÀI</th>
                      <th className="py-2.5 px-3">KẾT QUẢ / ĐIỂM SỐ</th>
                      <th className="py-2.5 px-3">NHẬN XÉT CỦA BẠN</th>
                      <th className="py-2.5 px-3 text-right">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
                          <div className="font-semibold text-slate-700 mb-1">Chưa có học viên nào tham gia nhóm này</div>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                            Chia sẻ mã mời <code className="font-mono font-bold text-sky-600">{groupInfo.code}</code> để học viên nhập mã và tự động ghi danh vào lớp.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{st.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{st.email}</div>
                          </td>

                          <td className="py-3 px-3">
                            {st.submissionStatus === 'PENDING' ? (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>Chờ chấm điểm</span>
                              </span>
                            ) : st.submissionStatus === 'GRADED' ? (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                <span>Đã hoàn tất</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                                Chưa nộp bài
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {st.submissionStatus === 'GRADED' && st.score !== undefined ? (
                              <span>{st.score} / 100đ</span>
                            ) : (
                              <span className="text-slate-400 font-normal">&mdash;</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-slate-600 italic max-w-xs truncate text-[11px]">
                            {st.feedback ? (
                              <span>&ldquo;{st.feedback}&rdquo;</span>
                            ) : (
                              <span className="text-slate-400 not-italic">Chưa có phản hồi</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            {st.submissionStatus === 'PENDING' || st.submissionStatus === 'GRADED' ? (
                              <button
                                onClick={() => handleOpenGradingForStudent(st.id)}
                                className="px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold text-[11px] inline-flex items-center gap-1 transition-colors shadow-xs"
                              >
                                <span>Chấm bài</span>
                                <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRemindStudent(st.name)}
                                className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] inline-flex items-center gap-1 transition-colors"
                              >
                                <BellRing className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
                                <span>Nhắc nộp</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* TAB 2: ASSIGNMENTS */
            <div className="space-y-3">
              {assignments.length === 0 ? (
                <div className="p-12 text-center rounded-md border border-slate-200 bg-white">
                  <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
                  <div className="font-semibold text-slate-800 mb-1">Chưa giao bài kiểm tra nào cho nhóm</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Giao bài khảo thí để học viên trong nhóm tiến hành làm bài và nộp minh chứng.
                  </p>
                  <Link
                    href="/evaluator/exams"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Giao bài từ đề thi chuẩn</span>
                  </Link>
                </div>
              ) : (
                assignments.map((asm) => (
                  <div
                    key={asm.id}
                    className="p-4 rounded-md border border-slate-200 bg-white space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{asm.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{asm.domain}</p>
                      </div>
                      <Link
                        href={`/evaluator/live-room?assessmentId=${asm.id}`}
                        className="px-3 py-1.5 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Radio className="w-3 h-3" strokeWidth={1.75} />
                        <span>Mở phòng thi</span>
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Hạn nộp</span>
                        <span className="font-mono text-slate-900">{asm.dueDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Đã nộp</span>
                        <span className="font-mono text-slate-900 font-bold">{asm.submittedCount} / {asm.totalStudents}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Đã chấm</span>
                        <span className="font-mono text-emerald-700 font-bold">{asm.gradedCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Chờ chấm</span>
                        <span className="font-mono text-amber-700 font-bold">{asm.pendingCount}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* In-Context Grading Drawer */}
      <InContextGradingDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        submission={gradableSubmissions[activeSubmissionIndex] || null}
        onSaveGrade={handleSaveGrade}
        onNext={() => setActiveSubmissionIndex((prev) => Math.min(prev + 1, gradableSubmissions.length - 1))}
        onPrev={() => setActiveSubmissionIndex((prev) => Math.max(prev - 1, 0))}
        currentIndex={activeSubmissionIndex}
        totalSubmissions={gradableSubmissions.length}
      />
    </div>
  );
}
