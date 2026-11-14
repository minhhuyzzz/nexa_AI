'use client';

import { useState, useEffect, useMemo } from 'react';
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
  X,
  ExternalLink,
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
  status?: string;
}

interface AiGatewayConfig {
  provider: string;
  defaultModel: string;
  endpointUrl?: string;
  maskedApiKey: string;
  costBudgetMonthlyUsd?: number;
  monthlyBudgetUsd?: number;
  flows?: Record<string, any>;
  updatedAt?: string;
}

const FEATURE_LABELS: Record<string, string> = {
  RUBRIC_GRADING: 'Chấm Rubric và đánh giá minh chứng',
  COMPETENCY_ANALYSIS: 'Phân tích hồ sơ năng lực số và lộ trình',
  AUTHORING_ASSIST: 'Trợ lý soạn đề khảo thí',
  SIMILAR_QUESTION: 'Tạo câu hỏi tương tự',
  EXPLAIN_OPTIONS: 'Giải thích đáp án',
  GENERATE_BY_DOMAIN: 'Sinh câu hỏi theo miền năng lực',
  HEALTH_CHECK: 'Kiểm tra sức khỏe cổng AI',
  OTHER: 'Nghiệp vụ khác / Hệ thống',
};

export default function AdminAiGatewayPage() {
  const [stats, setStats] = useState<AiGatewayStats | null>(null);
  const [events, setEvents] = useState<AiEventLog[]>([]);
  const [config, setConfig] = useState<AiGatewayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [flow, setFlow] = useState<'all' | 'personal' | 'org'>('all');
  const [searchLog, setSearchLog] = useState('');

  // Modal configuration
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string>('GOOGLE_GEMINI');
  const [editingApiKey, setEditingApiKey] = useState('');
  const [editingModel, setEditingModel] = useState('gemini-2.5-flash');
  const [editingEndpointUrl, setEditingEndpointUrl] = useState('');
  const [editingBudget, setEditingBudget] = useState(200);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState('');

  const fetchData = async (selectedPeriod = period, selectedFlow = flow) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/ai-gateway?period=${selectedPeriod}&flow=${selectedFlow}`);
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setEvents(data.recentEvents || []);
      }
      if (data.config) {
        setConfig(data.config);
        setEditingProvider(data.config.provider || 'GOOGLE_GEMINI');
        setEditingModel(data.config.defaultModel || 'gemini-2.5-flash');
        setEditingEndpointUrl(data.config.endpointUrl || '');
        setEditingBudget(data.config.costBudgetMonthlyUsd ?? data.config.monthlyBudgetUsd ?? 200);
      }
    } catch (e) {
      console.error('Failed to load AI gateway stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period, flow);
  }, [period, flow]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigSuccessMsg('');
    try {
      const payload: Record<string, any> = {
        provider: editingProvider,
        defaultModel: editingModel,
        costBudgetMonthlyUsd: Number(editingBudget),
      };
      if (editingApiKey.trim()) {
        payload.apiKey = editingApiKey.trim();
      }
      if (editingProvider === 'ON_PREMISE' || editingEndpointUrl.trim()) {
        payload.endpointUrl = editingEndpointUrl.trim();
      }
      const res = await fetch('/api/admin/ai-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        setConfigSuccessMsg('Đã lưu cấu hình AI Gateway thành công vào cơ sở dữ liệu');
        setEditingApiKey('');
        setTimeout(() => {
          setIsConfigModalOpen(false);
          setConfigSuccessMsg('');
        }, 1200);
        fetchData(period, flow);
      } else {
        alert(result.error || 'Lỗi khi lưu cấu hình');
      }
    } catch (err) {
      console.error('Save config error', err);
      alert('Không thể kết nối đến máy chủ lưu cấu hình');
    } finally {
      setSavingConfig(false);
    }
  };

  // Real KPI metrics from Database
  const totalReq = stats?.totalRequests ?? 0;
  const errorRate = stats?.errorRatePercent ? stats.errorRatePercent.toFixed(2) : '0,00';
  const totalTokens = stats?.totalTokens ?? 0;
  const totalTokensDisplay =
    totalTokens >= 1_000_000
      ? (totalTokens / 1_000_000).toFixed(2) + 'M'
      : totalTokens >= 1_000
      ? (totalTokens / 1_000).toFixed(1) + 'k'
      : totalTokens.toLocaleString('vi-VN');
  const avgLatency = stats?.avgLatencyMs ?? 0;
  const p95Latency = stats?.p95LatencyMs ?? 0;
  const totalCostUsd = stats?.totalCostUsd ?? 0;
  const totalCostVnd = stats?.totalCostVnd ?? 0;
  const totalCostDisplay =
    totalCostVnd >= 1_000_000
      ? (totalCostVnd / 1_000_000).toFixed(2) + ' triệu đ'
      : `${totalCostVnd.toLocaleString('vi-VN')} đ`;

  // Real dynamic breakdown of models
  const modelsList = useMemo(() => {
    const raw = stats?.models || {};
    return Object.entries(raw)
      .map(([name, count]) => {
        const percent = totalReq > 0 ? Number(((count / totalReq) * 100).toFixed(1)) : 0;
        return {
          name,
          calls: count.toLocaleString('vi-VN'),
          percent,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [stats?.models, totalReq]);

  // Real dynamic breakdown of features
  const featuresList = useMemo(() => {
    const raw = stats?.features || {};
    return Object.entries(raw)
      .map(([code, count]) => {
        const percent = totalReq > 0 ? Number(((count / totalReq) * 100).toFixed(1)) : 0;
        return {
          name: FEATURE_LABELS[code] || code,
          calls: count.toLocaleString('vi-VN'),
          percent,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [stats?.features, totalReq]);

  // Filter logs by search term
  const filteredEvents = useMemo(() => {
    if (!searchLog.trim()) return events;
    const term = searchLog.toLowerCase();
    return events.filter((ev) => {
      const featLabel = (FEATURE_LABELS[ev.feature] || ev.feature).toLowerCase();
      return (
        featLabel.includes(term) ||
        ev.model?.toLowerCase().includes(term) ||
        ev.id?.toLowerCase().includes(term)
      );
    });
  }, [events, searchLog]);

  // Budget calculations (real usage vs monthly quota)
  const monthlyBudgetUsd = config?.costBudgetMonthlyUsd ?? config?.monthlyBudgetUsd ?? 200.0;
  const budgetUsedPercent = Math.min(
    100,
    Number(((totalCostUsd / monthlyBudgetUsd) * 100).toFixed(1))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Quản trị Cổng AI Gateway và Chi phí
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-md">
              Dữ liệu thực tế 100%
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Giám sát lưu lượng AI, chi phí USD/VND theo lượt gọi thực tế từ cơ sở dữ liệu telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <Key className="w-3.5 h-3.5 text-slate-500" />
            <span>Cấu hình Model và Khóa API</span>
          </button>
          <button
            onClick={() => fetchData(period, flow)}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Controls: Flow Isolation Pills & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Flow Selector Pills: Tất cả luồng | Cá nhân | Tổ chức */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl w-fit text-xs font-semibold">
          <button
            onClick={() => setFlow('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
              flow === 'all'
                ? 'bg-white dark:bg-[#111114] text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Tất cả luồng</span>
          </button>
          <button
            onClick={() => setFlow('personal')}
            className={`px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
              flow === 'personal'
                ? 'bg-white dark:bg-[#111114] text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Cá nhân</span>
          </button>
          <button
            onClick={() => setFlow('org')}
            className={`px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
              flow === 'org'
                ? 'bg-white dark:bg-[#111114] text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Tổ chức</span>
          </button>
        </div>

        {/* Period Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl w-fit text-xs font-semibold">
          {(['24h', '7d', '30d', 'all'] as const).map((p) => {
            const label =
              p === '24h'
                ? '24 giờ qua'
                : p === '7d'
                ? '7 ngày qua'
                : p === '30d'
                ? '30 ngày qua'
                : 'Toàn thời gian';
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  period === p
                    ? 'bg-white dark:bg-[#111114] text-blue-600 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 6 Key Metrics Cards (Real telemetry) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Tổng lượt gọi AI</span>
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
            {loading ? '...' : totalReq.toLocaleString('vi-VN')}
          </div>
          <div className="text-[10px] text-slate-400">Chu kỳ {period}</div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Tỷ lệ lỗi</span>
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
            {loading ? '...' : `${errorRate}%`}
          </div>
          <div className="text-[10px] text-slate-400">Lỗi mạng/API</div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>Token tiêu thụ</span>
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
            {loading ? '...' : totalTokensDisplay}
          </div>
          <div className="text-[10px] text-slate-400">Prompt + Output</div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Độ trễ trung bình</span>
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
            {loading ? '...' : `${avgLatency} ms`}
          </div>
          <div className="text-[10px] text-slate-400">Thời gian phản hồi</div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>P95 latency</span>
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
            {loading ? '...' : `${p95Latency.toLocaleString('vi-VN')} ms`}
          </div>
          <div className="text-[10px] text-slate-400">95% cuộc gọi dưới ngưỡng</div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Chi phí AI thực tế</span>
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
            {loading ? '...' : totalCostDisplay}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            ~${totalCostUsd.toFixed(4)} USD
          </div>
        </div>
      </div>

      {/* 4. Middle Grid: Phân bổ theo mô hình & Phân bổ theo nghiệp vụ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Phân bổ theo mô hình */}
        <div className="lg:col-span-6 bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Phân bổ theo mô hình
            </h3>
            <p className="text-[11px] text-slate-400">
              Tỷ lệ lượt gọi và thống kê thực tế theo từng mô hình AI trong hệ thống.
            </p>
          </div>

          {modelsList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Chưa có dữ liệu gọi mô hình AI trong chu kỳ này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 text-[11px] font-medium">
                    <th className="py-2.5 pr-2">Mô hình</th>
                    <th className="py-2.5 px-2">Lượt gọi</th>
                    <th className="py-2.5 pl-2 text-right">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {modelsList.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40">
                      <td className="py-2.5 pr-2 font-mono font-medium text-neutral-800 dark:text-zinc-200">
                        {m.name}
                      </td>
                      <td className="py-2.5 px-2 tabular-nums text-slate-600 dark:text-zinc-300">
                        {m.calls}
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="tabular-nums text-slate-500 w-10 text-[11px]">{m.percent}%</span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${m.percent}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Phân bổ theo nghiệp vụ */}
        <div className="lg:col-span-6 bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Phân bổ theo nghiệp vụ
            </h3>
            <p className="text-[11px] text-slate-400">
              Tỷ trọng sử dụng AI theo từng tính năng trong nền tảng NEXA.
            </p>
          </div>

          {featuresList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Chưa có dữ liệu nghiệp vụ AI trong chu kỳ này.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              {/* Counter summary */}
              <div className="w-28 h-28 rounded-full border border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center shrink-0">
                <span className="text-base font-bold text-neutral-900 dark:text-white tabular-nums">
                  {totalReq.toLocaleString('vi-VN')}
                </span>
                <span className="text-[10px] text-slate-400">lượt gọi</span>
              </div>

              {/* List */}
              <div className="flex-1 w-full space-y-2 text-xs">
                {featuresList.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      <span className="text-slate-600 dark:text-zinc-300 truncate max-w-[170px]" title={f.name}>
                        {f.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] tabular-nums">
                      <span className="text-slate-400">{f.calls} lượt</span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{f.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Provider & Routing + Quota Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Provider card */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Provider &amp; Kết nối
            </h3>
            <span className="text-[10px] text-slate-400">Kiến trúc 8 lớp</span>
          </div>
          <div className="space-y-2 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 flex items-center justify-between border border-slate-100 dark:border-zinc-800">
              <div>
                <div className="font-semibold text-neutral-800 dark:text-zinc-200">Google Gemini</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {config?.defaultModel || 'gemini-2.5-flash'}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                ● Đang hoạt động
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 flex items-center justify-between border border-slate-100 dark:border-zinc-800">
              <div>
                <div className="font-semibold text-neutral-800 dark:text-zinc-200">Khóa API kết nối</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {config?.maskedApiKey || 'Đã cấu hình qua môi trường'}
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                Đổi khóa
              </button>
            </div>
          </div>
        </div>

        {/* Model assignment card */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
            Mô hình theo luồng nghiệp vụ
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-zinc-400">Chấm Rubric &amp; Minh chứng</span>
              <span className="font-mono font-semibold text-blue-600">
                {config?.flows?.rubricGrading?.model || 'gemini-2.5-flash'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-zinc-400">Phân tích Năng lực 5 Miền</span>
              <span className="font-mono font-semibold text-blue-600">
                {config?.flows?.competencyAnalysis?.model || 'gemini-2.5-flash'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-zinc-400">Trợ lý Soạn Đề AI</span>
              <span className="font-mono font-semibold text-blue-600">
                {config?.defaultModel || 'gemini-2.5-flash'}
              </span>
            </div>
          </div>
        </div>

        {/* Budget control */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Kiểm soát Chi phí &amp; Hạn mức
            </h3>
            <span className="text-[10px] text-slate-400">Ngân sách định mức</span>
          </div>
          <div>
            <div className="flex items-baseline justify-between text-xs mb-1.5">
              <span className="font-bold text-neutral-900 dark:text-neutral-100 text-base tabular-nums">
                ${monthlyBudgetUsd.toFixed(2)} USD
              </span>
              <span className="text-slate-500 text-[11px]">
                Đã dùng: ${totalCostUsd.toFixed(2)} USD ({budgetUsedPercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${budgetUsedPercent}%` }}
              />
            </div>
          </div>
          <div className="pt-2 text-[11px] text-slate-500">
            Tương đương: <strong className="text-neutral-800 dark:text-neutral-200">{totalCostDisplay}</strong> trên dữ liệu đo lường.
          </div>
        </div>
      </div>

      {/* 6. Request Logs Table */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Nhật ký Yêu cầu AI (Telemetry Logs)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chi tiết các lượt gọi AI thực tế được ghi nhận vào bảng <code className="text-blue-600 font-mono">ai_usage_events</code>.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              placeholder="Tìm theo nghiệp vụ, mô hình, ID..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white w-64 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 font-medium">
                <th className="py-2.5 pr-4">Nghiệp vụ</th>
                <th className="py-2.5 px-3">Luồng</th>
                <th className="py-2.5 px-4">Mô hình</th>
                <th className="py-2.5 px-4">Prompt / Completion</th>
                <th className="py-2.5 px-4">Độ trễ</th>
                <th className="py-2.5 px-4">Chi phí ước tính</th>
                <th className="py-2.5 pl-4 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    {searchLog
                      ? 'Không tìm thấy nhật ký yêu cầu nào phù hợp với từ khóa.'
                      : 'Chưa có nhật ký yêu cầu AI nào được ghi nhận trong chu kỳ này.'}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((log) => {
                  const costVnd = Math.round((log.cost_estimated || 0) * 25400);
                  const isFailed = log.status === 'FAILED';
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="py-3 pr-4 font-semibold text-neutral-900 dark:text-neutral-100">
                        <div className="flex items-center gap-1.5">
                          {isFailed && (
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Yêu cầu thất bại" />
                          )}
                          <span>{FEATURE_LABELS[log.feature] || log.feature}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            (log as any).organization_id || (log as any).flow === 'org'
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          }`}
                        >
                          {(log as any).organization_id || (log as any).flow === 'org' ? 'Tổ chức' : 'Cá nhân'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-zinc-300">
                        {log.model}
                      </td>
                      <td className="py-3 px-4 tabular-nums text-slate-600 dark:text-zinc-400 font-mono">
                        {(log.prompt_tokens || 0).toLocaleString('vi-VN')} /{' '}
                        {(log.completion_tokens || 0).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 tabular-nums text-slate-600 dark:text-zinc-400 font-mono">
                        {log.latency_ms} ms
                      </td>
                      <td className="py-3 px-4 tabular-nums font-semibold text-neutral-800 dark:text-zinc-200">
                        {costVnd > 0 ? `${costVnd.toLocaleString('vi-VN')} đ` : '< 1 đ'}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          (${Number(log.cost_estimated || 0).toFixed(5)})
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-right text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-3 flex items-center justify-between text-xs text-slate-400">
          <div>
            Hiển thị {filteredEvents.length} trong tổng số {events.length} sự kiện gần nhất (chu kỳ {period})
          </div>
        </div>
      </div>

      {/* 7. Modal Cấu hình Model Keys */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Cấu hình AI Gateway và Khóa API
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Cập nhật khóa API, nhà cung cấp và mô hình AI định tuyến cho toàn nền tảng.
                </p>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {configSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{configSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-zinc-300 mb-1.5">
                  Nhà cung cấp (Provider)
                </label>
                <select
                  value={editingProvider}
                  onChange={(e) => {
                    const nextP = e.target.value;
                    setEditingProvider(nextP);
                    if (nextP === 'GOOGLE_GEMINI') setEditingModel('gemini-2.5-flash');
                    else if (nextP === 'OPENAI') setEditingModel('gpt-4o');
                    else if (nextP === 'ANTHROPIC_CLAUDE') setEditingModel('claude-3-5-sonnet-latest');
                    else if (nextP === 'ON_PREMISE') setEditingModel('deepseek-v3');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                >
                  <option value="GOOGLE_GEMINI">Google Gemini (Khuyến nghị - Hỗ trợ đầy đủ)</option>
                  <option value="OPENAI">OpenAI (GPT-4o, o3-mini)</option>
                  <option value="ANTHROPIC_CLAUDE">Anthropic Claude (Claude 3.5 Sonnet)</option>
                  <option value="ON_PREMISE">Mô hình mở On-Premise (Llama 3 / DeepSeek v3 qua vLLM)</option>
                </select>
              </div>

              {editingProvider === 'ON_PREMISE' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-zinc-300 mb-1.5">
                    Địa chỉ máy chủ On-Premise (Endpoint URL)
                  </label>
                  <input
                    type="url"
                    value={editingEndpointUrl}
                    onChange={(e) => setEditingEndpointUrl(e.target.value)}
                    placeholder="http://vllm-service.internal:8000/v1"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hỗ trợ giao thức OpenAI-compatible của vLLM, Ollama hoặc TGI nội bộ.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-zinc-300 mb-1.5">
                  Mô hình mặc định (Default Model)
                </label>
                {editingProvider === 'GOOGLE_GEMINI' ? (
                  <select
                    value={editingModel}
                    onChange={(e) => setEditingModel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Cân bằng tốc độ và chi phí tối ưu)</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro (Phân tích chuyên sâu hồ sơ năng lực)</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash (Độ trễ thấp, sinh câu hỏi nhanh)</option>
                  </select>
                ) : editingProvider === 'OPENAI' ? (
                  <select
                    value={editingModel}
                    onChange={(e) => setEditingModel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="gpt-4o">gpt-4o (Hiệu năng cao, đa phương thức)</option>
                    <option value="gpt-4o-mini">gpt-4o-mini (Tiết kiệm chi phí, phản hồi nhanh)</option>
                    <option value="o3-mini">o3-mini (Suy luận chuyên sâu và thẩm định logic)</option>
                  </select>
                ) : editingProvider === 'ANTHROPIC_CLAUDE' ? (
                  <select
                    value={editingModel}
                    onChange={(e) => setEditingModel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="claude-3-5-sonnet-latest">claude-3-5-sonnet (Chấm Rubric tự luận chuẩn xác)</option>
                    <option value="claude-3-5-haiku-latest">claude-3-5-haiku (Độ trễ thấp, xử lý tức thời)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={editingModel}
                    onChange={(e) => setEditingModel(e.target.value)}
                    placeholder="deepseek-ai/DeepSeek-V3 hoặc meta-llama/Llama-3.3-70B-Instruct"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-zinc-300 mb-1.5">
                  {editingProvider === 'ON_PREMISE'
                    ? 'Khóa API xác thực nội bộ (Tùy chọn)'
                    : `Khóa API (${editingProvider})`}
                </label>
                <input
                  type="password"
                  value={editingApiKey}
                  onChange={(e) => setEditingApiKey(e.target.value)}
                  placeholder={config?.maskedApiKey || 'Nhập khóa API mới để ghi đè...'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Khóa hiện tại: <span className="font-mono">{config?.maskedApiKey || 'Chưa lưu trong DB (đang dùng biến môi trường)'}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-zinc-300 mb-1.5">
                  Ngân sách định mức tháng (USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    step="10"
                    value={editingBudget}
                    onChange={(e) => setEditingBudget(Number(e.target.value))}
                    placeholder="200"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    USD / tháng
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Định mức chi phí dùng để tính toán thanh tiến độ và cảnh báo hạn mức nền tảng.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {savingConfig && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Lưu cấu hình</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
