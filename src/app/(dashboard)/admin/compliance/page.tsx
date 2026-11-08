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
  MoreHorizontal,
} from 'lucide-react';
import {
  AdminKpiCard,
  AdminPagination,
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

const sampleConsentRecords = [
  {
    initials: 'NT',
    name: 'Nguyễn Thành',
    email: 'thanh.nguyen@nexa.edu.vn',
    version: 'v2.3.1',
    status: 'GRANTED',
    ip: '203.113.72.10',
    device: 'MacBook Pro',
    os: 'Chrome 136 · macOS 14',
    isMobile: false,
    time: 'Hôm nay, 14:26',
  },
  {
    initials: 'TL',
    name: 'Trần Lan',
    email: 'lan.tran@nexa.edu.vn',
    version: 'v2.3.1',
    status: 'GRANTED',
    ip: '116.107.28.54',
    device: 'Windows PC',
    os: 'Edge 135 · Windows 11',
    isMobile: false,
    time: 'Hôm nay, 13:52',
  },
  {
    initials: 'VH',
    name: 'Vũ Hải',
    email: 'hai.vu@nexa.edu.vn',
    version: 'v2.3.1',
    status: 'GRANTED',
    ip: '203.162.16.77',
    device: 'iPhone 15',
    os: 'Safari 17 · iOS 17',
    isMobile: true,
    time: 'Hôm nay, 11:37',
  },
  {
    initials: 'QA',
    name: 'Quang Anh',
    email: 'anh.quang@nexa.edu.vn',
    version: 'v2.3.1',
    status: 'GRANTED',
    ip: '14.231.80.19',
    device: 'Android Phone',
    os: 'Chrome 136 · Android 14',
    isMobile: true,
    time: 'Hôm qua, 20:14',
  },
  {
    initials: 'MN',
    name: 'Mai Ngọc',
    email: 'ngoc.mai@nexa.edu.vn',
    version: 'v2.3.0',
    status: 'UPDATED',
    ip: '171.244.36.90',
    device: 'Windows PC',
    os: 'Chrome 134 · Windows 11',
    isMobile: false,
    time: 'Hôm qua, 17:08',
  },
  {
    initials: 'ĐK',
    name: 'Đức Khoa',
    email: 'khoa.duc@nexa.edu.vn',
    version: 'v2.3.0',
    status: 'UPDATED',
    ip: '118.69.201.33',
    device: 'MacBook Air',
    os: 'Safari 17 · macOS 14',
    isMobile: false,
    time: 'Hôm qua, 09:03',
  },
];

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

  const totalConsentsDisplay = telemetry?.totalConsents
    ? telemetry.totalConsents.toLocaleString('vi-VN')
    : '284.720';
  const proctoringCount = telemetry?.totalProctoringEvents
    ? telemetry.totalProctoringEvents.toLocaleString('vi-VN')
    : '18.540';
  const alertsCount = telemetry?.highSeverityCount || 12;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header (Chuẩn Ảnh 10) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Tuân thủ, bảo mật &amp; kiểm toán
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Theo dõi đồng thuận dữ liệu, liêm chính khảo thí và sự kiện bảo mật của nền tảng.
          </p>
        </div>

        <button
          onClick={fetchComplianceData}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới nhật ký</span>
        </button>
      </div>

      {/* 2. Top 4 KPI Metrics (Chuẩn Ảnh 10) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          label="Bản ghi đồng thuận"
          value={totalConsentsDisplay}
          change="+6,8%"
          changeType="positive"
          timeframe="So với 30 ngày trước"
          icon={FileText}
        />
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 border border-slate-100 dark:border-zinc-800">
                <Layers className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                Phiên bản quy chế áp dụng
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
              ✓ Hiện hành
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
              v2.3.1
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cập nhật: 12 Th05, 2025</p>
          </div>
        </div>
        <AdminKpiCard
          label="Sự kiện giám sát phòng thi"
          value={proctoringCount}
          change="+2,1%"
          changeType="positive"
          timeframe="So với 30 ngày trước"
          icon={Video}
        />
        <AdminKpiCard
          label="Cảnh báo nghiêm trọng"
          value={alertsCount}
          change="-38,5%"
          changeType="negative"
          timeframe="So với 30 ngày trước"
          icon={AlertTriangle}
        />
      </div>

      {/* 3. Tabs (Chuẩn Ảnh 10) */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('consent')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'consent'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'bg-white dark:bg-[#111114] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Đồng thuận dữ liệu cá nhân</span>
        </button>

        <button
          onClick={() => setActiveTab('proctoring')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'proctoring'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'bg-white dark:bg-[#111114] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Sự kiện liêm chính phòng thi</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'audit'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'bg-white dark:bg-[#111114] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Nhật ký kiểm toán</span>
        </button>
      </div>

      {/* 4. Filter Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm theo người dùng, email hoặc ID..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
        />
      </div>

      {/* 5. Data Table (Chuẩn Ảnh 10) */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-medium">
                <th className="py-3 px-4">Người dùng</th>
                <th className="py-3 px-4">Phiên bản</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Địa chỉ IP</th>
                <th className="py-3 px-4">Thiết bị / User Agent</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="">
              {sampleConsentRecords.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition-colors">
                  {/* Người dùng */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 border border-blue-200 dark:border-blue-800">
                        {r.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {r.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {r.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Phiên bản */}
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-zinc-400">
                    {r.version}
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {r.status === 'GRANTED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Đã đồng thuận
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Đã cập nhật
                      </span>
                    )}
                  </td>

                  {/* Địa chỉ IP */}
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-zinc-400">
                    {r.ip}
                  </td>

                  {/* Thiết bị / User Agent */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {r.isMobile ? (
                        <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <Laptop className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {r.device}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {r.os}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Thời gian */}
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {r.time}
                  </td>

                  {/* Thao tác */}
                  <td className="py-3 px-4 text-right">
                    <button className="p-1 rounded text-slate-400 hover:text-slate-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div>Hiển thị 1–6 của 284.720 bản ghi</div>
            <div className="flex items-center gap-1">
              <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold">1</span>
              <span className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">2</span>
              <span className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">3</span>
              <span className="px-1">...</span>
              <span className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">47.454</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
