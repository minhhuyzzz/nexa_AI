'use client';

import { useState, useEffect } from 'react';
import {
  Cpu,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Key,
  Layers,
  Sparkles,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';

interface FlowConfig {
  enabled: boolean;
  model: string;
  name?: string;
  description?: string;
}

interface AIGatewayState {
  provider: 'GOOGLE_GEMINI' | 'ANTHROPIC_CLAUDE' | 'OPENAI';
  apiKey: string;
  maskedApiKey: string;
  hasApiKey: boolean;
  defaultModel: string;
  flows: {
    rubricGrading: FlowConfig;
    competencyAnalysis: FlowConfig;
  };
  updatedAt?: string;
}

const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    tag: 'Khuyên Dùng • Ổn Định',
    latency: '~2.8s',
    cost: 'Miễn phí / Tối ưu',
    desc: 'Tốc độ phản hồi vượt trội, chuẩn xác cao theo Rubric 100%, tỷ lệ chịu tải ổn định nhất.',
    isRecommended: true,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: 'Thế Hệ Mới Nhất',
    latency: '~3.2s',
    cost: 'Miễn phí / Tối ưu',
    desc: 'Model thế hệ tiếp theo của Google, tối ưu hóa suy luận bối cảnh dài và chẩn đoán sư phạm.',
    isRecommended: false,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    tag: 'Chuyên Sâu (Complex)',
    latency: '~6.5s',
    cost: 'Tiêu chuẩn Pro',
    desc: 'Lập luận chuyên sâu, phù hợp cho bài khảo thí chuyên gia và thẩm định chéo nâng cao.',
    isRecommended: false,
  },
];

