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
} from 'lucide-react';

interface UserRecord {
  id: string;
  nickname: string;
  fullName: string;
  email: string;
  role: 'LEARNER' | 'EVALUATOR' | 'ADMIN';
  planTier: 'FREE' | 'PRO' | 'ENTERPRISE';
  points: number;
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

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [newRole, setNewRole] = useState<'LEARNER' | 'EVALUATOR' | 'ADMIN'>('LEARNER');
  const [newTier, setNewTier] = useState<'FREE' | 'PRO' | 'ENTERPRISE'>('FREE');
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [editError, setEditError] = useState('');

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
          u.id === editingUser.id ? { ...u, role: newRole, planTier: newTier } : u
        )
      );

      setEditingUser(null);
      setActionMsg('Đã cập nhật vai trò và gói dịch vụ thành công.');
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setEditError('Lỗi kết nối máy chủ khi cập nhật');
    } finally {
      setSaving(false);
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
    return matchQuery && matchRole && matchTier;
  });

  const learnersCount = users.filter((u) => u.role === 'LEARNER').length;
  const evaluatorsCount = users.filter((u) => u.role === 'EVALUATOR').length;
  const proCount = users.filter((u) => u.planTier === 'PRO' || u.planTier === 'ENTERPRISE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý Người dùng &amp; Tài khoản
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị phân quyền tài khoản, phân hạng gói dịch vụ và theo dõi hoạt động thành viên.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/organizations"
            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-sky-600" />
            <span>Quản lý Trường học &amp; DN</span>
          </Link>
          <button
            onClick={fetchUsers}
            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
          <span>{actionMsg}</span>
        </div>
      )}

      {fetchError && (
        <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={fetchUsers}
            className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 rounded border border-rose-200 text-xs font-semibold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs">
        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <span className="text-slate-500 text-[11px]">Tổng người dùng</span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {users.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Đã xác thực email</div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <span className="text-slate-500 text-[11px]">Học viên (Learners)</span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {learnersCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Đang làm bài thi &amp; tích điểm</div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <span className="text-slate-500 text-[11px]">Giảng viên (Evaluators)</span>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {evaluatorsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Coi thi &amp; chấm tự luận</div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <span className="text-slate-500 text-[11px]">Tài khoản VIP / Campus</span>
          <div className="text-2xl font-bold text-sky-700 font-mono tabular-nums">
            {proCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Gói Pro &amp; Trường học</div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Tìm theo nickname, email, họ tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px]">Vai trò:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-slate-200 bg-white text-slate-700 text-xs shadow-xs"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="LEARNER">Học viên</option>
              <option value="EVALUATOR">Giảng viên / Chuyên gia</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px]">Gói:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-slate-200 bg-white text-slate-700 text-xs shadow-xs"
            >
              <option value="ALL">Tất cả gói</option>
              <option value="FREE">Miễn phí (Free)</option>
              <option value="PRO">VIP Pro</option>
              <option value="ENTERPRISE">Campus / Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Clean Users Table */}
      <div className="border border-slate-200 rounded-md overflow-hidden bg-white text-xs shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[11px] font-semibold font-mono">
                <th className="py-2.5 px-3.5">NGƯỜI DÙNG</th>
                <th className="py-2.5 px-3.5">VAI TRÒ</th>
                <th className="py-2.5 px-3.5">GÓI DỊCH VỤ</th>
                <th className="py-2.5 px-3.5">TỔ CHỨC / TRƯỜNG</th>
                <th className="py-2.5 px-3.5 text-center">BÀI THI</th>
                <th className="py-2.5 px-3.5 text-right">NGÀY TẠO</th>
                <th className="py-2.5 px-3.5 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-900">{u.nickname || u.fullName || 'Người dùng'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      {u.role === 'ADMIN' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-900 text-white">
                          QUẢN TRỊ VIÊN
                        </span>
                      ) : u.role === 'EVALUATOR' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Giảng viên
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Học viên
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      {u.planTier === 'ENTERPRISE' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 font-mono">
                          Campus
                        </span>
                      ) : u.planTier === 'PRO' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                          VIP Pro
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] text-slate-500 font-mono">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      {u.organization ? (
                        <span className="font-medium text-slate-800 text-[11px]">
                          {u.organization.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Cá nhân</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono tabular-nums text-slate-700">
                      {u.submissionsCount}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-400 text-[11px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition-colors shadow-xs inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-slate-400" />
                          <span>Phân quyền</span>
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

      {/* EDIT ROLE & PLAN MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-md w-full shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Phân Quyền &amp; Nâng Cấp Gói
                </h2>
                <div className="text-[11px] text-slate-500 font-mono">
                  {editingUser.email}
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Vai trò hệ thống:
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white"
                >
                  <option value="LEARNER">Học viên (Khảo thí &amp; Nhận chứng chỉ)</option>
                  <option value="EVALUATOR">Giảng viên / Chuyên gia (Coi thi &amp; Chấm bài)</option>
                  <option value="ADMIN">Quản trị viên (Master Admin)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Quy tắc: 1 Email gắn liền với 1 vai trò cố định để tránh xung đột giao diện.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Phân hạng gói dịch vụ:
                </label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white"
                >
                  <option value="FREE">Miễn phí (Free - 1 lượt thi/tháng)</option>
                  <option value="PRO">VIP Pro (Không giới hạn lượt thi &amp; Trợ lý AI)</option>
                  <option value="ENTERPRISE">Campus / Enterprise (Thuộc tổ chức đối tác)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs disabled:opacity-50"
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
