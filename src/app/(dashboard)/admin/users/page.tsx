'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  MoreVertical,
  CheckCircle2,
  Lock,
  Unlock,
  Building,
  Mail,
  Calendar,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface UserRecord {
  id: string;
  displayName: string;
  email: string;
  role: 'LEARNER' | 'EVALUATOR' | 'ADMIN';
  organization: string;
  status: 'ACTIVE' | 'LOCKED';
  joinedAt: string;
  assessmentsTaken: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' }
          : u
      )
    );
  };

  const handleChangeRole = async (userId: string, newRole: UserRecord['role']) => {
    try {
      setUpdating(true);
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        console.error('Error updating role:', json.error);
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (editingUser) {
        setEditingUser({ ...editingUser, role: newRole });
      }
    } catch (err) {
      console.error('Failed to change role:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              QUẢN TRỊ TỐI CAO
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản Lý Người Dùng &amp; Phân Quyền
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Danh sách toàn bộ tài khoản trong hệ thống: Học viên, Người đánh giá và Quản trị viên.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
            Tổng tài khoản: <span className="text-sky-600">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-xs w-full">
          <Search
            className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            strokeWidth={1.75}
          />
          <input
            type="text"
            placeholder="Tìm theo tên, email, đơn vị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'LEARNER', label: 'Học viên' },
            { id: 'EVALUATOR', label: 'Đánh giá viên' },
            { id: 'ADMIN', label: 'Quản trị viên' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                roleFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-slate-200/80 rounded-md overflow-hidden bg-white shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-600" />
            <p className="text-xs">Đang tải danh sách tài khoản từ Supabase...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
              <Users className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Không tìm thấy tài khoản nào</h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery || roleFilter !== 'ALL'
                  ? 'Không có kết quả phù hợp với bộ lọc hiện tại. Thử đổi từ khóa hoặc bộ lọc vai trò.'
                  : 'Hệ thống chưa ghi nhận tài khoản người dùng nào trong cơ sở dữ liệu.'}
              </p>
            </div>
            {(searchQuery || roleFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('ALL');
                }}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500 text-[11px] font-semibold">
                <th className="py-3 px-4">NGƯỜI DÙNG</th>
                <th className="py-3 px-4">VAI TRÒ</th>
                <th className="py-3 px-4">ĐƠN VỊ / TỔ CHỨC</th>
                <th className="py-3 px-4">TRẠNG THÁI</th>
                <th className="py-3 px-4">NGÀY THAM GIA</th>
                <th className="py-3 px-4 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 uppercase shrink-0">
                        {u.displayName[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{u.displayName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {u.role === 'ADMIN' ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-slate-900 text-white">
                        ADMIN
                      </span>
                    ) : u.role === 'EVALUATOR' ? (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                        Đánh giá viên
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        Học viên
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600">{u.organization}</td>

                  <td className="py-3.5 px-4">
                    {u.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        Đã khóa
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">{u.joinedAt}</td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                      >
                        Phân quyền
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`p-1.5 rounded-md border text-xs transition-colors ${
                          u.status === 'ACTIVE'
                            ? 'border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        }`}
                        title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {u.status === 'ACTIVE' ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-md w-full shadow-sm space-y-4 text-slate-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Phân Quyền Vai Trò Người Dùng
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                Đóng
              </button>
            </div>

            <div>
              <div className="font-semibold text-slate-800 text-sm">
                {editingUser.displayName}
              </div>
              <div className="text-slate-400 text-[11px]">{editingUser.email}</div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="font-semibold text-slate-700 block">
                Chọn vai trò trong hệ thống:
              </label>

              {[
                { role: 'LEARNER' as const, label: 'Học viên (LEARNER)', desc: 'Làm bài thi, nhận diện khoảng trống, học liệu bồi dưỡng.' },
                { role: 'EVALUATOR' as const, label: 'Người đánh giá (EVALUATOR)', desc: 'Tạo lớp, mở phòng thi PIN/QR, chấm bài Rubric.' },
                { role: 'ADMIN' as const, label: 'Quản trị viên (ADMIN)', desc: 'Toàn quyền cấu hình hệ thống, AI, gói dịch vụ và người dùng.' },
              ].map((opt) => (
                <div
                  key={opt.role}
                  onClick={() => handleChangeRole(editingUser.id, opt.role)}
                  className={`p-3 rounded-md border cursor-pointer transition-colors ${
                    editingUser.role === opt.role
                      ? 'border-sky-600 bg-sky-50/30 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs text-slate-900">{opt.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
