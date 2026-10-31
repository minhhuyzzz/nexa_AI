'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Mail,
  Copy,
  Check,
  Search,
  Shield,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
} from 'lucide-react';
import { BulkMemberImportModal } from '@/components/dashboard/org/BulkMemberImportModal';

export interface MemberItem {
  membershipId: string;
  userId: string;
  email: string;
  nickname: string;
  role: string;
  status: string;
  createdAt: string;
  isCurrentUser: boolean;
}

export interface MembershipRequestItem {
  id: string;
  user_id: string;
  student_id?: string | null;
  full_name: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  organization_join_codes?: { code: string; title?: string } | null;
}

export interface JoinCodeItem {
  id: string;
  code: string;
  title?: string | null;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_revoked: boolean;
  created_at: string;
}

interface Props {
  organizationId: string;
  organizationName: string;
  members: MemberItem[];
  maxMembers?: number;
  isManager: boolean;
}

const ROLE_DISPLAY: Record<string, { label: string; badgeClass: string }> = {
  ORG_OWNER: {
    label: 'Chủ sở hữu',
    badgeClass: 'bg-slate-900 text-white border-slate-900',
  },
  ORG_ADMIN: {
    label: 'Quản trị viên',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  ASSESSOR: {
    label: 'Người đánh giá',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  EVALUATOR: {
    label: 'Người đánh giá',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  REPORT_VIEWER: {
    label: 'Người xem báo cáo',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  MEMBER: {
    label: 'Thành viên',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

export function OrgMembersClientView({
  organizationId,
  organizationName,
  members: initialMembers,
  maxMembers = 50,
  isManager,
}: Props) {
  const [activeTab, setActiveTab] = useState<'members' | 'requests' | 'join-codes'>('members');
  const [members, setMembers] = useState<MemberItem[]>(initialMembers);
  const [search, setSearch] = useState('');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCreateCodeModal, setShowCreateCodeModal] = useState(false);

  // Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ inviteUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Requests states (Approval Queue)
  const [requests, setRequests] = useState<MembershipRequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Join Codes states
  const [joinCodes, setJoinCodes] = useState<JoinCodeItem[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [codeTitle, setCodeTitle] = useState('Khảo thí khóa mới');
  const [codeMaxUses, setCodeMaxUses] = useState(100);
  const [codeExpiryDays, setCodeExpiryDays] = useState(30);
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyJoinLink = (codeStr: string, codeId: string) => {
    const url = `${window.location.origin}/join/org/${codeStr}`;
    navigator.clipboard.writeText(url);
    setCopiedCodeId(codeId);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const remainingSeats = Math.max(0, maxMembers - members.length);

  // Fetch Requests when tab opens
  useEffect(() => {
    if (activeTab === 'requests' && isManager) {
      fetchRequests();
    } else if (activeTab === 'join-codes' && isManager) {
      fetchJoinCodes();
    }
  }, [activeTab, isManager]);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`/api/organizations/${organizationId}/membership-requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch {
      // silent fallback
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchJoinCodes = async () => {
    setLoadingCodes(true);
    try {
      const res = await fetch(`/api/organizations/${organizationId}/join-codes`);
      if (res.ok) {
        const data = await res.json();
        setJoinCodes(data.codes || []);
      }
    } catch {
      // silent fallback
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleReviewRequest = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    setProcessingRequestId(requestId);
    try {
      const res = await fetch(`/api/organizations/${organizationId}/membership-requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        await fetchRequests();
      }
    } catch {
      // silent
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleCreateJoinCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCode(true);
    try {
      const res = await fetch(`/api/organizations/${organizationId}/join-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: codeTitle,
          maxUses: codeMaxUses,
          expiresInDays: codeExpiryDays,
        }),
      });
      if (res.ok) {
        setShowCreateCodeModal(false);
        await fetchJoinCodes();
      }
    } catch {
      // silent
    } finally {
      setIsCreatingCode(false);
    }
  };

  const handleRevokeCode = async (codeId: string) => {
    try {
      const res = await fetch(`/api/organizations/${organizationId}/join-codes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeId }),
      });
      if (res.ok) {
        await fetchJoinCodes();
      }
    } catch {
      // silent
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.nickname.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteError(null);
    setInviteResult(null);

    try {
      const res = await fetch('/api/organizations/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          email: inviteEmail.trim(),
          orgRole: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo lời mời');
      }

      setInviteResult({ inviteUrl: data.invitation.inviteUrl });
      setInviteEmail('');
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsInviting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'members'
              ? 'bg-sky-50 text-sky-700 border border-sky-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Thành viên chính thức</span>
          <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-700 ml-1">
            {members.length}
          </span>
        </button>

        {isManager && (
          <>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'requests'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Hàng đợi duyệt</span>
              {pendingRequests.length > 0 && (
                <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold ml-1">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('join-codes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'join-codes'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Mã tham gia & Link</span>
            </button>
          </>
        )}
      </div>

      {/* Tab 1: Official Members */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                strokeWidth={1.75}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, email hoặc vai trò..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
              />
            </div>

            {isManager && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold shadow-xs transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                  <span>Import CSV</span>
                </button>

                <button
                  onClick={() => {
                    setShowInviteModal(true);
                    setInviteResult(null);
                    setInviteError(null);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Mời thành viên</span>
                </button>
              </div>
            )}
          </div>

          <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Thành viên</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Vai trò</th>
                    <th className="py-2.5 px-4">Trạng thái</th>
                    <th className="py-2.5 px-4">Ngày tham gia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        Không tìm thấy thành viên nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => {
                      const roleConfig = ROLE_DISPLAY[m.role] || {
                        label: m.role,
                        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                      };

                      return (
                        <tr key={m.membershipId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0">
                                {m.nickname.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  <span>{m.nickname}</span>
                                  {m.isCurrentUser && (
                                    <span className="text-[10px] text-sky-600 font-normal">(Bạn)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{m.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${roleConfig.badgeClass}`}
                            >
                              {roleConfig.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  m.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-amber-500'
                                }`}
                              />
                              <span>{m.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px] font-mono tabular-nums">
                            {new Date(m.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Membership Requests (Approval Queue) */}
      {activeTab === 'requests' && isManager && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 flex items-center justify-between">
            <span>
              Người dùng gửi yêu cầu thông qua Mã tham gia cần được Quản trị viên duyệt trước khi kích hoạt.
            </span>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              Còn {remainingSeats} ghế trống
            </span>
          </div>

          <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs">
            {loadingRequests ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                <span>Đang tải hàng đợi phê duyệt...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có yêu cầu gia nhập nào trong hàng đợi.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Họ và Tên</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Mã SV/CB</th>
                    <th className="py-2.5 px-4">Mã tham gia</th>
                    <th className="py-2.5 px-4">Thời gian gửi</th>
                    <th className="py-2.5 px-4">Trạng thái</th>
                    <th className="py-2.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.full_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{r.email}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {r.student_id || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-sky-700">
                        {r.organization_join_codes?.code || 'Trực tiếp'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px] tabular-nums">
                        {new Date(r.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            r.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : r.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {r.status === 'PENDING'
                            ? 'Chờ duyệt'
                            : r.status === 'APPROVED'
                            ? 'Đã duyệt'
                            : 'Đã từ chối'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReviewRequest(r.id, 'APPROVE')}
                              disabled={processingRequestId === r.id}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleReviewRequest(r.id, 'REJECT')}
                              disabled={processingRequestId === r.id}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Join Codes */}
      {activeTab === 'join-codes' && isManager && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Tạo mã đăng ký có hạn sử dụng để phát cho lớp học hoặc nhóm sinh viên tự gửi yêu cầu gia nhập.
            </p>
            <button
              onClick={() => setShowCreateCodeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Tạo mã mới</span>
            </button>
          </div>

          <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs">
            {loadingCodes ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                <span>Đang tải danh sách mã tham gia...</span>
              </div>
            ) : joinCodes.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có mã tham gia nào. Bấm &quot;Tạo mã mới&quot; để phát hành mã đầu tiên.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Mã tham gia</th>
                    <th className="py-2.5 px-4">Mục đích</th>
                    <th className="py-2.5 px-4">Lượt sử dụng</th>
                    <th className="py-2.5 px-4">Hạn sử dụng</th>
                    <th className="py-2.5 px-4">Trạng thái</th>
                    <th className="py-2.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {joinCodes.map((code) => {
                    const isExpired = new Date(code.expires_at) < new Date();
                    return (
                      <tr key={code.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">
                          {code.code}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{code.title || 'Mã tham gia'}</td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                          {code.used_count} / {code.max_uses}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-500 text-[11px]">
                          {new Date(code.expires_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              code.is_revoked
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isExpired
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {code.is_revoked ? 'Đã thu hồi' : isExpired ? 'Hết hạn' : 'Đang hoạt động'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!code.is_revoked && !isExpired && (
                              <button
                                onClick={() => handleCopyJoinLink(code.code, code.id)}
                                title="Sao chép liên kết tham gia"
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-sky-700 hover:text-sky-800 hover:bg-sky-50 rounded font-medium border border-sky-200 transition-colors cursor-pointer"
                              >
                                {copiedCodeId === code.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" strokeWidth={1.75} />
                                    <span>Đã chép link</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-sky-600" strokeWidth={1.75} />
                                    <span>Sao chép link</span>
                                  </>
                                )}
                              </button>
                            )}
                            {!code.is_revoked && !isExpired && (
                              <button
                                onClick={() => handleRevokeCode(code.id)}
                                className="px-2 py-1 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded font-medium transition-colors cursor-pointer"
                              >
                                Thu hồi
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <BulkMemberImportModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        organizationId={organizationId}
        remainingSeats={remainingSeats}
        onSuccess={() => window.location.reload()}
      />

      {/* Create Join Code Modal */}
      {showCreateCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Tạo Mã Tham Gia Tổ Chức</h3>
            <form onSubmit={handleCreateJoinCode} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mục đích / Tên đợt</label>
                <input
                  type="text"
                  required
                  value={codeTitle}
                  onChange={(e) => setCodeTitle(e.target.value)}
                  placeholder="Khảo thí sinh viên K24"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lượt tối đa</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={codeMaxUses}
                    onChange={(e) => setCodeMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời hạn (ngày)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={codeExpiryDays}
                    onChange={(e) => setCodeExpiryDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCodeModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded border border-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCode}
                  className="px-4 py-1.5 text-xs text-white bg-sky-600 hover:bg-sky-700 rounded font-semibold transition-colors disabled:opacity-50"
                >
                  {isCreatingCode ? 'Đang tạo...' : 'Phát hành mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-md bg-white border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Mời thành viên qua Email</h3>
                <p className="text-xs text-slate-500 mt-0.5">{organizationName}</p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>

            {inviteError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
                <span>{inviteError}</span>
              </div>
            )}

            {!inviteResult ? (
              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email thành viên
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="giangvien@truong.edu.vn"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vai trò trong tổ chức
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-600 bg-white"
                  >
                    <option value="MEMBER">Thành viên (Làm bài khảo thí theo phân công)</option>
                    <option value="ASSESSOR">Người đánh giá (Soạn đề, chấm bài, mở phòng Live)</option>
                    <option value="REPORT_VIEWER">Người xem báo cáo (Xem phân tích & số liệu)</option>
                    <option value="ORG_ADMIN">Quản trị viên đơn vị (Quản lý thành viên & đề thi)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded border border-slate-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="px-4 py-1.5 text-xs text-white bg-sky-600 hover:bg-sky-700 rounded font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isInviting && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />}
                    <span>Tạo liên kết mời</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800">
                  <div className="font-semibold">Đã tạo lời mời thành công!</div>
                  <p className="text-[11px] mt-1 text-emerald-700">
                    Gửi liên kết bên dưới cho thành viên để họ gia nhập tổ chức.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteResult.inviteUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(inviteResult.inviteUrl)}
                    className="px-3 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold flex items-center gap-1 hover:bg-slate-800"
                  >
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
