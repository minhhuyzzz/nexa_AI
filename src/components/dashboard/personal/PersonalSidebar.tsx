'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NexaLogo } from '@/components/brand/NexaLogo';
import { FeedbackModal } from '@/components/dashboard/FeedbackModal';
import {
  LayoutGrid,
  ClipboardCheck,
  Route,
  Award,
  Users,
  ListChecks,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  FilePlus2,
  Radio,
  Settings,
  Share2,
  Trophy,
} from 'lucide-react';

const learningNavItems = [
  { name: 'Tổng quan', href: '/personal/dashboard', icon: LayoutGrid },
  { name: 'Bài đánh giá', href: '/personal/assessments', icon: ClipboardCheck },
  { name: 'Lộ trình của tôi', href: '/personal/learning-path', icon: Route },
  { name: 'Bảng xếp hạng', href: '/personal/leaderboard', icon: Trophy },
  { name: 'Chứng chỉ', href: '/personal/credentials', icon: Award },
];

const workNavItems = [
  { name: 'Lớp & Nhóm', href: '/personal/groups', icon: Users },
  { name: 'Bài được giao', href: '/personal/submissions', icon: ListChecks },
];

const creatorNavItems = [
  { name: 'Đề đánh giá của tôi', href: '/personal/authoring', icon: FilePlus2 },
  { name: 'Phòng thi trực tiếp', href: '/personal/live-room', icon: Radio },
  { name: 'Góp đề cộng đồng', href: '/personal/contribute', icon: Share2 },
];

export function PersonalSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const isRouteActive = (href: string) => {
    if (href === '/personal/dashboard' || href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/personal/dashboard';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      <aside
        className={`border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0A0A0B] flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Brand header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 shrink-0">
            <Link
              href="/personal/dashboard"
              className="flex items-center gap-2 overflow-hidden"
              title="NEXA AI Platform"
            >
              <NexaLogo size={28} showText={!isCollapsed} />
            </Link>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md text-slate-400 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors"
              title={isCollapsed ? 'Mở rộng menu' : 'Thu nhỏ menu'}
              aria-label={isCollapsed ? 'Mở rộng menu' : 'Thu nhỏ menu'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
              ) : (
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
              )}
            </button>
          </div>

          {/* Navigation Items (Scrollable) */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {/* 1. Học tập & Phát triển */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[11px] uppercase tracking-wider text-slate-400 dark:text-neutral-400 font-semibold">
                  Học tập &amp; Phát triển
                </div>
              )}
              <div className="space-y-0.5">
                {learningNavItems.map((item) => {
                  const active = isRouteActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        isCollapsed ? 'justify-center px-0' : ''
                      } ${
                        active
                          ? 'bg-blue-50/70 dark:bg-zinc-900/90 text-blue-600 dark:text-blue-400 font-semibold border-l-2 border-blue-600 dark:border-blue-400'
                          : 'text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-neutral-300'}`}
                        strokeWidth={1.75}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="my-2.5 border-t border-slate-100 dark:border-zinc-800/80" />

            {/* 2. Nhóm & Công việc */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[11px] uppercase tracking-wider text-slate-400 dark:text-neutral-400 font-semibold">
                  Nhóm &amp; Công việc
                </div>
              )}
              <div className="space-y-0.5">
                {workNavItems.map((item) => {
                  const active = isRouteActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        isCollapsed ? 'justify-center px-0' : ''
                      } ${
                        active
                          ? 'bg-blue-50/70 dark:bg-zinc-900/90 text-blue-600 dark:text-blue-400 font-semibold border-l-2 border-blue-600 dark:border-blue-400'
                          : 'text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-neutral-300'}`}
                        strokeWidth={1.75}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="my-2.5 border-t border-slate-100 dark:border-zinc-800/80" />

            {/* 3. Công cụ tạo & Tổ chức */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[11px] uppercase tracking-wider text-slate-400 dark:text-neutral-400 font-semibold">
                  Công cụ tạo &amp; Tổ chức
                </div>
              )}
              <div className="space-y-0.5">
                {creatorNavItems.map((item) => {
                  const active = isRouteActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        isCollapsed ? 'justify-center px-0' : ''
                      } ${
                        active
                          ? 'bg-blue-50/70 dark:bg-zinc-900/90 text-blue-600 dark:text-blue-400 font-semibold border-l-2 border-blue-600 dark:border-blue-400'
                          : 'text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-neutral-300'}`}
                        strokeWidth={1.75}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Footer Items: Settings & Feedback */}
          <div className="p-3 border-t border-slate-100 dark:border-zinc-850 shrink-0 space-y-1">
            <Link
              href="/personal/settings"
              title={isCollapsed ? 'Cài đặt' : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors ${
                isCollapsed ? 'justify-center px-0' : ''
              } ${isRouteActive('/personal/settings') ? 'bg-slate-100 dark:bg-zinc-850 text-neutral-900 dark:text-neutral-100 font-semibold' : ''}`}
            >
              <Settings className="w-4 h-4 text-slate-400 dark:text-neutral-500 shrink-0" strokeWidth={1.75} />
              {!isCollapsed && <span>Cài đặt</span>}
            </Link>

            <button
              onClick={() => setShowFeedback(true)}
              title="Đóng góp ý kiến cho NEXA"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
              {!isCollapsed && <span>Góp ý kiến</span>}
            </button>
          </div>
        </div>
      </aside>

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  );
}

export { PersonalSidebar as LearnerSidebar };
