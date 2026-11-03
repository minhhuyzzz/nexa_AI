'use client';

import React, { useState } from 'react';
import {
  Mail,
  Search,
  RotateCw,
  Copy,
  Check,
  Trash2,
  Clock,
  AlertTriangle,
  UserPlus,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import type { OrgInvitationItem } from './types';

interface PendingInvitationsViewProps {
  organizationId: string;
  invitations: OrgInvitationItem[];
  loading: boolean;
  onRefresh: () => void;
  onOpenInviteDrawer: () => void;
  onInvitationRevoked: () => void;
}

export function PendingInvitationsView({
  organizationId,
  invitations,
  loading,
  onRefresh,
  onOpenInviteDrawer,
  onInvitationRevoked,
}: PendingInvitationsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getRoleBadge = (role: string) => {
    if (role === 'ORG_ADMIN' || role === 'ORG_OWNER') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          Quản trị viên
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
        Thành viên
      </span>
    );
  };

  const getStatusBadge = (invitation: OrgInvitationItem) => {
    if (invitation.status === 'REVOKED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
          Đã thu hồi
        </span>
      );
    }
    if (invitation.status === 'ACCEPTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          Đã kích hoạt
        </span>
      );
    }
    const isExpired = new Date(invitation.expires_at) < new Date();
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          <Clock className="w-3 h-3" /> Hết hạn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
        <Clock className="w-3 h-3" /> Đang chờ
      </span>
    );
  };

  const copyInviteLink = (invitation: OrgInvitationItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteUrl = invitation.token
      ? `${origin}/invite/org?token=${invitation.token}`
      : `${origin}/login?invited_org=${organizationId}`;

    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(invitation.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleRevoke = async (invitationId: string) => {
    setRevokingId(invitationId);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/organizations/invitations?id=${encodeURIComponent(invitationId)}&organizationId=${encodeURIComponent(organizationId)}`,
        {
          method: 'DELETE',
        }
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Không thể thu hồi lời mời');
      }
      setConfirmRevokeId(null);
      onInvitationRevoked();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi thu hồi lời mời');
    } finally {
      setRevokingId(null);
    }
  };

  const filteredInvitations = invitations.filter((inv) => {
    const matchesSearch = inv.email.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesRole =
      roleFilter === 'ALL'
        ? true
        : roleFilter === 'ADMIN'
        ? inv.org_role === 'ORG_ADMIN' || inv.org_role === 'ORG_OWNER'
        : inv.org_role !== 'ORG_ADMIN' && inv.org_role !== 'ORG_OWNER';
    return matchesSearch && matchesRole;
  });

  const pendingCount = invitations.filter(
    (i) => i.status === 'PENDING' && new Date(i.expires_at) >= new Date()
  ).length;

  return (
    <div className="space-y-3.5">
      {errorMsg && (
        <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Toolbar: Search, Role Filter, Refresh */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Tìm theo email người nhận..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-md bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-md bg-white dark:bg-[#111114] text-neutral-800 dark:text-zinc-200 focus:outline-none"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="MEMBER">Thành viên</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold text-neutral-700 dark:text-zinc-300 transition-colors shadow-xs"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            <span>Làm mới</span>
          </button>
          <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">
            {filteredInvitations.length} lời mời
          </span>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">Email người nhận</th>
                <th className="py-2.5 px-4">Vai trò đề xuất</th>
                <th className="py-2.5 px-4">Ngày gửi</th>
                <th className="py-2.5 px-4">Hạn hiệu lực</th>
                <th className="py-2.5 px-4">Trạng thái</th>
                <th className="py-2.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
              {filteredInvitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-slate-400 dark:text-neutral-500">
                      <Mail className="w-10 h-10 mb-2 opacity-50" />
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {searchQuery ? 'Không tìm thấy lời mời nào phù hợp' : 'Chưa có lời mời nào'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 mb-4">
                        {searchQuery
                          ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc vai trò.'
                          : 'Gửi thư mời qua email để thêm thành viên mới vào tổ chức của bạn.'}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={onOpenInviteDrawer}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Mời ngay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvitations.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {inv.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getRoleBadge(inv.org_role)}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-neutral-400 font-mono tabular-nums">
                      {new Date(inv.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-neutral-400 font-mono tabular-nums">
                      {new Date(inv.expires_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(inv)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {inv.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => copyInviteLink(inv)}
                            title="Sao chép liên kết mời"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition"
                          >
                            {copiedId === inv.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  Đã chép
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-500" />
                                <span className="text-[11px]">Sao chép link</span>
                              </>
                            )}
                          </button>
                        )}

                        {inv.status === 'PENDING' && (
                          <>
                            {confirmRevokeId === inv.id ? (
                              <div className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/60 p-0.5 rounded border border-red-200 dark:border-red-800">
                                <button
                                  type="button"
                                  onClick={() => handleRevoke(inv.id)}
                                  disabled={revokingId === inv.id}
                                  className="px-2 py-0.5 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition"
                                >
                                  {revokingId === inv.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    'Thu hồi'
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRevokeId(null)}
                                  className="px-1.5 py-0.5 text-[11px] text-slate-600 dark:text-zinc-400 hover:text-neutral-900"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmRevokeId(inv.id)}
                                title="Thu hồi lời mời"
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
