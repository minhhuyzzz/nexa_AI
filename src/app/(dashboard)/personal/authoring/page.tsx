'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileCheck,
  Plus,
  Radio,
  Clock,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
  Loader2,
  HelpCircle,
  Users,
  Calendar,
  Edit3,
  Trash2,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  CheckSquare,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AssessmentRow {
  id: string;
  code: string;
  title: string;
  description: string;
  domain: string;
  durationMinutes: number;
  passingScore: number;
  questionCount: number;
  mcqCount: number;
  scenarioCount: number;
  practicalCount: number;
  assignedGroup: string;
  status: 'ACTIVE' | 'DRAFT';
  updatedAt: string;
}

export default function EvaluatorAssessmentsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Assign to Group Modal State
  const [classes, setClasses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [assignModalAsm, setAssignModalAsm] = useState<AssessmentRow | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isAssigning, setIsAssigning] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          id,
          title,
          description,
          duration_minutes,
          passing_score,
          is_published,
          created_at,
          updated_at,
          assessment_items (
            id,
            type,
            points,
            competencies (
              skill_code,
              competency_domains (
                code,
                title
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assessments:', error);
      } else if (data) {
        const mapped: AssessmentRow[] = data.map((a: any) => {
          const items = Array.isArray(a.assessment_items) ? a.assessment_items : [];
          const mcqCount = items.filter((i: any) => i.type === 'MCQ').length;
          const scenarioCount = items.filter((i: any) => i.type === 'SCENARIO').length;
          const practicalCount = items.filter(
            (i: any) =>
              i.type === 'PRACTICAL' ||
              i.type === 'DIGITAL_EVIDENCE' ||
              i.type === 'PRACTICAL_TASK' ||
              i.type === 'PRACTICAL_FILE'
          ).length;

          const domainCodes = [
            ...new Set(
              items
                .map((i: any) => {
                  const comp = Array.isArray(i.competencies) ? i.competencies[0] : i.competencies;
                  const dom = Array.isArray(comp?.competency_domains)
                    ? comp?.competency_domains[0]
                    : comp?.competency_domains;
                  return dom?.code;
                })
                .filter(Boolean)
            ),
          ];

          const domainLabel =
            domainCodes.length === 0
              ? 'Đa miền DigComp'
              : domainCodes.length === 1
              ? `Miền 0${domainCodes[0]}`
              : `Đa miền (${domainCodes.length} miền)`;

          return {
            id: a.id,
            code: `ASM-${a.id.slice(0, 6).toUpperCase()}`,
            title: a.title,
            description: a.description || '',
            domain: domainLabel,
            durationMinutes: a.duration_minutes || 45,
            passingScore: Number(a.passing_score) || 70,
            questionCount: items.length,
            mcqCount,
            scenarioCount,
            practicalCount,
            assignedGroup: 'Toàn hệ thống',
            status: a.is_published ? 'ACTIVE' : 'DRAFT',
            updatedAt: new Date(a.updated_at || a.created_at).toLocaleDateString('vi-VN'),
          };
        });
        setAssessments(mapped);
      }
    } catch (err) {
      console.error('Unexpected error loading assessments:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/evaluator/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
        if (data.classes && data.classes.length > 0) {
          setSelectedClassId(data.classes[0].id);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
    fetchClasses();
  }, [fetchAssessments, fetchClasses]);

  // 1-Click Launch Live Room
  const handleLaunchLive = async (asm: AssessmentRow) => {
    setActionLoadingId(asm.id);
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const roomTitle = `${asm.title} - Ca thi ${timeStr}`;

      const res = await fetch('/api/evaluator/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: roomTitle,
          assessmentId: asm.id,
          roomMode: 'OPEN',
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Không thể tạo phòng thi trực tiếp');
      }

      const data = await res.json();
      if (data.room?.id) {
        router.push(`/live/control?roomId=${data.room.id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi khởi tạo phòng thi trực tiếp');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Assessment
  const handleDeleteAssessment = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài khảo thí "${title}" không?`)) return;

    try {
      const res = await fetch(`/api/personal/assessments/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa bài thi');

      setAssessments((prev) => prev.filter((item) => item.id !== id));
      showToast(data.message || 'Đã xóa bài khảo thí thành công!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi xóa bài thi';
      alert(message);
    }
  };

  // Confirm Assign to Group
  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalAsm || !selectedClassId) return;
    setIsAssigning(true);

    try {
      const res = await fetch(`/api/evaluator/classes/${selectedClassId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: assignModalAsm.id,
          deadline: deadlineDate ? new Date(`${deadlineDate}T23:59:59`).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Lỗi khi giao bài cho lớp');
      }

      const assignedClass = classes.find((c) => c.id === selectedClassId);
      showToast(`Đã giao bài "${assignModalAsm.title}" cho lớp "${assignedClass?.name || 'Lớp học'}"`);
      setAssignModalAsm(null);
    } catch (err: any) {
      alert(err.message || 'Không thể giao bài cho lớp');
    } finally {
      setIsAssigning(false);
    }
  };

  const filtered = assessments.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-md shadow-md border border-slate-700 flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.75} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              KHẢO THÍ CHUYÊN GIA
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản Lý Đề Khảo Thí &amp; Đợt Thi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết kế đề thi cá nhân trong 3-Pane Studio, phát sóng phòng thi PIN trực tiếp hoặc giao bài cho lớp học.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/personal/authoring/new"
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>Soạn đề thi mới</span>
          </Link>
        </div>
      </div>

      {/* Compact Status Bar (h-10) - Replaced Fake KPI Cards */}
      <div className="h-10 px-4 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-500">Tổng số đề:</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {loading ? '-' : assessments.length}
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-500">Đang kích hoạt:</span>
            <span className="font-mono font-bold text-emerald-700 tabular-nums">
              {assessments.filter((a) => a.status === 'ACTIVE').length}
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-500">Bản nháp:</span>
            <span className="font-mono font-bold text-slate-700 tabular-nums">
              {assessments.filter((a) => a.status === 'DRAFT').length}
            </span>
          </div>
        </div>

        <div className="hidden sm:block text-[11px] text-slate-400 font-mono">
          Trình điều phối khảo thí NEXA &bull; Mã PIN 6 số &amp; QR Live
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-md border border-slate-200 bg-white">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, mã đề hoặc miền năng lực..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md text-xs pl-9 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Assessment Table */}
      <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
            <p className="text-xs">Đang tải danh sách bài khảo thí...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              {searchQuery ? 'Không tìm thấy bài khảo thí phù hợp' : 'Chưa có bài khảo thí nào'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {searchQuery
                ? 'Hãy thử thay đổi từ khóa tìm kiếm.'
                : 'Bắt đầu soạn đề khảo thí cá nhân trong 3-Pane Studio chuyên nghiệp.'}
            </p>
            <Link
              href="/personal/authoring/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Soạn đề thi mới</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Đề khảo thí</th>
                  <th className="py-3 px-4">Miền DigComp</th>
                  <th className="py-3 px-4">Cấu trúc câu hỏi</th>
                  <th className="py-3 px-4 text-center">Thời lượng &amp; Đạt</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((asm) => (
                  <tr key={asm.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                      <Link
                        href={`/personal/authoring/${asm.id}`}
                        className="hover:text-sky-600 block line-clamp-1"
                        title={asm.title}
                      >
                        {asm.title}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-mono font-normal mt-0.5">
                        Mã: {asm.code} &bull; Cập nhật: {asm.updatedAt}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium font-mono border border-slate-200">
                        {asm.domain}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono text-[11px] text-slate-800 font-semibold">
                        {asm.questionCount} câu hỏi
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {asm.mcqCount > 0 && `${asm.mcqCount} MCQ `}
                        {asm.scenarioCount > 0 && `• ${asm.scenarioCount} TH `}
                        {asm.practicalCount > 0 && `• ${asm.practicalCount} Thực hành`}
                        {asm.questionCount === 0 && 'Chưa có câu hỏi'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      <span>{asm.durationMinutes} phút</span> &bull;{' '}
                      <span className="font-semibold text-slate-900">{asm.passingScore}%</span>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {asm.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Sẵn sàng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Bản nháp
                        </span>
                      )}
                    </td>

                    {/* 4 Essential Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Phát sóng Live (Primary) */}
                        <button
                          type="button"
                          onClick={() => handleLaunchLive(asm)}
                          disabled={actionLoadingId === asm.id}
                          className="px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1 disabled:opacity-50"
                          title="Tạo phòng thi live ngay và vào màn hình điều phối"
                        >
                          <Radio className="w-3 h-3" strokeWidth={1.75} />
                          <span>{actionLoadingId === asm.id ? 'Đang mở...' : 'Phát sóng Live'}</span>
                        </button>

                        {/* 2. Giao cho lớp */}
                        <button
                          type="button"
                          onClick={() => setAssignModalAsm(asm)}
                          className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                          title="Giao đề thi này cho lớp học"
                        >
                          <Users className="w-3 h-3 text-slate-500" strokeWidth={1.75} />
                          <span>Giao lớp</span>
                        </button>

                        {/* 3. Bàn chấm bài theo ngữ cảnh */}
                        <Link
                          href={`/personal/grading?assessmentId=${asm.id}`}
                          className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                          title="Xem bài nộp và mở bàn chấm bài cho đề này"
                        >
                          <CheckSquare className="w-3 h-3 text-slate-500" strokeWidth={1.75} />
                          <span>Bàn chấm</span>
                        </Link>

                        {/* 3. Sửa đề trong Studio */}
                        <Link
                          href={`/personal/authoring/${asm.id}`}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Mở trình soạn thảo 3-Pane Studio"
                        >
                          <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </Link>

                        {/* 4. Xóa đề */}
                        <button
                          type="button"
                          onClick={() => handleDeleteAssessment(asm.id, asm.title)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa bài khảo thí"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign To Group Modal */}
      {assignModalAsm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md shadow-md max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                <span>Giao Đề Khảo Thí Cho Lớp Học</span>
              </h3>
              <button
                type="button"
                onClick={() => setAssignModalAsm(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssign} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Đề khảo thí được chọn:</span>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200 font-semibold text-slate-900">
                  {assignModalAsm.title}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">
                    Chọn Lớp học / Nhóm học viên tiếp nhận:
                  </label>
                  <Link href="/personal/groups" className="text-[11px] text-sky-600 hover:underline">
                    + Quản lý lớp
                  </Link>
                </div>
                {classes.length === 0 ? (
                  <div className="p-3 rounded border border-amber-200 bg-amber-50 text-amber-800 text-[11px]">
                    Bạn chưa tạo lớp học nào. Vui lòng vào trang{' '}
                    <Link href="/personal/groups" className="font-bold underline">
                      Lớp học &amp; Học viên
                    </Link>{' '}
                    để tạo lớp trước khi giao bài.
                  </div>
                ) : (
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:border-sky-600 text-xs"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Hạn chót hoàn thành bài thi (Deadline):
                </label>
                <input
                  type="date"
                  required
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:border-sky-600 text-xs font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalAsm(null)}
                  className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAssigning ? 'Đang giao...' : 'Xác nhận giao bài'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
