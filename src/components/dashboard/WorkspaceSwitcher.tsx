'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Building2,
  User,
  ChevronDown,
  Check,
  Plus,
  Copy,
  ShieldCheck,
  Loader2,
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
  ORG_ADMIN: 'Quản trị tổ chức',
  ASSESSOR: 'Người đánh giá',
  EVALUATOR: 'Người đánh giá',
  REPORT_VIEWER: 'Xem báo cáo',
  MEMBER: 'Thành viên',
};

export function WorkspaceSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('personal');
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [personalPlan, setPersonalPlan] = useState<'FREE' | 'PRO'>('FREE');
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
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const cookieWs = getCookie('nexa_active_workspace');
    const localWs = typeof window !== 'undefined' ? localStorage.getItem('nexa_active_workspace') : null;
    const currentId = cookieWs || localWs || 'personal';
    setActiveWorkspaceId(currentId);

    // Fetch user organizations and plan
    const controller = new AbortController();

    const fetchWorkspaces = async () => {
      try {
        const res = await fetch('/api/organizations/my', { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (data.workspaces) {
            setWorkspaces(data.workspaces);
            setIsPlatformAdmin(!!data.isPlatformAdmin);
            if (data.planTier) {
              setPersonalPlan(data.planTier.toUpperCase() === 'PRO' ? 'PRO' : 'FREE');
            }

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
            } else if (pathname?.startsWith('/admin')) {
              setActiveWorkspaceId('admin');
            }
          }
        }
      } catch (e: unknown) {
        const isAbort = (e as { name?: string })?.name === 'AbortError';
        if (!isAbort) {
          console.warn('Could not load workspaces:', (e as Error)?.message || e);
        }
      }
    };

    fetchWorkspaces();

    return () => {
      controller.abort();
    };
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexa_active_workspace', id);
    }
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
    } else if (id === 'admin') {
      router.push('/admin/dashboard');
    } else if (slug) {
      router.push(`/org/${slug}`);
    } else {
      router.refresh();
    }
  };

  const activeWorkspace = workspaces.find((w) => w.organization.id === activeWorkspaceId.replace('org_', ''));
  const isPersonal = pathname?.startsWith('/personal') || activeWorkspaceId === 'personal' || !activeWorkspace;
  const isAdmin = pathname?.startsWith('/admin') || activeWorkspaceId === 'admin';
  const isOrgManager = !isPersonal && !isAdmin && (activeWorkspace?.role === 'ORG_OWNER' || activeWorkspace?.role === 'ORG_ADMIN');

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
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs cursor-pointer"
        aria-label="Chọn không gian làm việc"
      >
        <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 shrink-0">
          {isAdmin ? (
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" strokeWidth={1.75} />
          ) : isPersonal ? (
            <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          )}
        </div>
        <div className="flex flex-col min-w-0 pr-1">
          <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium uppercase tracking-wider leading-none">
            Không gian làm việc
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[130px] sm:max-w-[160px]">
              {isAdmin ? 'Quản trị nền tảng NEXA' : isPersonal ? 'Cá nhân' : activeWorkspace?.organization?.name || 'Tổ chức'}
            </span>
            {isPersonal ? (
              <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300">
                {personalPlan}
              </span>
            ) : !isAdmin && activeWorkspace ? (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300">
                BUSINESS
              </span>
            ) : null}
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={1.75}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 rounded-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-md py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-zinc-850 mb-1">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
              Chọn không gian làm việc
            </span>
          </div>

          {/* Option: Personal Workspace */}
          <button
            onClick={() => handleSelectWorkspace('personal')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer ${
              isPersonal && !isAdmin ? 'bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold' : 'text-neutral-800 dark:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
              </div>
              <div className="flex flex-col text-left truncate">
                <span className="truncate">Cá nhân</span>
                <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-normal">Học tập & tạo đề tự do</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300">
                {personalPlan}
              </span>
              {isPersonal && !isAdmin && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />}
            </div>
          </button>

          {/* Organizations Group */}
          {workspaces.length > 0 && (
            <div className="mt-1 pt-1 border-t border-slate-100 dark:border-zinc-850">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                Tổ chức / Trường học
              </div>
              {workspaces.map((ws) => {
                const isSelected = !isAdmin && (activeWorkspaceId === `org_${ws.organization.id}` || activeWorkspaceId === ws.organization.id);
                return (
                  <button
                    key={ws.membershipId}
                    onClick={() => handleSelectWorkspace(`org_${ws.organization.id}`, ws.organization.slug)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer ${
                      isSelected ? 'bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold' : 'text-neutral-800 dark:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                      </div>
                      <div className="flex flex-col text-left truncate">
                        <span className="truncate">{ws.organization.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-normal">
                          {ROLE_LABELS[ws.role] || ws.role} · <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">BUSINESS</span>
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Platform Admin Option */}
          {isPlatformAdmin && (
            <div className="mt-1 pt-1 border-t border-slate-100 dark:border-zinc-850">
              <button
                onClick={() => handleSelectWorkspace('admin')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer ${
                  isAdmin ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold' : 'text-purple-700 dark:text-purple-400'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-col text-left truncate">
                    <span className="truncate">Quản trị nền tảng NEXA</span>
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-normal">Toàn quyền hệ thống</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                    ADMIN
                  </span>
                  {isAdmin && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" strokeWidth={1.75} />}
                </div>
              </button>
            </div>
          )}

          {/* Manage or Invite button for Org Admin */}
          {isOrgManager && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-zinc-850 px-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowInviteModal(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-zinc-900 rounded font-medium transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/70 p-4">
          <div className="w-full max-w-md rounded-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-lg p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-zinc-850 pb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Mời thành viên mới</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Tổ chức: {activeWorkspace.organization.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteResult(null);
                  setInviteError(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {inviteError && (
              <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                {inviteError}
              </div>
            )}

            {!inviteResult ? (
              <form onSubmit={handleCreateInvite} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Email thành viên
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="giangvien@truong.edu.vn"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Vai trò trong tổ chức
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as OrgRoleType)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100"
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
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 rounded border border-slate-200 dark:border-zinc-800 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isInviting && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />}
                    <span>Tạo liên kết mời</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-md text-xs text-emerald-800 dark:text-emerald-200">
                  <div className="font-semibold">Đã tạo lời mời thành công!</div>
                  <p className="text-[11px] mt-1 text-emerald-700 dark:text-emerald-300">
                    Gửi liên kết sau cho thành viên. Liên kết có giá trị sử dụng 1 lần trong vòng 7 ngày.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteResult.inviteUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md select-all text-neutral-900 dark:text-neutral-100"
                  />
                  <button
                    onClick={() => copyToClipboard(inviteResult.inviteUrl)}
                    className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer"
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
