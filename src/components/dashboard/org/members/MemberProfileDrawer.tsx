'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Award,
  Crown,
  GraduationCap,
  UserCheck,
  BarChart2,
  Calendar,
  Clock,
  Check,
  RotateCcw,
  Loader2,
  AlertCircle,
  Trash2,
  Lock,
} from 'lucide-react';
import type { OrgMemberItem } from './types';

interface MemberProfileDrawerProps {
  member: OrgMemberItem | null;
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  isManager: boolean;
  onUpdated: () => void;
  onDeleted: () => void;
}

const ROLES = [
  {
    id: 'ORG_ADMIN',
    title: 'Quản trị viên',
    description: 'Toàn quyền điều hành tổ chức, thành viên, lớp học và đợt đánh giá',
    icon: Shield,
  },
  {
    id: 'MEMBER',
    title: 'Thành viên',
    description: 'Tham gia học tập, làm bài đánh giá và nhận kết quả theo phân công',
    icon: UserCheck,
  },
];

const DEFAULT_PERMISSIONS_BY_ROLE: Record<string, Record<string, boolean>> = {
  ORG_OWNER: {
    manage_members: true,
    create_campaigns: true,
    grade_submissions: true,
    view_analytics: true,
    manage_settings: true,
  },
  ORG_ADMIN: {
    manage_members: true,
    create_campaigns: true,
    grade_submissions: true,
    view_analytics: true,
    manage_settings: true,
  },
  ASSESSOR: {
    manage_members: false,
    create_campaigns: false,
    grade_submissions: true,
    view_analytics: true,
    manage_settings: false,
  },
  MEMBER: {
    manage_members: false,
    create_campaigns: false,
    grade_submissions: false,
    view_analytics: false,
    manage_settings: false,
  },
  REPORT_VIEWER: {
    manage_members: false,
    create_campaigns: false,
    grade_submissions: false,
    view_analytics: true,
    manage_settings: false,
  },
};

