'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Zap,
  Clock,
  DollarSign,
  RefreshCw,
  Settings,
  Layers,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

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
  const [period, setPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [sampleSize, setSampleSize] = useState<number>(0);

  const fetchData = async (selectedPeriod = period) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/ai-gateway?period=${selectedPeriod}`);
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setEvents(data.recentEvents || []);
        setSampleSize(data.sampleSize || data.stats.totalRequests || 0);
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

  const handlePeriodChange = (newPeriod: '24h' | '7d' | '30d' | 'all') => {
    setPeriod(newPeriod);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              AI INFRASTRUCTURE &amp; COST ACCOUNTING
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản trị AI Gateway &amp; Hạch toán Chi phí
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát lưu lượng đa mô hình, định mức tiêu thụ Token thực tế, độ trễ phản hồi và chi phí vận hành thương mại.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchData(period)}
            disabled={loading}
            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <Link
            href="/admin/settings?tab=ai"
            className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cấu hình Model Keys</span>
          </Link>
        </div>
      </div>

      {/* 2. Period Filter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white border border-slate-200 rounded-md text-xs">
        <div className="flex items-center gap-1.5 font-mono text-slate-600">
          <span className="text-[11px] font-semibold text-slate-500">KỲ THỐNG KÊ:</span>
          <span className="text-[11px] text-slate-400">
            (Mẫu: {sampleSize} sự kiện)
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(
            [
              { id: '24h', label: '24 giờ' },
              { id: '7d', label: '7 ngày qua' },
              { id: '30d', label: '30 ngày qua' },
              { id: 'all', label: 'Toàn thời gian' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => handlePeriodChange(item.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                period === item.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Key Metrics Strip (MOD-05) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-200">
        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Tổng lượt gọi AI</span>
            <Cpu className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {stats?.totalRequests || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono truncate">
            {stats?.errorCount ? `${stats.errorCount} lỗi ghi nhận` : 'Hoạt động ổn định'}
          </div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Tỷ lệ lỗi (Error Rate)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {stats?.errorRatePercent !== undefined ? `${stats.errorRatePercent}%` : '0%'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Mục tiêu &lt; 1.0%
          </div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Tổng Token tiêu thụ</span>
            <Zap className="w-3.5 h-3.5 text-blue-600" strokeWidth={1.75} />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums truncate">
            {(stats?.totalTokens || 0).toLocaleString('vi-VN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono truncate">
            {(stats?.totalPromptTokens || 0).toLocaleString('vi-VN')} In / {(stats?.totalCompletionTokens || 0).toLocaleString('vi-VN')} Out
          </div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Độ trễ trung bình</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {stats?.avgLatencyMs || 0}
            <span className="text-xs font-normal text-slate-400 ml-1">ms</span>
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-mono">
            Target SLA &lt; 2500ms
          </div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Độ trễ P95 (Peak)</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.75} />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {stats?.p95LatencyMs || stats?.avgLatencyMs || 0}
            <span className="text-xs font-normal text-slate-400 ml-1">ms</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Phân vị 95%
          </div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Chi phí AI thực tế</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums truncate">
            {(stats?.totalCostVnd || 0).toLocaleString('vi-VN')}
            <span className="text-xs font-normal text-slate-400 ml-1">đ</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono truncate">
            ${stats?.totalCostUsd || '0.000'} USD quy đổi
          </div>
        </div>
      </div>

      {/* 4. Models & Features Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model Distribution */}
        <div className="p-4 rounded-md border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              PHÂN BỔ THEO MÔ HÌNH (MODELS)
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              AIProviderAdapter
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {stats && Object.keys(stats.models).length > 0 ? (
              Object.entries(stats.models).map(([model, count]) => {
                const pct = stats.totalRequests > 0 ? Math.round((count / stats.totalRequests) * 100) : 0;
                return (
                  <div key={model} className="p-2.5 rounded bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-semibold text-slate-900">{model}</div>
                      <div className="text-[10px] text-slate-400">Google Gemini API chính thức</div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <span className="font-bold text-slate-900">{count} lượt</span>
                      <span className="text-slate-400 text-[10px] ml-1.5">({pct}%)</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 bg-slate-50 rounded border border-slate-200/80 text-slate-500">
                gemini-3.5-flash &bull; 100% lưu lượng mặc định
              </div>
            )}
          </div>
        </div>

        {/* Feature Distribution */}
        <div className="p-4 rounded-md border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              PHÂN BỔ THEO NGHIỆP VỤ (FEATURES)
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              On-demand Triggers
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {stats && Object.keys(stats.features).length > 0 ? (
              Object.entries(stats.features).map(([feat, count]) => {
                const pct = stats.totalRequests > 0 ? Math.round((count / stats.totalRequests) * 100) : 0;
                const label =
                  feat === 'RUBRIC_GRADING' || feat === 'grade-submission'
                    ? 'Chấm Rubric thực hành tự động'
                    : feat === 'COMPETENCY_ANALYSIS' || feat === 'analyze-competency'
                    ? 'Phân tích năng lực & Đề xuất lộ trình'
                    : feat === 'TUTOR_CHAT' || feat === 'tutor-chat'
                    ? 'Trợ lý gia sư AI DigComp'
                    : feat;

                return (
                  <div key={feat} className="p-2.5 rounded bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{label}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{feat}</div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <span className="font-bold text-slate-900">{count} lượt</span>
                      <span className="text-slate-400 text-[10px] ml-1.5">({pct}%)</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 bg-slate-50 rounded border border-slate-200/80 text-slate-500">
                Chưa có dữ liệu phân bổ nghiệp vụ trong kỳ được chọn.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Recent Event Logs Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              NHẬT KÝ SỰ KIỆN GỌI AI GẦN ĐÂY (AI USAGE LOGS)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            25 sự kiện mới nhất
          </span>
        </div>

        <div className="border border-slate-200 rounded-md overflow-hidden bg-white text-xs shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[11px] font-semibold font-mono">
                  <th className="py-2.5 px-3.5">NGHIỆP VỤ</th>
                  <th className="py-2.5 px-3.5">MÔ HÌNH</th>
                  <th className="py-2.5 px-3.5 text-center">PROMPT / COMPLETION</th>
                  <th className="py-2.5 px-3.5 text-center">ĐỘ TRỄ</th>
                  <th className="py-2.5 px-3.5 text-right">CHI PHÍ</th>
                  <th className="py-2.5 px-3.5 text-right">THỜI GIAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Chưa ghi nhận sự kiện gọi AI nào trong kỳ được chọn.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3.5">
                        <span className="font-semibold text-slate-900 font-mono">
                          {ev.feature}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-600">
                        {ev.model}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono tabular-nums text-slate-700">
                        {ev.prompt_tokens} / {ev.completion_tokens}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono tabular-nums text-slate-700">
                        {ev.latency_ms}ms
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                        ${Number(ev.cost_estimated || 0).toFixed(4)}
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
      </div>
    </div>
  );
}
