'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  CheckCircle2,
  Lock,
  GraduationCap,
  Award,
  RefreshCw,
  MoreHorizontal,
  X,
  AlertCircle,
  Building2,
  UserX,
  UserCheck,
  Shield,
  LogOut,
  UserPlus,
  Copy,
  CreditCard,
  CheckSquare,
} from 'lucide-react';
import {
  AdminKpiCard,
  AdminNoticeBanner,
  AdminPagination,
} from '@/components/dashboard/admin/AdminUIComponents';

interface UserRecord {
  id: string;
  nickname: string;
  fullName: string;
  email: string;
  role: 'LEARNER' | 'EVALUATOR' | 'ADMIN';
  adminRole?: string;
  planTier: string;
  planDisplayName?: string;
  points: number;
  isSuspended: boolean;
  suspendedReason?: string | null;
  suspendedAt?: string | null;
  organization: { id: string; name: string; code: string; orgRole?: string } | null;
  submissionsCount: number;
  createdAt: string;
}

function getInitials(name: string, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : 'US';
}

function UsersContent() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');

  // Action Menu dropdown
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Edit Role & Plan Modal State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [newRole, setNewRole] = useState<'LEARNER' | 'ADMIN'>('LEARNER');
  const [newAdminRole, setNewAdminRole] = useState<string>('LEARNER');
  const [newTier, setNewTier] = useState<string>('BASIC');
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [editError, setEditError] = useState('');

  // Suspend Modal State
  const [suspendingUser, setSuspendingUser] = useState<UserRecord | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);
  const [suspendError, setSuspendError] = useState('');

  // Pagination & Bulk Select State
  const [currentPage, setCurrentPage] = useState(1);
  const [isBulkSelectActive, setIsBulkSelectActive] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, tierFilter]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (res.ok) {
        setUsers(json.users || []);
      } else {
        setFetchError(json.error || 'Không thể tải danh sách người dùng từ máy chủ.');
      }
    } catch {
      setFetchError('Lỗi kết nối máy chủ khi tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenEdit = (user: UserRecord) => {
    setEditingUser(user);
    setNewRole(user.role === 'ADMIN' ? 'ADMIN' : 'LEARNER');
    setNewAdminRole(user.adminRole || (user.role === 'ADMIN' ? 'SUPER_ADMIN' : 'LEARNER'));
    setNewTier(user.planTier);
    setActionMsg('');
    setEditError('');
    setActiveMenuId(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    setActionMsg('');
    setEditError('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          planTier: newTier,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Lỗi cập nhật người dùng từ máy chủ');
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                planTier: newTier,
              }
            : u
        )
      );

      setEditingUser(null);
      setActionMsg('Đã cập nhật gói dịch vụ thành công.');
      setTimeout(() => setActionMsg(''), 3000);
    } catch {
      setEditError('Lỗi kết nối máy chủ khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSuspend = async (user: UserRecord) => {
    setActiveMenuId(null);
    if (user.isSuspended) {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            action: 'UNSUSPEND',
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === user.id
                ? { ...u, isSuspended: false, suspendedReason: null, suspendedAt: null }
                : u
            )
          );
          setActionMsg(`Đã mở khóa tài khoản ${user.email} thành công.`);
          setTimeout(() => setActionMsg(''), 3000);
        } else {
          alert(data.error || 'Không thể mở khóa tài khoản');
        }
      } catch {
        alert('Lỗi kết nối khi mở khóa tài khoản');
      }
    } else {
      setSuspendingUser(user);
      setSuspendReason('Vi phạm điều khoản sử dụng và quy chế khảo thí NEXA');
      setSuspendError('');
    }
  };

  const handleConfirmSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingUser) return;

    setSuspendSubmitting(true);
    setSuspendError('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: suspendingUser.id,
          action: 'SUSPEND',
          reason: suspendReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSuspendError(data.error || 'Lỗi tạm khóa tài khoản');
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === suspendingUser.id
            ? {
                ...u,
                isSuspended: true,
                suspendedReason: suspendReason,
                suspendedAt: new Date().toISOString(),
              }
            : u
        )
      );

      setSuspendingUser(null);
      setActionMsg(`Đã tạm khóa tài khoản ${suspendingUser.email}.`);
      setTimeout(() => setActionMsg(''), 3000);
    } catch {
      setSuspendError('Lỗi kết nối khi tạm khóa tài khoản');
    } finally {
      setSuspendSubmitting(false);
    }
  };

  const handleRevokeSession = async (user: UserRecord) => {
    setActiveMenuId(null);
    if (!confirm(`Bạn có chắc chắn muốn buộc đăng xuất toàn bộ phiên của ${user.email}?`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'REVOKE_SESSION',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(`Đã thu hồi phiên đăng nhập của ${user.email}.`);
        setTimeout(() => setActionMsg(''), 3000);
      } else {
        alert(data.error || 'Không thể thu hồi phiên');
      }
    } catch {
      alert('Lỗi kết nối khi thu hồi phiên');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchQuery =
      !search.trim() ||
      u.nickname.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchTier =
      tierFilter === 'ALL' ||
      (tierFilter === 'ENTERPRISE' && (u.planTier === 'ENTERPRISE' || u.planTier === 'BUSINESS')) ||
      (tierFilter === 'ADVANCED' && (u.planTier === 'ADVANCED' || u.planTier === 'PRO')) ||
      (tierFilter === 'STANDARD' && (u.planTier === 'STANDARD' || u.planTier === 'PLUS')) ||
      (tierFilter === 'BASIC' && (u.planTier === 'BASIC' || u.planTier === 'FREE'));
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && !u.isSuspended) ||
      (statusFilter === 'SUSPENDED' && u.isSuspended);

    return matchQuery && matchTier && matchStatus;
  });

  const totalUsersCount = users.length;
  const activeCount = users.filter((u) => !u.isSuspended).length;
  const suspendedCount = users.filter((u) => u.isSuspended).length;

  const recordsPerPage = 10;
  const totalPages = Math.ceil(Math.max(1, filteredUsers.length) / recordsPerPage);

  // Tự động điều chỉnh trang nếu vượt quá tổng số trang sau khi lọc
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage;
    return filteredUsers.slice(start, start + recordsPerPage);
  }, [filteredUsers, currentPage, recordsPerPage]);

  // Bulk Actions
  const handleBulkSuspend = async (suspend: boolean) => {
    if (selectedUserIds.length === 0) return;
    const actionLabel = suspend ? 'tạm khóa' : 'mở khóa';
    if (!confirm(`Bạn có chắc chắn muốn ${actionLabel} ${selectedUserIds.length} tài khoản đã chọn?`)) {
      return;
    }
    setBulkActionLoading(true);
    try {
      const results = await Promise.all(
        selectedUserIds.map((userId) =>
          fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              action: suspend ? 'SUSPEND' : 'UNSUSPEND',
              reason: suspend ? 'Tạm khóa hàng loạt từ ban quản trị' : undefined,
            }),
          })
        )
      );
      const successfulCount = results.filter((r) => r.ok).length;
      setUsers((prev) =>
        prev.map((u) => {
          if (selectedUserIds.includes(u.id)) {
            return {
              ...u,
              isSuspended: suspend,
              suspendedReason: suspend ? 'Tạm khóa hàng loạt' : null,
              suspendedAt: suspend ? new Date().toISOString() : null,
            };
          }
          return u;
        })
      );
      setActionMsg(`Đã ${actionLabel} thành công ${successfulCount}/${selectedUserIds.length} tài khoản.`);
      setSelectedUserIds([]);
      setTimeout(() => setActionMsg(''), 3000);
    } catch {
      alert(`Lỗi kết nối khi ${actionLabel} hàng loạt`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkRevokeSession = async () => {
    if (selectedUserIds.length === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn đăng xuất toàn bộ phiên của ${selectedUserIds.length} tài khoản đã chọn?`)) {
      return;
    }
    setBulkActionLoading(true);
    try {
      const results = await Promise.all(
        selectedUserIds.map((userId) =>
          fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              action: 'REVOKE_SESSION',
            }),
          })
        )
      );
      const successfulCount = results.filter((r) => r.ok).length;
      setActionMsg(`Đã thu hồi phiên thành công ${successfulCount}/${selectedUserIds.length} tài khoản.`);
      setSelectedUserIds([]);
      setTimeout(() => setActionMsg(''), 3000);
    } catch {
      alert('Lỗi kết nối khi thu hồi phiên hàng loạt');
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <span>Học viên và Khách hàng</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Quản lý tài khoản học viên và tổ chức. Nhân sự điều hành được quản lý riêng tại{' '}
            <Link href="/admin/roles" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Quản trị viên và Phân quyền →
            </Link>
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
          <span>{actionMsg}</span>
        </div>
      )}

      {fetchError && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" strokeWidth={1.75} />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={fetchUsers}
            className="px-2.5 py-1 bg-white dark:bg-zinc-900 hover:bg-rose-100 text-rose-700 rounded border border-rose-200 text-xs font-semibold"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 2. Top 3 KPI Metrics (Compact 3-on-1 row for mobile) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <AdminKpiCard
          label="Tổng người dùng"
          value={totalUsersCount.toLocaleString('vi-VN')}
          icon={Users}
        />
        <AdminKpiCard
          label="Đang hoạt động"
          value={activeCount.toLocaleString('vi-VN')}
          icon={UserCheck}
        />
        <AdminKpiCard
          label="Tài khoản bị khóa"
          value={suspendedCount.toLocaleString('vi-VN')}
          icon={Lock}
        />
      </div>

      {/* 3. Toolbar Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên, email hoặc ID người dùng..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs text-neutral-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs cursor-pointer"
          >
            <option value="ALL">Trạng thái: Tất cả</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="SUSPENDED">Bị khóa</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs cursor-pointer"
          >
            <option value="ALL">Gói: Tất cả</option>
            <option value="BASIC">Gói Cơ Bản</option>
            <option value="STANDARD">Gói Tiêu Chuẩn</option>
            <option value="ADVANCED">Gói Nâng Cao</option>
            <option value="ENTERPRISE">Gói Tổ Chức</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setIsBulkSelectActive((prev) => {
                if (prev) setSelectedUserIds([]);
                return !prev;
              });
            }}
            className={`w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer border ${
              isBulkSelectActive
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 ring-1 ring-blue-500'
                : 'bg-white dark:bg-[#111114] text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{isBulkSelectActive ? 'Thoát chọn nhiều' : 'Chọn nhiều'}</span>
          </button>

          <button
            onClick={() => alert('Chức năng Mời người dùng vào nền tảng đã sẵn sàng.')}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Mời người dùng</span>
          </button>
        </div>
      </div>

      {/* 4. Notice Banner (Chuẩn Ảnh 2) */}
      <AdminNoticeBanner
        variant="info"
        message="Chỉ quản lý tài khoản hệ thống; không xử lý thành viên lớp của Org/Personal tại đây."
      />

      {/* 4.1 Thanh tác vụ hàng loạt khi bật Chọn nhiều */}
      {isBulkSelectActive && (
        <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-900 dark:text-blue-200">
              Đã chọn <span className="font-mono font-bold">{selectedUserIds.length}</span> / {filteredUsers.length} tài khoản
            </span>
            {selectedUserIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedUserIds([])}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Bỏ chọn tất cả
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={selectedUserIds.length === 0 || bulkActionLoading}
              onClick={() => handleBulkSuspend(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Tạm khóa ({selectedUserIds.length})</span>
            </button>
            <button
              type="button"
              disabled={selectedUserIds.length === 0 || bulkActionLoading}
              onClick={() => handleBulkSuspend(false)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mở khóa ({selectedUserIds.length})</span>
            </button>
            <button
              type="button"
              disabled={selectedUserIds.length === 0 || bulkActionLoading}
              onClick={handleBulkRevokeSession}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất phiên ({selectedUserIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsBulkSelectActive(false);
                setSelectedUserIds([]);
              }}
              className="px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-zinc-700 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Thoát
            </button>
          </div>
        </div>
      )}

      {/* 5. User Table (Chuẩn Ảnh 2) */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-medium">
                {isBulkSelectActive && (
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        paginatedUsers.length > 0 &&
                        paginatedUsers.every((u) => selectedUserIds.includes(u.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newIds = Array.from(
                            new Set([...selectedUserIds, ...paginatedUsers.map((u) => u.id)])
                          );
                          setSelectedUserIds(newIds);
                        } else {
                          setSelectedUserIds(
                            selectedUserIds.filter(
                              (id) => !paginatedUsers.some((u) => u.id === id)
                            )
                          );
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                    />
                  </th>
                )}
                <th className="py-3 px-4">Người dùng</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Gói dịch vụ</th>
                <th className="py-3 px-4">Tổ chức trực thuộc</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isBulkSelectActive ? 7 : 6} className="py-12 text-center text-slate-400">
                    {loading ? 'Đang tải danh sách người dùng...' : 'Không tìm thấy người dùng phù hợp với bộ lọc.'}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const initials = getInitials(u.fullName || u.nickname, u.email);
                  const isMenuOpen = activeMenuId === u.id;
                  const isSelected = selectedUserIds.includes(u.id);

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition-colors ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {isBulkSelectActive && (
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUserIds((prev) => [...prev, u.id]);
                              } else {
                                setSelectedUserIds((prev) => prev.filter((id) => id !== u.id));
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Người dùng: Avatar tròn + Tên + Email + ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 border border-blue-200 dark:border-blue-800">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {u.fullName || u.nickname || 'Chưa đặt tên'}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                              {u.email}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500">
                                ID: {u.id.slice(0, 8)}...
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(u.id);
                                  setActionMsg(`Đã sao chép ID người dùng: ${u.id}`);
                                  setTimeout(() => setActionMsg(''), 2000);
                                }}
                                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-0.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800"
                                title={`Sao chép toàn bộ ID: ${u.id}`}
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {u.isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Bị khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Hoạt động
                          </span>
                        )}
                      </td>

                      {/* Vai trò */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                          {u.organization ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                              <Building2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>{u.organization.orgRole === 'ORG_OWNER' ? 'Chủ tổ chức' : u.organization.orgRole === 'ORG_ADMIN' ? 'Quản trị tổ chức' : 'Thành viên'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>Học viên</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Gói dịch vụ: 4 Gói chuẩn hóa */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${
                            u.planTier === 'ENTERPRISE' || u.planTier === 'BUSINESS'
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800'
                              : u.planTier === 'ADVANCED' || u.planTier === 'PRO'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800'
                              : u.planTier === 'STANDARD' || u.planTier === 'PLUS'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
                              : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {u.planDisplayName || (
                            u.planTier === 'ENTERPRISE' || u.planTier === 'BUSINESS'
                              ? 'Gói Tổ Chức'
                              : u.planTier === 'ADVANCED' || u.planTier === 'PRO'
                              ? 'Gói Nâng Cao'
                              : u.planTier === 'STANDARD' || u.planTier === 'PLUS'
                              ? 'Gói Tiêu Chuẩn'
                              : 'Gói Cơ Bản'
                          )}
                        </span>
                      </td>

                      {/* Tổ chức trực thuộc */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {u.organization ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <div>
                              <div className="font-medium text-neutral-800 dark:text-zinc-200">
                                {u.organization.name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] text-slate-400">
                                  {u.organization.code}
                                </span>
                                {u.organization.orgRole && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                                    {u.organization.orgRole === 'ORG_OWNER'
                                      ? 'Chủ sở hữu'
                                      : u.organization.orgRole === 'ORG_ADMIN'
                                      ? 'Quản trị viên'
                                      : u.organization.orgRole === 'ASSESSOR'
                                      ? 'Khảo thí viên'
                                      : 'Thành viên'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                            Cá nhân
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right relative">
                        <button
                          onClick={() => setActiveMenuId(isMenuOpen ? null : u.id)}
                          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-850 transition-colors inline-flex items-center justify-center cursor-pointer"
                          aria-label="Tùy chọn thao tác"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-4 top-10 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-lg py-1.5 z-30 text-left">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                              <span>Điều chỉnh Gói dịch vụ</span>
                            </button>
                            <button
                              onClick={() => handleToggleSuspend(u)}
                              className="w-full px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>{u.isSuspended ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản'}</span>
                            </button>
                            <button
                              onClick={() => handleRevokeSession(u)}
                              className="w-full px-3 py-1.5 text-xs text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Đăng xuất phiên</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4">
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={filteredUsers.length}
            recordsPerPage={recordsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Điều chỉnh Gói dịch vụ: {editingUser.email}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 pt-4 text-xs">
              {editError && (
                <div className="p-2.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  {editError}
                </div>
              )}

              <div>
                <label className="block font-bold text-xs text-slate-700 dark:text-zinc-300 mb-1">
                  Gói dịch vụ (Tự động cấp bù AI credits và 30 ngày thời hạn)
                </label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  <option value="BASIC">Gói Cơ Bản</option>
                  <option value="STANDARD">Gói Tiêu Chuẩn</option>
                  <option value="ADVANCED">Gói Nâng Cao</option>
                  <option value="ENTERPRISE">Gói Tổ Chức</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Xác nhận tạm khóa tài khoản
              </h3>
              <button
                onClick={() => setSuspendingUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSuspend} className="space-y-4 pt-4 text-xs">
              <p className="text-slate-600 dark:text-zinc-400">
                Bạn sắp tạm khóa tài khoản <span className="font-semibold text-neutral-900 dark:text-white">{suspendingUser.email}</span>. Tài khoản này sẽ không thể đăng nhập cho đến khi được mở lại.
              </p>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Lý do tạm khóa
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuspendingUser(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={suspendSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium disabled:opacity-50"
                >
                  {suspendSubmitting ? 'Đang khóa...' : 'Xác nhận khóa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">Đang tải quản lý người dùng...</div>}>
      <UsersContent />
    </Suspense>
  );
}
