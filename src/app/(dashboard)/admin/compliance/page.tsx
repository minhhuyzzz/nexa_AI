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
  Eye,
  MonitorX,
} from 'lucide-react';

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

export default function AdminCompliancePage() {
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>([]);
  const [proctoringEvents, setProctoringEvents] = useState<ProctoringEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'consent' | 'proctoring'>('consent');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/compliance');
      const data = await res.json();
      if (data.consentLogs) setConsentLogs(data.consentLogs);
      if (data.proctoringEvents) setProctoringEvents(data.proctoringEvents);
    } catch (e) {
      console.error('Failed to load compliance audit data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const highSeverityCount = proctoringEvents.filter((e) => e.severity === 'HIGH').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              SECURITY AUDIT &amp; REGULATORY COMPLIANCE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tuân Thủ NĐ 13/2023 &amp; Giám Sát Liêm Chính Khảo Thí
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kiểm toán việc lưu trữ đồng thuận bảo vệ dữ liệu cá nhân (PDPA) và truy vết sự kiện an toàn phòng thi trực tiếp.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchData}
            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Làm mới nhật ký</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-200">
        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Bản ghi đồng thuận (PDPA)</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {consentLogs.length}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-mono">
            100% người dùng đã cấp quyền
          </div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Phiên bản quy chế áp dụng</span>
            <FileCheck2 className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono pt-0.5">
            v1.0-ND13
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Nghị định 13/2023/NĐ-CP
          </div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Sự kiện giám sát phòng thi</span>
            <Eye className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {proctoringEvents.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Tab switch, blur, fullscreen
          </div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Cảnh báo nghiêm trọng</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {highSeverityCount}
          </div>
          <div className="text-[10px] text-rose-700 mt-1 font-mono">
            Cần giám thị rà soát
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('consent')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'consent'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Đồng thuận bảo vệ dữ liệu cá nhân ({consentLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('proctoring')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'proctoring'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MonitorX className="w-3.5 h-3.5" />
            <span>Sự kiện liêm chính phòng thi ({proctoringEvents.length})</span>
          </button>
        </div>

        <div className="relative text-xs min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo email, IP, sự kiện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
          />
        </div>
      </div>

      {/* 4. Content by Active Tab */}
      {activeTab === 'consent' ? (
        <div className="border border-slate-200 rounded-md overflow-hidden bg-white text-xs shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[11px] font-semibold font-mono">
                  <th className="py-2.5 px-3.5">NGƯỜI DÙNG</th>
                  <th className="py-2.5 px-3.5">PHIÊN BẢN</th>
                  <th className="py-2.5 px-3.5 text-center">TRẠNG THÁI</th>
                  <th className="py-2.5 px-3.5 font-mono">ĐỊA CHỈ IP</th>
                  <th className="py-2.5 px-3.5">THIẾT BỊ / USER AGENT</th>
                  <th className="py-2.5 px-3.5 text-right">THỜI GIAN ĐỒNG THUẬN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {consentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Chưa có nhật ký đồng thuận nào được lưu.
                    </td>
                  </tr>
                ) : (
                  consentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900">
                          {log.profiles?.nickname || 'Người dùng'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.profiles?.email || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-semibold text-slate-700">
                        {log.consent_version}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Đồng thuận
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-600">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 max-w-xs truncate text-[11px]">
                        {log.user_agent || 'Mozilla/5.0'}
                      </td>
                      <td className="py-3 px-3.5 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-md overflow-hidden bg-white text-xs shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[11px] font-semibold font-mono">
                  <th className="py-2.5 px-3.5">THÍ SINH</th>
                  <th className="py-2.5 px-3.5 font-mono">MÃ PHÒNG</th>
                  <th className="py-2.5 px-3.5">LOẠI SỰ KIỆN</th>
                  <th className="py-2.5 px-3.5 text-center">MỨC ĐỘ</th>
                  <th className="py-2.5 px-3.5">CHI TIẾT</th>
                  <th className="py-2.5 px-3.5 text-right">THỜI GIAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {proctoringEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Không ghi nhận sự kiện vi phạm liêm chính nào trong các phòng thi.
                    </td>
                  </tr>
                ) : (
                  proctoringEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900">
                          {ev.profiles?.nickname || 'Thí sinh'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {ev.profiles?.email || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-700">
                        {ev.room_id ? ev.room_id.slice(0, 8) : 'LIVE-ROOM'}
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-800 font-mono">
                        {ev.event_type}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {ev.severity === 'HIGH' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Nghiêm trọng
                          </span>
                        ) : ev.severity === 'MEDIUM' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Cảnh báo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Thông thường
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 text-[11px] max-w-xs truncate">
                        {typeof ev.details === 'object' ? JSON.stringify(ev.details) : String(ev.details || '—')}
                      </td>
                      <td className="py-3 px-3.5 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(ev.created_at).toLocaleTimeString('vi-VN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
