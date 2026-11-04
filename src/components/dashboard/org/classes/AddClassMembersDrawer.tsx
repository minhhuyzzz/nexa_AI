'use client';

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Users,
  FileSpreadsheet,
  KeyRound,
  Check,
  Search,
  Shield,
  Loader2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import type { RoleInClass } from './types';

interface CandidateMember {
  userId: string;
  fullName: string;
  email: string;
  suggestedRole: RoleInClass;
}

interface AddClassMembersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  classId: string;
  className: string;
  currentMemberCount: number;
  maxCapacity: number;
  candidates: CandidateMember[];
  onSuccess: () => void;
}

const ROLE_PERMISSIONS: Record<
  RoleInClass,
  { label: string; permissions: string[] }
> = {
  STUDENT: {
    label: 'Học viên',
    permissions: [
      'Tham gia lớp, học tập và xem nội dung bài giảng.',
      'Làm bài đánh giá, nộp minh chứng bài tập.',
      'Xem kết quả và phản hồi cá nhân.',
      'Không có quyền quản lý hay chỉnh sửa lớp.',
    ],
  },
  ASSISTANT_TEACHER: {
    label: 'Giảng viên hỗ trợ',
    permissions: [
      'Hỗ trợ giảng viên chính trong quản lý lớp và học viên.',
      'Tham gia chấm bài, phản hồi và theo dõi tiến độ.',
      'Không có quyền thay đổi cài đặt lớp hoặc cấu hình tổ chức.',
    ],
  },
  CLASS_LEADER: {
    label: 'Lớp trưởng',
    permissions: [
      'Đại diện học sinh, hỗ trợ điểm danh và nhắc nhở nộp bài.',
      'Xem danh sách tiến độ học tập của các thành viên trong lớp.',
      'Làm bài thi và nộp minh chứng bình thường.',
    ],
  },
  VICE_LEADER: {
    label: 'Lớp phó',
    permissions: [
      'Hỗ trợ lớp trưởng điều phối hoạt động lớp học.',
      'Được quyền xem tiến độ nộp bài của các tổ trong lớp.',
    ],
  },
};

