'use client';

import { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Cpu,
  Mail,
  Database,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Bell,
  HardDrive,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [isSaved, setIsSaved] = useState(false);

  // Platform general settings
  const [platformName, setPlatformName] = useState('NEXA Digital Competency Platform');
  const [supportEmail, setSupportEmail] = useState('hotro@nexa.vn');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  // AI Parameters
  const [primaryAiModel, setPrimaryAiModel] = useState('gemini-2.5-flash');
  const [confidenceGreenThreshold, setConfidenceGreenThreshold] = useState(80);
  const [confidenceYellowThreshold, setConfidenceYellowThreshold] = useState(60);
  const [strictPiiScrub, setStrictPiiScrub] = useState(true);
  const [aiTimeoutSeconds, setAiTimeoutSeconds] = useState(30);

  // Security
  const [require2faForStaff, setRequire2faForStaff] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(60);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);

  // Email SMTP
  const [smtpHost, setSmtpHost] = useState('smtp.sendgrid.net');
  const [smtpPort, setSmtpPort] = useState(587);
  const [senderName, setSenderName] = useState('NEXA Assessment System');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              HẠ TẦNG &amp; THÔNG SỐ
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cài Đặt Hệ Thống &amp; Tham Số Vận Hành
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị cấu hình toàn cục, chính sách kích hoạt AI on-demand, ngưỡng tin cậy chấm điểm và an toàn dữ liệu.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Save className="w-4 h-4" strokeWidth={2} />
          <span>Lưu cấu hình</span>
        </button>
      </div>

      {/* Success banner */}
      {isSaved && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Đã cập nhật toàn bộ tham số hệ thống thành công. Các thay đổi có hiệu lực ngay lập tức.</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono">STATUS: SYNCED</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: General Platform Settings */}
        <div className="p-5 rounded-md border border-slate-200 bg-white space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900">1. Thông Tin Chung Nền Tảng</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Tên hiển thị hệ thống:
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Email tiếp nhận hỗ trợ &amp; kỹ thuật:
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">Cho phép tự đăng ký tài khoản tự do</div>
                <div className="text-[11px] text-slate-500">Người học và người đánh giá có thể tự tạo tài khoản qua trang /register</div>
              </div>
              <input
                type="checkbox"
                checked={allowRegistration}
                onChange={(e) => setAllowRegistration(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">Chế độ bảo trì hệ thống (Maintenance Mode)</div>
                <div className="text-[11px] text-slate-500">Tạm khóa truy cập làm bài đối với người học, chỉ cho phép Quản trị viên truy cập</div>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </label>
          </div>
        </div>

        {/* Section 2: AI Engine & Confidence Rules */}
        <div className="p-5 rounded-md border border-slate-200 bg-white space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Cpu className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900">2. Tham Số Chấm Điểm AI &amp; Độ Tin Cậy (Confidence)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Mô hình AI chủ lực (AI Adapter):
              </label>
              <select
                value={primaryAiModel}
                onChange={(e) => setPrimaryAiModel(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-mono"
              >
                <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Khuyến nghị)</option>
                <option value="gemini-2.5-pro">Google Gemini 2.5 Pro (Chuyên sâu)</option>
                <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Ngưỡng Tin Cậy Cao (Xanh lá &ge; %):
              </label>
              <input
                type="number"
                min={70}
                max={95}
                value={confidenceGreenThreshold}
                onChange={(e) => setConfidenceGreenThreshold(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-400">Mặc định: 80% trở lên</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Ngưỡng Cần Thẩm Định Lại (Vàng &lt; %):
              </label>
              <input
                type="number"
                min={40}
                max={75}
                value={confidenceYellowThreshold}
                onChange={(e) => setConfidenceYellowThreshold(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-400">Dưới ngưỡng này gắn cờ đỏ cho Chuyên gia</span>
            </div>
          </div>

          <div className="p-3 rounded-md bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">Bắt buộc khử sạch PII (Sanitization) trước khi đẩy vào AI</div>
              <div className="text-[11px] text-slate-500">Mã hóa email, tên thật, CCCD thành token ngẫu nhiên trước khi gửi tới API</div>
            </div>
            <input
              type="checkbox"
              checked={strictPiiScrub}
              onChange={(e) => setStrictPiiScrub(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Section 3: Security & Session Policy */}
        <div className="p-5 rounded-md border border-slate-200 bg-white space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900">3. Chính Sách Bảo Mật &amp; Phiên Làm Việc</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Thời gian timeout phiên làm việc (phút):
              </label>
              <input
                type="number"
                min={15}
                max={240}
                value={sessionTimeoutMinutes}
                onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Giới hạn đăng nhập sai liên tiếp:
              </label>
              <input
                type="number"
                min={3}
                max={10}
                value={maxLoginAttempts}
                onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-400">Khóa tạm thời 15 phút nếu vượt quá</span>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2.5 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={require2faForStaff}
                  onChange={(e) => setRequire2faForStaff(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                />
                <div>
                  <div className="font-semibold text-slate-900">Bắt buộc 2FA</div>
                  <div className="text-[11px] text-slate-500">Dành cho Evaluator &amp; Admin</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Storage & Database Health */}
        <div className="p-5 rounded-md border border-slate-200 bg-white space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Database className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900">4. Cơ Sở Dữ Liệu &amp; Lưu Trữ Minh Chứng</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200/80">
              <div className="text-slate-500 text-[11px]">PostgreSQL Database (Supabase)</div>
              <div className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Kết nối ổn định (Latency 18ms)
              </div>
            </div>

            <div className="p-3 rounded-md bg-slate-50 border border-slate-200/80">
              <div className="text-slate-500 text-[11px]">Storage Bucket (Evidence / Files)</div>
              <div className="text-sm font-bold text-slate-800 mt-1">
                1.82 TB / 10 TB cấp phép
              </div>
            </div>

            <div className="p-3 rounded-md bg-slate-50 border border-slate-200/80">
              <div className="text-slate-500 text-[11px]">Sao lưu tự động (Daily Backup)</div>
              <div className="text-sm font-bold text-slate-800 mt-1 font-mono">
                02:00 UTC+7 mỗi ngày
              </div>
            </div>
          </div>
        </div>

        {/* Action Button at bottom */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setPlatformName('NEXA Digital Competency Platform');
              setPrimaryAiModel('gemini-2.5-flash');
            }}
            className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
          >
            Khôi phục mặc định
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors shadow-xs"
          >
            Lưu toàn bộ thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}
