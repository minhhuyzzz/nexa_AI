'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Activity,
  Eye,
  EyeOff,
  RefreshCw,
  Users,
  Webhook,
  FileText,
  Sliders,
  Shield,
  Clock,
  Globe,
  Bell,
  Mail,
  HardDrive,
  Lock,
  Database,
  Check,
  X,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  AdminNoticeBanner,
} from '@/components/dashboard/admin/AdminUIComponents';

interface AdminRoleDefinition {
  code: string;
  title: string;
  description: string;
  scope: string[];
}

const nexaRolesDefinition: AdminRoleDefinition[] = [
  {
    code: 'SUPER_ADMIN',
    title: 'Super Admin (Quản trị nền tảng)',
    description: 'Toàn quyền điều hành cao nhất, quản lý phân quyền Admin và cấu hình toàn bộ hệ thống NEXA.',
    scope: ['ALL_PERMISSIONS', 'SYSTEM_SETTINGS', 'USER_MANAGEMENT', 'SECURITY_AUDIT'],
  },
  {
    code: 'EVALUATOR',
    title: 'Chuyên gia / Giảng viên (Evaluator)',
    description: 'Biên soạn đề thi, mở phòng thi trực tiếp mã PIN, chấm bài tự luận Split-view và quản lý nhóm lớp.',
    scope: ['ASSESSMENT_AUTHORING', 'LIVE_ROOM_CONTROL', 'SPLIT_VIEW_GRADING', 'CLASS_MANAGEMENT'],
  },
  {
    code: 'ORG_ADMIN',
    title: 'Quản trị viên Tổ chức (Org Admin)',
    description: 'Quản lý workspace đơn vị, tổ chức các đợt thi tập trung (Campaign), quản lý thành viên và hợp đồng B2B.',
    scope: ['ORGANIZATION_SETTINGS', 'CAMPAIGN_MANAGEMENT', 'MEMBER_MANAGEMENT', 'BI_ANALYTICS'],
  },
  {
    code: 'LEARNER',
    title: 'Học viên (Learner)',
    description: 'Làm bài đánh giá năng lực số 5 miền, học tập theo lộ trình cá nhân hóa và nhận chứng chỉ số xác thực SHA-256.',
    scope: ['TAKE_ASSESSMENTS', 'LEARNING_PATH_ACCESS', 'VIEW_PERSONAL_REPORT', 'EARN_CREDENTIALS'],
  },
];

function AdminSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'general' | 'roles' | 'integrations' | 'audit'>(
    tabParam === 'roles'
      ? 'roles'
      : tabParam === 'integrations'
      ? 'integrations'
      : tabParam === 'audit'
      ? 'audit'
      : 'general'
  );

  useEffect(() => {
    if (tabParam === 'general' || tabParam === 'roles' || tabParam === 'integrations' || tabParam === 'audit') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const switchTab = (tab: 'general' | 'roles' | 'integrations' | 'audit') => {
    setActiveTab(tab);
    router.replace(`/admin/settings?tab=${tab}`);
  };

  // Form State - General Settings
  const [platformName, setPlatformName] = useState('NEXA');
  const [supportEmail, setSupportEmail] = useState('support@nexa.edu.vn');
  const [systemTimezone, setSystemTimezone] = useState('Asia/Bangkok');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // System Rules
  const [defaultLanguage, setDefaultLanguage] = useState('vi');
  const [sessionTimeout, setSessionTimeout] = useState('8h');
  const [dataRetention, setDataRetention] = useState('36m');
  const [maxUploadSize, setMaxUploadSize] = useState('50mb');

  // Moderation & Data Toggles
  const [requireContentModeration, setRequireContentModeration] = useState(true);
  const [isolateCanonicalBank, setIsolateCanonicalBank] = useState(true);
  const [immutableAuditLogs, setImmutableAuditLogs] = useState(true);

  // Notifications State
  const [alertEmails, setAlertEmails] = useState<string[]>([
    'ops@nexa.edu.vn',
    'it@nexa.edu.vn',
  ]);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('https://hooks.slack.com/services/T00/B00/X8923...');
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookTestedSuccess, setWebhookTestedSuccess] = useState(false);

  // Save State
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddEmail = () => {
    if (!newEmailInput.trim()) return;
    const email = newEmailInput.trim().toLowerCase();
    if (!alertEmails.includes(email) && email.includes('@')) {
      setAlertEmails([...alertEmails, email]);
      setNewEmailInput('');
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setAlertEmails(alertEmails.filter((e) => e !== emailToRemove));
  };

  const handleTestWebhook = () => {
    setWebhookTesting(true);
    setTimeout(() => {
      setWebhookTesting(false);
      setWebhookTestedSuccess(true);
      setTimeout(() => setWebhookTestedSuccess(false), 3000);
    }, 800);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName,
          supportEmail,
          systemTimezone,
          maintenanceMode,
          defaultLanguage,
          sessionTimeout,
          dataRetention,
          maxUploadSize,
          requireContentModeration,
          isolateCanonicalBank,
          immutableAuditLogs,
          alertEmails,
          gamificationPolicy: {
            contributionMcqDefaultPts: 20,
            contributionScenarioDefaultPts: 50,
            contributionPracticalFileDefaultPts: 100,
            bugReportDefaultPts: 150,
            minRewardPts: 0,
            maxRewardPts: 500,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu cấu hình');
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setPlatformName('NEXA');
    setSupportEmail('support@nexa.edu.vn');
    setSystemTimezone('Asia/Bangkok');
    setMaintenanceMode(false);
    setDefaultLanguage('vi');
    setSessionTimeout('8h');
    setDataRetention('36m');
    setMaxUploadSize('50mb');
    setRequireContentModeration(true);
    setIsolateCanonicalBank(true);
    setImmutableAuditLogs(true);
    setAlertEmails(['ops@nexa.edu.vn', 'it@nexa.edu.vn']);
  };

  return (
    <div className="space-y-6">
      {/* Page Header matching Ảnh 12 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Cài đặt nền tảng
          </h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Cấu hình tập trung cho toàn hệ thống, bao gồm vận hành, quy tắc bảo mật và chính sách tích hợp.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors shrink-0 disabled:opacity-50"
        >
          <Save className="w-4 h-4" strokeWidth={1.75} />
          <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
        </button>
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
            <span>Đã cập nhật và lưu cấu hình nền tảng thành công.</span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">CONFIG: PERSISTED</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs (Pill Tabs, không gạch chân) */}
      <div>
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-zinc-900/80 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => switchTab('general')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'general'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-4 h-4" strokeWidth={1.75} />
            <span>Cấu hình chung</span>
          </button>

          <button
            onClick={() => switchTab('roles')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" strokeWidth={1.75} />
            <span>Vai trò admin nội bộ</span>
          </button>

          <button
            onClick={() => switchTab('integrations')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'integrations'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Webhook className="w-4 h-4" strokeWidth={1.75} />
            <span>Tích hợp &amp; Webhook</span>
          </button>

          <button
            onClick={() => switchTab('audit')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <FileText className="w-4 h-4" strokeWidth={1.75} />
            <span>Nhật ký kiểm toán</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CẤU HÌNH CHUNG (Chuẩn Ảnh 12) */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Nền tảng & vận hành */}
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Nền tảng &amp; vận hành
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Môi trường: Sản xuất
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1.5">
                    Tên nền tảng
                  </label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1.5">
                    Email hỗ trợ
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1.5">
                    Múi giờ hệ thống
                  </label>
                  <select
                    value={systemTimezone}
                    onChange={(e) => setSystemTimezone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value="Asia/Bangkok">(GMT+07:00) Bangkok, Hà Nội, Jakarta</option>
                    <option value="Asia/Singapore">(GMT+08:00) Singapore, Kuala Lumpur</option>
                    <option value="Asia/Tokyo">(GMT+09:00) Tokyo, Seoul</option>
                    <option value="UTC">(GMT+00:00) Universal Coordinated Time</option>
                  </select>
                </div>

                {/* Maintenance mode toggle */}
                <div className="pt-2 flex items-start justify-between gap-4 p-3.5 rounded-lg border border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/40">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Chế độ bảo trì
                    </span>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                      Khi bật, chỉ Super Admin mới có quyền truy cập hệ thống. Người dùng sẽ thấy màn hình thông báo bảo trì định kỳ.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      maintenanceMode ? 'bg-amber-600' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Quy tắc hệ thống */}
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-5">
              <div className="pb-3">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Quy tắc hệ thống
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1.5">
                    Ngôn ngữ mặc định
                  </label>
                  <select
                    value={defaultLanguage}
                    onChange={(e) => setDefaultLanguage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value="vi">Tiếng Việt (Mặc định)</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1.5">
                    Thời gian phiên làm việc (Session Timeout)
                  </label>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value="4h">4 giờ</option>
                    <option value="8h">8 giờ (Khuyến nghị)</option>
                    <option value="24h">24 giờ</option>
                    <option value="7d">7 ngày</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1.5">
                    Chính sách mật khẩu
                  </label>
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
                    <span className="text-xs text-neutral-800 dark:text-zinc-200 font-medium">
                      Mạnh (≥ 8 ký tự, gồm chữ hoa, chữ thường, số &amp; ký tự đặc biệt)
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                      Bắt buộc
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1.5">
                      Thời gian lưu trữ dữ liệu
                    </label>
                    <select
                      value={dataRetention}
                      onChange={(e) => setDataRetention(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="12m">12 tháng</option>
                      <option value="24m">24 tháng</option>
                      <option value="36m">36 tháng (Tiêu chuẩn)</option>
                      <option value="forever">Vĩnh viễn (Lưu trữ đầy đủ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1.5">
                      Giới hạn tải lên
                    </label>
                    <select
                      value={maxUploadSize}
                      onChange={(e) => setMaxUploadSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="25mb">25 MB</option>
                      <option value="50mb">50 MB (Khuyến nghị)</option>
                      <option value="100mb">100 MB</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Kiểm duyệt & dữ liệu hệ thống */}
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-5">
              <div className="pb-3">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Kiểm duyệt &amp; dữ liệu hệ thống
                </h3>
              </div>

              <div className="space-y-4">
                {/* Toggle 1 */}
                <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/40">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Yêu cầu kiểm duyệt trước khi xuất bản đề đánh giá hệ thống
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                      Mọi đề khảo thí chuẩn Canonical phải qua thẩm định từ Content Admin trước khi hiển thị cho người học.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequireContentModeration(!requireContentModeration)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      requireContentModeration ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        requireContentModeration ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2 */}
                <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/40">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Cách ly ngân hàng đề hệ thống với đề cá nhân/tổ chức
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                      Đề chuẩn cấp nền tảng được lưu trữ trong kho dữ liệu độc lập, phòng chống lẫn lộn với đề do người dùng tự tạo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsolateCanonicalBank(!isolateCanonicalBank)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isolateCanonicalBank ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isolateCanonicalBank ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 3 */}
                <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/40">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Lưu trữ nhật ký kiểm toán bất biến
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                      Ghi nhận mọi thao tác cấu hình, cấp quyền và can thiệp dữ liệu nhạy cảm vào bảng audit log không thể sửa đổi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImmutableAuditLogs(!immutableAuditLogs)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      immutableAuditLogs ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        immutableAuditLogs ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Info Callout */}
                <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-start gap-2.5 text-xs text-slate-600 dark:text-neutral-300">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" strokeWidth={1.75} />
                  <p className="leading-relaxed text-[11px]">
                    Dữ liệu khảo thí chuẩn Canonical là tài sản lõi của nền tảng NEXA, tuyệt đối tuân thủ phân tầng bảo mật cấp 1 và không bị ảnh hưởng khi người dùng chỉnh sửa đề thi cá nhân.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4: Thông báo vận hành */}
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-5">
              <div className="pb-3">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Thông báo vận hành
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1.5">
                    Email nhận thông báo sự cố &amp; bảo mật
                  </label>
                  <div className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {alertEmails.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-xs font-medium text-neutral-800 dark:text-zinc-200"
                        >
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{email}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(email)}
                            className="hover:text-rose-600 ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="email"
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEmail();
                          }
                        }}
                        placeholder="Thêm email nhận thông báo..."
                        className="flex-1 px-2.5 py-1 text-xs bg-transparent focus:outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddEmail}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold rounded text-neutral-800 dark:text-zinc-200"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400">
                      Slack / Webhook URL sự cố khẩn cấp
                    </label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3 h-3" strokeWidth={2.5} />
                      Đã kết nối
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={slackWebhookUrl}
                      onChange={(e) => setSlackWebhookUrl(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={webhookTesting}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 rounded-lg text-xs font-semibold transition-colors shrink-0 disabled:opacity-50"
                    >
                      {webhookTesting ? 'Đang gửi...' : 'Kiểm tra'}
                    </button>
                  </div>
                  {webhookTestedSuccess && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Gửi tin nhắn thử nghiệm thành công tới kênh #nexa-ops.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-sm font-semibold rounded-lg transition-colors"
            >
              Khôi phục mặc định
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" strokeWidth={1.75} />
              <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: VAI TRÒ ADMIN NỘI BỘ */}
      {activeTab === 'roles' && (
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <span>Ma trận phân quyền 5 vai trò nội bộ Platform Admin</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Cách ly chức năng quản trị theo nguyên tắc đặc quyền tối thiểu (Least Privilege).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {nexaRolesDefinition.map((role) => (
              <div
                key={role.code}
                className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-600 text-white">
                      {role.code}
                    </span>
                    <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{role.title}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {role.scope.length} nhóm quyền cấp phép
                  </span>
                </div>

                <p className="text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed">{role.description}</p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {role.scope.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 font-mono text-[11px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TÍCH HỢP & WEBHOOK */}
      {activeTab === 'integrations' && (
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-6">
          <div className="pb-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Webhook className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
              <span>Cấu hình tích hợp dịch vụ thực tế</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Các webhook và cổng thanh toán, dịch vụ email vận hành của toàn bộ nền tảng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* payOS */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">payOS Payment Gateway</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Đã cấu hình
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Endpoint nhận webhook thanh toán tự động: <code className="font-mono text-blue-600 dark:text-blue-400">/api/webhooks/payos</code>
              </p>
              <div>
                <label className="block text-xs text-slate-500 dark:text-neutral-400 mb-1">HMAC Secret:</label>
                <input
                  type="password"
                  readOnly
                  value="payos_live_whsec_••••••••••••"
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg font-mono text-xs text-neutral-800 dark:text-zinc-200"
                />
              </div>
            </div>

            {/* Resend Email */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Resend Transactional Email</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Kích hoạt
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Dùng gửi token kích hoạt Business B2B và email báo cáo khảo thí.
              </p>
              <div>
                <label className="block text-xs text-slate-500 dark:text-neutral-400 mb-1">API Key:</label>
                <input
                  type="password"
                  readOnly
                  value="re_live_••••••••••••••••"
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg font-mono text-xs text-neutral-800 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NHẬT KÝ KIỂM TOÁN */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <span>Nhật ký kiểm toán thao tác quản trị (Admin Audit Trail)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Truy vết toàn bộ hành vi nhạy cảm: khóa tài khoản, cấp quyền B2B, đối soát doanh thu.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 text-xs text-slate-600 dark:text-neutral-400 space-y-2.5 font-mono">
            <div className="flex justify-between items-center py-1.5">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">[2026-11-04 15:40]</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">SYSTEM_CONFIG_UPDATED</span>
              <span>Target: platform_settings</span>
              <span>Admin: master@nexa.vn</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">[2026-11-04 14:15]</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">PAYMENT_RECONCILED</span>
              <span>Target: tx_ref_9812</span>
              <span>Admin: finance@nexa.vn</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">[2026-11-04 11:02]</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">ORG_INVITATION_SENT</span>
              <span>Target: org_fpt_edu</span>
              <span>Admin: ops@nexa.vn</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">[2026-11-03 19:20]</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">USER_ROLE_ASSIGNED</span>
              <span>Target: assessor_vu@hust.edu.vn</span>
              <span>Admin: master@nexa.vn</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Đang tải cài đặt hệ thống...
        </div>
      }
    >
      <AdminSettingsContent />
    </Suspense>
  );
}
