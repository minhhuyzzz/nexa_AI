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
} from 'lucide-react';

interface AiGatewayStats {
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  avgLatencyMs: number;
  errorCount?: number;
  errorRatePercent?: number;
}

interface AiEventLog {
  id: string;
  feature: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  status?: string;
  created_at: string;
}

interface AiGatewayConfig {
  provider: 'GOOGLE_GEMINI' | 'ANTHROPIC_CLAUDE' | 'OPENAI' | 'DEEPSEEK' | 'ON_PREMISE' | 'OPENROUTER';
  defaultModel: string;
  endpointUrl?: string;
  maskedApiKey?: string;
  hasCustomApiKey?: boolean;
  costBudgetMonthlyUsd?: number;
  monthlyBudgetUsd?: number;
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
  GENERATE_BY_DOMAIN: 'Sinh Câu Hỏi Theo Miền',
  HEALTH_CHECK: 'Kiểm Tra Sức Khỏe',
  OTHER: 'Hệ thống / Nghiệp vụ khác',
};

function AdminAiGatewayContent() {
  const [stats, setStats] = useState<AiGatewayStats | null>(null);
  const [events, setEvents] = useState<AiEventLog[]>([]);
  const [config, setConfig] = useState<AiGatewayConfig | null>(null);
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

  // Dynamic budget binding for tests
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

  // Metrics Display
  const totalReq = stats?.totalRequests ?? 0;
  const totalTokens = stats?.totalTokens ?? 0;
  const totalTokensDisplay =
    totalTokens >= 1_000_000
      ? (totalTokens / 1_000_000).toFixed(2) + 'M'
      : totalTokens >= 1_000
      ? (totalTokens / 1_000).toFixed(1) + 'k'
      : totalTokens.toLocaleString('vi-VN');
  const avgLatency = stats?.avgLatencyMs ?? 0;
  const errorRate = stats?.errorRatePercent ?? 0;
  const successRate = Math.max(0, Number((100 - errorRate).toFixed(1)));

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
            Quản trị kết nối mô hình trí tuệ nhân tạo và giám sát lưu lượng xử lý thực tế toàn sàn.
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
            <span>Đã cập nhật cấu hình Cổng AI thành công vào cơ sở dữ liệu.</span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
            AI_GATEWAY: ACTIVE
          </span>
        </div>
      )}

      {/* 2. 4 Clean Metric Cards (Đo lường dữ liệu thực tế) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1">
            <span className="font-medium">Tổng lượt gọi AI</span>
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums my-0.5">
            {loading ? '...' : totalReq.toLocaleString('vi-VN')}
          </div>
          <span className="text-[10px] text-slate-400">Chu kỳ {period === 'all' ? 'toàn thời gian' : period}</span>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1">
            <span className="font-medium">Tổng Token tiêu thụ</span>
            <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums my-0.5">
            {loading ? '...' : totalTokensDisplay}
          </div>
          <span className="text-[10px] text-slate-400">Prompt + Output tokens</span>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1">
            <span className="font-medium">Độ trễ trung bình</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums my-0.5">
            {loading ? '...' : `${avgLatency} ms`}
          </div>
          <span className="text-[10px] text-slate-400">Thời gian phản hồi mô hình</span>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1">
            <span className="font-medium">Tỷ lệ thành công</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums my-0.5">
            {loading ? '...' : `${successRate}%`}
          </div>
          <span className="text-[10px] text-slate-400">Yêu cầu hoàn thành hợp lệ</span>
        </div>
      </div>

      {/* 3. Unified Model & Provider Setup Card */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Cpu className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Cấu hình Nhà cung cấp &amp; Kết nối AI
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Quản trị kết nối mô hình và định mức ngân sách vận hành
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-neutral-400">
              Định mức: <strong className="font-mono text-neutral-900 dark:text-neutral-100">${(Number(budgetUsd) || monthlyBudgetUsd).toFixed(2)} USD</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sẵn sàng
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4 pt-1">
          {/* Row 1: Provider & Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1.5">
                Nhà cung cấp (Provider)
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                <option value="GOOGLE_GEMINI">Google Gemini (Khuyến nghị)</option>
                <option value="OPENROUTER">OpenRouter (Router đa mô hình)</option>
                <option value="OPENAI">OpenAI (ChatGPT / Router tương thích)</option>
                <option value="DEEPSEEK">DeepSeek</option>
                <option value="ANTHROPIC_CLAUDE">Anthropic Claude</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300">
                  Mô hình AI (Tùy chọn)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Mặc định: {PROVIDER_OPTIONS.find((p) => p.id === provider)?.defaultModel}
                </span>
              </div>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Để trống dùng mặc định, hoặc nhập model tùy ý (gpt-4o, deepseek-v3...)"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Row 2: Base URL & Monthly Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1.5">
                Base URL / Endpoint (Tùy chọn)
              </label>
              <input
                type="text"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder={
                  provider === 'OPENROUTER'
                    ? 'https://openrouter.ai/api/v1'
                    : 'Mặc định nhà cung cấp, hoặc dán URL router...'
                }
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

          {/* Row 3: Custom API Key Input with Eye Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1.5">
              Khóa API (API Key)
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder={hasServerKey ? 'Đang dùng khóa mặc định từ .env (nhập vào để ghi đè)...' : 'Dán khóa API kết nối...'}
                className="w-full pl-3.5 pr-11 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title={showApiKey ? 'Ẩn khóa API' : 'Hiện khóa API'}
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình AI'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Telemetry Logs Table */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Nhật ký yêu cầu AI (Telemetry Logs)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chi tiết các lượt gọi mô hình thực tế được ghi nhận vào bảng cơ sở dữ liệu <code className="text-blue-600 font-mono">ai_usage_events</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                placeholder="Tìm theo nghiệp vụ, model..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white w-48 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Flow Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFlowDropdownOpen(!isFlowDropdownOpen)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>
                  {flow === 'all' ? 'Tất cả luồng' : flow === 'personal' ? 'Cá nhân' : 'Tổ chức'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isFlowDropdownOpen && (
                <div className="absolute right-0 mt-1 w-36 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-lg py-1 z-20">
                  <button
                    type="button"
                    onClick={() => setFlow('all')}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                      flow === 'all'
                        ? 'bg-blue-50 text-blue-600 font-semibold dark:bg-blue-950/40'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Tất cả luồng
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlow('personal')}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                      flow === 'personal'
                        ? 'bg-blue-50 text-blue-600 font-semibold dark:bg-blue-950/40'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Cá nhân
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlow('org')}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                      flow === 'org'
                        ? 'bg-blue-50 text-blue-600 font-semibold dark:bg-blue-950/40'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Tổ chức
                  </button>
                </div>
              )}
            </div>

            {/* Period Dropdown Selection */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer shadow-2xs"
            >
              <option value="24h">24 giờ qua</option>
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
              <option value="all">Toàn thời gian</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-zinc-900/60 text-slate-500 dark:text-neutral-400 font-medium">
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3">Nghiệp vụ</th>
                <th className="py-2.5 px-3">Mô hình</th>
                <th className="py-2.5 px-3">Prompt / Output Token</th>
                <th className="py-2.5 px-3">Độ trễ</th>
                <th className="py-2.5 px-3 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {searchLog
                      ? 'Không tìm thấy nhật ký yêu cầu nào phù hợp với từ khóa.'
                      : 'Chưa có nhật ký yêu cầu AI nào được ghi nhận trong chu kỳ này.'}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((log) => {
                  const isFailed = log.status === 'FAILED';
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="py-3 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString('vi-VN')}
                      </td>

                      <td className="py-3 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                        {FEATURE_LABELS[log.feature] || log.feature}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-zinc-300">
                        {log.model}
                      </td>

                      <td className="py-3 px-3 tabular-nums text-slate-600 dark:text-zinc-400 font-mono">
                        {(log.prompt_tokens || 0).toLocaleString('vi-VN')} / {(log.completion_tokens || 0).toLocaleString('vi-VN')}
                      </td>

                      <td className="py-3 px-3 tabular-nums text-slate-600 dark:text-zinc-400 font-mono">
                        {log.latency_ms} ms
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {isFailed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            Thất bại
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3" />
                            Thành công
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Hiển thị {filteredEvents.length} sự kiện trong chu kỳ</span>
          <span className="font-mono text-[11px]">AI GATEWAY TELEMETRY</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminAiGatewayPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Đang tải Cổng kết nối AI...
        </div>
      }
    >
      <AdminAiGatewayContent />
    </Suspense>
  );
}
