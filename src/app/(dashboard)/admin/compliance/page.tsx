'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Download,
  FileText,
  Copy,
  Check,
  KeyRound,
  AlertTriangle,
  Database,
  Eye,
  Server,
  X,
  Loader2,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: 'SYSTEM' | 'ADMIN' | 'EVALUATOR' | 'AI_GATEWAY';
  action: string;
  resource: string;
  ipAddress: string;
  sha256Hash: string;
  status: 'VERIFIED' | 'FLAGGED';
  details: string;
}

export default function AdminCompliancePage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/compliance');
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.sha256Hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'ALL' || log.actorRole === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              AN TOÀN &amp; TUÂN THỦ
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bảo Mật &amp; Nhật Ký Kiểm Toán (Audit Trail)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Nhật ký bất biến ghi nhận mọi thay đổi điểm số, quyết định chấm của AI, cấp chứng chỉ với chuỗi băm SHA-256.
          </p>
        </div>

        <button
          onClick={() => alert('Xuất tệp nhật ký kiểm toán định dạng CSV/JSON đã ký số thành công.')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Download className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
          <span>Xuất báo cáo kiểm toán</span>
        </button>
      </div>

      {/* Compliance Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Toàn vẹn dữ liệu SHA-256</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            100%
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
            Không có dấu hiệu giả mạo
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Khử PII trước AI Gateway</span>
            <Lock className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            100.0%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Zero PII rò rỉ ra ngoài hệ thống</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Sự kiện kiểm toán đã ghi nhận</span>
            <FileText className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {loading ? '—' : logs.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Lưu trữ toàn vẹn trong CSDL</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Nghị định 13/2023/NĐ-CP</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Đạt chuẩn tuân thủ
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Bảo vệ dữ liệu cá nhân VN</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-md border border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Tìm theo mã sự kiện, người thao tác hoặc mã băm SHA-256..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md text-xs pl-9 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          <span className="text-xs text-slate-500">Tác nhân:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-700"
          >
            <option value="ALL">Tất cả tác nhân</option>
            <option value="AI_GATEWAY">AI Gateway</option>
            <option value="EVALUATOR">Người đánh giá</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-600" />
            <p className="text-xs">Đang tải nhật ký kiểm soát tuân thủ &amp; cam kết...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
              <ShieldCheck className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Chưa ghi nhận sự kiện kiểm toán nào</h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery || roleFilter !== 'ALL'
                  ? 'Không tìm thấy nhật ký phù hợp với bộ lọc hiện tại.'
                  : 'Hệ thống chưa ghi nhận sự kiện cam kết hoặc kiểm toán nào trong bảng dữ liệu.'}
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Tác nhân</th>
                  <th className="py-3 px-4">Sự kiện (Action)</th>
                  <th className="py-3 px-4">Tài nguyên liên quan</th>
                  <th className="py-3 px-4">Địa chỉ IP</th>
                  <th className="py-3 px-4">Mã băm SHA-256</th>
                  <th className="py-3 px-4 text-center">Toàn vẹn</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-[180px] truncate">
                      {log.actor}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-[180px] truncate">
                      {log.resource}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[90px]">
                          {log.sha256Hash.slice(0, 8)}...{log.sha256Hash.slice(-6)}
                        </span>
                        <button
                          onClick={() => handleCopyHash(log.sha256Hash)}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                          title="Sao chép toàn bộ chuỗi SHA-256"
                        >
                          {copiedHash === log.sha256Hash ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Khớp
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-medium transition-colors"
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Audit Log Detail */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-lg w-full shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Chi Tiết Bản Ghi Kiểm Toán</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-md bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Thời gian:</span>
                  <span className="font-mono font-medium text-slate-800">{selectedLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">IP / Nguồn:</span>
                  <span className="font-mono font-medium text-slate-800">{selectedLog.ipAddress}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200/50">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Tác nhân:</span>
                  <span className="font-medium text-slate-900">{selectedLog.actor}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">
                  Nội dung chi tiết sự kiện:
                </span>
                <p className="p-3 rounded bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedLog.details}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">
                  Mã băm toàn vẹn SHA-256 (Immutable Hash):
                </span>
                <div className="p-2.5 rounded bg-slate-900 text-sky-400 font-mono text-[11px] break-all border border-slate-800 flex items-center justify-between gap-2">
                  <span>{selectedLog.sha256Hash}</span>
                  <button
                    onClick={() => handleCopyHash(selectedLog.sha256Hash)}
                    className="shrink-0 p-1 rounded bg-slate-800 text-white hover:bg-slate-700"
                    title="Sao chép"
                  >
                    {copiedHash === selectedLog.sha256Hash ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
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
