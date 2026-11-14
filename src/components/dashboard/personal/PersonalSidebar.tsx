'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NexaLogo } from '@/components/brand/NexaLogo';
import { FeedbackModal } from '@/components/dashboard/FeedbackModal';
import { SidebarFeedbackCard } from '@/components/dashboard/SidebarFeedbackCard';
import { SidebarFloatingTooltip, type TooltipState } from '@/components/dashboard/SidebarFloatingTooltip';
import {
  LayoutGrid,
  ClipboardCheck,
  Route,
  Award,
  Users,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  FilePlus2,
  Radio,
  Share2,
  Trophy,
  Compass,
  FileCheck,
  LucideIcon,
  X,
} from 'lucide-react';
import { useMobileNav } from '@/contexts/MobileNavContext';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const learningNavItems: NavItem[] = [
  { name: 'Tổng quan', href: '/personal/dashboard', icon: LayoutGrid },
  { name: 'Khảo thí chuẩn', href: '/personal/assessments', icon: ClipboardCheck },
  { name: 'Lộ trình của tôi', href: '/personal/learning-path', icon: Route },
  { name: 'Bảng xếp hạng', href: '/personal/leaderboard', icon: Trophy },
  { name: 'Chứng chỉ', href: '/personal/credentials', icon: Award },
];

const workNavItems: NavItem[] = [
  { name: 'Lớp & Nhóm', href: '/personal/groups', icon: Users },
  { name: 'Bài được giao', href: '/personal/submissions', icon: ListChecks },
];

const creatorNavItems: NavItem[] = [
  { name: 'Đề đánh giá của tôi', href: '/personal/authoring', icon: FilePlus2 },
  { name: 'Phòng thi trực tiếp', href: '/personal/live-room', icon: Radio },
  { name: 'Góp đề cộng đồng', href: '/personal/contribute', icon: Share2 },
];

export function PersonalSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [canGrade, setCanGrade] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<TooltipState | null>(null);
  const { isMobileOpen, closeMobile } = useMobileNav();

  useEffect(() => {
    // If tablet (768px - 1024px), default to collapsed (Icon Rail)
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/personal/evaluator-check')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.canGrade) {
          setCanGrade(true);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const dynamicWorkNavItems = [
    ...workNavItems,
    ...(canGrade
      ? [{ name: 'Bài cần chấm', href: '/personal/grading', icon: FileCheck }]
      : []),
  ];

  const isRouteActive = (href: string) => {
    if (href === '/personal/dashboard' || href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/personal/dashboard';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderNavGroup = (
    title: string,
    items: NavItem[],
    onItemClick?: () => void,
    collapsedOverride?: boolean
  ) => {
    const collapsed = collapsedOverride !== undefined ? collapsedOverride : isCollapsed;
    return (
      <div className="space-y-1">
        {!collapsed ? (
          <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            {title}
          </div>
        ) : (
          <div className="h-2" />
        )}
        <div className="space-y-1">
          {items.map((item) => {
            const active = isRouteActive(item.href);
            const Icon = item.icon;

            if (collapsed) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.name}
                  title={item.name}
                  onClick={onItemClick}
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
                onClick={onItemClick}
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
    );
  };

  return (
    <>
      {/* 1. Desktop & Tablet Fixed Sidebar (hidden on mobile < md) */}
      <aside
        className={`hidden md:flex border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0A0A0B] flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 select-none ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Brand header */}
          {isCollapsed ? (
            <div className="h-16 flex items-center justify-center shrink-0">
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredTooltip({ name: 'Mở rộng menu', top: rect.top + rect.height / 2 });
                }}
                onMouseLeave={() => setHoveredTooltip(null)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                title="Mở rộng menu"
                aria-label="Mở rộng menu"
              >
                <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <div className="h-16 px-3.5 flex items-center justify-between shrink-0">
              <Link
                href="/personal/dashboard"
                className="flex items-center gap-2 overflow-hidden"
                title="NEXA AI Platform"
              >
                <NexaLogo size={28} showText={true} />
              </Link>

              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                title="Thu nhỏ menu"
                aria-label="Thu nhỏ menu"
              >
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          )}

          {/* Navigation Items (Scrollable without native scrollbar) */}
          <nav
            onScroll={() => setHoveredTooltip(null)}
            className="flex-1 overflow-y-auto no-scrollbar px-2.5 py-2 space-y-3"
          >
            {renderNavGroup('Học tập & Phát triển', learningNavItems)}
            {renderNavGroup('Nhóm & Công việc', dynamicWorkNavItems)}
            {renderNavGroup('Công cụ tạo & Tổ chức', creatorNavItems)}
          </nav>

          {/* Blue Feedback Box at bottom */}
          <SidebarFeedbackCard
            isCollapsed={isCollapsed}
            onOpenFeedback={() => setShowFeedback(true)}
            onHoverTooltip={setHoveredTooltip}
            title="Đóng góp ý kiến"
            description="Ý kiến của bạn giúp NEXA ngày một hoàn thiện hơn."
          />
        </div>

        {/* Floating Tooltip outside scroll container */}
        <SidebarFloatingTooltip tooltip={isCollapsed ? hoveredTooltip : null} />
      </aside>

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
                href="/personal/dashboard"
                onClick={closeMobile}
                className="flex items-center gap-2 overflow-hidden"
                title="NEXA AI Platform"
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

            {/* Mobile Nav Links: clicking any closes drawer */}
            <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-3">
              {renderNavGroup('Học tập & Phát triển', learningNavItems, closeMobile, false)}
              {renderNavGroup('Nhóm & Công việc', dynamicWorkNavItems, closeMobile, false)}
              {renderNavGroup('Công cụ tạo & Tổ chức', creatorNavItems, closeMobile, false)}
            </nav>

            {/* Mobile Feedback Card */}
            <SidebarFeedbackCard
              isCollapsed={false}
              onOpenFeedback={() => {
                closeMobile();
                setShowFeedback(true);
              }}
              onHoverTooltip={() => {}}
              title="Đóng góp ý kiến"
              description="Ý kiến của bạn giúp NEXA ngày một hoàn thiện hơn."
            />
          </div>
        </aside>
      </div>

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  );
}

export { PersonalSidebar as LearnerSidebar };
