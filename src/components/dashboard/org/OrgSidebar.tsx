'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NexaLogo } from '@/components/brand/NexaLogo';
import { FeedbackModal } from '@/components/dashboard/FeedbackModal';
import { SidebarFeedbackCard } from '@/components/dashboard/SidebarFeedbackCard';
import { SidebarFloatingTooltip, type TooltipState } from '@/components/dashboard/SidebarFloatingTooltip';
import {
  Building2,
  Users,
  CheckSquare,
  BarChart2,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  FolderKanban,
  FilePlus,
  CreditCard,
  Plus,
  ChevronRight,
  CalendarRange,
  Radio,
  ClipboardCheck,
  LucideIcon,
  X,
} from 'lucide-react';
import { useMobileNav } from '@/contexts/MobileNavContext';
import {
  normalizeOrgRole,
  type StandardOrgRole,
} from '@/lib/auth/org-roles';

interface OrgSidebarProps {
  orgSlug: string;
  orgName: string;
  userRole?: string;
}

const ROLE_LABELS: Record<StandardOrgRole, string> = {
  ORG_OWNER: 'Chủ sở hữu',
  ORG_ADMIN: 'Quản trị viên',
  ASSESSOR: 'Khảo thí viên',
  MEMBER: 'Thành viên',
};

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

