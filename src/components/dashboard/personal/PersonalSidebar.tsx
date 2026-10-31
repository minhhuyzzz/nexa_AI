'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NexaLogo } from '@/components/brand/NexaLogo';
import { FeedbackModal } from '@/components/dashboard/FeedbackModal';
import {
  Home,
  CheckSquare,
  Compass,
  Award,
  Users,
  History,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  FilePlus,
  Radio,
  BarChart2,
  Database,
  Settings,
  Share2,
} from 'lucide-react';

const learningNavItems = [
  { name: 'Tổng quan', href: '/personal/dashboard', icon: Home },
  { name: 'Bài đánh giá', href: '/personal/assessments', icon: CheckSquare },
  { name: 'Hồ sơ năng lực', href: '/personal/competency', icon: BarChart2 },
  { name: 'Lộ trình của tôi', href: '/personal/learning-path', icon: Compass },
  { name: 'Chứng chỉ', href: '/personal/credentials', icon: Award },
];

const workNavItems = [
  { name: 'Lớp & Nhóm', href: '/personal/groups', icon: Users },
  { name: 'Bài được giao', href: '/personal/submissions', icon: History },
];

const creatorNavItems = [
  { name: 'Đề đánh giá của tôi', href: '/personal/authoring', icon: FilePlus },
  { name: 'Ngân hàng câu hỏi', href: '/personal/item-bank', icon: Database },
  { name: 'Phòng thi trực tiếp', href: '/personal/live-room', icon: Radio },
  { name: 'Góp đề cộng đồng', href: '/personal/contribute', icon: Share2 },
];

export function PersonalSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const isRouteActive = (href: string) => {
    if (href === '/personal/dashboard' || href === '/dashboard') {
      return (
        pathname === '/dashboard' ||
        pathname === '/personal/dashboard'
      );
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      <aside
        className={`border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Brand header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
            <Link
              href="/personal/dashboard"
              className="flex items-center gap-2 overflow-hidden"
              title="NEXA AI Platform"
            >
              <NexaLogo size={28} showText={!isCollapsed} />
            </Link>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {/* 1. Học tập & Phát triển */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
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
                          ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-sky-600'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${active ? 'text-sky-600' : 'text-slate-400'}`}
                        strokeWidth={1.75}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 2. Nhóm & Công việc */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
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
                          ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-sky-600'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${active ? 'text-sky-600' : 'text-slate-400'}`}
                        strokeWidth={1.75}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 3. Công cụ tạo & Tổ chức */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
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
                          ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-sky-600'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${active ? 'text-sky-600' : 'text-slate-400'}`}
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
          <div className="p-3 border-t border-slate-100 shrink-0 space-y-1">
            <Link
              href="/personal/settings"
              title={isCollapsed ? 'Cài đặt' : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors ${
                isCollapsed ? 'justify-center px-0' : ''
              } ${isRouteActive('/personal/settings') ? 'bg-slate-100 text-slate-900 font-semibold' : ''}`}
            >
              <Settings className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.75} />
              {!isCollapsed && <span>Cài đặt</span>}
            </Link>

            <button
              onClick={() => setShowFeedback(true)}
              title="Đóng góp ý kiến cho NEXA"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <MessageSquare className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />
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