export function MemberProfileDrawer({
  member,
  isOpen,
  onClose,
  organizationId,
  isManager,
  onUpdated,
  onDeleted,
}: MemberProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState<'rbac' | 'activity' | 'security'>('rbac');
  const [selectedRole, setSelectedRole] = useState<string>('MEMBER');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<string>('ACTIVE');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (member) {
      setSelectedRole(member.role);
      setStatus(member.status);
      setPermissions(DEFAULT_PERMISSIONS_BY_ROLE[member.role] || DEFAULT_PERMISSIONS_BY_ROLE.MEMBER);
      setError(null);
      setSuccessMsg(null);
      setShowDeleteConfirm(false);
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setPermissions(DEFAULT_PERMISSIONS_BY_ROLE[roleId] || DEFAULT_PERMISSIONS_BY_ROLE.MEMBER);
  };

  const togglePermission = (key: string) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetToRoleDefault = () => {
    setPermissions(DEFAULT_PERMISSIONS_BY_ROLE[selectedRole] || DEFAULT_PERMISSIONS_BY_ROLE.MEMBER);
  };

  const handleSaveRbac = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: member.userId,
          orgRole: selectedRole,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật phân quyền thất bại');
      }

      setSuccessMsg('Đã lưu phân quyền thành công!');
      onUpdated();
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/organizations/${organizationId}/members?userId=${member.userId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Xóa thành viên thất bại');
      }

      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-3xl bg-white dark:bg-[#111114] shadow-2xl border-l border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Hồ sơ thành viên
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Member Identity Strip */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-base font-mono">
                  {member.nickname.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {member.nickname}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span>{status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}</span>
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 dark:text-neutral-400 mt-0.5">
                    {member.email}
                  </p>
                </div>
              </div>

              {isManager && !member.isCurrentUser && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Xóa thành viên"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Delete Confirmation Box */}
            {showDeleteConfirm && (
              <div className="p-3.5 rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 text-xs space-y-2">
                <div className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Xác nhận xóa thành viên khỏi tổ chức?</span>
                </div>
                <p className="text-slate-600 dark:text-neutral-400">
                  Thành viên sẽ mất quyền truy cập vào không gian tổ chức này và các bài thi liên quan. Thao tác này có thể giải phóng 1 ghế khả dụng.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDeleteMember}
                    disabled={loading}
                    className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    Xác nhận xóa
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Metadata 4 Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded border border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20">
                <div className="text-[10px] text-slate-400 font-medium">Nhóm / Lớp</div>
                <div className="font-semibold text-neutral-800 dark:text-zinc-200 mt-0.5 truncate">
                  {member.className || 'Chưa gán lớp'}
                </div>
              </div>
              <div className="p-2.5 rounded border border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20">
                <div className="text-[10px] text-slate-400 font-medium">Vai trò hiện tại</div>
                <div className="font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                  {member.role}
                </div>
              </div>
              <div className="p-2.5 rounded border border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20">
                <div className="text-[10px] text-slate-400 font-medium">Ngày tham gia</div>
                <div className="font-mono text-neutral-800 dark:text-zinc-200 mt-0.5 tabular-nums">
                  {new Date(member.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <div className="p-2.5 rounded border border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20">
                <div className="text-[10px] text-slate-400 font-medium">Hành động gần nhất</div>
                <div className="text-neutral-800 dark:text-zinc-200 mt-0.5 truncate">
                  {member.lastActiveAt ? new Date(member.lastActiveAt).toLocaleDateString('vi-VN') : 'Đang hoạt động'}
                </div>
              </div>
            </div>

            {/* Tabs Bar */}
            <div className="border-b border-slate-200 dark:border-zinc-800 flex gap-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('rbac')}
                className={`pb-2.5 border-b-2 transition-colors ${
                  activeTab === 'rbac'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                Phân quyền
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`pb-2.5 border-b-2 transition-colors ${
                  activeTab === 'activity'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                Hoạt động
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`pb-2.5 border-b-2 transition-colors ${
                  activeTab === 'security'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                Bảo mật &amp; Truy cập
              </button>
            </div>

            {/* Tab: RBAC */}
            {activeTab === 'rbac' && (
              <div className="space-y-6">
                {/* 5 Role Cards */}
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono mb-2.5">
                    Vai trò trong tổ chức
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      const isSelected = selectedRole === r.id;

                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleRoleSelect(r.id)}
                          className={`p-3 rounded-md border text-left transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-600'
                              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Icon
                                className={`w-4 h-4 ${
                                  isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                                }`}
                              />
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
                              )}
                            </div>
                            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                              {r.title}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1 line-clamp-2">
                              {r.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Granular Permission Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                        Quyền chi tiết
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                        Tùy chỉnh các khả năng cụ thể cho thành viên này.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetToRoleDefault}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Đặt về mặc định vai trò</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-3 text-xs">
                    {[
                      {
                        key: 'manage_members',
                        title: 'Quản lý thành viên',
                        desc: 'Thêm, chỉnh sửa, vô hiệu hóa thành viên và phân quyền.',
                      },
                      {
                        key: 'create_campaigns',
                        title: 'Tạo đợt đánh giá',
                        desc: 'Tạo, cấu hình và quản lý các đợt khảo thí của đơn vị.',
                      },
                      {
                        key: 'grade_submissions',
                        title: 'Chấm bài thi & minh chứng',
                        desc: 'Chấm điểm và đánh giá bài làm, phản hồi cho học viên.',
                      },
                      {
                        key: 'view_analytics',
                        title: 'Xem báo cáo năng lực',
                        desc: 'Xem báo cáo thống kê 5 miền theo lớp, đợt hoặc tổ chức.',
                      },
                      {
                        key: 'manage_settings',
                        title: 'Quản lý cấu hình tổ chức',
                        desc: 'Thiết lập thông tin tổ chức, chính sách và xem hạn mức.',
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0 border-b last:border-0 border-slate-100 dark:border-zinc-850"
                      >
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                            {item.desc}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(permissions[item.key])}
                          onChange={() => togglePermission(item.key)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Switch (Active / Suspended) */}
                <div className="p-3.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Trạng thái tài khoản
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                      Tạm ngưng sẽ chặn quyền truy cập vào tổ chức mà không xóa dữ liệu.
                    </div>
                  </div>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-medium"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="SUSPENDED">Tạm ngưng</option>
                  </select>
                </div>
              </div>
            )}

            {/* Tab: Activity */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                  Lịch sử hoạt động
                </div>
                <div className="border-l-2 border-slate-200 dark:border-zinc-800 ml-2 space-y-4 text-xs pl-4">
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Đăng nhập hệ thống
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                      Hôm nay, 09:24
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Tham gia lớp học {member.className || 'mặc định'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                      {new Date(member.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Tạo tài khoản và kích hoạt vai trò {member.role}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                      {new Date(member.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Security */}
            {activeTab === 'security' && (
              <div className="space-y-3 text-xs">
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
                  Bảo mật &amp; Truy cập
                </div>
                <div className="p-3.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Mã định danh thành viên:</span>
                    <span className="font-mono text-[11px] text-neutral-800 dark:text-zinc-200">
                      {member.membershipId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">User ID:</span>
                    <span className="font-mono text-[11px] text-neutral-800 dark:text-zinc-200">
                      {member.userId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phương thức gia nhập:</span>
                    <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                      Lời mời tổ chức / Mã tham gia
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Messages */}
            {error && (
              <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-zinc-900/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 transition-colors"
            >
              Hủy thay đổi
            </button>
            <button
              type="button"
              onClick={handleSaveRbac}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Lưu phân quyền</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
