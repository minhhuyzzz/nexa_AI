'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2, User, ShieldCheck, Check, ChevronDown, Sparkles } from 'lucide-react';

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

const ROLE_LABELS: Record<string, string> = {
  ORG_OWNER: 'Chủ sở hữu',
  ORG_ADMIN: 'Quản trị tổ chức',
  ASSESSOR: 'Người đánh giá',
  EVALUATOR: 'Người đánh giá',
  REPORT_VIEWER: 'Xem báo cáo',
  MEMBER: 'Thành viên',
};

interface AvatarWorkspaceSectionProps {
  onClose: () => void;
}

export function AvatarWorkspaceSection({ onClose }: AvatarWorkspaceSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('personal');
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [personalPlan, setPersonalPlan] = useState<'FREE' | 'PRO'>('FREE');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

    const fetchWorkspaces = async () => {
      try {
        const res = await fetch('/api/organizations/my');
        if (res.ok) {
          const data = await res.json();
          if (data.workspaces) {
            setWorkspaces(data.workspaces);
            setIsPlatformAdmin(!!data.isPlatformAdmin);
            if (data.planTier) {
              setPersonalPlan(data.planTier.toUpperCase() === 'PRO' ? 'PRO' : 'FREE');
            }

            if (pathname?.startsWith('/org/')) {
              const routeSlug = pathname.split('/')[2];
              const matched = data.workspaces.find((w: WorkspaceItem) => w.organization.slug === routeSlug);
              if (matched) {
                setActiveWorkspaceId(`org_${matched.organization.id}`);
              }
            } else if (pathname?.startsWith('/personal')) {
              setActiveWorkspaceId('personal');
            } else if (pathname?.startsWith('/admin')) {
              setActiveWorkspaceId('admin');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load workspaces in avatar menu:', err);
      }
    };

    fetchWorkspaces();
  }, [pathname]);

  const handleSelectWorkspace = (id: string, slug?: string) => {
    setActiveWorkspaceId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexa_active_workspace', id);
    }
    document.cookie = `nexa_active_workspace=${id}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    if (slug) {
      document.cookie = `nexa_active_org_slug=${slug}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    } else {
      document.cookie = `nexa_active_org_slug=; path=/; max-age=0; SameSite=Lax`;
    }
    onClose();

    if (id === 'personal') {
      router.push('/personal/dashboard');
    } else if (slug) {
      router.push(`/org/${slug}`);
    } else if (id === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.refresh();
    }
  };

  const isPersonalActive = pathname?.startsWith('/personal') || activeWorkspaceId === 'personal';
  const isAdminActive = pathname?.startsWith('/admin') || activeWorkspaceId === 'admin';
  const currentActiveOrg = workspaces.find((w) =>
    pathname?.startsWith(`/org/${w.organization.slug}`) || activeWorkspaceId === `org_${w.organization.id}`
  );

  return (
    <div className="py-2.5 border-b border-slate-100 dark:border-zinc-850">
      {/* Phía trên: Thẻ gói tài khoản & CTA Nâng cấp */}
      <div className="mx-3 mb-2.5 p-2.5 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Gói dịch vụ cá nhân
          </span>
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              personalPlan === 'PRO'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
            }`}
          >
            {personalPlan}
          </span>
        </div>

        {personalPlan === 'FREE' ? (
          <Link
            href="/personal/billing"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Nâng cấp PRO</span>
          </Link>
        ) : (
          <Link
            href="/personal/billing"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-950 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Quản lý gói PRO</span>
          </Link>
        )}
      </div>

      {/* Mục Không gian làm việc thiết kế dạng Dropdown */}
      <div className="px-3">
        <div className="px-1 pb-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
          Không gian làm việc
        </div>

        {/* Dropdown Trigger Button */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs transition-colors cursor-pointer"
          aria-label="Chọn không gian làm việc"
          aria-expanded={isDropdownOpen}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isAdminActive ? (
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-purple-600 dark:text-purple-400" strokeWidth={1.75} />
            ) : currentActiveOrg ? (
              <Building2 className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            ) : (
              <User className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            )}
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {isAdminActive
                ? 'Quản trị nền tảng NEXA'
                : currentActiveOrg
                ? currentActiveOrg.organization.name
                : 'Cá nhân'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
              {isAdminActive
                ? 'ADMIN'
                : currentActiveOrg
                ? `${ROLE_LABELS[currentActiveOrg.role] || currentActiveOrg.role} · BUSINESS`
                : personalPlan}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
              strokeWidth={1.75}
            />
          </div>
        </button>

        {/* Dropdown Options List */}
        {isDropdownOpen && (
          <div className="mt-1.5 p-1 rounded-md bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-0.5 animate-in fade-in-50 zoom-in-95">
            {/* 1. Personal Workspace Option */}
            <button
              type="button"
              onClick={() => {
                handleSelectWorkspace('personal');
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors cursor-pointer text-left ${
                isPersonalActive && !isAdminActive
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'hover:bg-white dark:hover:bg-zinc-800 text-neutral-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <span className="truncate">Cá nhân</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 font-bold">
                  {personalPlan}
                </span>
                {isPersonalActive && !isAdminActive && (
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                )}
              </div>
            </button>

            {/* 2. Organizations Options */}
            {workspaces.map((ws) => {
              const isOrgActive = !isAdminActive && (
                pathname?.startsWith(`/org/${ws.organization.slug}`) ||
                activeWorkspaceId === `org_${ws.organization.id}` ||
                activeWorkspaceId === ws.organization.id
              );
              return (
                <button
                  key={ws.membershipId}
                  type="button"
                  onClick={() => {
                    handleSelectWorkspace(`org_${ws.organization.id}`, ws.organization.slug);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors cursor-pointer text-left ${
                    isOrgActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'hover:bg-white dark:hover:bg-zinc-800 text-neutral-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                      <span className="truncate font-medium text-neutral-900 dark:text-neutral-100">{ws.organization.name}</span>
                    </div>
                    <div className="pl-5.5 text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                      {ROLE_LABELS[ws.role] || ws.role} · <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">BUSINESS</span>
                    </div>
                  </div>
                  {isOrgActive && (
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-1" strokeWidth={2} />
                  )}
                </button>
              );
            })}

            {/* 3. Platform Admin Option */}
            {isPlatformAdmin && (
              <button
                type="button"
                onClick={() => {
                  handleSelectWorkspace('admin');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors cursor-pointer text-left ${
                  isAdminActive
                    ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold'
                    : 'hover:bg-white dark:hover:bg-zinc-800 text-purple-700 dark:text-purple-400'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-purple-600 dark:text-purple-400" strokeWidth={1.75} />
                  <span className="truncate font-medium">Quản trị nền tảng NEXA</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold">
                    ADMIN
                  </span>
                  {isAdminActive && (
                    <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                  )}
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
