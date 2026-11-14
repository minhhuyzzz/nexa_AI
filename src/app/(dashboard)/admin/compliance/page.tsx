'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  Search,
  CheckCircle2,
  Lock,
  Layers,
  Laptop,
  Smartphone,
  Video,
  FileText,
  User,
} from 'lucide-react';
import {
  AdminKpiCard,
} from '@/components/dashboard/admin/AdminUIComponents';

interface ConsentLog {
  id: string;
  user_id: string;
  consent_version: string;
  is_granted: boolean;
  ip_address: string;
  user_agent: string;
  created_at: string;
  profiles?: {
    email: string;
    nickname: string;
  };
}

interface ProctoringEvent {
  id: string;
  user_id: string;
  room_id: string;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  details: any;
  created_at: string;
  profiles?: {
    email: string;
    nickname: string;
  };
}

interface ComplianceTelemetry {
  totalProfiles: number;
  totalConsents: number;
  consentRate: number;
  totalProctoringEvents: number;
  highSeverityCount: number;
}

export default function AdminCompliancePage() {
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>([]);
  const [proctoringEvents, setProctoringEvents] = useState<ProctoringEvent[]>([]);
  const [telemetry, setTelemetry] = useState<ComplianceTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'consent' | 'proctoring' | 'audit'>('consent');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/compliance');
      const data = await res.json();
      if (data.telemetry) {
        setTelemetry(data.telemetry);
        setConsentLogs(data.consentLogs || []);
        setProctoringEvents(data.proctoringEvents || []);
      }
    } catch (e) {
      console.error('Failed to load compliance data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const totalConsentsDisplay = (telemetry?.totalConsents ?? 0).toLocaleString('vi-VN');
  const proctoringCount = (telemetry?.totalProctoringEvents ?? 0).toLocaleString('vi-VN');
  const alertsCount = (telemetry?.highSeverityCount ?? 0).toLocaleString('vi-VN');
  const consentRateDisplay = telemetry?.consentRate ? `${telemetry.consentRate}%` : '0%';

  const filteredConsentLogs = consentLogs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.profiles?.email?.toLowerCase().includes(q) ||
      log.profiles?.nickname?.toLowerCase().includes(q) ||
      log.ip_address?.toLowerCase().includes(q) ||
      log.consent_version?.toLowerCase().includes(q)
    );
  });

  const filteredProctoringEvents = proctoringEvents.filter((ev) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.profiles?.email?.toLowerCase().includes(q) ||
      ev.event_type?.toLowerCase().includes(q) ||
      ev.room_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Tuân thủ, bảo mật và kiểm toán
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Theo dõi đồng thuận dữ liệu (Nghị định 13/2023/NĐ-CP), liêm chính khảo thí và sự kiện kiểm toán hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchComplianceData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
        </button>
      </div>

      {/* 2. Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          label="Hồ sơ đã đồng thuận"
          value={totalConsentsDisplay}
          change={consentRateDisplay}
          changeType="positive"
          timeframe="Tỷ lệ người dùng chấp thuận"
          icon={ShieldCheck}
        />
        <AdminKpiCard
          label="Tỷ lệ tuân thủ dữ liệu"
          value={consentRateDisplay}
          change="NĐ 13/2023"
          changeType="positive"
          timeframe="Chính sách quyền riêng tư"
          icon={FileCheck2}
        />
        <AdminKpiCard
          label="Sự kiện phòng thi giám sát"
          value={proctoringCount}
          change="Khảo thí"
          changeType="neutral"
          timeframe="Telemetry từ các phòng thi"
          icon={Video}
        />
        <AdminKpiCard
          label="Cảnh báo mức độ cao"
          value={alertsCount}
          change={telemetry?.highSeverityCount ? 'Cần xử lý' : 'An toàn'}
          changeType={telemetry?.highSeverityCount ? 'negative' : 'positive'}
          timeframe="Vi phạm liêm chính hoặc bảo mật"
          icon={AlertTriangle}
        />
      </div>

      {/* 3. Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('consent')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'consent'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
              : 'bg-white dark:bg-[#111114] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Đồng thuận dữ liệu ({consentLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('proctoring')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'proctoring'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
              : 'bg-white dark:bg-[#111114] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Sự kiện liêm chính phòng thi ({proctoringEvents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
              : 'bg-white dark:bg-[#111114] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tiêu chuẩn bảo mật</span>
        </button>
      </div>

      {/* 4. Filter Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm theo email, nickname, địa chỉ IP hoặc phiên bản..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
        />
      </div>

      {/* 5. Tab Content: Consent Logs */}
      {activeTab === 'consent' && (
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-medium">
                  <th className="py-3 px-4">Người dùng</th>
                  <th className="py-3 px-4">Phiên bản chính sách</th>
                  <th className="py-3 px-4">Trạng thái đồng thuận</th>
                  <th className="py-3 px-4">Địa chỉ IP</th>
                  <th className="py-3 px-4">User Agent / Trình duyệt</th>
                  <th className="py-3 px-4">Thời gian ghi nhận</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-neutral-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileCheck2 className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
                        <span className="font-medium text-xs">Chưa có bản ghi đồng thuận dữ liệu nào</span>
                        <span className="text-[11px] text-slate-400">
                          Hệ thống tự động ghi nhận khi người dùng chấp thuận điều khoản Nghị định 13/2023/NĐ-CP.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredConsentLogs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-200 dark:border-blue-800">
                            {r.profiles?.nickname ? r.profiles.nickname.slice(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {r.profiles?.nickname || 'Người dùng'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {r.profiles?.email || r.user_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-zinc-400">
                        {r.consent_version}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.is_granted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đã đồng thuận
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Từ chối / Thu hồi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-zinc-400">
                        {r.ip_address || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-zinc-400 max-w-xs truncate" title={r.user_agent}>
                        {r.user_agent || 'Trình duyệt tiêu chuẩn'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
            <div>Hiển thị {filteredConsentLogs.length} bản ghi đồng thuận thực tế</div>
            <div className="font-mono text-[11px]">Nghị định 13/2023/NĐ-CP</div>
          </div>
        </div>
      )}

      {/* 5. Tab Content: Proctoring Events */}
      {activeTab === 'proctoring' && (
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-medium">
                  <th className="py-3 px-4">Thí sinh</th>
                  <th className="py-3 px-4">Mã phòng thi</th>
                  <th className="py-3 px-4">Loại sự kiện</th>
                  <th className="py-3 px-4">Mức độ nghiêm trọng</th>
                  <th className="py-3 px-4">Thời gian ghi nhận</th>
                </tr>
              </thead>
              <tbody>
                {filteredProctoringEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-neutral-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Video className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
                        <span className="font-medium text-xs">Không có sự kiện bất thường nào trong phòng thi</span>
                        <span className="text-[11px] text-slate-400">
                          Các sự kiện chuyển tab, mất kết nối hoặc hành vi bất thường sẽ được ghi nhận tại đây.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProctoringEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {ev.profiles?.nickname || 'Thí sinh'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {ev.profiles?.email || ev.user_id}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-zinc-400">
                        {ev.room_id || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-800 dark:text-zinc-200">
                        {ev.event_type}
                      </td>
                      <td className="py-3 px-4">
                        {ev.severity === 'HIGH' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
                            Nghiêm trọng (High)
                          </span>
                        ) : ev.severity === 'MEDIUM' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                            Cảnh báo (Medium)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                            Thông thường (Low)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(ev.created_at).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
            <div>Hiển thị {filteredProctoringEvents.length} sự kiện liêm chính phòng thi</div>
            <div className="font-mono text-[11px]">Proctoring Telemetry v2.0</div>
          </div>
        </div>
      )}

      {/* 5. Tab Content: Security Standards */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Chính sách bảo mật và tiêu chuẩn kiểm toán hệ thống
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Các quy định kỹ thuật bắt buộc áp dụng trên toàn bộ nền tảng NEXA
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Nghị định 13/2023/NĐ-CP
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Lưu vết đồng thuận rõ ràng kèm IP, User Agent, thời gian và phiên bản chính sách khi người dùng đăng ký hoặc cập nhật.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Kiểm soát liêm chính khảo thí
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Ghi nhận tự động các biến cố trong phòng thi trực tuyến để hỗ trợ chuyên gia khảo thí phúc khảo bài nộp.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Nhật ký kiểm toán bất biến
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Mọi thao tác quản trị viên (khóa tài khoản, duyệt B2B, đổi cấu hình) đều được lưu vào bảng admin_audit_logs.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
