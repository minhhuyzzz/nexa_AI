'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2, User, ShieldCheck, Check } from 'lucide-react';

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
  ORG_ADMIN: 'Quản trị viên',
  ASSESSOR: 'Người chấm',
  EVALUATOR: 'Người chấm',
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
  const isAdminActive = pathname?.startsWith('/admin');

  return (
    <div className="py-2 border-b border-slate-100 dark:border-zinc-800">
      <div className="px-4 pb-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
        Không gian làm việc
      </div>

      <div className="space-y-0.5 px-2">
        {/* Personal Workspace */}
        <button
          type="button"
          onClick={() => handleSelectWorkspace('personal')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors cursor-pointer text-left ${
            isPersonalActive && !isAdminActive
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
              : 'hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-zinc-400" strokeWidth={1.75} />
            <span className="truncate">Cá nhân (Personal)</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono text-slate-600 dark:text-zinc-300">
              {personalPlan}
            </span>
            {isPersonalActive && !isAdminActive && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          </div>
        </button>

        {/* Organizations List */}
        {workspaces.map((ws) => {
          const isOrgActive = pathname?.startsWith(`/org/${ws.organization.slug}`);
          return (
            <button
              key={ws.membershipId}
              type="button"
              onClick={() => handleSelectWorkspace(`org_${ws.organization.id}`, ws.organization.slug)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors cursor-pointer text-left ${
                isOrgActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-zinc-400" strokeWidth={1.75} />
                <span className="truncate">{ws.organization.name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                  {ROLE_LABELS[ws.role] || ws.role}
                </span>
                {isOrgActive && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              </div>
            </button>
          );
        })}

        {/* Platform Admin if user has ADMIN privilege */}
        {isPlatformAdmin && (
          <button
            type="button"
            onClick={() => handleSelectWorkspace('admin')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors cursor-pointer text-left ${
              isAdminActive
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold'
                : 'hover:bg-slate-50 dark:hover:bg-zinc-900 text-purple-700 dark:text-purple-400'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-purple-600 dark:text-purple-400" strokeWidth={1.75} />
              <span className="truncate">Quản Trị Nền Tảng (Admin)</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 font-mono text-purple-800 dark:text-purple-200">
                ADMIN
              </span>
              {isAdminActive && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
