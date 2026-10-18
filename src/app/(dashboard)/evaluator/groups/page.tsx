'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  QrCode,
  Copy,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';

interface GroupData {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  activeExams: number;
  averageScore: number;
  createdAt: string;
  students: {
    id: string;
    name: string;
    email: string;
    score: number;
    lastActive: string;
    feedback?: string;
  }[];
}

const mockGroups: GroupData[] = [
  {
    id: 'grp-1',
    name: 'Tin học ứng dụng & Năng lực số - Nhóm 03',
    code: 'DHQG24',
    memberCount: 42,
    activeExams: 2,
    averageScore: 78.4,
    createdAt: '15/09/2026',
    students: [
      {
        id: 'st-1',
        name: 'Trần Minh Huy',
        email: 'minhhuy@nexa.edu.vn',
        score: 85,
        lastActive: 'Hôm nay',
        feedback: 'Xử lý bài tập trích xuất dữ liệu rất chuẩn xác. Cần rèn luyện thêm phần giải trình phương án.',
      },
      {
        id: 'st-2',
        name: 'Nguyễn Văn An',
        email: 'vanan@gmail.com',
        score: 92,
        lastActive: 'Hôm qua',
        feedback: 'Nắm vững kiến thức an toàn thông tin.',
      },
      {
        id: 'st-3',
        name: 'Lê Thị Thu',
        email: 'thule@gmail.com',
        score: 74,
        lastActive: '3 ngày trước',
      },
    ],
  },
  {
    id: 'grp-2',
    name: 'Kỹ năng làm việc cùng AI - K24 Doanh nghiệp',
    code: 'AI-PRO8',
    memberCount: 28,
    activeExams: 1,
    averageScore: 82.1,
    createdAt: '01/10/2026',
    students: [
      {
        id: 'st-4',
        name: 'Phạm Quỳnh Chi',
        email: 'quynhchi@enterprise.vn',
        score: 88,
        lastActive: 'Hôm nay',
      },
      {
        id: 'st-5',
        name: 'Hoàng Quốc Bảo',
        email: 'bao.hoang@enterprise.vn',
        score: 79,
        lastActive: '2 ngày trước',
      },
    ],
  },
];

export default function EvaluatorGroupsPage() {
  const [groups, setGroups] = useState<GroupData[]>(mockGroups);
  const [selectedGroup, setSelectedGroup] = useState<GroupData>(mockGroups[0]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Create Group Modal State
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCode, setNewGroupCode] = useState('');

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const generatedCode = newGroupCode.trim().toUpperCase() || `GRP${Math.floor(100 + Math.random() * 900)}`;
    const newGrp: GroupData = {
      id: `grp-${Date.now()}`,
      name: newGroupName.trim(),
      code: generatedCode,
      memberCount: 0,
      activeExams: 0,
      averageScore: 0,
      createdAt: 'Hôm nay',
      students: [],
    };
    setGroups((prev) => [newGrp, ...prev]);
    setSelectedGroup(newGrp);
    setShowCreateGroupModal(false);
    setNewGroupName('');
    setNewGroupCode('');
  };

  const handleSaveFeedback = (studentId: string) => {
    if (!commentText.trim()) return;
    const student = selectedGroup.students.find((s) => s.id === studentId);
    if (student) {
      student.feedback = commentText;
    }
    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
      setEditingStudentId(null);
      setCommentText('');
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý Lớp học & Nhóm học viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tạo nhóm lớp, cấp mã mời / QR và gửi nhận xét cá nhân hóa tới học viên.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo nhóm lớp mới</span>
          </button>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-lg space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                Tạo Nhóm Lớp Mới
              </h2>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tên nhóm lớp / Khóa học:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kỹ năng số ứng dụng K49 - Nhóm 02"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Mã mời 6 ký tự và mã QR sẽ được hệ thống tự động khởi tạo.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors"
                >
                  Tạo nhóm ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Groups List (Left) & Group Details / Students (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Group Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Danh sách nhóm ({groups.length})
          </div>

          {groups.map((grp) => {
            const isSelected = selectedGroup.id === grp.id;
            return (
              <div
                key={grp.id}
                onClick={() => setSelectedGroup(grp)}
                className={`p-4 rounded-md border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-sky-600 bg-sky-50/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                    {grp.code}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {grp.memberCount} học viên
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{grp.name}</h3>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
                  <span>{grp.activeExams} bài thi hoạt động</span>
                  <span className="text-sky-600 font-medium">Nhấn xem chi tiết &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Group Details & Student List */}
        <div className="lg:col-span-8 p-6 rounded-md border border-slate-200 bg-white shadow-xs space-y-6">
          {/* Header of selected group */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                  {selectedGroup.code}
                </span>
                <span className="text-xs text-slate-500">
                  Ngày tạo: {selectedGroup.createdAt}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{selectedGroup.name}</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(selectedGroup.code)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                title="Sao chép mã nhóm chia sẻ cho người học"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode === selectedGroup.code ? 'Đã sao chép' : 'Chép mã nhóm'}</span>
              </button>
              <Link
                href={`/evaluator/live-room/${selectedGroup.code}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors"
              >
                <span>Mở phòng thi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Student List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Danh sách học viên ({selectedGroup.students.length})
              </h3>
              <span className="text-xs text-slate-400">
                Bấm "Nhận xét" để gửi phản hồi trực tiếp cho từng học viên
              </span>
            </div>

            <div className="space-y-3">
              {selectedGroup.students.map((student) => (
                <div
                  key={student.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                        {student.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{student.name}</div>
                        <div className="text-[11px] text-slate-500">{student.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">Điểm cao nhất</div>
                        <div className="text-xs font-bold text-slate-900">
                          {student.score}/100
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setEditingStudentId(student.id);
                          setCommentText(student.feedback || '');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors shrink-0"
                      >
                        <MessageSquare className="w-3 h-3 text-sky-600" />
                        <span>{student.feedback ? 'Sửa nhận xét' : 'Nhận xét'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Student feedback display */}
                  {student.feedback && editingStudentId !== student.id && (
                    <div className="p-2.5 rounded-lg bg-sky-50/60 border border-sky-100 text-xs text-slate-700 italic">
                      <span className="font-semibold not-italic text-sky-900">
                        Lời nhận xét đã gửi:{' '}
                      </span>
                      "{student.feedback}"
                    </div>
                  )}

                  {/* Inline comment editor */}
                  {editingStudentId === student.id && (
                    <div className="p-3 rounded-lg bg-white border border-sky-200 space-y-2">
                      <textarea
                        rows={2}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Nhập lời nhận xét, góp ý chuyên môn cho học viên..."
                        className="w-full p-2 text-xs rounded border border-slate-200 focus:outline-none focus:border-sky-500 resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        {feedbackSuccess && (
                          <span className="text-xs text-emerald-600 font-medium mr-2">
                            Đã lưu nhận xét!
                          </span>
                        )}
                        <button
                          onClick={() => setEditingStudentId(null)}
                          className="px-3 py-1 rounded text-xs text-slate-500 hover:bg-slate-100"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleSaveFeedback(student.id)}
                          className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium"
                        >
                          Lưu & Gửi nhận xét
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
