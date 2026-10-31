'use client';

import { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'allowlist' | 'policy' | 'contract'>('profile');

  // Allowlist state
  const [domains, setDomains] = useState<string[]>([
    'fpt.edu.vn',
    'fe.edu.vn',
  ]);
  const [newDomain, setNewDomain] = useState('');
  const [enforceAllowlist, setEnforceAllowlist] = useState(true);

  // Policy state
  const [tabSwitchAlert, setTabSwitchAlert] = useState(true);
  const [autoSubmitTimeout, setAutoSubmitTimeout] = useState(true);
  const [revealObjectiveScore, setRevealObjectiveScore] = useState(true);
  const [piiMasking, setPiiMasking] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Feedback form state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

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

  const handleSavePolicy = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedbackText('');
    }, 2500);
  };

  const hasMaxSeats = typeof org.max_members === 'number' && org.max_members > 0;
  const maxSeatsDisplay = hasMaxSeats ? `${org.max_members} ghế` : 'Không giới hạn';
  const seatPercent = hasMaxSeats
    ? Math.min(100, Math.round((currentMembers / org.max_members!) * 100))
    : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
          <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Cài đặt Không gian Tổ chức</span>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Cấu hình & Quản trị {org.name}
        </h1>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
          Quản lý thông tin định danh, miền email hợp lệ, chính sách khảo thí và hợp đồng dịch vụ.
        </p>
      </div>

      {!isManager && (
        <div className="p-3.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="font-semibold">Chế độ xem thông tin (Chỉ đọc)</p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              Bạn đang ở vai trò <span className="font-mono font-bold">{userRole}</span>. Chỉ Quản trị viên (ORG_ADMIN) hoặc Chủ sở hữu (ORG_OWNER) mới có quyền thay đổi cấu hình.
            </p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <Building2 className="w-4 h-4" strokeWidth={1.75} />
          <span>Thông tin đơn vị</span>
        </button>

        <button
          onClick={() => setActiveTab('allowlist')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === 'allowlist'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <Mail className="w-4 h-4" strokeWidth={1.75} />
          <span>Miền Email (Allowlist)</span>
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === 'policy'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <Sliders className="w-4 h-4" strokeWidth={1.75} />
          <span>Chính sách khảo thí</span>
        </button>

        <button
          onClick={() => setActiveTab('contract')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === 'contract'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <FileText className="w-4 h-4" strokeWidth={1.75} />
          <span>Hợp đồng & Đóng góp ý kiến</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-850">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Thông tin Định danh Đơn vị</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                {org.is_active ? 'Đang hoạt động' : 'Tạm ngưng'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-neutral-400 font-medium mb-1.5">Tên Tổ chức / Đơn vị</label>
                <input
                  type="text"
                  readOnly
                  defaultValue={org.name}
                  className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-neutral-400 font-medium mb-1.5">Mã định danh URL (Slug)</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-100 dark:bg-zinc-850 text-slate-500 dark:text-neutral-400 border border-r-0 border-slate-200 dark:border-zinc-800 rounded-l font-mono text-[11px]">
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
                <label className="block text-slate-500 dark:text-neutral-400 font-medium mb-1.5">Mã cơ quan / Đơn vị (Org Code)</label>
                <input
                  type="text"
                  readOnly
                  defaultValue={org.code || 'CHƯA_CẤP'}
                  className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 font-mono font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-neutral-400 font-medium mb-1.5">Loại hình tổ chức</label>
                <input
                  type="text"
                  readOnly
                  defaultValue={
                    org.type === 'EDUCATIONAL'
                      ? 'Trường học / Cơ sở Giáo dục & Đào tạo'
                      : org.type === 'GOVERNMENT'
                      ? 'Cơ quan Quản lý / Nhà nước'
                      : 'Doanh nghiệp / Tập đoàn'
                  }
                  className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-neutral-400 font-medium mb-1.5">Người đại diện / Đầu mối quản trị</label>
                <input
                  type="text"
                  readOnly
                  defaultValue={org.contact_name || 'Quản trị viên Tổ chức'}
                  className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-neutral-400 font-medium mb-1.5">Email liên hệ chính thức</label>
                <input
                  type="text"
                  readOnly
                  defaultValue={org.contact_email || '—'}
                  className="w-full px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-neutral-400 font-medium mb-1.5">Ngày khởi tạo không gian</label>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{org.created_at ? new Date(org.created_at).toLocaleDateString('vi-VN') : '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          {isManager && (
            <div className="bg-white dark:bg-[#111114] border border-rose-200 dark:border-rose-950/60 rounded-md p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-rose-100 dark:border-rose-950/40">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" strokeWidth={1.75} />
                <h2 className="text-sm font-bold text-rose-900 dark:text-rose-300">Vùng Quản trị Nhạy cảm (Danger Zone)</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-400">
                Các thao tác tạm ngưng hoặc hủy bỏ quyền truy cập tổ chức chỉ được thực hiện khi có yêu cầu bằng văn bản hoặc kết thúc hợp đồng dịch vụ.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Yêu cầu tạm ngưng Không gian</p>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Chuyển dữ liệu sang chế độ lưu trữ an toàn. Thành viên vẫn giữ tài khoản cá nhân.
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  title="Quyền hạn thuộc Platform Superadmin"
                  className="px-3.5 py-1.5 rounded bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 font-medium text-xs opacity-60 cursor-not-allowed"
                >
                  Yêu cầu Tạm ngưng
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Domain Allowlist */}
      {activeTab === 'allowlist' && (
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-850">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                Miền Email Cho Phép (Domain Allowlist)
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                Tự động xác thực thành viên khi đăng ký hoặc tham gia qua liên kết / mã mời của đơn vị.
              </p>
            </div>
          </div>

          {/* Toggle enforce */}
          <div className="flex items-center justify-between p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Bắt buộc xác thực miền email</p>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                Chỉ cho phép người dùng có email thuộc danh sách miền dưới đây được tham gia tổ chức.
              </p>
            </div>
            <button
              onClick={() => isManager && setEnforceAllowlist(!enforceAllowlist)}
              disabled={!isManager}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enforceAllowlist ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-300 dark:bg-zinc-700'
              } ${!isManager ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  enforceAllowlist ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Domain input */}
          {isManager && (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                  @
                </span>
                <input
                  type="text"
                  placeholder="ví dụ: fpt.edu.vn, hust.edu.vn"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDomain();
                    }
                  }}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>
              <button
                type="button"
                onClick={handleAddDomain}
                className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Thêm miền</span>
              </button>
            </div>
          )}

          {/* Domain list */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300">
              Danh sách miền đang áp dụng ({domains.length})
            </label>
            <div className="divide-y divide-slate-100 dark:divide-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-md">
              {domains.map((domain) => (
                <div key={domain} className="flex items-center justify-between p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                    <span className="font-mono font-medium text-neutral-800 dark:text-zinc-200">@{domain}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      Đã xác thực
                    </span>
                  </div>
                  {isManager && (
                    <button
                      onClick={() => handleRemoveDomain(domain)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition-colors"
                      title="Xóa miền"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Policy */}
      {activeTab === 'policy' && (
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-850">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                Chính Sách Khảo Thí Mặc Định
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                Các quy định khảo thí áp dụng tự động cho toàn bộ đợt thi (Campaign) và phòng thi trực tiếp của tổ chức.
              </p>
            </div>
            {isSaved && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã lưu cài đặt
              </span>
            )}
          </div>

          <div className="space-y-4 text-xs">
            {/* Policy item 1 */}
            <div className="flex items-start justify-between p-3.5 rounded-md border border-slate-200 dark:border-zinc-800">
              <div className="space-y-1 pr-4">
                <p className="font-bold text-neutral-900 dark:text-neutral-100">Giám sát chuyển tab (Tab-switching Proctoring)</p>
                <p className="text-slate-500 dark:text-neutral-400 text-[11px]">
                  Tự động phát hiện và ghi nhận nhật ký vi phạm mỗi khi thí sinh chuyển cửa sổ trình duyệt trong lúc làm bài.
                </p>
              </div>
              <input
                type="checkbox"
                checked={tabSwitchAlert}
                onChange={(e) => isManager && setTabSwitchAlert(e.target.checked)}
                disabled={!isManager}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1"
              />
            </div>

            {/* Policy item 2 */}
            <div className="flex items-start justify-between p-3.5 rounded-md border border-slate-200 dark:border-zinc-800">
              <div className="space-y-1 pr-4">
                <p className="font-bold text-neutral-900 dark:text-neutral-100">Tự động thu bài khi hết thời lượng (Auto-submit on timeout)</p>
                <p className="text-slate-500 dark:text-neutral-400 text-[11px]">
                  Hệ thống lập tức khóa quyền làm bài và nộp dữ liệu bài làm khi đồng hồ đếm ngược kết thúc.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoSubmitTimeout}
                onChange={(e) => isManager && setAutoSubmitTimeout(e.target.checked)}
                disabled={!isManager}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1"
              />
            </div>

            {/* Policy item 3 */}
            <div className="flex items-start justify-between p-3.5 rounded-md border border-slate-200 dark:border-zinc-800">
              <div className="space-y-1 pr-4">
                <p className="font-bold text-neutral-900 dark:text-neutral-100">Công bố điểm trắc nghiệm tức thì</p>
                <p className="text-slate-500 dark:text-neutral-400 text-[11px]">
                  Hiển thị điểm các câu hỏi khách quan cho thí sinh ngay sau khi bấm nộp bài. Phần tự luận chuyển vào hàng đợi chấm của giám khảo.
                </p>
              </div>
              <input
                type="checkbox"
                checked={revealObjectiveScore}
                onChange={(e) => isManager && setRevealObjectiveScore(e.target.checked)}
                disabled={!isManager}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1"
              />
            </div>

            {/* Policy item 4 */}
            <div className="flex items-start justify-between p-3.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <div className="space-y-1 pr-4">
                <p className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Ẩn danh thông tin cá nhân khi gửi AI (PII Masking)
                </p>
                <p className="text-slate-500 dark:text-neutral-400 text-[11px]">
                  Tự động loại bỏ họ tên, email, mã số sinh viên trước khi gửi câu trả lời tự luận sang mô hình AI để gợi ý chấm Rubric (Bắt buộc theo NĐ 13/2023/NĐ-CP).
                </p>
              </div>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-mono text-[10px] font-bold rounded border border-emerald-200 dark:border-emerald-800">
                BẮT BUỘC BẬT
              </span>
            </div>
          </div>

          {isManager && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSavePolicy}
                className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Lưu chính sách khảo thí</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Contract & Platform Feedback */}
      {activeTab === 'contract' && (
        <div className="space-y-6">
          {/* Contract details card */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-850">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Chi Tiết Hợp Đồng & Hạn Ngạch</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                B2B ENTERPRISE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Member Seats */}
              <div className="p-4 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                    Ghế thành viên (Member Seats)
                  </span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    {currentMembers} / {maxSeatsDisplay} {hasMaxSeats ? `(${seatPercent}%)` : ''}
                  </span>
                </div>
                {hasMaxSeats ? (
                  <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${seatPercent}%` }}
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Hợp đồng Enterprise không giới hạn số lượng thành viên tham gia.
                  </p>
                )}
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  {hasMaxSeats
                    ? `Tổ chức đã sử dụng ${currentMembers} chỗ trên tổng hạn mức ${org.max_members} thành viên theo hợp đồng.`
                    : `Hiện có ${currentMembers} thành viên đang hoạt động.`}
                </p>
              </div>

              {/* Assessment Quota */}
              <div className="p-4 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                    Hạn ngạch Khảo thí Đơn vị
                  </span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    {org.quota_assessments ? `${org.quota_assessments} bài` : 'Theo thỏa thuận hợp đồng'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full w-1/4" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Áp dụng cho các đợt thi đánh giá năng lực số 5 miền và kỳ thi trực tiếp có giám sát.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs border-t border-slate-100 dark:border-zinc-850">
              <span className="text-slate-500 dark:text-neutral-400">
                Cần nâng cấp hạn mức hoặc gia hạn thời gian hợp đồng?
              </span>
              <a
                href="mailto:enterprise@nexa.vn?subject=Yeu%20cau%20gia%20han%20hop%20dong%20NEXA"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
              >
                <span>Liên hệ chuyên viên B2B</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Platform Feedback Box */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-850">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Đóng Góp Ý Kiến Cho Đội Ngũ Sản Phẩm NEXA</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Ý kiến của quý đơn vị sẽ được gửi trực tiếp tới Platform Operations và Đội ngũ Phát triển sản phẩm.
                </p>
              </div>
            </div>

            {feedbackSent ? (
              <div className="p-4 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Cảm ơn quý đơn vị! Ý kiến đóng góp đã được tiếp nhận tại Trung tâm Truyền thông nền tảng.</span>
              </div>
            ) : (
              <form onSubmit={handleSendFeedback} className="space-y-3">
                <textarea
                  rows={4}
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Chia sẻ phản hồi, đề xuất tính năng mới hoặc yêu cầu hỗ trợ kỹ thuật từ tổ chức của bạn..."
                  className="w-full px-3 py-2 text-xs rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Gửi đóng góp ý kiến</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
