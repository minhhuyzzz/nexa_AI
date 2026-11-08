'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
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
  planTier: 'FREE' | 'PRO' | 'BUSINESS';
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

  // Filters (Chuẩn Ảnh 2)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [workspaceFilter, setWorkspaceFilter] = useState('ALL');

  // Action Menu dropdown
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Edit Role & Plan Modal State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [newRole, setNewRole] = useState<'LEARNER' | 'EVALUATOR' | 'ADMIN'>('LEARNER');
  const [newAdminRole, setNewAdminRole] = useState<string>('LEARNER');
  const [newTier, setNewTier] = useState<'FREE' | 'PRO' | 'BUSINESS'>('FREE');
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [editError, setEditError] = useState('');

  // Suspend Modal State
  const [suspendingUser, setSuspendingUser] = useState<UserRecord | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);
  const [suspendError, setSuspendError] = useState('');

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
    setNewRole(user.role);
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
          role: newRole,
          adminRole: newRole === 'ADMIN' ? newAdminRole : 'LEARNER',
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
                role: newRole,
                adminRole: newRole === 'ADMIN' ? newAdminRole : 'LEARNER',
                planTier: newTier,
              }
            : u
        )
      );

      setEditingUser(null);
      setActionMsg('Đã cập nhật vai trò và phân quyền thành công.');
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
    const matchRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'ADMIN' && u.role === 'ADMIN') ||
      (roleFilter === 'EVALUATOR' && u.role === 'EVALUATOR') ||
      (roleFilter === 'LEARNER' && u.role === 'LEARNER');
    const matchTier =
      tierFilter === 'ALL' ||
      (tierFilter === 'BUSINESS' && u.planTier === 'BUSINESS') ||
      (tierFilter === 'PRO' && u.planTier === 'PRO') ||
      (tierFilter === 'FREE' && u.planTier === 'FREE');
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && !u.isSuspended) ||
      (statusFilter === 'SUSPENDED' && u.isSuspended);

    return matchQuery && matchRole && matchTier && matchStatus;
  });

  const totalUsersCount = users.length;
  const learnersCount = users.filter((u) => u.role === 'LEARNER').length;
  const evaluatorsCount = users.filter((u) => u.role === 'EVALUATOR').length;
  const suspendedCount = users.filter((u) => u.isSuspended).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header (Chuẩn Ảnh 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Quản lý người dùng &amp; tài khoản
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Quản trị tài khoản hệ thống, chuyên gia, học viên và quyền truy cập nền tảng.
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

      {/* 2. Top 4 KPI Metrics (Chuẩn Ảnh 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          label="Tổng người dùng"
          value={totalUsersCount.toLocaleString('vi-VN')}
          timeframe="Tài khoản trên toàn hệ thống"
          icon={Users}
        />
        <AdminKpiCard
          label="Học viên"
          value={learnersCount.toLocaleString('vi-VN')}
          timeframe="Người dùng cá nhân & thành viên"
          icon={GraduationCap}
        />
        <AdminKpiCard
          label="Khảo thí viên"
          value={evaluatorsCount.toLocaleString('vi-VN')}
          timeframe="Cán bộ khảo thí & đánh giá"
          icon={Award}
        />
        <AdminKpiCard
          label="Tài khoản bị khóa"
          value={suspendedCount.toLocaleString('vi-VN')}
          timeframe={suspendedCount > 0 ? 'Tài khoản đang bị tạm ngưng' : 'Không có tài khoản bị khóa'}
          icon={Lock}
        />
      </div>

      {/* 3. Toolbar Filters (Chuẩn Ảnh 2) */}
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
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          >
            <option value="ALL">Trạng thái: Tất cả</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="SUSPENDED">Bị khóa</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          >
            <option value="ALL">Vai trò: Tất cả</option>
            <option value="ADMIN">Quản trị hệ thống</option>
            <option value="EVALUATOR">Khảo thí viên</option>
            <option value="LEARNER">Học viên</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          >
            <option value="ALL">Gói: Tất cả</option>
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
            <option value="BUSINESS">Business</option>
          </select>

          <select
            value={workspaceFilter}
            onChange={(e) => setWorkspaceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          >
            <option value="ALL">Workspace: Tất cả</option>
          </select>

          <button
            onClick={() => alert('Chức năng Mời người dùng vào nền tảng đã sẵn sàng.')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs inline-flex items-center gap-1.5 transition-colors shrink-0"
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

      {/* 5. User Table (Chuẩn Ảnh 2) */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-medium">
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-600" />
                </th>
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
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {loading ? 'Đang tải danh sách người dùng...' : 'Không tìm thấy người dùng phù hợp với bộ lọc.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.slice(0, 10).map((u) => {
                  const initials = getInitials(u.fullName || u.nickname, u.email);
                  const isMenuOpen = activeMenuId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-4">
                        <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-600" />
                      </td>

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
                          {u.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-blue-600" />}
                          {u.role === 'EVALUATOR' && <Award className="w-3.5 h-3.5 text-blue-600" />}
                          {u.role === 'LEARNER' && <GraduationCap className="w-3.5 h-3.5 text-slate-400" />}
                          <span>
                            {u.role === 'ADMIN'
                              ? 'Quản trị hệ thống'
                              : u.role === 'EVALUATOR'
                              ? 'Khảo thí viên'
                              : 'Học viên'}
                          </span>
                        </div>
                      </td>

                      {/* Gói dịch vụ: Free, Pro, Business */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          u.planTier === 'BUSINESS'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800'
                            : u.planTier === 'PRO'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                        }`}>
                          {u.planTier === 'BUSINESS' ? 'Business' : u.planTier === 'PRO' ? 'Pro' : 'Free'}
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-4 top-10 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-lg py-1.5 z-30 text-left">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                            >
                              <Shield className="w-3.5 h-3.5 text-blue-600" />
                              <span>Phân quyền &amp; Gói</span>
                            </button>
                            <button
                              onClick={() => handleToggleSuspend(u)}
                              className="w-full px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>{u.isSuspended ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản'}</span>
                            </button>
                            <button
                              onClick={() => handleRevokeSession(u)}
                              className="w-full px-3 py-1.5 text-xs text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
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
            currentPage={1}
            totalPages={Math.ceil(Math.max(1, filteredUsers.length) / 10)}
            totalRecords={filteredUsers.length}
            recordsPerPage={10}
          />
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Phân quyền &amp; Gói: {editingUser.email}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600"
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
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Vai trò chính
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <option value="LEARNER">Học viên (LEARNER)</option>
                  <option value="EVALUATOR">Khảo thí viên (EVALUATOR)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Gói dịch vụ
                </label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <option value="FREE">Gói Miễn phí</option>
                  <option value="PRO">Gói Chuyên sâu</option>
                  <option value="BUSINESS">Gói Doanh nghiệp (Business)</option>
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
