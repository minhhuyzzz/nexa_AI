'use client';

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Users,
  Check,
  Search,
  Loader2,
  AlertCircle,
  Copy,
  Link as LinkIcon,
} from 'lucide-react';

interface CandidateMember {
  userId: string;
  fullName: string;
  email: string;
  orgRole?: string;
}

interface AddClassMembersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  classId: string;
  className: string;
  classCode?: string;
  currentMemberCount: number;
  maxCapacity?: number;
  candidates: CandidateMember[];
  onSuccess: () => void;
}

export function AddClassMembersDrawer({
  isOpen,
  onClose,
  organizationId,
  classId,
  className,
  classCode,
  currentMemberCount,
  maxCapacity,
  candidates,
  onSuccess,
}: AddClassMembersDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'MEMBER' | 'ASSESSOR' | 'ADMIN'>('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const getRoleBadge = (orgRole?: string) => {
    switch (orgRole) {
      case 'ORG_OWNER':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800 shrink-0 font-mono">
            Chủ sở hữu
          </span>
        );
      case 'ORG_ADMIN':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 shrink-0 font-mono">
            Quản trị viên
          </span>
        );
      case 'ASSESSOR':
      case 'EVALUATOR':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 font-mono">
            Khảo thí viên
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400 border border-slate-200/60 dark:border-zinc-700 shrink-0 font-mono">
            Thành viên
          </span>
        );
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchSearch =
      !searchQuery.trim() ||
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase().trim());

    const matchRole =
      roleFilter === 'ALL'
        ? true
        : roleFilter === 'MEMBER'
        ? !c.orgRole || c.orgRole === 'MEMBER'
        : roleFilter === 'ASSESSOR'
        ? c.orgRole === 'ASSESSOR' || c.orgRole === 'EVALUATOR'
        : roleFilter === 'ADMIN'
        ? c.orgRole === 'ORG_ADMIN' || c.orgRole === 'ORG_OWNER'
        : true;

    return matchSearch && matchRole;
  });

  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredCandidates.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredCandidates.map((c) => c.userId));
    }
  };

  const copyCode = () => {
    if (!classCode) return;
    navigator.clipboard.writeText(classCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    if (!classCode) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/join?code=${classCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleEnroll = async () => {
    if (selectedUserIds.length === 0) {
      setError('Vui lòng chọn ít nhất một thành viên để thêm');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        members: selectedUserIds.map((userId) => ({
          userId,
          roleInClass: 'STUDENT',
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-900/40">
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
                Bổ sung nhân sự hoặc sinh viên của trường vào <span className="font-semibold text-neutral-800 dark:text-neutral-200">{className}</span>
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

        {/* Sĩ số hiện tại & số lượng đã chọn */}
        <div className="bg-blue-50/60 dark:bg-blue-950/40 px-5 py-2.5 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
            <span>
              Sĩ số lớp hiện tại: <strong className="font-mono tabular-nums">{currentMemberCount}</strong> thành viên
            </span>
          </div>
          {candidates.length > 0 && (
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold tabular-nums">
              Đã chọn: {selectedUserIds.length}
            </span>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Share Join Code Card */}
          {classCode && (
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 block">
                  Tham gia bằng mã lớp hoặc liên kết
                </span>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 block">
                  Học viên nhập mã này tại trang chủ hoặc truy cập liên kết để vào thẳng lớp.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={copyCode}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-900 dark:text-neutral-100 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{classCode}</span>
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <LinkIcon className="w-3.5 h-3.5 text-slate-400" />}
                  <span>Sao chép link</span>
                </button>
              </div>
            </div>
          )}

          {/* Candidates Search & Select All row */}
          {candidates.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm thành viên theo tên hoặc email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 focus:outline-none cursor-pointer shrink-0"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="MEMBER">Thành viên (Học viên)</option>
                <option value="ASSESSOR">Khảo thí viên</option>
                <option value="ADMIN">Quản trị viên / Chủ sở hữu</option>
              </select>

              {filteredCandidates.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-700 dark:text-zinc-300 transition shrink-0 cursor-pointer"
                >
                  {selectedUserIds.length === filteredCandidates.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              )}
            </div>
          )}

          {/* Candidate Table List */}
          <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
            {filteredCandidates.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <Users className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  {candidates.length === 0
                    ? 'Tất cả nhân sự trong tổ chức đã có mặt trong lớp này.'
                    : 'Không tìm thấy thành viên nào phù hợp với từ khóa.'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1 max-w-md mx-auto">
                  Bạn có thể gửi mã tham gia <strong className="font-mono text-neutral-700 dark:text-neutral-300">{classCode}</strong> cho học viên bên ngoài để họ tự đăng ký vào lớp.
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {filteredCandidates.map((c) => {
                  const isSelected = selectedUserIds.includes(c.userId);
                  const monogram = (c.fullName || c.email || 'U')[0].toUpperCase();
                  return (
                    <div
                      key={c.userId}
                      onClick={() => toggleSelectUser(c.userId)}
                      className={`p-3 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-50/50 dark:bg-blue-950/30'
                          : 'hover:bg-slate-50/80 dark:hover:bg-zinc-850/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {monogram}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {c.fullName}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 truncate">
                            {c.email}
                          </p>
                        </div>
                      </div>

                      {getRoleBadge(c.orgRole)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-5 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium transition cursor-pointer"
          >
            Đóng
          </button>

          {candidates.length > 0 && (
            <button
              type="button"
              disabled={selectedUserIds.length === 0 || loading}
              onClick={handleEnroll}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-xs cursor-pointer"
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
          )}
        </div>
      </div>
    </div>
  );
}