export default function AdminAIGatewayPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState<AIGatewayState>({
    provider: 'GOOGLE_GEMINI',
    apiKey: '',
    maskedApiKey: '',
    hasApiKey: false,
    defaultModel: 'gemini-3.5-flash',
    flows: {
      rubricGrading: {
        enabled: true,
        model: 'gemini-3.5-flash',
        name: 'Chấm Rubric & Đánh giá Minh chứng',
      },
      competencyAnalysis: {
        enabled: true,
        model: 'gemini-3.5-flash',
        name: 'Phân tích Năng lực & Đề xuất Lộ trình',
      },
    },
  });

  // Load config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/admin/ai-gateway');
        const data = await res.json();
        if (res.ok && data.success && data.config) {
          setForm({
            provider: data.config.provider || 'GOOGLE_GEMINI',
            apiKey: data.config.maskedApiKey || '',
            maskedApiKey: data.config.maskedApiKey || '',
            hasApiKey: data.config.hasApiKey || false,
            defaultModel: data.config.defaultModel || 'gemini-3.5-flash',
            flows: {
              rubricGrading: {
                enabled: data.config.flows?.rubricGrading?.enabled ?? true,
                model: data.config.flows?.rubricGrading?.model || 'gemini-3.5-flash',
                name: 'Chấm Rubric & Đánh giá Minh chứng',
              },
              competencyAnalysis: {
                enabled: data.config.flows?.competencyAnalysis?.enabled ?? true,
                model: data.config.flows?.competencyAnalysis?.model || 'gemini-3.5-flash',
                name: 'Phân tích Năng lực & Đề xuất Lộ trình',
              },
            },
            updatedAt: data.config.updatedAt,
          });
        }
      } catch (err) {
        console.error('Error fetching AI Gateway config:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/ai-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: form.provider,
          apiKey: form.apiKey,
          defaultModel: form.defaultModel,
          flows: form.flows,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lưu cấu hình thất bại');
      }

      setForm((prev) => ({
        ...prev,
        maskedApiKey: data.config.maskedApiKey,
        hasApiKey: data.config.hasApiKey,
        apiKey: data.config.maskedApiKey,
        updatedAt: data.config.updatedAt,
      }));

      setStatusMessage({
        type: 'success',
        text: 'Đã lưu cấu hình thành công! Tất cả luồng AI đã được áp dụng model mới ngay lập tức.',
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi không xác định',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/ai/status');
      const data = await res.json();

      if (res.ok && data.connected) {
        setStatusMessage({
          type: 'success',
          text: `Kết nối thành công tới ${data.provider} (Model: ${data.model})! Độ trễ phản hồi: ${data.latencyMs ?? 'ổn định'}ms.`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `Kết nối thất bại: ${data.error || 'Không nhận được phản hồi từ AI'}`,
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi kiểm tra kết nối',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
        <p className="text-xs">Đang tải thông số cấu hình AI Gateway...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">
              HỆ THỐNG ĐIỀU PHỐI AI &amp; MÔ HÌNH
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản Trị Cổng Kết Nối AI (AI Gateway)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình nạp khóa API, lựa chọn mô hình áp dụng và phân bổ các luồng nghiệp vụ khảo thí thông minh trên nền tảng NEXA.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${testing ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            <span>{testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối Live'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" strokeWidth={1.75} />
            )}
            <span>{saving ? 'Đang lưu...' : 'Lưu & Áp dụng'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-md border text-xs font-medium flex items-center gap-2 shadow-xs animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Section 1: Nạp Khóa API & Chọn Nhà Cung Cấp */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Key className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Thiết Lập Khóa API Nhà Cung Cấp (API Key Management)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Provider Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Nhà cung cấp dịch vụ AI
            </label>
            <select
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value as AIGatewayState['provider'] })}
              className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
            >
              <option value="GOOGLE_GEMINI">Google Gemini (Khuyên dùng chính thức)</option>
              <option value="OPENAI">OpenAI (Dự phòng)</option>
              <option value="ANTHROPIC_CLAUDE">Anthropic Claude (Dự phòng)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              NEXA sử dụng SDK chính thức @google/genai với khả năng bảo mật cao.
            </p>
          </div>

          {/* API Key Input */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Khóa API (Secret Key)</span>
              {form.hasApiKey && (
                <span className="text-[10px] text-emerald-600 font-mono font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Đã nạp khóa hợp lệ
                </span>
              )}
            </label>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                placeholder={form.hasApiKey ? form.maskedApiKey : 'Dán khóa AI API Key vào đây (ví dụ: AQ.Ab8RN6...)'}
                className="w-full pl-3 pr-10 py-2 rounded-md border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                title={showKey ? 'Ẩn khóa' : 'Hiện khóa'}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Khóa API được lưu trữ an toàn trong máy chủ nội bộ và không bao giờ hiển thị công khai ra phía học viên.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Lựa Chọn Mô Hình Áp Dụng (Model Selection) */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Mô Hình AI Mặc Định Áp Dụng Toàn Hệ Thống
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Đang chọn: <strong className="text-sky-700">{form.defaultModel}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AVAILABLE_MODELS.map((m) => {
            const isSelected = form.defaultModel === m.id;

            return (
              <div
                key={m.id}
                onClick={() => {
                  setForm({
                    ...form,
                    defaultModel: m.id,
                    flows: {
                      rubricGrading: { ...form.flows.rubricGrading, model: m.id },
                      competencyAnalysis: { ...form.flows.competencyAnalysis, model: m.id },
                    },
                  });
                }}
                className={`p-4 rounded-md border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/40 ring-1 ring-sky-300 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                    {isSelected ? (
                      <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                        m.isRecommended
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {m.tag}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {m.desc}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Độ trễ: {m.latency}</span>
                  <span>{m.cost}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Phân Luồng Nghiệp Vụ Áp Dụng AI */}
      <div className="p-6 rounded-md bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Layers className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            3. Phân Luồng Nghiệp Vụ Áp Dụng AI (AI Workflows Routing)
          </h2>
        </div>

        <div className="space-y-4">
          {/* Flow 1: Rubric Grading */}
          <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs">
                  Luồng 1: Chấm Điểm Rubric Tự Luận &amp; Minh Chứng Thực Hành
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700">
                  /api/ai/grade-submission
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Được kích hoạt khi Người học hoặc Chuyên gia khảo thí bấm &quot;Chấm bằng AI&quot;. AI trích dẫn minh chứng và tính điểm Rubric 100%.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <select
                value={form.flows.rubricGrading.model}
                onChange={(e) =>
                  setForm({
                    ...form,
                    flows: {
                      ...form.flows,
                      rubricGrading: { ...form.flows.rubricGrading, model: e.target.value },
                    },
                  })
                }
                className="px-2.5 py-1.5 rounded border border-slate-200 text-xs text-slate-800 bg-white font-mono"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    flows: {
                      ...form.flows,
                      rubricGrading: {
                        ...form.flows.rubricGrading,
                        enabled: !form.flows.rubricGrading.enabled,
                      },
                    },
                  })
                }
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  form.flows.rubricGrading.enabled ? 'bg-sky-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    form.flows.rubricGrading.enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Flow 2: Competency Analysis */}
          <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs">
                  Luồng 2: Phân Tích Năng Lực 5 Miền &amp; Đề Xuất Lộ Trình 4 Bước
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700">
                  /api/ai/analyze-competency
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Được kích hoạt khi người học bấm nút nhận xét tại trang Lộ trình. AI phân tích điểm mạnh, khoảng trống &lt; 70% và gợi ý chuyên đề học tập.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <select
                value={form.flows.competencyAnalysis.model}
                onChange={(e) =>
                  setForm({
                    ...form,
                    flows: {
                      ...form.flows,
                      competencyAnalysis: { ...form.flows.competencyAnalysis, model: e.target.value },
                    },
                  })
                }
                className="px-2.5 py-1.5 rounded border border-slate-200 text-xs text-slate-800 bg-white font-mono"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    flows: {
                      ...form.flows,
                      competencyAnalysis: {
                        ...form.flows.competencyAnalysis,
                        enabled: !form.flows.competencyAnalysis.enabled,
                      },
                    },
                  })
                }
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  form.flows.competencyAnalysis.enabled ? 'bg-sky-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    form.flows.competencyAnalysis.enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Efficiency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Lock className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
            Bộ Lọc Khử Sạch Dữ Liệu Cá Nhân (Decree 13/2023 Compliance)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Mọi dữ liệu cá nhân như Email, Số điện thoại, CCCD/CMND đều được khử khuẩn tự động qua PIIScrubberService trước khi gửi sang adapter LLM bên ngoài.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-700 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Chính sách khử PII luôn được cưỡng chế 100% không thể tắt</span>
          </div>
        </div>

        <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Zap className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            Cơ Chế Kích Hoạt AI Theo Yêu Cầu (On-Demand Trigger)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Bài nộp được chấm tự động bằng thuật toán thuần (0.01s). AI chỉ được kích hoạt khi người dùng bấm nút yêu cầu trên giao diện, tiết kiệm tài nguyên và bảo vệ hạn ngạch.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-sky-700 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Tiết kiệm 95% chi phí API so với mô hình gọi tự động</span>
          </div>
        </div>
      </div>
    </div>
  );
}