export function AddClassMembersDrawer({
  isOpen,
  onClose,
  organizationId,
  classId,
  className,
  currentMemberCount,
  maxCapacity,
  candidates,
  onSuccess,
}: AddClassMembersDrawerProps) {
  const [method, setMethod] = useState<'ORG' | 'CSV' | 'CODE'>('ORG');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState<RoleInClass>('STUDENT');
  const [subGroup, setSubGroup] = useState('Tổ 1 - Phát triển ứng dụng');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const remainingSlots = Math.max(0, maxCapacity - currentMemberCount);

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredCandidates = candidates.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  const selectedCandidates = candidates.filter((c) => selectedUserIds.includes(c.userId));

  const handleEnroll = async () => {
    if (selectedUserIds.length === 0) {
      setError('Vui lòng chọn ít nhất một thành viên để thêm');
      return;
    }

    if (selectedUserIds.length > remainingSlots) {
      setError(`Vượt quá số chỗ trống còn lại của lớp (${remainingSlots} chỗ)`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        members: selectedUserIds.map((userId) => ({
          userId,
          roleInClass: targetRole,
          subGroup: subGroup.trim() || undefined,
        })),
      };

      const res = await fetch(`/api/organizations/${organizationId}/classes/${classId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Thêm thành viên thất bại');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi thêm thành viên');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-class-member-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <UserPlus className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2
                id="add-class-member-modal-title"
                className="text-base font-bold text-neutral-900 dark:text-neutral-100"
              >
                Thêm thành viên vào lớp
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Bổ sung học viên hoặc giảng viên vào {className}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Capacity banner */}
        <div className="bg-blue-50/60 dark:bg-blue-950/40 px-5 py-2.5 border-b border-blue-100 dark:border-blue-900 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              Lớp hiện có <strong className="font-mono tabular-nums">{currentMemberCount}</strong> thành viên • còn{' '}
              <strong className="font-mono tabular-nums">{remainingSlots}</strong> chỗ trống (Sức chứa tối đa {maxCapacity})
            </span>
          </div>
        </div>

        {/* 3 Methods */}
        <div className="p-5 pb-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => setMethod('ORG')}
              className={`p-3 rounded-md border cursor-pointer transition flex items-center gap-3 ${
                method === 'ORG'
                  ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/30 ring-1 ring-blue-600'
                  : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Chọn từ tổ chức
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  Tìm và chọn thành viên trong tổ chức
                </p>
              </div>
              {method === 'ORG' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
            </div>

            <div
              onClick={() => setMethod('CSV')}
              className={`p-3 rounded-md border cursor-pointer transition flex items-center gap-3 ${
                method === 'CSV'
                  ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/30 ring-1 ring-blue-600'
                  : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-purple-600 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Nhập danh sách
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  Thêm hàng loạt bằng file Excel/CSV
                </p>
              </div>
              {method === 'CSV' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
            </div>

            <div
              onClick={() => setMethod('CODE')}
              className={`p-3 rounded-md border cursor-pointer transition flex items-center gap-3 ${
                method === 'CODE'
                  ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/30 ring-1 ring-blue-600'
                  : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-emerald-600 shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Mã gia nhập
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  Tạo mã để thành viên tự tham gia
                </p>
              </div>
              {method === 'CODE' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
            </div>
          </div>
        </div>

        {/* Drawer Body: 2 Columns */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-xs">
          {/* Left Column: Candidate List (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Chọn thành viên từ tổ chức
                </h4>
                <p className="text-[11px] text-slate-500">
                  Danh sách thành viên thuộc tổ chức và chưa có trong lớp này.
                </p>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold tabular-nums">
                Đã chọn: {selectedUserIds.length}
              </span>
            </div>

            {error && (
              <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên, email hoặc mã nhân sự..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Candidate Table */}
            <div className="border border-slate-200 dark:border-zinc-800 rounded-md overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-zinc-800 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 w-8">Chọn</th>
                    <th className="py-2 px-3">Thành viên</th>
                    <th className="py-2 px-3 text-right">Gợi ý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        Tất cả thành viên tổ chức đã ở trong lớp này hoặc không tìm thấy kết quả.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((c) => {
                      const isSelected = selectedUserIds.includes(c.userId);
                      return (
                        <tr
                          key={c.userId}
                          onClick={() => toggleSelectUser(c.userId)}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-50/50 dark:bg-blue-950/40'
                              : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <div>
                              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {c.fullName}
                              </p>
                              <p className="text-[11px] font-mono text-slate-500">{c.email}</p>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 font-medium">
                              {ROLE_PERMISSIONS[c.suggestedRole]?.label || 'Học viên'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Enrollment Config (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-4">
            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 border-b border-slate-200 dark:border-zinc-800 pb-2">
              Thiết lập khi thêm vào lớp
            </h4>

            <div>
              <label className="block font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                Vai trò trong lớp
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as RoleInClass)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600"
              >
                <option value="STUDENT">Học viên / Sinh viên</option>
                <option value="CLASS_LEADER">Lớp trưởng</option>
                <option value="VICE_LEADER">Lớp phó</option>
                <option value="ASSISTANT_TEACHER">Giảng viên hỗ trợ</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                Nhóm con / tổ
              </label>
              <input
                type="text"
                value={subGroup}
                onChange={(e) => setSubGroup(e.target.value)}
                placeholder="Ví dụ: Tổ 1 - Phát triển ứng dụng"
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600 font-mono"
              />
            </div>

            {/* Selected Chips List */}
            {selectedCandidates.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-[11px] block">
                  Đã chọn ({selectedCandidates.length} thành viên):
                </span>
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                  {selectedCandidates.map((c) => (
                    <div
                      key={c.userId}
                      className="flex items-center justify-between p-1.5 bg-white dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700 text-[11px]"
                    >
                      <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[150px]">
                        {c.fullName}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSelectUser(c.userId)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Role Permissions Box */}
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1.5">
              <span className="font-semibold text-blue-600 dark:text-blue-400 text-[11px] flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Quyền của vai trò {ROLE_PERMISSIONS[targetRole]?.label}
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-600 dark:text-neutral-400">
                {ROLE_PERMISSIONS[targetRole]?.permissions.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-neutral-900 rounded-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium transition"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={selectedUserIds.length === 0 || loading || selectedUserIds.length > remainingSlots}
            onClick={handleEnroll}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang thêm...</span>
              </>
            ) : (
              <span>Thêm vào lớp ({selectedUserIds.length})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
