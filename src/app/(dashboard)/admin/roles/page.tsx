'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Crown,
  UserPlus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Mail,
} from 'lucide-react';

interface SuperAdminItem {
  id: string;
  email: string;
  fullName: string;
  nickname: string;
  adminRole: 'SUPER_ADMIN';
  isImmutable: boolean;
  isRegistered: boolean;
  createdAt: string | null;
  isSuspended: boolean;
}

interface PlatformAdminItem {
  id: string;
  email: string | null;
  fullName: string;
  nickname: string;
  adminRole: 'ADMIN';
  isImmutable: boolean;
  isRegistered: boolean;
  createdAt: string;
  isSuspended: boolean;
}

export default function AdminRolesPage() {
  const [loading, setLoading] = useState(true);
  const [superAdmins, setSuperAdmins] = useState<SuperAdminItem[]>([]);
  const [platformAdmins, setPlatformAdmins] = useState<PlatformAdminItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State: Thêm Quản trị viên
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Modal State: Thu hồi quyền
  const [revokingUser, setRevokingUser] = useState<PlatformAdminItem | null>(null);
  const [isSubmittingRevoke, setIsSubmittingRevoke] = useState(false);

  const fetchRolesData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/admin/roles');
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Chỉ Chủ sở hữu nền tảng (Super Admin) mới có quyền truy cập trang này.');
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Không thể tải danh sách vai trò quản trị');
      }
      const data = await res.json();
      setSuperAdmins(data.superAdmins || []);
      setPlatformAdmins(data.platformAdmins || []);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim()) return;

    try {
      setIsSubmittingAdd(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cấp quyền thất bại');
      }

      setSuccessMsg(data.message || 'Cấp quyền Quản trị viên thành công!');
      setAddEmail('');
      setIsAddModalOpen(false);
      await fetchRolesData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleRevokeAdmin = async () => {
    if (!revokingUser) return;

    try {
      setIsSubmittingRevoke(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch('/api/admin/roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: revokingUser.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Thu hồi quyền thất bại');
      }

      setSuccessMsg(data.message || 'Thu hồi quyền Quản trị viên thành công!');
      setRevokingUser(null);
      await fetchRolesData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setIsSubmittingRevoke(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 mb-1">
            <span>Quản trị hệ thống</span>
            <span>/</span>
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
              Quản trị viên và Phân quyền
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Quản trị viên và Phân quyền
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Quản lý danh sách Chủ sở hữu và phân quyền Quản trị viên điều hành nền tảng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchRolesData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" strokeWidth={1.75} />
            <span>Thêm Quản trị viên</span>
          </button>
        </div>
      </div>

      {/* Thông báo phản hồi */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer font-medium ml-2"
          >
            Đóng
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-700 dark:text-rose-300 hover:underline cursor-pointer font-medium ml-2"
          >
            Đóng
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
          <p className="text-xs text-slate-500 dark:text-neutral-400">Đang tải danh sách nhân sự quản trị...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 2. KHỐI 1: CHỦ SỞ HỮU NỀN TẢNG (SUPER ADMIN) */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span>Chủ sở hữu nền tảng</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                      {superAdmins.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Tài khoản nắm giữ quyền hạn cao nhất trong hệ thống NEXA AI.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-slate-500 dark:text-neutral-400 font-medium">
                    <th className="py-3 px-4">Thành viên</th>
                    <th className="py-3 px-4">Vai trò</th>
                    <th className="py-3 px-4">Phạm vi quyền hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {superAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {admin.email.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {admin.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono mt-0.5">
                              {admin.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                          <span>SUPER ADMIN</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300">
                        <span>Toàn quyền kiểm soát và điều hành hệ thống</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. KHỐI 2: QUẢN TRỊ VIÊN HỆ THỐNG */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span>Quản trị viên hệ thống</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      {platformAdmins.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Nhân sự được ủy quyền quản lý khách hàng, tổ chức, đề thi và vận hành hàng ngày.
                  </p>
                </div>
              </div>
            </div>

            {platformAdmins.length === 0 ? (
              <div className="p-12 text-center">
                <Shield className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" strokeWidth={1.5} />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Chưa có Quản trị viên nào được bổ nhiệm
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
                  Hệ thống hiện được điều hành trực tiếp bởi ban Chủ sở hữu. Bạn có thể bổ nhiệm thêm quản trị viên khi cần phân chia công việc.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" strokeWidth={1.75} />
                  <span>Bổ nhiệm Quản trị viên ngay</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-slate-500 dark:text-neutral-400 font-medium">
                      <th className="py-3 px-4">Thành viên</th>
                      <th className="py-3 px-4">Vai trò</th>
                      <th className="py-3 px-4">Phạm vi quyền hạn</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {platformAdmins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                              {(admin.fullName || admin.email || 'AD').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {admin.fullName}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono mt-0.5">
                                {admin.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>QUẢN TRỊ VIÊN</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300">
                          <span>Vận hành người dùng, tổ chức, đề thi và tài chính</span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setRevokingUser(admin)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Thu hồi quyền</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MODAL: THÊM QUẢN TRỊ VIÊN MỚI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Bổ nhiệm Quản trị viên
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Cấp quyền điều hành hệ thống cho tài khoản người dùng
                </p>
              </div>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  Email người dùng <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="vd: nhanvien@nexa.edu.vn"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Lưu ý: Tài khoản cần được đăng ký trên hệ thống trước khi cấp quyền.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmittingAdd}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd || !addEmail.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAdd && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xác nhận bổ nhiệm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: XÁC NHẬN THU HỒI QUYỀN */}
      {revokingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Xác nhận thu hồi quyền Quản trị viên
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Tài khoản sẽ được chuyển về người dùng tiêu chuẩn
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed mb-4">
              Bạn có chắc chắn muốn thu hồi quyền Quản trị viên của{' '}
              <strong className="text-neutral-900 dark:text-neutral-100 font-semibold font-mono">
                {revokingUser.email}
              </strong>
              ? Tài khoản này sẽ không còn quyền truy cập vào khu vực quản trị hệ thống.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRevokingUser(null)}
                disabled={isSubmittingRevoke}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRevokeAdmin}
                disabled={isSubmittingRevoke}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRevoke && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Thu hồi quyền ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
