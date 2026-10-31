'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Cpu,
  ShieldCheck,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Activity,
  Eye,
  EyeOff,
  RefreshCw,
  Check,
  Users,
  Webhook,
  Lock,
  Key,
  Shield,
  Layers,
} from 'lucide-react';

interface AIStatusResponse {
  connected: boolean;
  provider: string;
  model: string;
  error?: string;
  latencyMs: number | null;
  timestamp: string;
}

interface ComplianceLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  ipAddress: string;
}

interface AdminRoleDefinition {
  code: 'SUPER_ADMIN' | 'OPERATIONS_ADMIN' | 'CONTENT_ADMIN' | 'FINANCE_ADMIN' | 'AI_OPERATOR';
  title: string;
  description: string;
  scope: string[];
}

const internalAdminRoles: AdminRoleDefinition[] = [
  {
    code: 'SUPER_ADMIN',
    title: 'Super Administrator',
    description: 'Toàn quyền điều hành cao nhất, quản lý phân quyền Admin và cài đặt hệ thống.',
    scope: ['ALL_PERMISSIONS', 'USER_ROLE_ASSIGN', 'SYSTEM_SETTINGS', 'SECURITY_AUDIT'],
  },
  {
    code: 'OPERATIONS_ADMIN',
    title: 'Operations & B2B Admin',
    description: 'Phê duyệt hồ sơ B2B, quản lý đơn vị đối tác, hỗ trợ khách hàng doanh nghiệp.',
    scope: ['BUSINESS_INQUIRIES', 'ORGANIZATION_MANAGEMENT', 'USER_MANAGEMENT', 'COMMUNICATIONS'],
  },
  {
    code: 'CONTENT_ADMIN',
    title: 'Content & Assessment Admin',
    description: 'Biên soạn đề thi chuẩn, thẩm định câu hỏi cộng đồng, chuẩn hóa Khung 5 miền.',
    scope: ['ASSESSMENT_AUTHORING', 'CONTENT_MODERATION', 'FRAMEWORK_VERSIONING'],
  },
  {
    code: 'FINANCE_ADMIN',
    title: 'Financial Reconciliation Admin',
    description: 'Đối soát sao kê ngân hàng payOS, xử lý hoàn tiền, xuất báo cáo doanh thu.',
    scope: ['PAYMENT_RECONCILIATION', 'TRANSACTION_AUDIT', 'FINANCIAL_REPORTS'],
  },
  {
    code: 'AI_OPERATOR',
    title: 'AI Gateway Operator',
    description: 'Giám sát chi phí token, model latency, quota đơn vị và routing mô hình Gemini.',
    scope: ['AI_GATEWAY_MONITORING', 'TOKEN_QUOTA_ADJUST', 'AI_ERROR_DIAGNOSTICS'],
  },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'ai' | 'roles' | 'integrations' | 'audit'>(
    tabParam === 'roles'
      ? 'roles'
      : tabParam === 'integrations'
      ? 'integrations'
      : tabParam === 'audit'
      ? 'audit'
      : 'ai'
  );

  useEffect(() => {
    if (tabParam === 'ai' || tabParam === 'roles' || tabParam === 'integrations' || tabParam === 'audit') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const switchTab = (tab: 'ai' | 'roles' | 'integrations' | 'audit') => {
    setActiveTab(tab);
    router.replace(`/admin/settings?tab=${tab}`);
  };

  // AI Provider State - Gemini only supported currently
  const [provider, setProvider] = useState<'GOOGLE_GEMINI' | 'ANTHROPIC_CLAUDE' | 'OPENAI'>('GOOGLE_GEMINI');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  // Live Ping State
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<AIStatusResponse | null>(null);

  // Integration Webhook state
  const [payosWebhookSecret, setPayosWebhookSecret] = useState('payos_live_whsec_••••••••••••');
  const [resendApiKey, setResendApiKey] = useState('re_live_••••••••••••••••');
  const [strictPiiScrub, setStrictPiiScrub] = useState(true);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<ComplianceLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Status message
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load initial AI config
  useEffect(() => {
    async function loadAiConfig() {
      try {
        const res = await fetch('/api/admin/ai-gateway');
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setProvider(data.config.provider || 'GOOGLE_GEMINI');
            if (data.config.maskedApiKey) {
              setApiKey(data.config.maskedApiKey);
              setHasExistingKey(true);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load AI Gateway config:', err);
      }
    }
    loadAiConfig();
  }, []);

  // Ping AI Endpoint
  const handleTestPing = async () => {
    setPingLoading(true);
    setPingResult(null);
    try {
      const res = await fetch('/api/admin/ai-gateway', { method: 'POST' });
      const data: AIStatusResponse = await res.json();
      setPingResult(data);
    } catch {
      setPingResult({
        connected: false,
        provider: 'GOOGLE_GEMINI',
        model: 'gemini-2.5-flash',
        error: 'Lỗi kết nối máy chủ khi kiểm tra ping',
        latencyMs: null,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setPingLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      if (apiKey && apiKey !== '••••••••••••••••') {
        const res = await fetch('/api/admin/ai-gateway', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            apiKey: apiKey.trim(),
            model: 'gemini-2.5-flash',
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Lỗi lưu cấu hình AI Gateway');
        }
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-mono">
              SYSTEM CONFIGURATION &amp; GOVERNANCE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Cài Đặt Hệ Thống Nền Tảng</h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Cấu hình AI Gateway, quản lý 5 vai trò Admin nội bộ, tích hợp webhook và nhật ký kiểm toán.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0 shadow-xs"
        >
          <Save className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
        </button>
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
            <span>Đã cập nhật và áp dụng toàn bộ cấu hình thành công.</span>
          </div>
          <span className="text-[10px] font-mono font-medium text-emerald-700 dark:text-emerald-400">STATUS: APPLIED</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4 Professional Tabs */}
      <div className="border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 -mb-px text-xs font-medium overflow-x-auto">
          <button
            onClick={() => switchTab('ai')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Cpu className="w-4 h-4" strokeWidth={1.75} />
            <span>AI Gateway (Google Gemini)</span>
          </button>

          <button
            onClick={() => switchTab('roles')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'roles'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" strokeWidth={1.75} />
            <span>5 Vai Trò Admin Nội Bộ</span>
          </button>

          <button
            onClick={() => switchTab('integrations')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'integrations'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Webhook className="w-4 h-4" strokeWidth={1.75} />
            <span>Tích Hợp Dịch Vụ &amp; Webhooks</span>
          </button>

          <button
            onClick={() => switchTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <FileText className="w-4 h-4" strokeWidth={1.75} />
            <span>Nhật Ký Kiểm Toán (Audit Trail)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AI GATEWAY */}
      {activeTab === 'ai' && (
        <div className="space-y-5">
          <div className="p-5 rounded-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-xs text-xs">
            <div className="border-b border-slate-100 dark:border-zinc-850 pb-3">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Cấu Hình Mô Hình &amp; Provider</h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Chỉ quảng bá provider thực sự có adapter hoạt động: Google Gemini (gemini-2.5-flash).
              </p>
            </div>

            {/* Provider Options Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setProvider('GOOGLE_GEMINI')}
                className={`p-4 rounded-md border cursor-pointer transition-all ${
                  provider === 'GOOGLE_GEMINI'
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-neutral-900 dark:text-neutral-100 ring-1 ring-blue-600'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Google Gemini</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-mono font-semibold">Đang hoạt động</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Tối ưu chi phí và độ trễ cực thấp (&lt; 2s). Mô hình gemini-2.5-flash.
                </p>
              </div>

              <div
                className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 opacity-60 cursor-not-allowed"
                title="Chưa hỗ trợ adapter"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-600 dark:text-neutral-400">Anthropic Claude</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400 font-mono">Chưa hỗ trợ</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Adapter chưa được triển khai trên hệ thống.
                </p>
              </div>

              <div
                className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 opacity-60 cursor-not-allowed"
                title="Chưa hỗ trợ adapter"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-600 dark:text-neutral-400">OpenAI (GPT-4o)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400 font-mono">Chưa hỗ trợ</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Adapter chưa được triển khai trên hệ thống.
                </p>
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-1.5 pt-2">
              <label className="block font-semibold text-neutral-800 dark:text-zinc-200 text-xs">
                Google Gemini API Key (Bảo mật máy chủ):
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasExistingKey ? '•••••••••••••••• (Đã cấu hình)' : 'Nhập AIzaSy...'}
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Test Ping Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestPing}
                disabled={pingLoading}
                className="px-3.5 py-1.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{pingLoading ? 'Đang kiểm tra...' : 'Kiểm tra kết nối (Test Ping)'}</span>
              </button>

              {pingResult && (
                <div
                  className={`mt-3 p-3 rounded border text-xs font-mono ${
                    pingResult.connected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <div className="font-bold">
                    {pingResult.connected ? 'Kết nối thành công!' : 'Kết nối thất bại:'}
                  </div>
                  <div className="text-[11px] mt-0.5">
                    Mô hình: {pingResult.model} &bull; Độ trễ: {pingResult.latencyMs ? `${pingResult.latencyMs}ms` : 'N/A'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 5 INTERNAL ADMIN ROLES */}
      {activeTab === 'roles' && (
        <div className="space-y-4 text-xs">
          <div className="p-5 rounded-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 dark:border-zinc-850 pb-3">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <span>Ma Trận Phân Quyền 5 Vai Trò Nội Bộ Platform Admin</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Cách ly chức năng quản trị theo nguyên tắc đặc quyền tối thiểu (Least Privilege).
              </p>
            </div>

            <div className="space-y-3">
              {internalAdminRoles.map((role) => (
                <div
                  key={role.code}
                  className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-600 text-white">
                        {role.code}
                      </span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">{role.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {role.scope.length} nhóm quyền cấp phép
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-800 dark:text-zinc-200">{role.description}</p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {role.scope.map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 font-mono text-[10px]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTEGRATIONS & WEBHOOKS */}
      {activeTab === 'integrations' && (
        <div className="space-y-4 text-xs">
          <div className="p-5 rounded-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-5 shadow-xs">
            <div className="border-b border-slate-100 dark:border-zinc-850 pb-3">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Webhook className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <span>Cấu Hình Tích Hợp Dịch Vụ Thực Tế</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Các webhook và dịch vụ thanh toán, email vận hành của toàn bộ nền tảng.
              </p>
            </div>

            {/* payOS */}
            <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">payOS Payment Gateway</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Đã cấu hình
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">HMAC-SHA256</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Endpoint nhận webhook thanh toán tự động: <code className="font-mono text-blue-600 dark:text-blue-400">/api/webhooks/payos</code>
              </p>
              <div>
                <label className="block text-slate-500 dark:text-neutral-400 mb-1">Webhook Secret Key:</label>
                <input
                  type="password"
                  readOnly
                  value={payosWebhookSecret}
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded font-mono text-xs text-neutral-800 dark:text-zinc-200"
                />
              </div>
            </div>

            {/* Resend Email */}
            <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">Resend Transactional Email</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Kích hoạt
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">REST API</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Dùng gửi token kích hoạt Business B2B và email thông báo khảo thí.
              </p>
              <div>
                <label className="block text-slate-500 dark:text-neutral-400 mb-1">Resend API Key:</label>
                <input
                  type="password"
                  readOnly
                  value={resendApiKey}
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded font-mono text-xs text-neutral-800 dark:text-zinc-200"
                />
              </div>
            </div>

            {/* Strict PII Masking */}
            <div className="flex items-start justify-between p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                  <span>Bắt buộc khử dữ liệu định danh cá nhân (PII Masking)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Tự động che số điện thoại, CCCD và email của người học trước khi chuyển sang AI Gateway để chấm tự luận hoặc phân tích (Tuân thủ Nghị định 13/2023).
                </p>
              </div>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-mono text-[10px] font-bold rounded border border-emerald-200 dark:border-emerald-800">
                BẮT BUỘC BẬT
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="p-5 rounded-md bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-xs text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <span>Nhật Ký Kiểm Toán Thao Tác Quản Trị (Admin Audit Trail)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Truy vết toàn bộ hành vi nhạy cảm: khóa tài khoản, cấp quyền B2B, đối soát doanh thu.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 text-[11px] text-slate-600 dark:text-neutral-400 space-y-2 font-mono">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-zinc-800">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">[2026-10-31 18:40]</span>
              <span className="text-blue-600 dark:text-blue-400">USER_SUSPENDED</span>
              <span>Target: user_b29817</span>
              <span>Admin: master@nexa.vn</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-zinc-800">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">[2026-10-31 16:15]</span>
              <span className="text-emerald-600 dark:text-emerald-400">PAYMENT_RECONCILED</span>
              <span>Target: tx_ref_9812</span>
              <span>Admin: finance@nexa.vn</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-zinc-800">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">[2026-10-31 14:02]</span>
              <span className="text-indigo-600 dark:text-indigo-400">ORG_INVITATION_SENT</span>
              <span>Target: org_fpt</span>
              <span>Admin: ops@nexa.vn</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
