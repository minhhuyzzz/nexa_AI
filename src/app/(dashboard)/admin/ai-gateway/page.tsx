'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import {
  Sparkles,
  RefreshCw,
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Search,
  Database,
  Layers,
  Save,
  Key,
  ShieldCheck,
  Check,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
  Activity,
  Sliders,
  CreditCard,
  Scale,
  BarChart3,
  ExternalLink,
  Clock,
  Coins,
  ArrowUpRight,
  TrendingDown,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertCircle
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
  totalCostUsd?: number;
  totalCostVnd?: number;
  models?: Record<string, number>;
  features?: Record<string, number>;
}

interface AiEventLog {
  id: string;
  feature: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  status?: string;
  cost_estimated?: number;
  created_at: string;
  flow?: 'org' | 'personal';
}

interface AiGatewayConfig {
  provider: 'GOOGLE_GEMINI' | 'ANTHROPIC_CLAUDE' | 'OPENAI' | 'DEEPSEEK' | 'ON_PREMISE' | 'OPENROUTER';
  defaultModel: string;
  endpointUrl?: string;
  maskedApiKey?: string;
  hasCustomApiKey?: boolean;
  costBudgetMonthlyUsd?: number;
  monthlyBudgetUsd?: number;
  flows?: Record<string, any>;
  updatedAt?: string;
}

interface CalibrationSummary {
  totalLogs: number;
  meanScoreDelta: number;
  exactMatchCount: number;
  highAgreementCount: number;
  divergentCount: number;
  recentLogs: Array<{
    id: string;
    evaluation_id?: string;
    submission_id: string;
    org_id?: string;
    assessor_id: string;
    ai_score: number;
    human_score: number;
    score_delta: number;
    task_type: string;
    created_at: string;
  }>;
}

interface TaskPolicy {
  task_type: string;
  is_enabled: boolean;
  supported_provider: string;
  model_name: string;
  price_credits: number;
  timeout_ms: number;
  max_retries?: number;
  require_human_review: boolean;
  description?: string;
}

interface CreditUsageSummary {
  totalReservations: number;
  totalSettled: number;
  totalReleased: number;
  totalFlagged: number;
}

const PROVIDER_OPTIONS = [
  { id: 'GOOGLE_GEMINI', name: 'Google Gemini', defaultModel: 'gemini-2.5-flash', defaultEndpoint: '', hint: 'Tốc độ cao, chi phí tối ưu' },
  { id: 'OPENROUTER', name: 'OpenRouter (Router đa mô hình)', defaultModel: 'deepseek/deepseek-chat', defaultEndpoint: 'https://openrouter.ai/api/v1', hint: 'Định tuyến mọi model: Gemini, GPT, Claude, DeepSeek' },
  { id: 'OPENAI', name: 'OpenAI (ChatGPT / Router tương thích)', defaultModel: 'gpt-4o-mini', defaultEndpoint: 'https://api.openai.com/v1', hint: 'gpt-4o, gpt-4o-mini hoặc router chuẩn OpenAI' },
  { id: 'DEEPSEEK', name: 'DeepSeek', defaultModel: 'deepseek-chat', defaultEndpoint: 'https://api.deepseek.com', hint: 'deepseek-chat, deepseek-reasoner' },
  { id: 'ANTHROPIC_CLAUDE', name: 'Anthropic Claude', defaultModel: 'claude-3-5-sonnet', defaultEndpoint: 'https://api.anthropic.com/v1', hint: 'claude-3-5-sonnet, claude-3-5-haiku' },
];

const FEATURE_LABELS: Record<string, string> = {
  RUBRIC_GRADING: 'Chấm Rubric & Minh chứng',
  COMPETENCY_ANALYSIS: 'Phân tích Năng lực 5 Miền',
  AUTHORING_ASSIST: 'Trợ lý Soạn Đề',
  SIMILAR_QUESTION: 'Tạo Câu Hỏi Tương Tự',
  EXPLAIN_OPTIONS: 'Giải Thích Đáp Án',
  EXPLAIN_QUESTION: 'Giải Thích Sư Phạm (Personal)',
  GENERATE_BY_DOMAIN: 'Sinh Câu Hỏi Theo Miền',
  ORG_INSIGHT: 'Chiến Lược Tổ Chức',
  HEALTH_CHECK: 'Kiểm Tra Sức Khỏe',
  OTHER: 'Hệ thống / Nghiệp vụ khác',
};

