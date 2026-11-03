'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  User,
  Check,
  ChevronRight,
  Sparkles,
  Copy,
  Plus,
  UserPlus,
} from 'lucide-react';
import { JoinOrgModal } from './JoinOrgModal';
import { OrgInviteModal } from './org/OrgInviteModal';

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

// Global in-memory cache for 0ms instant loading
let cachedWorkspaces: WorkspaceItem[] | null = null;
let cachedPlanTier: 'FREE' | 'PRO' = 'FREE';
let isPrefetched = false;

function prefetchWorkspaces() {
  if (typeof window === 'undefined' || isPrefetched) return;
  isPrefetched = true;
  fetch('/api/organizations/my')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data?.workspaces) {
        cachedWorkspaces = data.workspaces;
        if (data.planTier) {
          cachedPlanTier = data.planTier.toUpperCase() === 'PRO' ? 'PRO' : 'FREE';
        }
        try {
          sessionStorage.setItem('nexa_cached_workspaces', JSON.stringify(data.workspaces));
        } catch {}
      }
    })
    .catch(() => {});
}

// Prefetch immediately on client bundle load
if (typeof window !== 'undefined') {
  prefetchWorkspaces();
}

interface AvatarWorkspaceSectionProps {
  onClose: () => void;
  onOpenJoinModal?: () => void;
  onOpenInviteModal?: (org: OrganizationInfo) => void;
  userAvatarUrl?: string | null;
  userDisplayName?: string;
}

