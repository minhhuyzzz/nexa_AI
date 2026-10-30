'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Building2,
  User,
  ChevronDown,
  Check,
  Plus,
  Mail,
  Copy,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Briefcase,
} from 'lucide-react';

export interface OrganizationInfo {
  id: string;
  name: string;
  slug?: string;
  code?: string;
  plan_tier?: string;
}

export type OrgRoleType =
  | 'ORG_OWNER'
  | 'ORG_ADMIN'
  | 'ASSESSOR'
  | 'EVALUATOR'
  | 'REPORT_VIEWER'
  | 'MEMBER';

export interface WorkspaceItem {
  membershipId: string;
  role: OrgRoleType;
  organization: OrganizationInfo;
}

const ROLE_LABELS: Record<OrgRoleType, string> = {
  ORG_OWNER: 'Chủ sở hữu',
  ORG_ADMIN: 'Quản trị viên',
  ASSESSOR: 'Người đánh giá',
  EVALUATOR: 'Người đánh giá',
  REPORT_VIEWER: 'Người xem báo cáo',
  MEMBER: 'Thành viên',
};

export function WorkspaceSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('personal');
  const [isOpen, setIsOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRoleType>('ASSESSOR');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ inviteUrl: string } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read active workspace cookie or localStorage
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const cookieWs = getCookie('nexa_active_workspace');
    const localWs = localStorage.getItem('nexa_active_workspace');
    const currentId = cookieWs || localWs || 'personal';
    setActiveWorkspaceId(currentId);

    // Fetch user organizations
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch('/api/organizations/my');
        if (res.ok) {
          const data = await res.json();
          if (data.workspaces) {
            setWorkspaces(data.workspaces);
            // Sync active workspace state with current route
            if (pathname?.startsWith('/org/')) {
              const routeSlug = pathname.split('/')[2];
              const matched = data.workspaces.find((w: WorkspaceItem) => w.organization.slug === routeSlug);
              if (matched) {
                setActiveWorkspaceId(`org_${matched.organization.id}`);
                localStorage.setItem('nexa_active_workspace', `org_${matched.organization.id}`);
                document.cookie = `nexa_active_workspace=org_${matched.organization.id}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
                document.cookie = `nexa_active_org_slug=${matched.organization.slug}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
              }
            } else if (pathname?.startsWith('/personal')) {
              setActiveWorkspaceId('personal');
              localStorage.setItem('nexa_active_workspace', 'personal');
              document.cookie = `nexa_active_workspace=personal; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
            }
          }
        }
      } catch (e) {
        console.error('Failed to load workspaces', e);
      }
    };

    fetchWorkspaces();
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectWorkspace = (id: string, slug?: string) => {
    setActiveWorkspaceId(id);
    localStorage.setItem('nexa_active_workspace', id);
    // Set 30-day cookie for server/middleware
    document.cookie = `nexa_active_workspace=${id}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    if (slug) {
      document.cookie = `nexa_active_org_slug=${slug}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    } else {
      document.cookie = `nexa_active_org_slug=; path=/; max-age=0; SameSite=Lax`;
    }
    setIsOpen(false);

    if (id === 'personal') {
      router.push('/personal/dashboard');
    } else if (slug) {
      router.push(`/org/${slug}`);
    } else {
      router.refresh();
    }
  };

  const activeWorkspace = workspaces.find((w) => w.organization.id === activeWorkspaceId.replace('org_', ''));
  const isPersonal = activeWorkspaceId === 'personal' || !activeWorkspace;
  const isOrgManager = !isPersonal && (activeWorkspace?.role === 'ORG_OWNER' || activeWorkspace?.role === 'ORG_ADMIN');

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPersonal || !activeWorkspace) return;

    setIsInviting(true);
    setInviteError(null);
    setInviteResult(null);

    try {
      const res = await fetch('/api/organizations/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: activeWorkspace.organization.id,
          email: inviteEmail,
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
    <div className="relative" ref={dropdownRef}>
      {/* Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-sky-600 shadow-xs"
        aria-label="Chọn không gian làm việc"
      >
        <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 text-slate-700 shrink-0">
          {isPersonal ? (
            <User className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
          )}
        </div>
        <div className="flex flex-col min-w-0 pr-1">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none">
            Không gian làm việc
          </span>
          <span className="text-xs font-semibold text-slate-900 truncate max-w-[140px] mt-0.5">
            {isPersonal ? 'Cá nhân' : activeWorkspace.organization.name}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={1.75}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 rounded-md bg-white border border-slate-200 shadow-sm py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Chọn không gian làm việc
            </span>
          </div>

          {/* Option: Personal Workspace */}
          <button
            onClick={() => handleSelectWorkspace('personal')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-slate-50 ${
              isPersonal ? 'bg-sky-50/50 text-sky-900 font-semibold' : 'text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
              </div>
              <div className="flex flex-col text-left truncate">
                <span className="truncate">Không gian Cá nhân</span>
                <span className="text-[10px] text-slate-400 font-normal">Học tập & tạo đề tự do</span>
              </div>
            </div>
            {isPersonal && <Check className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />}
          </button>

          {/* Organizations Group */}
          {workspaces.length > 0 && (
            <div className="mt-1 pt-1 border-t border-slate-100">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Tổ chức / Trường học
              </div>
              {workspaces.map((ws) => {
                const isSelected = activeWorkspaceId === `org_${ws.organization.id}` || activeWorkspaceId === ws.organization.id;
                return (
                  <button
                    key={ws.membershipId}
                    onClick={() => handleSelectWorkspace(`org_${ws.organization.id}`, ws.organization.slug)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-slate-50 ${
                      isSelected ? 'bg-sky-50/50 text-sky-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded bg-sky-50 flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                      </div>
                      <div className="flex flex-col text-left truncate">
                        <span className="truncate">{ws.organization.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {ROLE_LABELS[ws.role] || ws.role}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Manage or Invite button for Org Admin */}
          {isOrgManager && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-100 px-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowInviteModal(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Mời thành viên vào tổ chức</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && activeWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-md bg-white border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Mời thành viên mới</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tổ chức: {activeWorkspace.organization.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteResult(null);
                  setInviteError(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>

            {inviteError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {inviteError}
              </div>
            )}

            {!inviteResult ? (
              <form onSubmit={handleCreateInvite} className="space-y-3">
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
                    onChange={(e) => setInviteRole(e.target.value as OrgRoleType)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-600 bg-white"
                  >
                    <option value="ASSESSOR">Người đánh giá (Soạn đề, chấm bài, mở phòng Live)</option>
                    <option value="REPORT_VIEWER">Người xem báo cáo (Chỉ xem số liệu thống kê)</option>
                    <option value="MEMBER">Thành viên (Tham gia làm bài theo kỳ thi)</option>
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
                    Gửi liên kết sau cho thành viên. Liên kết có giá trị sử dụng 1 lần trong vòng 7 ngày.
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
