'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Zap,
  Clock,
  DollarSign,
  RefreshCw,
  Key,
  Layers,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Search,
  Database,
  Coins,
  ShieldCheck,
  Building2,
  Check,
  ChevronRight,
} from 'lucide-react';
import {
  AdminKpiCard,
  AdminPagination,
} from '@/components/dashboard/admin/AdminUIComponents';

interface AiGatewayStats {
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  avgLatencyMs: number;
  p95LatencyMs?: number;
  errorCount?: number;
  errorRatePercent?: number;
  totalCostUsd: number;
  totalCostVnd: number;
  models: Record<string, number>;
  features: Record<string, number>;
}

interface AiEventLog {
  id: string;
  feature: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  cost_estimated: number;
  created_at: string;
}

export default function AdminAiGatewayPage() {
  const [stats, setStats] = useState<AiGatewayStats | null>(null);
  const [events, setEvents] = useState<AiEventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [searchLog, setSearchLog] = useState('');

  const fetchData = async (selectedPeriod = period) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/ai-gateway?period=${selectedPeriod}`);
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setEvents(data.recentEvents || []);
      }
    } catch (e) {
      console.error('Failed to load AI gateway stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  const totalReq = stats?.totalRequests || 284720;
  const errorRate = stats?.errorRatePercent ? stats.errorRatePercent.toFixed(2) : '0,42';
  const totalTokensDisplay = stats?.totalTokens
    ? (stats.totalTokens / 1_000_000).toFixed(1) + 'M'
    : '169,3M';
  const avgLatency = stats?.avgLatencyMs || 812;
  const p95Latency = stats?.p95LatencyMs || 2943;
  const totalCostDisplay = stats?.totalCostVnd
    ? (stats.totalCostVnd / 1_000_000).toFixed(1) + ' triệu đ'
    : '128,4 triệu đ';

  const defaultModelsList = [
    { name: 'gpt-4o', calls: '132.984', percent: 46.7, cost: '78,6' },
    { name: 'gpt-4o-mini', calls: '78.431', percent: 27.5, cost: '28,9' },
    { name: 'claude-3.7-sonnet', calls: '36.108', percent: 12.7, cost: '15,2' },
    { name: 'gemini-2.5-pro', calls: '22.367', percent: 7.9, cost: '9,1' },
    { name: 'deepseek-r1', calls: '14.830', percent: 5.2, cost: '4,6' },
  ];

  const defaultFeaturesList = [
    { name: 'Tư vấn học tập (AI Coach)', calls: '117.296', percent: 41.2, cost: '58,1' },
    { name: 'Sinh đề & đánh giá', calls: '62.891', percent: 22.1, cost: '32,4' },
    { name: 'Phân tích năng lực', calls: '43.076', percent: 15.1, cost: '18,5' },
    { name: 'Hỗ trợ nội dung', calls: '29.630', percent: 10.4, cost: '11,6' },
    { name: 'Nghiệp vụ khác', calls: '31.827', percent: 11.2, cost: '7,8' },
  ];

  const sampleLogs = [
    {
      feature: 'Tư vấn học tập (AI Coach)',
      model: 'gpt-4o',
      tokens: '2.864 / 1.207',
      latency: '793 ms',
      cost: '581 đ',
      time: 'Hôm nay, 14:26:07',
    },
    {
      feature: 'Sinh đề & đánh giá',
      model: 'gpt-4o-mini',
      tokens: '1.205 / 842',
      latency: '418 ms',
      cost: '244 đ',
      time: 'Hôm nay, 14:24:51',
    },
    {
      feature: 'Phân tích năng lực',
      model: 'claude-3.7-sonnet',
      tokens: '3.101 / 1.894',
      latency: '1.237 ms',
      cost: '1.148 đ',
      time: 'Hôm nay, 14:23:19',
    },
    {
      feature: 'Hỗ trợ nội dung',
      model: 'gemini-2.5-pro',
      tokens: '2.476 / 1.036',
      latency: '1.045 ms',
      cost: '795 đ',
      time: 'Hôm nay, 14:21:03',
    },
    {
      feature: 'Chấm Rubric AI',
      model: 'deepseek-r1',
      tokens: '3.902 / 1.655',
      latency: '1.298 ms',
      cost: '320 đ',
      time: 'Hôm nay, 14:20:18',
    },
    {
      feature: 'Nghiệp vụ khác / Hệ thống',
      model: 'llama-3.3-70b',
      tokens: '678 / 233',
      latency: '362 ms',
      cost: '110 đ',
      time: 'Hôm nay, 14:18:40',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header (Chuẩn Ảnh 9) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Quản trị AI Gateway &amp; chi phí
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Giám sát lưu lượng AI, hiệu năng mô hình và chi phí theo nghiệp vụ hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => alert('Mở bảng cấu hình khóa API (OpenAI, Gemini, DeepSeek, Anthropic).')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <Key className="w-3.5 h-3.5 text-slate-500" />
            <span>Cấu hình model keys</span>
          </button>
          <button
            onClick={() => fetchData(period)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Period Filter Tabs (Chuẩn Ảnh 9) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl w-fit text-xs font-semibold">
        {(['24h', '7d', '30d', 'all'] as const).map((p) => {
          const label = p === '24h' ? '24 giờ' : p === '7d' ? '7 ngày' : p === '30d' ? '30 ngày' : 'Toàn thời gian';
          return (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                period === p
                  ? 'bg-white dark:bg-[#111114] text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 3. 6 Key Metrics Cards (Chuẩn Ảnh 9) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Tổng lượt gọi AI</span>
            </div>
            <span className="text-blue-600 font-semibold text-[10px]">↗ +6,8%</span>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
            {totalReq.toLocaleString('vi-VN')}
          </div>
          <div className="text-[10px] text-slate-400">So với 24 giờ trước</div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Tỷ lệ lỗi</span>
            </div>
            <span className="text-emerald-600 font-semibold text-[10px]">↘ -0,18%</span>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
            {errorRate}%
          </div>
          <div className="text-[10px] text-slate-400">So với 24 giờ trước</div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>Tổng token tiêu thụ</span>
            </div>
            <span className="text-blue-600 font-semibold text-[10px]">↗ +7,1%</span>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
            {totalTokensDisplay}
          </div>
          <div className="text-[10px] text-slate-400">So với 24 giờ trước</div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Độ trễ trung bình</span>
            </div>
            <span className="text-emerald-600 font-semibold text-[10px]">↘ -8,9%</span>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
            {avgLatency} ms
          </div>
          <div className="text-[10px] text-slate-400">So với 24 giờ trước</div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>P95 latency</span>
            </div>
            <span className="text-emerald-600 font-semibold text-[10px]">↘ -11,2%</span>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
            {p95Latency.toLocaleString('vi-VN')} ms
          </div>
          <div className="text-[10px] text-slate-400">So với 24 giờ trước</div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Chi phí AI thực tế</span>
            </div>
            <span className="text-blue-600 font-semibold text-[10px]">↗ +4,6%</span>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
            {totalCostDisplay}
          </div>
          <div className="text-[10px] text-slate-400">So với 24 giờ trước</div>
        </div>
      </div>

      {/* 4. Middle Grid: Phân bổ theo mô hình & Phân bổ theo nghiệp vụ (Chuẩn Ảnh 9) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Phân bổ theo mô hình */}
        <div className="lg:col-span-6 bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Phân bổ theo mô hình
            </h3>
            <p className="text-[11px] text-slate-400">
              Tỷ lệ lượt gọi, token và chi phí theo từng mô hình AI.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 text-[11px] font-medium">
                  <th className="py-2.5 pr-2">Mô hình</th>
                  <th className="py-2.5 px-2">Lượt gọi</th>
                  <th className="py-2.5 px-2">Tỷ lệ</th>
                  <th className="py-2.5 pl-2 text-right">Chi phí (triệu đ)</th>
                </tr>
              </thead>
              <tbody className="">
                {defaultModelsList.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40">
                    <td className="py-2.5 pr-2 font-mono font-medium text-neutral-800 dark:text-zinc-200">
                      {m.name}
                    </td>
                    <td className="py-2.5 px-2 tabular-nums text-slate-600 dark:text-zinc-300">
                      {m.calls}
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums text-slate-500 w-10 text-[11px]">{m.percent}%</span>
                        <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${m.percent}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pl-2 text-right font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                      {m.cost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Phân bổ theo nghiệp vụ */}
        <div className="lg:col-span-6 bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Phân bổ theo nghiệp vụ
            </h3>
            <p className="text-[11px] text-slate-400">
              Tỷ trọng sử dụng AI theo các nghiệp vụ hệ thống.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            {/* Donut graphic */}
            <div className="w-28 h-28 rounded-full flex flex-col items-center justify-center shrink-0">
              <span className="text-base font-bold text-neutral-900 dark:text-white tabular-nums">284.720</span>
              <span className="text-[10px] text-slate-400">lượt gọi</span>
            </div>

            {/* List */}
            <div className="flex-1 w-full space-y-2 text-xs">
              {defaultFeaturesList.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-slate-600 dark:text-zinc-300 truncate max-w-[140px]">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] tabular-nums">
                    <span className="text-slate-400">{f.calls} ({f.percent}%)</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{f.cost} tr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Provider & Routing + Quota Controls (Chuẩn Ảnh 11) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Provider card */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Provider &amp; điều phối
            </h3>
            <span className="text-[10px] text-slate-400">Ưu tiên &amp; tình trạng</span>
          </div>
          <div className="space-y-2 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 flex items-center justify-between border border-slate-100 dark:border-zinc-800">
              <span className="font-semibold text-neutral-800 dark:text-zinc-200">Google Gemini</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">● Đang hoạt động</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 flex items-center justify-between border border-slate-100 dark:border-zinc-800">
              <span className="font-semibold text-neutral-800 dark:text-zinc-200">DeepSeek AI</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">● Đang hoạt động</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 flex items-center justify-between border border-slate-100 dark:border-zinc-800">
              <span className="font-semibold text-neutral-800 dark:text-zinc-200">OpenAI</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">Dự phòng</span>
            </div>
          </div>
        </div>

        {/* Model assignment card */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            Phân bổ mô hình theo nghiệp vụ
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-zinc-400">Chấm Rubric AI</span>
              <span className="font-mono font-semibold text-blue-600">deepseek-r1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-zinc-400">Gợi ý phản hồi</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-zinc-300">gemini-2.0-flash</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-zinc-400">Sinh câu hỏi</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-zinc-300">gemini-2.5-flash</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-zinc-400">Phân tích năng lực</span>
              <span className="font-mono font-semibold text-blue-600">gemini-2.5-pro</span>
            </div>
          </div>
        </div>

        {/* Budget control */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Kiểm soát chi phí &amp; hạn mức
            </h3>
            <span className="text-[10px] text-slate-400">Ngân sách tháng</span>
          </div>
          <div>
            <div className="flex items-baseline justify-between text-xs mb-1.5">
              <span className="font-bold text-neutral-900 dark:text-neutral-100 text-base tabular-nums">200,00 USD</span>
              <span className="text-slate-500 text-[11px]">Đã dùng: 122,84 USD (61,4%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '61.4%' }} />
            </div>
          </div>
          <div className="pt-2 text-[11px] text-slate-500">
            Ngưỡng cảnh báo: <strong className="text-neutral-800 dark:text-neutral-200">80% (160,00 USD)</strong>
          </div>
        </div>
      </div>

      {/* 6. Request Logs Table (Chuẩn Ảnh 9) */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Nhật ký yêu cầu (Logs AI Gateway)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chi tiết các lượt gọi AI qua gateway, hỗ trợ tra cứu và đối soát chi phí.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              placeholder="Tìm theo nghiệp vụ, model, request id..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 font-medium">
                <th className="py-2.5 pr-4">Nghiệp vụ</th>
                <th className="py-2.5 px-4">Mô hình</th>
                <th className="py-2.5 px-4">Prompt / Completion (token)</th>
                <th className="py-2.5 px-4">Độ trễ</th>
                <th className="py-2.5 px-4">Chi phí</th>
                <th className="py-2.5 pl-4 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="">
              {sampleLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40">
                  <td className="py-3 pr-4 font-semibold text-neutral-900 dark:text-neutral-100">
                    {log.feature}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-zinc-300">
                    {log.model}
                  </td>
                  <td className="py-3 px-4 tabular-nums text-slate-600 dark:text-zinc-400 font-mono">
                    {log.tokens}
                  </td>
                  <td className="py-3 px-4 tabular-nums text-slate-600 dark:text-zinc-400 font-mono">
                    {log.latency}
                  </td>
                  <td className="py-3 px-4 tabular-nums font-semibold text-neutral-800 dark:text-zinc-200">
                    {log.cost}
                  </td>
                  <td className="py-3 pl-4 text-right text-slate-500 whitespace-nowrap">
                    {log.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3 flex items-center justify-between text-xs text-slate-400">
          <div>Hiển thị 1–6 trong 284.720 bản ghi</div>
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
  );
}
