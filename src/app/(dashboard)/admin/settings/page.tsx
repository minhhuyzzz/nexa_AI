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

export default function AdminSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'ai' | 'security' | 'audit'>(
    tabParam === 'audit' ? 'audit' : tabParam === 'security' ? 'security' : 'ai'
  );

  useEffect(() => {
    if (tabParam === 'ai' || tabParam === 'security' || tabParam === 'audit') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const switchTab = (tab: 'ai' | 'security' | 'audit') => {
    setActiveTab(tab);
    router.replace(`/admin/settings?tab=${tab}`);
  };

  // AI Provider State - Simple & Clear: Gemini | Claude | OpenAI
  const [provider, setProvider] = useState<'GOOGLE_GEMINI' | 'ANTHROPIC_CLAUDE' | 'OPENAI'>('GOOGLE_GEMINI');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  // Live Ping State
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<AIStatusResponse | null>(null);

  // Security State
  const [strictPiiScrub, setStrictPiiScrub] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(60);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);

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

  // Load audit logs when tab is switched
  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  async function loadAuditLogs() {
    try {
      setLoadingAudit(true);
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        const logs = (data.logs || []).map((l: any) => ({
          id: l.id,
          timestamp: new Date(l.created_at).toLocaleString('vi-VN'),
          actor: l.admin_email || 'Platform Admin',
          action: `${l.action} (${l.target_type}${l.target_id ? `: ${l.target_id.slice(0, 8)}...` : ''})`,
          resource: l.details ? JSON.stringify(l.details) : 'Hệ thống',
          ipAddress: l.ip_address || 'Internal RPC',
        }));
        setAuditLogs(logs);
      } else {
        // Fallback to compliance logs
        const compRes = await fetch('/api/admin/compliance');
        if (compRes.ok) {
          const compData = await compRes.json();
          const logs = (compData.consentLogs || []).map((l: any) => ({
            id: l.id,
            timestamp: new Date(l.created_at).toLocaleString('vi-VN'),
            actor: l.profiles?.email || 'Người dùng',
            action: 'Đồng thuận dữ liệu NĐ 13/2023',
            resource: l.consent_version || 'v1.0',
            ipAddress: l.ip_address || '127.0.0.1',
          }));
          setAuditLogs(logs);
        }
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  }

  // Live Ping AI
  async function handleTestPing() {
    try {
      setPingLoading(true);
      setPingResult(null);
      const res = await fetch('/api/ai/status');
      const data: AIStatusResponse = await res.json();
      setPingResult(data);
    } catch (err) {
      setPingResult({
        connected: false,
        provider: provider === 'GOOGLE_GEMINI' ? 'Google Gemini' : provider === 'ANTHROPIC_CLAUDE' ? 'Anthropic Claude' : 'OpenAI',
        model: 'default',
        error: err instanceof Error ? err.message : 'Lỗi kết nối',
        latencyMs: null,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setPingLoading(false);
    }
  }

  // Save Settings
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/ai-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey,
          strictPiiScrub,
          sessionTimeoutMinutes,
          maxLoginAttempts,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Không thể lưu cấu hình');
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi lưu tham số');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cài đặt hệ thống</h1>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình nhà cung cấp trí tuệ nhân tạo (AI), chính sách bảo mật và kiểm toán thao tác quản trị.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0 shadow-xs"
        >
          <Save className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
        </button>
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
            <span>Đã cập nhật và áp dụng toàn bộ cấu hình thành công.</span>
          </div>
          <span className="text-[10px] font-mono font-medium text-emerald-700">STATUS: APPLIED</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3 Clean Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-2 -mb-px text-xs">
          <button
            onClick={() => switchTab('ai')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" strokeWidth={1.75} />
            <span>Cấu hình AI (Gemini / Claude / OpenAI)</span>
          </button>

          <button
            onClick={() => switchTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
            <span>Bảo mật &amp; Phiên làm việc</span>
          </button>

          <button
            onClick={() => switchTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" strokeWidth={1.75} />
            <span>Nhật ký kiểm toán (Audit Logs)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AI SETUP */}
      {activeTab === 'ai' && (
        <div className="space-y-5">
          <div className="p-5 rounded-md bg-white border border-slate-200 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-slate-900">Nhà cung cấp Trí tuệ Nhân tạo</h2>
              <p className="text-xs text-slate-500">
                Chọn nhà cung cấp bạn muốn sử dụng cho việc chấm bài khảo thí và phân tích năng lực.
              </p>
            </div>

            {/* Provider Options Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setProvider('GOOGLE_GEMINI')}
                className={`p-4 rounded-md border cursor-pointer transition-all ${
                  provider === 'GOOGLE_GEMINI'
                    ? 'border-sky-600 bg-sky-50/40 text-slate-900 ring-1 ring-sky-600'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs">Google Gemini</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-mono font-semibold">Khuyến nghị</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Tối ưu chi phí và tốc độ cao (&lt; 2s). Mô hình gemini-2.5-flash.
                </p>
              </div>

              <div
                onClick={() => setProvider('ANTHROPIC_CLAUDE')}
                className={`p-4 rounded-md border cursor-pointer transition-all ${
                  provider === 'ANTHROPIC_CLAUDE'
                    ? 'border-sky-600 bg-sky-50/40 text-slate-900 ring-1 ring-sky-600'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs">Anthropic Claude</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">Claude 3.5</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Phân tích tự luận chuyên sâu, lập luận chi tiết và chuẩn mực văn phong.
                </p>
              </div>

              <div
                onClick={() => setProvider('OPENAI')}
                className={`p-4 rounded-md border cursor-pointer transition-all ${
                  provider === 'OPENAI'
                    ? 'border-sky-600 bg-sky-50/40 text-slate-900 ring-1 ring-sky-600'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs">OpenAI (GPT-4o)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">Dự phòng</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Nhà cung cấp dự phòng cho các bài đánh giá tình huống phức tạp.
                </p>
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-1.5 pt-2">
              <label className="block font-semibold text-slate-800 text-xs">
                API Key ({provider === 'GOOGLE_GEMINI' ? 'Google Gemini' : provider === 'ANTHROPIC_CLAUDE' ? 'Anthropic Claude' : 'OpenAI'}):
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Nhập khóa API hoặc để trống để sử dụng biến môi trường trên máy chủ..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 focus:bg-white text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                {hasExistingKey
                  ? 'Hệ thống đã lưu API Key hợp lệ. Nhập chuỗi mới nếu bạn cần cập nhật khóa.'
                  : 'Nếu để trống, hệ thống sẽ sử dụng biến môi trường cấu hình trên máy chủ.'}
              </p>
            </div>

            {/* Test Connection Button & Ping Result */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Kiểm tra xem khóa API có hoạt động và kết nối được với máy chủ AI không.
              </div>
              <button
                type="button"
                onClick={handleTestPing}
                disabled={pingLoading}
                className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${pingLoading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                <span>{pingLoading ? 'Đang kiểm tra...' : 'Kiểm tra kết nối (Test Ping)'}</span>
              </button>
            </div>

            {pingResult && (
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      pingResult.connected ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  />
                  <span className="font-semibold text-slate-900">
                    {pingResult.provider}
                  </span>
                  <span className="text-slate-400">&bull;</span>
                  <span className={pingResult.connected ? 'text-emerald-700 font-medium' : 'text-rose-600'}>
                    {pingResult.connected ? 'Kết nối thành công!' : (pingResult.error || 'Kết nối thất bại')}
                  </span>
                </div>
                {pingResult.latencyMs !== null && (
                  <div className="text-[11px] font-mono text-slate-600">
                    Độ trễ phản hồi: <strong className="text-slate-900">{pingResult.latencyMs}ms</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & SESSION */}
      {activeTab === 'security' && (
        <div className="p-5 rounded-md bg-white border border-slate-200 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">Bảo mật &amp; Quản trị phiên làm việc</h2>
            <p className="text-xs text-slate-500">Chính sách bảo vệ thông tin người dùng và an toàn hệ thống.</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* PII Scrubber */}
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                  <span>Tự động khử thông tin định danh cá nhân (PII Sanitization)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Tự động che số điện thoại, CCCD và email của người học trước khi gửi dữ liệu sang các dịch vụ AI bên ngoài theo quy định bảo vệ dữ liệu.
                </p>
              </div>
              <input
                type="checkbox"
                checked={strictPiiScrub}
                onChange={(e) => setStrictPiiScrub(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-600 mt-1 cursor-pointer"
              />
            </div>

            {/* Session Timeout & Login Attempts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800">Thời gian hết hạn phiên làm việc</span>
                  <span className="font-mono text-slate-600 text-xs font-bold">{sessionTimeoutMinutes} phút</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={240}
                  step={15}
                  value={sessionTimeoutMinutes}
                  onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">Tự động đăng xuất nếu không có thao tác</p>
              </div>

              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800">Giới hạn đăng nhập sai liên tiếp</span>
                  <span className="font-mono text-slate-600 text-xs font-bold">{maxLoginAttempts} lần</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={10}
                  step={1}
                  value={maxLoginAttempts}
                  onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">Khóa tạm thời địa chỉ IP nếu vượt quá giới hạn</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="p-5 rounded-md bg-white border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Nhật ký Kiểm toán Hệ thống</h2>
              <p className="text-xs text-slate-500">
                Ghi nhận các hoạt động đồng thuận và thao tác quan trọng trên hệ thống.
              </p>
            </div>
            <button
              onClick={loadAuditLogs}
              disabled={loadingAudit}
              className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loadingAudit ? 'animate-spin' : ''}`} strokeWidth={1.75} />
              <span>Làm mới</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold font-mono">
                <tr>
                  <th className="py-2.5 px-3">THỜI GIAN</th>
                  <th className="py-2.5 px-3">NGƯỜI DÙNG</th>
                  <th className="py-2.5 px-3">HÀNH ĐỘNG</th>
                  <th className="py-2.5 px-3 font-mono">ĐỊA CHỈ IP</th>
                  <th className="py-2.5 px-3 text-center">TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      {loadingAudit ? 'Đang tải dữ liệu kiểm toán...' : 'Chưa có bản ghi nhật ký kiểm toán nào.'}
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {log.actor}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                        {log.ipAddress}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Hợp lệ
                        </span>
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
