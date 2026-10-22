'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Copy,
  Check,
  Search,
  Radio,
  Clock,
  ArrowRight,
  BookOpen,
  Award,
  Calendar,
} from 'lucide-react';

interface GroupCardData {
  id: string;
  name: string;
  code: string;
  shortCode: string;
  memberCount: number;
  activeExams: number;
  pendingGradingCount: number;
  averageScore: number;
  createdAt: string;
  description?: string;
}

import { useEffect, useCallback } from 'react';

export default function EvaluatorGroupsPage() {
  const [groups, setGroups] = useState<GroupCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Group Modal State
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/evaluator/rooms');
      if (res.ok) {
        const data = await res.json();
        const rooms = data.rooms || [];
        const formatted: GroupCardData[] = rooms.map((r: { id: string; title: string; roomCode: string; participantCount: number; createdAt: string }) => {
          const words = r.title.trim().split(' ');
          const shortCode = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : words[0].slice(0, 2).toUpperCase();

          return {
            id: r.id,
            name: r.title,
            code: r.roomCode,
            shortCode,
            memberCount: r.participantCount || 0,
            activeExams: 1,
            pendingGradingCount: 0,
            averageScore: 0,
            createdAt: new Date(r.createdAt).toLocaleDateString('vi-VN'),
            description: 'Nhóm lớp khảo thí và bồi dưỡng năng lực số.',
          };
        });
        setGroups(formatted);
      } else {
        setGroups([]);
      }
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/evaluator/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGroupName.trim(),
          assessmentId: 'a0000000-0000-0000-0000-000000000001',
          roomMode: 'GROUP_ONLY',
        }),
      });

      if (res.ok) {
        setShowCreateGroupModal(false);
        setNewGroupName('');
        setNewGroupCode('');
        setNewGroupDesc('');
        fetchGroups();
      }
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = groups.reduce((acc, g) => acc + g.memberCount, 0);
  const totalPending = groups.reduce((acc, g) => acc + g.pendingGradingCount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Quản lý Lớp học & Nhóm học viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản trị các nhóm lớp, cấp mã mời và theo dõi toàn diện tiến độ khảo thí của học viên.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo nhóm lớp mới</span>
          </button>
        </div>
      </div>

      {/* Metrics Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-md border border-slate-200 bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tổng số nhóm lớp
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {groups.length}
          </div>
        </div>

        <div className="p-3.5 rounded-md border border-slate-200 bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tổng số học viên
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {totalStudents}
          </div>
        </div>

        <div className="p-3.5 rounded-md border border-slate-200 bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Khảo thí đang mở
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {groups.reduce((acc, g) => acc + g.activeExams, 0)}
          </div>
        </div>

        <div className="p-3.5 rounded-md border border-slate-200 bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Bài nộp chờ chấm
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1 tabular-nums">
            {totalPending}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md bg-white border border-slate-200 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên nhóm lớp hoặc mã mời..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-900"
          />
        </div>

        <div className="text-slate-500 font-mono text-[11px]">
          Hiển thị <strong className="text-slate-900 font-bold">{filteredGroups.length}</strong> / {groups.length} nhóm lớp
        </div>
      </div>

      {/* Groups Grid - No Right Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            Đang tải danh sách nhóm lớp học viên...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="col-span-full py-16 px-4 text-center max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
              <Users className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Chưa có nhóm học viên nào</h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery
                  ? 'Không tìm thấy nhóm học viên phù hợp với từ khóa.'
                  : 'Tạo nhóm lớp đầu tiên để nhận mã tham gia và quản lý học viên khảo thí.'}
              </p>
            </div>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 mx-auto shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Tạo nhóm mới</span>
            </button>
          </div>
        ) : (
          filteredGroups.map((grp) => (
            <Link
              key={grp.id}
              href={`/evaluator/groups/${grp.id}`}
              className="p-5 rounded-md border border-slate-200 bg-white hover:border-sky-500/80 hover:shadow-sm transition-all flex flex-col justify-between group"
            >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-md bg-sky-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {grp.shortCode}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {grp.code}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleCopy(grp.code, e)}
                  className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[11px] text-slate-600 font-medium inline-flex items-center gap-1 transition-colors"
                  title="Sao chép mã mời"
                >
                  {copiedCode === grp.code ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Chép mã</span>
                    </>
                  )}
                </button>
              </div>

              {/* Group Title & Description */}
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug">
                {grp.name}
              </h3>
              {grp.description && (
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {grp.description}
                </p>
              )}

              {/* Stats badges */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sĩ số</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {grp.memberCount} <span className="font-normal text-[11px] text-slate-500">học viên</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Điểm TB</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {grp.averageScore > 0 ? `${grp.averageScore}/100đ` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                {grp.pendingGradingCount > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{grp.pendingGradingCount} bài chờ chấm</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    {grp.activeExams} bài thi hoạt động
                  </span>
                )}
              </div>

              <span className="text-xs font-semibold text-sky-600 group-hover:text-sky-700 inline-flex items-center gap-1">
                <span>Vào lớp</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>
        )))}
      </div>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-md w-full shadow-sm space-y-4 text-slate-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Tạo Nhóm Lớp Đánh Giá Mới</span>
              </h2>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tên nhóm lớp / Khóa đào tạo: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tin học văn phòng & Kỹ năng số K50"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-600 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Mã mời tùy chỉnh (Tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: DIG50 (Để trống hệ thống sẽ tự sinh 6 ký tự)"
                  value={newGroupCode}
                  onChange={(e) => setNewGroupCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-600 text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Mô tả mục tiêu nhóm lớp:
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả tóm tắt đối tượng học viên hoặc chuẩn đầu ra..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-600 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors"
                >
                  Tạo nhóm ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
