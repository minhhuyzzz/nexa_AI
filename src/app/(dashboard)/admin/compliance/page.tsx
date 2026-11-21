'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  User,
  Activity,
  Layers,
  Code,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface AdminAuditLog {
  id: string;
  admin_id: string | null;
  admin_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

interface AuditStats {
  totalActions: number;
  actions24h: number;
  activeAdmins: number;
  totalSuperAdmins?: number;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  UPDATE: { label: 'Cập nhật Đề thi', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  CREATE: { label: 'Tạo mới Đề thi', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  DELETE: { label: 'Xóa Đề thi', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  GRANT_ROLE: { label: 'Cấp quyền Quản trị', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  REVOKE_ROLE: { label: 'Thu hồi quyền Quản trị', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  SUSPEND_USER: { label: 'Tạm khóa tài khoản', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  UNSUSPEND_USER: { label: 'Mở khóa tài khoản', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  REVOKE_SESSION: { label: 'Đăng xuất phiên', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  UPDATE_TIER: { label: 'Đổi Gói dịch vụ', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800' },
  UPDATE_ROLE: { label: 'Đổi Vai trò', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  UPDATE_SYSTEM_SETTINGS: { label: 'Cập nhật Cài đặt', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  UPDATE_AI_CONFIG: { label: 'Cập nhật Cổng AI', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
  AI_CONFIG_UPDATED: { label: 'Cập nhật Cổng AI', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
  APPROVE: { label: 'Phê duyệt Đóng góp', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  REJECT: { label: 'Từ chối Đóng góp', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  APPROVE_ORGANIZATION: { label: 'Duyệt Tổ chức Business', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  ORG_ACTIVATED: { label: 'Kích hoạt Tổ chức', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  ORG_RENEWAL_APPROVED: { label: 'Duyệt Gia hạn Tổ chức', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  BAN_USER: { label: 'Khóa tài khoản', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  UNBAN_USER: { label: 'Mở khóa tài khoản', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  USER_ROLE_ASSIGN: { label: 'Phân quyền tài khoản', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  RECONCILE_PAYMENT: { label: 'Đối soát Giao dịch', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800' },
  TRANSACTION_MANUALLY_RECONCILED: { label: 'Đối soát Giao dịch', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800' },
  PUBLISH_ASSESSMENT: { label: 'Xuất bản Đề thi', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  CLONE_ASSESSMENT: { label: 'Nhân bản Đề thi', color: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700' },
  CLONE: { label: 'Nhân bản Đề thi', color: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700' },
  INQUIRY_STATUS_UPDATED: { label: 'Cập nhật Tư vấn', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  BROADCAST_NOTIFICATION: { label: 'Gửi Thông báo', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
};

function AdminComplianceContent() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({ totalActions: 0, actions24h: 0, activeAdmins: 0, totalSuperAdmins: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [targetFilter, setTargetFilter] = useState('ALL');
  const [period, setPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal payload view
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const params = new URLSearchParams();
      if (actionFilter !== 'ALL') params.set('action', actionFilter);
      if (targetFilter !== 'ALL') params.set('target_type', targetFilter);
      if (period !== 'all') params.set('period', period);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('limit', '100');

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Chỉ Chủ sở hữu nền tảng (Super Admin) mới có quyền truy cập Nhật ký kiểm toán.');
        }
        throw new Error('Không thể tải nhật ký kiểm toán');
      }
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-fetch on filter change
  }, [actionFilter, targetFilter, period]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditLogs();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Nhật ký kiểm toán
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-md">
              Admin Audit Trail
            </span>
          </div>
        </div>

        <button
          onClick={fetchAuditLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-800 dark:text-zinc-200 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

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

      {/* 2. 3 Activity Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
              Tổng thao tác ghi nhận
            </span>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums mt-1">
              {stats.totalActions.toLocaleString('vi-VN')}
            </div>
            <span className="text-[10px] text-slate-400">Toàn thời gian hệ thống</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Activity className="w-5 h-5" strokeWidth={1.75} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
              Thao tác trong 24 giờ qua
            </span>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums mt-1">
              {stats.actions24h.toLocaleString('vi-VN')}
            </div>
            <span className="text-[10px] text-slate-400">Hành vi gần nhất</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <Clock className="w-5 h-5" strokeWidth={1.75} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
              Quản trị viên có hoạt động
            </span>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums mt-1">
              {stats.activeAdmins}
            </div>
            <span className="text-[10px] text-slate-400">
              {stats.activeAdmins} trên tổng số {stats.totalSuperAdmins || stats.activeAdmins} Chủ nền tảng đã thao tác
            </span>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <User className="w-5 h-5" strokeWidth={1.75} />
          </div>
        </div>
      </div>

      {/* 3. Filter Controls */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo email quản trị, hành động hoặc ID đối tượng..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="ALL">Tất cả hành động</option>
              <option value="UPDATE">Cập nhật Đề thi</option>
              <option value="CREATE">Tạo mới</option>
              <option value="DELETE">Xóa</option>
              <option value="GRANT_ROLE">Cấp quyền Quản trị</option>
              <option value="REVOKE_ROLE">Thu hồi quyền Quản trị</option>
              <option value="SUSPEND_USER">Khóa tài khoản</option>
              <option value="UNSUSPEND_USER">Mở khóa tài khoản</option>
              <option value="REVOKE_SESSION">Đăng xuất phiên</option>
              <option value="UPDATE_TIER">Đổi Gói dịch vụ</option>
              <option value="UPDATE_SYSTEM_SETTINGS">Cập nhật Cài đặt</option>
              <option value="AI_CONFIG_UPDATED">Cập nhật Cổng AI</option>
              <option value="APPROVE">Phê duyệt Đóng góp</option>
              <option value="REJECT">Từ chối Đóng góp</option>
              <option value="ORG_ACTIVATED">Kích hoạt Tổ chức</option>
              <option value="ORG_RENEWAL_APPROVED">Duyệt Gia hạn Tổ chức</option>
              <option value="TRANSACTION_MANUALLY_RECONCILED">Đối soát Giao dịch</option>
              <option value="BROADCAST_NOTIFICATION">Gửi Thông báo</option>
            </select>

            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="ALL">Tất cả đối tượng</option>
              <option value="SYSTEM_SETTINGS">Cài đặt hệ thống</option>
              <option value="AI_GATEWAY">Cổng AI</option>
              <option value="USER">Người dùng</option>
              <option value="ORGANIZATION">Tổ chức</option>
              <option value="CONTRIBUTION">Đóng góp câu hỏi</option>
              <option value="TRANSACTION">Giao dịch</option>
              <option value="ASSESSMENT">Đề thi</option>
            </select>

            {/* Period Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-900 rounded-lg text-xs font-medium">
              {(['24h', '7d', '30d', 'all'] as const).map((p) => {
                const label = p === '24h' ? '24h' : p === '7d' ? '7 ngày' : p === '30d' ? '30 ngày' : 'Tất cả';
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer text-xs ${
                      period === p
                        ? 'bg-white dark:bg-[#111114] text-blue-600 font-semibold shadow-xs'
                        : 'text-slate-500 hover:text-neutral-800 dark:text-neutral-400'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </div>

      {/* 4. Logs Table */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-zinc-900/60 text-slate-500 dark:text-neutral-400 font-medium">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Quản trị viên</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Đối tượng</th>
                <th className="py-3 px-4">Địa chỉ IP</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Đang nạp nhật ký kiểm toán từ cơ sở dữ liệu...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 text-xs">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-zinc-600" />
                    <span>Không tìm thấy bản ghi kiểm toán nào phù hợp với điều kiện lọc.</span>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actionMeta = ACTION_LABELS[log.action] || {
                    label: log.action,
                    color: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700',
                  };

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-zinc-300 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString('vi-VN')}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {(log.admin_email || 'AD').substring(0, 2).toUpperCase()}
                          </span>
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {log.admin_email || 'Quản trị viên'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${actionMeta.color}`}
                        >
                          {actionMeta.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                            {log.target_type}
                          </span>
                          {log.target_id && (
                            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]" title={log.target_id}>
                              #{log.target_id.slice(0, 8)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {log.ip_address || '127.0.0.1'}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors cursor-pointer"
                        >
                          Xem Payload
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 bg-slate-50/40 dark:bg-zinc-900/30">
          <span>Hiển thị {logs.length} bản ghi kiểm toán gần nhất</span>
          <span className="font-mono text-[11px]">NEXA PLATFORM AUDIT TRAIL</span>
        </div>
      </div>

      {/* 5. Modal xem chi tiết Payload JSON */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-600" />
                  <span>Chi tiết dữ liệu kiểm toán</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  ID: <span className="font-mono">{selectedLog.id}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <div>
                <span className="text-slate-400">Quản trị viên:</span>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedLog.admin_email || 'System'}</p>
              </div>
              <div>
                <span className="text-slate-400">Thời gian:</span>
                <p className="font-mono text-neutral-900 dark:text-neutral-100">{new Date(selectedLog.created_at).toLocaleString('vi-VN')}</p>
              </div>
              <div>
                <span className="text-slate-400">Hành động:</span>
                <p className="font-semibold text-blue-600">{selectedLog.action}</p>
              </div>
              <div>
                <span className="text-slate-400">Đối tượng:</span>
                <p className="font-mono text-neutral-900 dark:text-neutral-100">{selectedLog.target_type} {selectedLog.target_id ? `(#${selectedLog.target_id})` : ''}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Địa chỉ IP ghi nhận:</span>
                <p className="font-mono text-neutral-900 dark:text-neutral-100">{selectedLog.ip_address || '127.0.0.1'}</p>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Payload JSON chi tiết:
              </span>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-72 border border-slate-800">
                {JSON.stringify(selectedLog.details, null, 2) || '{}'}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCompliancePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Đang tải nhật ký kiểm toán...
        </div>
      }
    >
      <AdminComplianceContent />
    </Suspense>
  );
}
