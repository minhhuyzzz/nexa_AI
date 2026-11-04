'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Shield,
  Key,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Mail,
  Sliders,
  FileText,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  MessageSquare,
  Lock,
  UserCheck,
  Check,
  RotateCcw,
} from 'lucide-react';

interface OrgSettingsViewProps {
  org: {
    id: string;
    name: string;
    slug: string;
    type?: string | null;
    code?: string | null;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    created_at?: string | null;
    is_active?: boolean;
    max_members?: number | null;
    quota_assessments?: number | null;
  };
  currentMembers: number;
  userRole: string;
  isManager: boolean;
}

export function OrgSettingsView({
  org,
  currentMembers,
  userRole,
  isManager,
}: OrgSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'join-mechanism' | 'allowlist' | 'policy' | 'feedback'>('profile');

  // Policy state
  const [domains, setDomains] = useState<string[]>([]);
  const [initialDomains, setInitialDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');

  const [tabSwitchAlert, setTabSwitchAlert] = useState(true);
  const [autoSubmitTimeout, setAutoSubmitTimeout] = useState(true);
  const [requireApprovalForJoinCode, setRequireApprovalForJoinCode] = useState(false);
  const [enablePinJoin, setEnablePinJoin] = useState(true);

  const [initialTabSwitchAlert, setInitialTabSwitchAlert] = useState(true);
  const [initialAutoSubmit, setInitialAutoSubmit] = useState(true);
  const [initialRequireApproval, setInitialRequireApproval] = useState(false);
  const [initialEnablePinJoin, setInitialEnablePinJoin] = useState(true);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Feedback form state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    async function loadPolicies() {
      try {
        const res = await fetch(`/api/org/${org.slug}/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.policy) {
            const loadedDomains = data.policy.allowed_domains || [];
            const loadedCheat = Boolean(data.policy.anti_cheat_enabled);
            const loadedFull = Boolean(data.policy.fullscreen_enforced);

            setDomains(loadedDomains);
            setInitialDomains(loadedDomains);
            setTabSwitchAlert(loadedCheat);
            setInitialTabSwitchAlert(loadedCheat);
            setAutoSubmitTimeout(loadedFull);
            setInitialAutoSubmit(loadedFull);
          }
        }
      } catch (err) {
        console.warn('Failed to load org policies:', err);
      }
    }
    loadPolicies();
  }, [org.slug]);

  // Dirty state calculation
  const isDirty =
    JSON.stringify(domains) !== JSON.stringify(initialDomains) ||
    tabSwitchAlert !== initialTabSwitchAlert ||
    autoSubmitTimeout !== initialAutoSubmit ||
    requireApprovalForJoinCode !== initialRequireApproval ||
    enablePinJoin !== initialEnablePinJoin;

  const handleReset = () => {
    setDomains(initialDomains);
    setTabSwitchAlert(initialTabSwitchAlert);
    setAutoSubmitTimeout(initialAutoSubmit);
    setRequireApprovalForJoinCode(initialRequireApproval);
    setEnablePinJoin(initialEnablePinJoin);
  };

  const handleAddDomain = () => {
    const trimmed = newDomain.trim().toLowerCase().replace(/^@/, '');
    if (trimmed && !domains.includes(trimmed)) {
      setDomains([...domains, trimmed]);
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setDomains(domains.filter((d) => d !== domainToRemove));
  };

  const handleSavePolicy = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/org/${org.slug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowed_domains: domains,
          anti_cheat_enabled: tabSwitchAlert,
          fullscreen_enforced: autoSubmitTimeout,
        }),
      });
      if (res.ok) {
        setInitialDomains(domains);
        setInitialTabSwitchAlert(tabSwitchAlert);
        setInitialAutoSubmit(autoSubmitTimeout);
        setInitialRequireApproval(requireApprovalForJoinCode);
        setInitialEnablePinJoin(enablePinJoin);

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
      }
    } catch (err) {
      console.error('Error saving org policy:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: org.id,
          category: 'FEATURE_REQUEST',
          subject: `Góp ý từ tổ chức ${org.name}`,
          content: feedbackText.trim(),
        }),
      });
      if (res.ok) {
        setFeedbackSent(true);
        setTimeout(() => {
          setFeedbackSent(false);
          setFeedbackText('');
        }, 2500);
      }
    } catch (err) {
      console.error('Error sending feedback:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-zinc-800">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Cài đặt Tổ chức
        </h1>
      </div>

      {!isManager && (
        <div className="p-3.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="font-semibold">Chế độ xem thông tin (Chỉ đọc)</p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              Bạn đang ở vai trò <span className="font-mono font-bold">{userRole}</span>. Chỉ Quản trị viên (ORG_ADMIN) hoặc Chủ sở hữu (ORG_OWNER) mới có quyền lưu thay đổi cấu hình.
            </p>
          </div>
        </div>
      )}

      {/* Main 2-Column Vertical Layout (Spec V4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Category Navigation List (3 cols) */}
        <div className="lg:col-span-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-2 space-y-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-semibold transition-colors cursor-pointer text-left ${
              activeTab === 'profile'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-850'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Thông tin đơn vị</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('join-mechanism')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-semibold transition-colors cursor-pointer text-left ${
              activeTab === 'join-mechanism'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-850'
            }`}
          >
            <Key className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Cơ chế gia nhập &amp; PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('allowlist')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-semibold transition-colors cursor-pointer text-left ${
              activeTab === 'allowlist'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-850'
            }`}
          >
            <Mail className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Miền Email (Allowlist)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('policy')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-semibold transition-colors cursor-pointer text-left ${
              activeTab === 'policy'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-850'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Chính sách khảo thí</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-semibold transition-colors cursor-pointer text-left ${
              activeTab === 'feedback'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-850'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Góp ý &amp; Phản hồi</span>
          </button>
        </div>

        {/* Right Column: Settings Form Canvas (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Thông tin Định danh Đơn vị
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  {org.is_active ? 'Đang hoạt động' : 'Tạm ngưng'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 dark:text-neutral-400 font-medium mb-1.5">
                    Tên Tổ chức / Đơn vị
                  </label>
                  <input
                    type="text"
                    readOnly
                    defaultValue={org.name}
                    className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-neutral-400 font-medium mb-1.5">
                    Mã định danh URL (Slug)
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400 border border-r-0 border-slate-200 dark:border-zinc-800 rounded-l font-mono text-[11px]">
                      /org/
                    </span>
                    <input
                      type="text"
                      readOnly
                      defaultValue={org.slug}
                      className="w-full px-3 py-2 rounded-r border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 font-mono font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-neutral-400 font-medium mb-1.5">
                    Mã đơn vị (Org Code)
                  </label>
                  <input
                    type="text"
                    readOnly
                    defaultValue={org.code || 'CHƯA_CẤP'}
                    className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 font-mono font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-neutral-400 font-medium mb-1.5">
                    Loại hình tổ chức
                  </label>
                  <input
                    type="text"
                    readOnly
                    defaultValue={
                      org.type === 'EDUCATIONAL'
                        ? 'Trường học / Cơ sở Đào tạo'
                        : org.type === 'GOVERNMENT'
                        ? 'Cơ quan Quản lý / Nhà nước'
                        : 'Doanh nghiệp / Tập đoàn'
                    }
                    className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JOIN MECHANISM */}
          {activeTab === 'join-mechanism' && (
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-6 space-y-5 shadow-xs">
              <div className="pb-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Cơ Chế Tham Gia &amp; Mã PIN Đơn Vị
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Kiểm soát cách nhân sự, học viên tìm kiếm và gia nhập tổ chức.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                      Cho phép tham gia bằng Mã Đơn Vị / Mã PIN
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 max-w-lg leading-relaxed">
                      Khi bật, người dùng có thể nhập mã <code className="font-mono font-bold text-blue-600 dark:text-blue-400">{org.code || org.slug.toUpperCase()}</code> tại trang /join để yêu cầu gia nhập.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePinJoin}
                    onChange={(e) => setEnablePinJoin(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                      Bắt buộc Quản trị viên duyệt (Approval Required)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 max-w-lg leading-relaxed">
                      Mọi yêu cầu tham gia qua mã PIN sẽ vào Hàng chờ phê duyệt (`/org/{org.slug}/members`) thay vì tự động kích hoạt tài khoản.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireApprovalForJoinCode}
                    onChange={(e) => setRequireApprovalForJoinCode(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALLOWLIST */}
          {activeTab === 'allowlist' && (
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-6 space-y-5 shadow-xs">
              <div className="pb-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Danh Sách Tên Miền Email Hợp Lệ (Allowlist)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Chỉ những người dùng sở hữu email thuộc các miền này mới được gia nhập tổ chức.
                </p>
              </div>

              {isManager && (
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDomain())}
                    placeholder="VD: poly.edu.vn hoặc company.com"
                    className="flex-1 h-9 px-3 text-xs rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddDomain}
                    className="h-9 px-3.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm miền</span>
                  </button>
                </div>
              )}

              <div className="space-y-2 pt-2">
                {domains.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-neutral-500 italic">
                    Chưa thiết lập miền email. Mọi địa chỉ email hợp lệ đều có thể tham gia nếu được mời.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {domains.map((dom) => (
                      <span
                        key={dom}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-neutral-200 text-xs font-mono font-medium border border-slate-200 dark:border-zinc-700"
                      >
                        @{dom}
                        {isManager && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDomain(dom)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            aria-label={`Xóa miền ${dom}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: POLICY */}
          {activeTab === 'policy' && (
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-6 space-y-5 shadow-xs">
              <div className="pb-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Chính Sách Khảo Thí &amp; Giám Sát Chống Gian Lận
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Thiết lập quy chế làm bài thi chuẩn hóa cho các đợt đánh giá thuộc tổ chức.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                      Cảnh báo chuyển tab khi làm bài thi
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 max-w-lg leading-relaxed">
                      Ghi nhận số lần học viên rời khỏi màn hình bài thi và hiển thị cảnh báo vi phạm quy chế.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={tabSwitchAlert}
                    onChange={(e) => setTabSwitchAlert(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                      Tự động nộp bài khi hết giờ (Auto-submit)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 max-w-lg leading-relaxed">
                      Hệ thống tự động khóa và gửi bài nộp khi đồng hồ đếm ngược của đợt thi về 00:00.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSubmitTimeout}
                    onChange={(e) => setAutoSubmitTimeout(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FEEDBACK */}
          {activeTab === 'feedback' && (
            <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-lg p-6 space-y-5 shadow-xs">
              <div className="pb-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Đóng Góp Ý Kiến &amp; Yêu Cầu Tính Năng
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Gửi phản hồi trực tiếp tới đội ngũ phát triển sản phẩm NEXA AI.
                </p>
              </div>

              <form onSubmit={handleSendFeedback} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1.5">
                    Nội dung ý kiến
                  </label>
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Mô tả tính năng hoặc đề xuất cải tiến cho không gian tổ chức của bạn..."
                    className="w-full p-3 rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Gửi ý kiến đóng góp
                  </button>
                  {feedbackSent && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Đã gửi phản hồi thành công!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Sticky Dirty State Bar */}
          {isDirty && isManager && (
            <div className="sticky bottom-4 z-40 p-4 rounded-lg bg-[#111726] text-white border border-blue-500/30 shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium text-slate-200">
                  Bạn có các thay đổi cấu hình chưa được lưu.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition cursor-pointer"
                >
                  Hoàn tác
                </button>
                <button
                  type="button"
                  onClick={handleSavePolicy}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Đang lưu...</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {isSaved && (
            <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã lưu thành công cấu hình tổ chức!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
