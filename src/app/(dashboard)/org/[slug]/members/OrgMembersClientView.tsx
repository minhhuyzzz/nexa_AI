'use client';

import { useState } from 'react';
import {
  Users,
  Plus,
  Mail,
  Copy,
  Check,
  Search,
  Shield,
  Loader2,
  UserX,
  AlertCircle,
} from 'lucide-react';

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

interface Props {
  organizationId: string;
  organizationName: string;
  members: MemberItem[];
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
  isManager,
}: Props) {
  const [members, setMembers] = useState<MemberItem[]>(initialMembers);
  const [search, setSearch] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('ASSESSOR');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ inviteUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredMembers = members.filter(
    (m) =>
      m.nickname.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

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
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email hoặc vai trò..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
          />
        </div>

        {isManager && (
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
        )}
      </div>

      {/* Members Table */}
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

                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {m.email}
                      </td>

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

                      <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
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

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-md bg-white border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Mời thành viên vào tổ chức</h3>
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
                    <option value="ASSESSOR">Người đánh giá (Soạn đề, chấm bài, mở phòng Live)</option>
                    <option value="REPORT_VIEWER">Người xem báo cáo (Xem phân tích & số liệu)</option>
                    <option value="MEMBER">Thành viên (Làm bài khảo thí theo phân công)</option>
                    <option value="ORG_ADMIN">Quản trị viên đơn vị (Toàn quyền quản lý)</option>
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
