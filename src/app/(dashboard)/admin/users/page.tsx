'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Shield,
  Award,
  RefreshCw,
  Edit2,
  X,
  AlertCircle,
  Building2,
  UserX,
  UserCheck,
  LogOut,
  AlertTriangle,
} from 'lucide-react';

interface UserRecord {
  id: string;
  nickname: string;
  fullName: string;
  email: string;
  role: 'LEARNER' | 'EVALUATOR' | 'ADMIN';
  adminRole?: string;
  planTier: 'FREE' | 'PRO' | 'ENTERPRISE';
  points: number;
  isSuspended: boolean;
  suspendedReason?: string | null;
  suspendedAt?: string | null;
  organization: { id: string; name: string; code: string; orgRole?: string } | null;
  submissionsCount: number;
  createdAt: string;
}

function UsersContent() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Edit Role & Plan Modal State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [newRole, setNewRole] = useState<'LEARNER' | 'EVALUATOR' | 'ADMIN'>('LEARNER');
  const [newAdminRole, setNewAdminRole] = useState<string>('LEARNER');
  const [newTier, setNewTier] = useState<'FREE' | 'PRO' | 'ENTERPRISE'>('FREE');
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
    if (user.isSuspended) {
      // Unsuspend
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
      // Open suspend modal
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
      u.fullName.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchTier = tierFilter === 'ALL' || u.planTier === tierFilter;
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && !u.isSuspended) ||
      (statusFilter === 'SUSPENDED' && u.isSuspended);

    return matchQuery && matchRole && matchTier && matchStatus;
  });

  const learnersCount = users.filter((u) => u.role === 'LEARNER').length;
  const evaluatorsCount = users.filter((u) => u.role === 'EVALUATOR').length;
  const suspendedCount = users.filter((u) => u.isSuspended).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Quản Lý Người Dùng &amp; Tài Khoản
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Quản trị phân quyền tài khoản, tạm khóa vi phạm và giám sát bảo mật phiên đăng nhập.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/organizations"
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Quản lý Khách hàng B2B</span>
          </Link>
          <button
            onClick={fetchUsers}
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
          <span>{actionMsg}</span>
        </div>
      )}

      {fetchError && (
        <div className="p-3.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" strokeWidth={1.75} />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={fetchUsers}
            className="px-2.5 py-1 bg-white dark:bg-zinc-900 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-400 rounded border border-rose-200 dark:border-rose-800 text-xs font-semibold"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-md bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-xs">
        <div className="p-2.5 bg-white dark:bg-[#111114] rounded border border-slate-200 dark:border-zinc-800">
          <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Tổng người dùng</span>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {users.length}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Đã xác thực email</div>
        </div>

        <div className="p-2.5 bg-white dark:bg-[#111114] rounded border border-slate-200 dark:border-zinc-800">
          <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Học viên (Learners)</span>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {learnersCount}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Khảo thí 5 miền</div>
        </div>

        <div className="p-2.5 bg-white dark:bg-[#111114] rounded border border-slate-200 dark:border-zinc-800">
          <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Giảng viên (Evaluators)</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {evaluatorsCount}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Giám sát & Chấm thi</div>
        </div>

        <div className="p-2.5 bg-white dark:bg-[#111114] rounded border border-slate-200 dark:border-zinc-800">
          <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Tài khoản tạm khóa</span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
            {suspendedCount}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Vi phạm điều khoản</div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Tìm theo nickname, email, họ tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 text-xs"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="SUSPENDED">Đã tạm khóa</option>
            </select>
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Vai trò:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 text-xs"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="LEARNER">Học viên</option>
              <option value="EVALUATOR">Giảng viên / Chuyên gia</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>

          {/* Tier filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Gói:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 text-xs"
            >
              <option value="ALL">Tất cả gói</option>
              <option value="FREE">Miễn phí (Free)</option>
              <option value="PRO">VIP Pro</option>
              <option value="ENTERPRISE">Business / Campus</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Clean Users Table */}
      <div className="border border-slate-200 dark:border-zinc-800 rounded-md overflow-hidden bg-white dark:bg-[#111114] text-xs shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900 text-slate-500 dark:text-neutral-400 text-[11px] font-semibold font-mono">
                <th className="py-2.5 px-3.5">NGƯỜI DÙNG</th>
                <th className="py-2.5 px-3.5">TRẠNG THÁI</th>
                <th className="py-2.5 px-3.5">VAI TRÒ</th>
                <th className="py-2.5 px-3.5">GÓI DỊCH VỤ</th>
                <th className="py-2.5 px-3.5">TỔ CHỨC / TRƯỜNG</th>
                <th className="py-2.5 px-3.5 text-center">BÀI THI</th>
                <th className="py-2.5 px-3.5 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-850 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-neutral-500">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-neutral-500">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/60 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">{u.nickname || u.fullName || 'Người dùng'}</div>
                      <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      {u.isSuspended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          <UserX className="w-3 h-3 text-rose-600" />
                          Đã khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      {u.role === 'ADMIN' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-600 text-white">
                          {u.adminRole || 'SUPER_ADMIN'}
                        </span>
                      ) : u.role === 'EVALUATOR' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Giảng viên
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                          Học viên
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      {u.planTier === 'ENTERPRISE' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                          Business
                        </span>
                      ) : u.planTier === 'PRO' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono">
                          Pro
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      {u.organization ? (
                        <span className="font-medium text-neutral-800 dark:text-zinc-200 text-[11px]">
                          {u.organization.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-neutral-500 text-[11px]">Cá nhân</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono tabular-nums text-neutral-800 dark:text-zinc-200">
                      {u.submissionsCount}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      {u.role !== 'ADMIN' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-700 dark:text-zinc-300 text-[11px] font-medium transition-colors"
                            title="Phân quyền & Nâng gói"
                          >
                            <Edit2 className="w-3 h-3 text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleToggleSuspend(u)}
                            className={`px-2 py-1 rounded border text-[11px] font-medium transition-colors ${
                              u.isSuspended
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                                : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                            }`}
                            title={u.isSuspended ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản'}
                          >
                            {u.isSuspended ? (
                              <UserCheck className="w-3 h-3" />
                            ) : (
                              <UserX className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRevokeSession(u)}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 text-[11px] font-medium transition-colors"
                            title="Buộc đăng xuất toàn bộ thiết bị"
                          >
                            <LogOut className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUSPEND REASON MODAL */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111114] rounded-md border border-slate-200 dark:border-zinc-800 p-6 max-w-md w-full shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-850">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Tạm Khóa Tài Khoản Vi Phạm
                </h2>
              </div>
              <button
                onClick={() => setSuspendingUser(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 dark:text-neutral-400">
              Khóa tài khoản <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{suspendingUser.email}</span>. Người dùng sẽ bị từ chối truy cập và đăng xuất khỏi mọi thiết bị.
            </p>

            {suspendError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded text-rose-800 dark:text-rose-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{suspendError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmSuspend} className="space-y-4">
              <div>
                <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                  Lý do tạm khóa (Ghi vào Audit Trail):
                </label>
                <textarea
                  rows={3}
                  required
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Nhập lý do vi phạm (ví dụ: Gian lận khảo thí, sử dụng bot cào đề...)"
                  className="w-full p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuspendingUser(null)}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={suspendSubmitting}
                  className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-50"
                >
                  {suspendSubmitting ? 'Đang khóa...' : 'Xác nhận khóa tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE & PLAN MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111114] rounded-md border border-slate-200 dark:border-zinc-800 p-6 max-w-md w-full shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-850">
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Phân Quyền &amp; Cấp Bậc Gói
                </h2>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                  {editingUser.email}
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded text-rose-800 dark:text-rose-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                  Vai trò hệ thống:
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs text-neutral-900 dark:text-neutral-100"
                >
                  <option value="LEARNER">Học viên (Khảo thí &amp; Nhận chứng chỉ)</option>
                  <option value="EVALUATOR">Giảng viên / Chuyên gia (Coi thi &amp; Chấm bài)</option>
                  <option value="ADMIN">Quản trị viên nền tảng (Platform Admin)</option>
                </select>
              </div>

              {newRole === 'ADMIN' && (
                <div>
                  <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                    Phân vai Admin nội bộ:
                  </label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Toàn quyền quản trị cao nhất)</option>
                    <option value="OPERATIONS_ADMIN">OPERATIONS_ADMIN (Vận hành B2B & Người dùng)</option>
                    <option value="CONTENT_ADMIN">CONTENT_ADMIN (Thẩm định đề thi & Khung 5 miền)</option>
                    <option value="FINANCE_ADMIN">FINANCE_ADMIN (Đối soát thanh toán & Doanh thu)</option>
                    <option value="AI_OPERATOR">AI_OPERATOR (Giám sát AI Gateway & Chi phí)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-semibold text-neutral-800 dark:text-zinc-200 block mb-1">
                  Phân hạng gói dịch vụ (Chỉ 3 gói thương mại):
                </label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value as any)}
                  className="w-full p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs text-neutral-900 dark:text-neutral-100"
                >
                  <option value="FREE">Miễn phí (Free - 1 lượt thi/tháng)</option>
                  <option value="PRO">VIP Pro (Không giới hạn lượt thi &amp; NEXA Guide AI)</option>
                  <option value="ENTERPRISE">Business (Thuộc tổ chức đối tác B2B)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Xác nhận cập nhật'}
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
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Đang tải danh sách người dùng...</div>}>
      <UsersContent />
    </Suspense>
  );
}