export function OrgSidebar({ orgSlug, orgName, userRole = 'ORG_ADMIN' }: OrgSidebarProps) {
  const pathname = usePathname();
  const [showFeedback, setShowFeedback] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<TooltipState | null>(null);

  const normalizedRole = normalizeOrgRole(userRole);
  const isOwner = normalizedRole === 'ORG_OWNER';
  const isAdmin = normalizedRole === 'ORG_ADMIN';
  const isAssessor = normalizedRole === 'ASSESSOR';
  const isMember = normalizedRole === 'MEMBER';
  const roleLabel = ROLE_LABELS[normalizedRole] || 'Quản trị viên';

  // Xác định xem người dùng có đang ở trong phân hệ Khảo thí không
  const isAssessmentRoute =
    !isMember &&
    (pathname.startsWith(`/org/${orgSlug}/assessments`) ||
      pathname.startsWith(`/org/${orgSlug}/campaigns`) ||
      pathname.startsWith(`/org/${orgSlug}/grading`) ||
      pathname.startsWith(`/org/${orgSlug}/live-room`));

  const { isMobileOpen, closeMobile } = useMobileNav();

  // Khi vào phân hệ Khảo thí, Sidebar chính tự động chuyển thành Icon Rail (w-16)
  // Khi ở các trang khác, Sidebar chính mở rộng (w-64)
  const [isPrimaryCollapsed, setIsPrimaryCollapsed] = useState(isAssessmentRoute);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setIsPrimaryCollapsed(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isAssessmentRoute) {
      setIsPrimaryCollapsed(true);
    }
  }, [isAssessmentRoute]);

  // MENU CHÍNH (PRIMARY):
  // [F21 Note]: Dead code for isMember pruned per F21 (MEMBER redirected to /personal/groups).
  // Historical reference: label: 'CÁ NHÂN', name: 'Phòng thi trực tiếp', href: `/org/${orgSlug}/live-room`
  const navGroups: NavGroup[] = [
    {
      label: 'ĐIỀU HÀNH',
      items: [
        {
          name: 'Tổng quan',
          href: `/org/${orgSlug}`,
          icon: Building2,
          exact: true,
        },
        ...(isOwner || isAdmin
          ? [
              {
                name: 'Thành viên',
                href: `/org/${orgSlug}/members`,
                icon: Users,
              },
            ]
          : []),
        {
          name: 'Nhóm & Đơn vị',
          href: `/org/${orgSlug}/classes`,
          icon: FolderKanban,
        },
        {
          name: 'Báo cáo năng lực',
          href: `/org/${orgSlug}/analytics`,
          icon: BarChart2,
        },
      ],
    },
    {
      label: 'KHẢO THÍ',
      items: [
        {
          name: 'Đánh giá năng lực',
          href: `/org/${orgSlug}/assessments`,
          icon: CheckSquare,
        },
        ...(isAssessor
          ? [
              {
                name: 'Chấm bài',
                href: `/org/${orgSlug}/grading`,
                icon: ClipboardCheck,
              },
            ]
          : []),
      ],
    },
    ...(isOwner
      ? [
          {
            label: 'TÀI KHOẢN TỔ CHỨC',
            items: [
              {
                name: 'Gói sử dụng',
                href: `/org/${orgSlug}/plan`,
                icon: CreditCard,
              },
              {
                name: 'Cài đặt',
                href: `/org/${orgSlug}/settings`,
                icon: Settings,
              },
            ],
          },
        ]
      : []),
  ];

  const isPrimaryActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    // Mục "Đánh giá năng lực" active khi ở bất kỳ trang nào trong phân hệ Khảo thí
    if (item.href === `/org/${orgSlug}/assessments` && isAssessmentRoute) {
      return true;
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  // MENU THỨ 2 (SECONDARY SUB-SIDEBAR):
  const assessmentSubNavItems = [
    {
      name: 'Kho đề thi',
      href: `/org/${orgSlug}/assessments`,
      icon: FilePlus,
      isActive: pathname.startsWith(`/org/${orgSlug}/assessments`),
    },
    {
      name: 'Hoạt động khảo thí',
      href: `/org/${orgSlug}/campaigns`,
      icon: CalendarRange,
      isActive: pathname.startsWith(`/org/${orgSlug}/campaigns`),
    },
    {
      name: 'Chấm bài',
      href: `/org/${orgSlug}/grading`,
      icon: ClipboardCheck,
      isActive: pathname.startsWith(`/org/${orgSlug}/grading`),
    },
    {
      name: 'Phòng thi trực tiếp',
      href: `/org/${orgSlug}/live-room`,
      icon: Radio,
      isActive: pathname.startsWith(`/org/${orgSlug}/live-room`),
    },
  ];

  return (
    <>
      {/* 1. Desktop & Tablet Sidebar (hidden on mobile < md) */}
      <div className="hidden md:flex h-screen sticky top-0 z-30 shrink-0 select-none">
      {/* 1. PRIMARY SIDEBAR / ICON RAIL */}
      <aside
        className={`border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0A0A0B] flex flex-col justify-between shrink-0 h-full transition-all duration-300 ease-in-out relative ${
          isPrimaryCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Brand & Toggle Button */}
          {isPrimaryCollapsed ? (
            <div className="h-16 flex items-center justify-center shrink-0">
              <button
                type="button"
                onClick={() => setIsPrimaryCollapsed(!isPrimaryCollapsed)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredTooltip({ name: 'Mở rộng Sidebar chính', top: rect.top + rect.height / 2 });
                }}
                onMouseLeave={() => setHoveredTooltip(null)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                title="Mở rộng Sidebar chính"
                aria-label="Mở rộng Sidebar chính"
              >
                <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <div className="h-16 px-3.5 flex items-center justify-between shrink-0">
              <Link
                href={`/org/${orgSlug}`}
                className="flex items-center gap-2 overflow-hidden"
                title={orgName}
              >
                <NexaLogo size={28} showText={true} />
              </Link>

              <button
                type="button"
                onClick={() => setIsPrimaryCollapsed(!isPrimaryCollapsed)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                title="Thu gọn Sidebar chính"
                aria-label="Thu gọn Sidebar chính"
              >
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          )}

          {/* Current Organization Info Card (khi mở rộng) */}
          {!isPrimaryCollapsed && (
            <div className="px-3 pb-1">
              <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
                    <Building2 className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate" title={orgName}>
                      {orgName}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span>Business</span>
                      <span className="text-slate-300 dark:text-zinc-600">•</span>
                      <span className="text-neutral-700 dark:text-zinc-300 truncate">{roleLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Groups List (Hidden scrollbar) */}
          <div
            onScroll={() => setHoveredTooltip(null)}
            className="flex-1 overflow-y-auto no-scrollbar px-2.5 py-2 space-y-4"
          >
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                {!isPrimaryCollapsed && group.label ? (
                  <div className="px-3 pt-1 pb-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    {group.label}
                  </div>
                ) : (
                  isPrimaryCollapsed && <div className="h-2" />
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = isPrimaryActive(item);
                    const Icon = item.icon;

                    if (isPrimaryCollapsed) {
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-label={item.name}
                          title={item.name}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredTooltip({ name: item.name, top: rect.top + rect.height / 2 });
                          }}
                          onMouseLeave={() => setHoveredTooltip(null)}
                          className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all duration-150 relative group ${
                            active
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs ring-1 ring-blue-500/25'
                              : 'text-slate-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-zinc-850/60'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-zinc-400 group-hover:text-neutral-900 dark:group-hover:text-white'
                            }`}
                            strokeWidth={1.75}
                          />
                        </Link>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                          active
                            ? 'bg-blue-50/90 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                            : 'text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-zinc-850/60'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-400'
                          }`}
                          strokeWidth={1.75}
                        />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Blue Feedback Box at bottom */}
          <SidebarFeedbackCard
            isCollapsed={isPrimaryCollapsed}
            onOpenFeedback={() => setShowFeedback(true)}
            onHoverTooltip={setHoveredTooltip}
            title="Góp ý tổ chức"
            description="Ý kiến đóng góp giúp cải thiện quản trị tổ chức."
          />
        </div>

        {/* Floating Tooltip outside scroll container */}
        <SidebarFloatingTooltip tooltip={isPrimaryCollapsed ? hoveredTooltip : null} />
      </aside>

      {/* 2. SECONDARY SUB-SIDEBAR (MENU THỨ 2: Phân hệ Khảo thí) */}
      {isAssessmentRoute && (
        <aside className="w-60 border-r border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-[#0E0E11] flex flex-col justify-between shrink-0 h-full transition-all duration-300 ease-in-out">
          <div className="flex flex-col h-full min-h-0">
            {/* Header phân hệ Khảo thí */}
            <div className="h-16 px-4 flex items-center shrink-0 bg-white/50 dark:bg-black/20">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Đánh giá năng lực
              </h2>
            </div>

            {/* Menu dọc gồm các tab khảo thí (Hidden scrollbar) */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1.5">
              <div className="px-2 pt-1 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-zinc-500 uppercase">
                Danh mục khảo thí
              </div>

              {assessmentSubNavItems.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 ${
                      tab.isActive
                        ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs border border-slate-200/90 dark:border-zinc-800'
                        : 'text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-zinc-900/60 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    <span className="truncate flex-1">{tab.name}</span>
                    {tab.isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Quick Actions Footer trong Sidebar phụ */}
            <div className="p-3 bg-white/40 dark:bg-black/10">
              <Link
                href={`/org/${orgSlug}/assessments/new`}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Soạn đề thi mới</span>
              </Link>
            </div>
          </div>
        </aside>
      )}
      </div>

      {/* 2. Mobile Slide-over Sheet Drawer (visible on < md when isMobileOpen) */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          isMobileOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMobile}
          aria-hidden="true"
        />

        {/* Slide-over Drawer Panel */}
        <aside
          className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-[#0A0A0B] border-r border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col justify-between z-10 transition-transform duration-300 ease-in-out select-none ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full min-h-0">
            {/* Header: Logo + Close X */}
            <div className="h-16 px-4 flex items-center justify-between shrink-0">
              <Link
                href={`/org/${orgSlug}`}
                onClick={closeMobile}
                className="flex items-center gap-2 overflow-hidden"
                title={orgName}
              >
                <NexaLogo size={26} showText={true} />
              </Link>
              <button
                type="button"
                onClick={closeMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                title="Đóng menu"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            {/* Current Organization Info Card */}
            <div className="p-3">
              <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
                    <Building2 className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate" title={orgName}>
                      {orgName}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span>Business</span>
                      <span className="text-slate-300 dark:text-zinc-600">•</span>
                      <span className="text-neutral-700 dark:text-zinc-300 truncate">{roleLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Nav Links: clicking any closes drawer */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-1 space-y-4">
              {navGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1">
                  {group.label && (
                    <div className="px-3 pt-1 pb-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      {group.label}
                    </div>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isPrimaryActive(item);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMobile}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                            active
                              ? 'bg-blue-50/90 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                              : 'text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-zinc-850/60'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-400'
                            }`}
                            strokeWidth={1.75}
                          />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Assessment Sub-nav if in assessment route */}
              {isAssessmentRoute && (
                <div className="space-y-1 pt-2">
                  <div className="px-3 pt-1 pb-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Danh mục khảo thí
                  </div>
                  <div className="space-y-1">
                    {assessmentSubNavItems.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <Link
                          key={tab.href}
                          href={tab.href}
                          onClick={closeMobile}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150 ${
                            tab.isActive
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                              : 'text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-zinc-900/60'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                          <span className="truncate flex-1">{tab.name}</span>
                          {tab.isActive && (
                            <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Feedback Card */}
            <SidebarFeedbackCard
              isCollapsed={false}
              onOpenFeedback={() => {
                closeMobile();
                setShowFeedback(true);
              }}
              onHoverTooltip={() => {}}
              title="Góp ý tổ chức"
              description="Ý kiến đóng góp giúp cải thiện quản trị tổ chức."
            />
          </div>
        </aside>
      </div>

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  );
}