export function AvatarWorkspaceSection({
  onClose,
  onOpenJoinModal,
  onOpenInviteModal,
}: AvatarWorkspaceSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Instant state initialization from in-memory cache or sessionStorage
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>(() => {
    if (cachedWorkspaces) return cachedWorkspaces;
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('nexa_cached_workspaces');
        if (stored) {
          const parsed = JSON.parse(stored);
          cachedWorkspaces = parsed;
          return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('personal');
  const [personalPlan, setPersonalPlan] = useState<'FREE' | 'PRO'>(cachedPlanTier);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

    const controller = new AbortController();

    const fetchWorkspaces = async () => {
      try {
        const res = await fetch('/api/organizations/my', { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (data.workspaces) {
            cachedWorkspaces = data.workspaces;
            setWorkspaces(data.workspaces);
            try {
              sessionStorage.setItem('nexa_cached_workspaces', JSON.stringify(data.workspaces));
            } catch {}

            if (data.planTier) {
              const tier = data.planTier.toUpperCase() === 'PRO' ? 'PRO' : 'FREE';
              cachedPlanTier = tier;
              setPersonalPlan(tier);
            }

            if (pathname?.startsWith('/org/')) {
              const routeSlug = pathname.split('/')[2];
              const matched = data.workspaces.find((w: WorkspaceItem) => w.organization.slug === routeSlug);
              if (matched) {
                setActiveWorkspaceId(`org_${matched.organization.id}`);
              }
            } else {
              setActiveWorkspaceId('personal');
            }
          }
        }
      } catch (err: unknown) {
        const isAbort = (err as { name?: string })?.name === 'AbortError';
        if (!isAbort) {
          console.warn('Could not load workspaces in avatar menu:', (err as Error)?.message || err);
        }
      }
    };

    fetchWorkspaces();

    return () => {
      controller.abort();
    };
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
    } else {
      router.refresh();
    }
  };

  const adminWorkspaces = workspaces.filter(
    (w) => w.role === 'ORG_OWNER' || w.role === 'ORG_ADMIN'
  );

  const isPersonalActive = pathname?.startsWith('/personal') || activeWorkspaceId === 'personal';
  const currentActiveOrg = adminWorkspaces.find((w) =>
    pathname?.startsWith(`/org/${w.organization.slug}`) || activeWorkspaceId === `org_${w.organization.id}`
  );

  const activeName = currentActiveOrg ? currentActiveOrg.organization.name : 'Cá nhân';
  const inviteCode = currentActiveOrg?.organization.code || currentActiveOrg?.organization.slug || '';

  const handleCopyInviteCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-2.5 border-b border-slate-100 dark:border-zinc-850">
      {/* 1. NÂNG CẤP PRO Ở CÁ NHÂN: Đặt ở PHÍA TRÊN không gian làm việc */}
      {isPersonalActive && !currentActiveOrg && personalPlan === 'FREE' && (
        <div className="px-3 pb-2.5">
          <Link
            href="/personal/billing"
            onClick={onClose}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 hover:brightness-95 transition-all text-xs font-semibold shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Nâng cấp NEXA PRO</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono">
              PRO
            </span>
          </Link>
        </div>
      )}

      {/* 2. Tiêu đề nhóm Không gian làm việc */}
      <div className="px-4 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
        Không gian làm việc
      </div>

      {/* 3. Main Workspace Row (Clickable Trigger with perfectly anchored flyout) */}
      <div className="px-2 relative">
        <button
          type="button"
          onClick={() => setIsFlyoutOpen(!isFlyoutOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer group text-left ${
            isFlyoutOpen
              ? 'bg-slate-100 dark:bg-zinc-850'
              : 'hover:bg-slate-50 dark:hover:bg-zinc-850/80'
          }`}
          aria-expanded={isFlyoutOpen}
          aria-label="Chuyển đổi không gian làm việc"
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {currentActiveOrg ? (
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
            ) : (
              <User className="w-4 h-4 text-slate-600 dark:text-neutral-400 shrink-0" strokeWidth={1.75} />
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm text-slate-900 dark:text-neutral-100 truncate">
                {activeName}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                {currentActiveOrg
                  ? (currentActiveOrg.organization.plan_tier?.toUpperCase() === 'ENTERPRISE' ? 'Enterprise' : 'Business')
                  : (personalPlan === 'PRO' ? 'Pro' : 'Miễn phí')}
              </span>
            </div>
          </div>

          <ChevronRight
            className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-neutral-200 transition-transform shrink-0 ${
              isFlyoutOpen ? 'rotate-90 sm:rotate-0' : ''
            }`}
            strokeWidth={2}
          />
        </button>

        {/* 4. Flyout Submenu "Chuyển đổi" - Định vị chuẩn xác ngang hàng với nút bấm */}
        {isFlyoutOpen && (
          <div className="mt-2 sm:mt-0 sm:absolute sm:right-[calc(100%+8px)] sm:top-0 w-full sm:w-64 rounded-xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-xl p-2.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-zinc-800 sm:border-none mb-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Chuyển đổi
              </span>
              <button
                type="button"
                onClick={() => setIsFlyoutOpen(false)}
                className="sm:hidden text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-neutral-100 font-medium px-1.5 py-0.5 rounded"
              >
                Đóng
              </button>
            </div>

            {/* Danh sách không gian làm việc: TÊN + GÓI TƯƠNG ỨNG + DẤU TICK */}
            <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
              {/* Option 1: Cá nhân */}
              <button
                type="button"
                onClick={() => {
                  handleSelectWorkspace('personal');
                  setIsFlyoutOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                  isPersonalActive
                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-neutral-100'
                    : 'hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className={`text-xs truncate ${isPersonalActive ? 'font-bold text-slate-900 dark:text-neutral-100' : 'font-medium text-slate-800 dark:text-zinc-200'}`}>
                    Cá nhân
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                    {personalPlan === 'PRO' ? 'Pro' : 'Miễn phí'}
                  </span>
                </div>
                {isPersonalActive && (
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" strokeWidth={2.5} />
                )}
              </button>

              {/* Option 2+: Các tổ chức quản trị (Chỉ hiển thị cho ORG_OWNER / ORG_ADMIN) */}
              {adminWorkspaces.map((ws) => {
                const isOrgActive =
                  pathname?.startsWith(`/org/${ws.organization.slug}`) ||
                  activeWorkspaceId === `org_${ws.organization.id}` ||
                  activeWorkspaceId === ws.organization.id;

                const planLabel = ws.organization.plan_tier?.toUpperCase() === 'ENTERPRISE'
                  ? 'Enterprise'
                  : 'Business';

                return (
                  <button
                    key={ws.membershipId}
                    type="button"
                    onClick={() => {
                      handleSelectWorkspace(`org_${ws.organization.id}`, ws.organization.slug);
                      setIsFlyoutOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                      isOrgActive
                        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-neutral-100'
                        : 'hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className={`text-xs truncate ${isOrgActive ? 'font-bold text-slate-900 dark:text-neutral-100' : 'font-medium text-slate-800 dark:text-zinc-200'}`}>
                        {ws.organization.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                        {planLabel}
                      </span>
                    </div>
                    {isOrgActive && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" strokeWidth={2.5} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Hành động dưới cùng của Menu Chuyển đổi */}
            <div className="pt-1.5 mt-1.5 border-t border-slate-100 dark:border-zinc-800">
              {currentActiveOrg ? (
                /* Khi đang ở Tổ chức: Hiển thị "Mời thành viên" */
                <button
                  type="button"
                  onClick={() => {
                    setIsFlyoutOpen(false);
                    if (onOpenInviteModal && currentActiveOrg) {
                      onClose();
                      onOpenInviteModal(currentActiveOrg.organization);
                    } else {
                      setShowInviteModal(true);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer text-left"
                >
                  <UserPlus className="w-4 h-4 shrink-0" strokeWidth={2} />
                  <span>Mời thành viên</span>
                </button>
              ) : (
                /* Khi đang ở Cá nhân: Hiển thị "Tham gia tổ chức khác" */
                <button
                  type="button"
                  onClick={() => {
                    setIsFlyoutOpen(false);
                    if (onOpenJoinModal) {
                      onClose();
                      onOpenJoinModal();
                    } else {
                      setShowJoinModal(true);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer text-left"
                >
                  <Plus className="w-4 h-4 shrink-0" strokeWidth={2} />
                  <span>Tham gia tổ chức khác</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals fallback if not handled by parent */}
      <JoinOrgModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {currentActiveOrg && (
        <OrgInviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          organization={currentActiveOrg.organization}
          userRole={currentActiveOrg.role}
        />
      )}
    </div>
  );
}