type TabKey = 'overview' | 'model-routing' | 'credit-policies' | 'hitl-calibration' | 'tokens-cost';

function AdminAiGatewayContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [stats, setStats] = useState<AiGatewayStats | null>(null);
  const [events, setEvents] = useState<AiEventLog[]>([]);
  const [config, setConfig] = useState<AiGatewayConfig | null>(null);
  const [calibrationSummary, setCalibrationSummary] = useState<CalibrationSummary | null>(null);
  const [taskPolicies, setTaskPolicies] = useState<TaskPolicy[]>([]);
  const [creditSummary, setCreditSummary] = useState<CreditUsageSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [period, setPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [flow, setFlow] = useState<'all' | 'personal' | 'org'>('all');
  const [searchLog, setSearchLog] = useState('');

  // Dropdown states
  const [isFlowDropdownOpen, setIsFlowDropdownOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Configuration Form State (Unified Model/Provider Setup)
  const [provider, setProvider] = useState<'GOOGLE_GEMINI' | 'ANTHROPIC_CLAUDE' | 'OPENAI' | 'DEEPSEEK' | 'ON_PREMISE' | 'OPENROUTER'>('GOOGLE_GEMINI');
  const [modelName, setModelName] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [budgetUsd, setBudgetUsd] = useState<number>(200);
  const [customApiKey, setCustomApiKey] = useState('');
  const [hasServerKey, setHasServerKey] = useState(true);

  const fetchData = async (selectedPeriod = period, selectedFlow = flow) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/ai-gateway?period=${selectedPeriod}&flow=${selectedFlow}`);
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.recentEvents) {
        setEvents(data.recentEvents);
      }
      if (data.config) {
        setConfig(data.config);
        if (data.config.provider) setProvider(data.config.provider);
        if (data.config.defaultModel) setModelName(data.config.defaultModel);
        if (typeof data.config.endpointUrl === 'string') setEndpointUrl(data.config.endpointUrl);
        if (typeof data.config.costBudgetMonthlyUsd === 'number') {
          setBudgetUsd(data.config.costBudgetMonthlyUsd);
        } else if (typeof data.config.monthlyBudgetUsd === 'number') {
          setBudgetUsd(data.config.monthlyBudgetUsd);
        }
        setHasServerKey(Boolean(data.config.maskedApiKey || !data.config.hasCustomApiKey));
      }
      if (data.calibrationSummary) {
        setCalibrationSummary(data.calibrationSummary);
      }
      if (data.taskPolicies) {
        setTaskPolicies(data.taskPolicies);
      }
      if (data.creditUsageSummary) {
        setCreditSummary(data.creditUsageSummary);
      }
    } catch (err) {
      console.error('Failed to load AI gateway data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period, flow);
  }, [period, flow]);

  useEffect(() => {
    setIsFlowDropdownOpen(false);
  }, [flow]);

  const monthlyBudgetUsd = config?.costBudgetMonthlyUsd ?? config?.monthlyBudgetUsd ?? 200.0;

  const handleProviderChange = (newProvider: 'GOOGLE_GEMINI' | 'ANTHROPIC_CLAUDE' | 'OPENAI' | 'DEEPSEEK' | 'ON_PREMISE' | 'OPENROUTER') => {
    setProvider(newProvider);
    const matched = PROVIDER_OPTIONS.find((p) => p.id === newProvider);
    if (matched) {
      setModelName(matched.defaultModel);
      if (newProvider === 'OPENROUTER') {
        setEndpointUrl(matched.defaultEndpoint || 'https://openrouter.ai/api/v1');
      } else if (newProvider === 'GOOGLE_GEMINI') {
        setEndpointUrl('');
      }
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload: Record<string, unknown> = {
        provider,
        defaultModel: modelName.trim(),
        endpointUrl: endpointUrl.trim(),
        costBudgetMonthlyUsd: Number(budgetUsd) || monthlyBudgetUsd,
      };

      if (customApiKey.trim()) {
        payload.apiKey = customApiKey.trim();
      }

      const res = await fetch('/api/admin/ai-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Lỗi khi lưu cấu hình');
      }

      setSaveSuccess(true);
      setCustomApiKey('');
      setTimeout(() => setSaveSuccess(false), 3500);
      fetchData(period, flow);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  // Metrics Calculation
  const totalReq = stats?.totalRequests ?? 0;
  const totalTokens = stats?.totalTokens ?? 0;
  const totalTokensDisplay =
    totalTokens >= 1_000_000
      ? (totalTokens / 1_000_000).toFixed(2) + 'M'
      : totalTokens >= 1_000
      ? (totalTokens / 1_000).toFixed(1) + 'k'
      : totalTokens.toLocaleString('vi-VN');
  const avgLatency = stats?.avgLatencyMs ?? 0;
  const p95Latency = stats?.p95LatencyMs ?? 0;
  const errorRate = stats?.errorRatePercent ?? 0;
  const successRate = Math.max(0, Number((100 - errorRate).toFixed(1)));
  const totalCostUsd = stats?.totalCostUsd ?? 0;

  // Filtered Events
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Cổng kết nối AI
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-md">
              AI Gateway
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Quản trị kết nối mô hình trí tuệ nhân tạo, điều phối routing và giám sát lưu lượng xử lý thực tế toàn sàn.
          </p>
        </div>

        <button
          onClick={() => fetchData(period, flow)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-800 dark:text-zinc-200 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
            <span>Đã cập nhật cấu hình Cổng AI thành công vào cơ sở dữ liệu và xóa bộ nhớ cache tức thì.</span>
          </div>
        </div>
      )}

      {/* 2. Five Navigation Tabs (Strict AGENTS.md compliant: zero horizontal border lines) */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-100 dark:bg-zinc-900 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 shadow-xs'
              : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          <span>Tổng quan Gateway</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('model-routing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
            activeTab === 'model-routing'
              ? 'bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 shadow-xs'
              : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          <span>Cấu hình Model & Routing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('credit-policies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
            activeTab === 'credit-policies'
              ? 'bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 shadow-xs'
              : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          <span>Định mức Credit & Tác vụ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hitl-calibration')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
            activeTab === 'hitl-calibration'
              ? 'bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 shadow-xs'
              : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          <span>Hiệu chuẩn HITL & Độ lệch</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tokens-cost')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
            activeTab === 'tokens-cost'
              ? 'bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 shadow-xs'
              : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          <span>Thống kê Token & Chi phí</span>
        </button>
      </div>

      {/* Global Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Khung thời gian:</span>
          {(['24h', '7d', '30d', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                period === p
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              {p === '24h' ? '24 Giờ' : p === '7d' ? '7 Ngày' : p === '30d' ? '30 Ngày' : 'Tất cả'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Luồng giám sát:</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFlowDropdownOpen(!isFlowDropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-neutral-800 dark:text-zinc-200 cursor-pointer"
            >
              <span>{flow === 'all' ? 'Toàn sàn (Personal + Org)' : flow === 'personal' ? 'Cá nhân (Personal)' : 'Tổ chức (Org B2B)'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isFlowDropdownOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg z-20 py-1">
                <button
                  type="button"
                  onClick={() => setFlow('all')}
                  className="w-full text-left px-3 py-2 text-xs text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900"
                >
                  Tất cả luồng
                </button>
                <button
                  type="button"
                  onClick={() => setFlow('personal')}
                  className="w-full text-left px-3 py-2 text-xs text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900"
                >
                  Cá nhân
                </button>
                <button
                  type="button"
                  onClick={() => setFlow('org')}
                  className="w-full text-left px-3 py-2 text-xs text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900"
                >
                  Tổ chức
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: TỔNG QUAN GATEWAY */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Nhà cung cấp chính</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full">
                  Hoạt động
                </span>
              </div>
              <div className="mt-2 text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{config?.provider || 'GOOGLE_GEMINI'}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400 dark:text-neutral-400 font-mono">
                {config?.defaultModel || 'gemini-2.5-flash'}
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Tổng yêu cầu</span>
                <Cpu className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                {totalReq.toLocaleString('vi-VN')}
              </div>
              <p className="mt-1 text-xs text-slate-400 dark:text-neutral-400">
                Tỷ lệ thành công: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{successRate}%</span>
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Độ trễ trung bình</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                {avgLatency} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
              <p className="mt-1 text-xs text-slate-400 dark:text-neutral-400">
                P95 Latency: <span className="font-mono font-medium">{p95Latency} ms</span>
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Tổng Token xử lý</span>
                <Zap className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                {totalTokensDisplay}
              </div>
              <p className="mt-1 text-xs text-slate-400 dark:text-neutral-400">
                Chi phí ước tính: <span className="font-mono font-semibold">${totalCostUsd.toFixed(3)}</span>
              </p>
            </div>
          </div>

          {/* Health & Circuit Breaker Status */}
          <div className="p-5 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Trạng thái Cầu dao & Khả năng sẵn sàng (Circuit Breaker & Health Status)
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Kiểm soát an toàn tránh cạn kiệt ngân sách hoặc lỗi dây chuyền từ API thượng nguồn.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg">
                Hệ thống bình thường
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-900 rounded-lg space-y-1">
                <span className="text-xs text-slate-500 dark:text-neutral-400">Khóa API máy chủ</span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                  <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{hasServerKey ? 'Đã kích hoạt & Lưu trữ an toàn' : 'Chưa cấu hình'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-zinc-900 rounded-lg space-y-1">
                <span className="text-xs text-slate-500 dark:text-neutral-400">Ngân sách hàng tháng</span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-mono">${budgetUsd} USD / tháng</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-zinc-900 rounded-lg space-y-1">
                <span className="text-xs text-slate-500 dark:text-neutral-400">Tỷ lệ lỗi (Error Rate)</span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                  <AlertCircle className={`w-3.5 h-3.5 ${errorRate > 5 ? 'text-rose-500' : 'text-emerald-500'}`} />
                  <span className="font-mono">{errorRate}% ({stats?.errorCount || 0} lỗi)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: CẤU HÌNH MODEL & ROUTING */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'model-routing' && (
        <form onSubmit={handleSaveConfig} className="p-5 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Cấu hình Động Cổng AI (Dynamic Gateway & Routing)
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Thiết lập này được lưu trực tiếp vào bảng <code className="font-mono text-blue-600">platform_settings</code> và xóa cache in-memory tức thì.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1.5">
                Nhà cung cấp AI (Provider)
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {PROVIDER_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300">
                  Mô hình AI mặc định (Model)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Mặc định: {PROVIDER_OPTIONS.find((p) => p.id === provider)?.defaultModel}
                </span>
              </div>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Ví dụ: gemini-2.5-flash, gpt-4o-mini..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1.5">
                Base URL / Endpoint tùy chỉnh (Tùy chọn)
              </label>
              <input
                type="text"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder={provider === 'OPENROUTER' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1'}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1.5">
                Định mức ngân sách tháng (USD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="10"
                  value={budgetUsd}
                  onChange={(e) => setBudgetUsd(Math.max(1, parseFloat(e.target.value) || 0))}
                  placeholder="200"
                  className="w-full pl-3.5 pr-14 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  USD
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1.5">
              Khóa API (API Key)
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder={hasServerKey ? 'Đang dùng khóa bảo mật trong cơ sở dữ liệu / .env (nhập để thay đổi)...' : 'Dán khóa API kết nối...'}
                className="w-full pl-3.5 pr-11 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title={showApiKey ? 'Ẩn khóa API' : 'Hiện khóa API'}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình AI Gateway'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: ĐỊNH MỨC CREDIT & TÁC VỤ */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'credit-policies' && (
        <div className="space-y-6">
          {/* Credit Ledger Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Tổng giữ chỗ (Reservations)</span>
              <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                {creditSummary?.totalReservations ?? 0}
              </div>
              <p className="mt-1 text-xs text-slate-400">Giao dịch 5 pha đảm bảo tính toàn vẹn</p>
            </div>

            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Đã quyết toán (Settled)</span>
              <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {creditSummary?.totalSettled ?? 0} <span className="text-xs text-slate-400">Credits</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Tác vụ AI hoàn thành thành công</p>
            </div>

            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Đã hoàn trả (Released)</span>
              <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                {creditSummary?.totalReleased ?? 0} <span className="text-xs text-slate-400">Credits</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Hoàn tiền tự động khi AI lỗi / timeout</p>
            </div>

            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Giao dịch cần đối soát</span>
              <div className="mt-2 text-2xl font-bold text-amber-500 font-mono tabular-nums">
                {creditSummary?.totalFlagged ?? 0}
              </div>
              <p className="mt-1 text-xs text-slate-400">FLAGGED_MANUAL_REVIEW</p>
            </div>
          </div>

          {/* AI Task Policies Table */}
          <div className="p-5 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Chính sách Định mức & Chi phí Tác vụ AI (ai_task_policies)
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Kiểm soát đơn giá Credits, thời gian chờ timeout và yêu cầu duyệt con người (HITL) cho từng nghiệp vụ.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 dark:text-neutral-400 font-medium">
                    <th className="p-3 rounded-l-lg">Mã tác vụ</th>
                    <th className="p-3">Mô tả</th>
                    <th className="p-3">Mô hình định tuyến</th>
                    <th className="p-3">Đơn giá</th>
                    <th className="p-3">Timeout</th>
                    <th className="p-3">Yêu cầu HITL</th>
                    <th className="p-3 rounded-r-lg">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {taskPolicies.length > 0 ? (
                    taskPolicies.map((tp) => (
                      <tr key={tp.task_type} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                        <td className="p-3 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                          {tp.task_type}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-neutral-300">
                          {tp.description || FEATURE_LABELS[tp.task_type] || 'Tác vụ hệ thống'}
                        </td>
                        <td className="p-3 font-mono text-slate-500 dark:text-neutral-400">
                          {tp.model_name}
                        </td>
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {tp.price_credits} Credit{tp.price_credits > 1 ? 's' : ''}
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          {tp.timeout_ms ? `${tp.timeout_ms / 1000}s` : '25s'}
                        </td>
                        <td className="p-3">
                          {tp.require_human_review ? (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-md">
                              Bắt buộc
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400 rounded-md">
                              Tự động
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {tp.is_enabled ? (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-md">
                              Hoạt động
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-md">
                              Vô hiệu
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        Chưa có chính sách tác vụ nào được nạp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: HIỆU CHUẨN HITL & ĐỘ LỆCH */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'hitl-calibration' && (
        <div className="space-y-6">
          {/* Calibration Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Tổng mẫu kiểm chuẩn</span>
              <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                {calibrationSummary?.totalLogs ?? 0}
              </div>
              <p className="mt-1 text-xs text-slate-400">Bài thi được đối chiếu điểm AI vs Người</p>
            </div>

            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Độ lệch tuyệt đối trung bình</span>
              <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                ±{calibrationSummary?.meanScoreDelta ?? 0} <span className="text-xs text-slate-400">điểm</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Mean absolute delta (Giảng viên - AI)</p>
            </div>

            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Đồng thuận cao (Δ ≤ 10)</span>
              <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {calibrationSummary
                  ? Math.round(
                      ((calibrationSummary.exactMatchCount + calibrationSummary.highAgreementCount) /
                        Math.max(1, calibrationSummary.totalLogs)) *
                        100
                    )
                  : 100}
                %
              </div>
              <p className="mt-1 text-xs text-slate-400">Tỷ lệ đồng thuận chất lượng chấm</p>
            </div>

            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Lệch đáng kể (Δ &gt; 10)</span>
              <div className="mt-2 text-2xl font-bold text-amber-500 font-mono tabular-nums">
                {calibrationSummary?.divergentCount ?? 0}
              </div>
              <p className="mt-1 text-xs text-slate-400">Cần thẩm định lại tiêu chí Rubric</p>
            </div>
          </div>

          {/* Recent Calibration Records */}
          <div className="p-5 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Nhật ký Kiểm chuẩn Chi tiết (ai_calibration_logs)
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Ghi nhận tự động mỗi khi Chuyên gia Khảo thí phê duyệt điểm chấm Rubric.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 dark:text-neutral-400 font-medium">
                    <th className="p-3 rounded-l-lg">Thời gian</th>
                    <th className="p-3">Mã bài nộp</th>
                    <th className="p-3">Điểm AI</th>
                    <th className="p-3">Điểm Giảng viên</th>
                    <th className="p-3">Độ lệch (Δ)</th>
                    <th className="p-3">Đánh giá mức độ</th>
                    <th className="p-3 rounded-r-lg">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {calibrationSummary && calibrationSummary.recentLogs.length > 0 ? (
                    calibrationSummary.recentLogs.map((log) => {
                      const delta = Number(log.score_delta);
                      const absDelta = Math.abs(delta);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                          <td className="p-3 text-slate-500 font-mono">
                            {new Date(log.created_at).toLocaleTimeString('vi-VN')} {new Date(log.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="p-3 font-mono text-slate-600 dark:text-neutral-300">
                            {log.submission_id.slice(0, 8)}...
                          </td>
                          <td className="p-3 font-mono font-semibold text-neutral-800 dark:text-zinc-200">
                            {log.ai_score}
                          </td>
                          <td className="p-3 font-mono font-semibold text-neutral-800 dark:text-zinc-200">
                            {log.human_score}
                          </td>
                          <td className="p-3 font-mono font-bold">
                            <span className={delta === 0 ? 'text-slate-500' : delta > 0 ? 'text-blue-600' : 'text-amber-500'}>
                              {delta > 0 ? `+${delta}` : delta}
                            </span>
                          </td>
                          <td className="p-3">
                            {absDelta === 0 ? (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-md">
                                Khớp tuyệt đối
                              </span>
                            ) : absDelta <= 10 ? (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-md">
                                Đồng thuận cao
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-md">
                                Lệch tiêu chí
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-slate-500">
                            {log.task_type}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        Chưa có dữ liệu hiệu chuẩn nào được ghi nhận. Dữ liệu sẽ xuất hiện khi các bài chấm Rubric được Cán bộ phê duyệt.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: THỐNG KÊ TOKEN & CHI PHÍ */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'tokens-cost' && (
        <div className="space-y-6">
          {/* Token Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Prompt Tokens (Đầu vào)</span>
              <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                {(stats?.totalPromptTokens ?? 0).toLocaleString('vi-VN')}
              </div>
              <p className="mt-1 text-xs text-slate-400">Tokens chứa ngữ cảnh và đề thi</p>
            </div>

            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Completion Tokens (Đầu ra)</span>
              <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                {(stats?.totalCompletionTokens ?? 0).toLocaleString('vi-VN')}
              </div>
              <p className="mt-1 text-xs text-slate-400">Tokens kết quả phân tích & lời giải</p>
            </div>

            <div className="p-4 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Chi phí quy đổi VND</span>
              <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                {(stats?.totalCostVnd ?? 0).toLocaleString('vi-VN')} <span className="text-xs text-slate-400">đ</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Tỷ giá tham chiếu: 25.400 VND/USD</p>
            </div>
          </div>

          {/* Telemetry Log Search & Stream */}
          <div className="p-5 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Nhật ký Telemetry Trực tiếp (ai_usage_events)
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Giám sát chi tiết lưu lượng, token và thời gian phản hồi của từng yêu cầu AI.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                  placeholder="Lọc tính năng, model, ID..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 dark:text-neutral-400 font-medium">
                    <th className="p-3 rounded-l-lg">Thời gian</th>
                    <th className="p-3">Nghiệp vụ / Tính năng</th>
                    <th className="p-3">Không gian</th>
                    <th className="p-3">Mô hình</th>
                    <th className="p-3">Tokens (In / Out)</th>
                    <th className="p-3">Độ trễ</th>
                    <th className="p-3 rounded-r-lg">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                        <td className="p-3 text-slate-500 font-mono">
                          {new Date(ev.created_at).toLocaleTimeString('vi-VN')}
                        </td>
                        <td className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">
                          {FEATURE_LABELS[ev.feature] || ev.feature}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md ${
                            ev.flow === 'org'
                              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400'
                              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                          }`}>
                            {ev.flow === 'org' ? 'Tổ chức' : 'Cá nhân'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          {ev.model}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-neutral-300">
                          {ev.prompt_tokens} / {ev.completion_tokens}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-neutral-300">
                          {ev.latency_ms}ms
                        </td>
                        <td className="p-3">
                          {ev.status === 'FAILED' ? (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-md">
                              Lỗi
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-md">
                              Thành công
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        Không tìm thấy sự kiện telemetry nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAiGatewayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <AdminAiGatewayContent />
    </Suspense>
  );
}
