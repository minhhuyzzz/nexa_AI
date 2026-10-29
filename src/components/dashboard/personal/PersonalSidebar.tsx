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
  Trophy,
  Award,
  Users,
  History,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  FilePlus,
  Radio,
  CreditCard,
  BarChart2,
  Database,
} from 'lucide-react';

const mainNavItems = [
  { name: 'Tổng quan', href: '/personal/dashboard', icon: Home },
  { name: 'Bài khảo thí', href: '/personal/assessments', icon: CheckSquare },
  { name: 'Lộ trình học tập', href: '/personal/learning-path', icon: Compass },
  { name: 'Radar 5 Miền', href: '/personal/competency', icon: BarChart2 },
  { name: 'Bảng xếp hạng', href: '/personal/leaderboard', icon: Trophy },
];

const personalNavItems = [
  { name: 'Nhóm học tập', href: '/personal/groups', icon: Users },
  { name: 'Nhiệm vụ & Hạn nộp', href: '/personal/submissions', icon: History },
  { name: 'Chứng chỉ của tôi', href: '/personal/credentials', icon: Award },
];

const creatorNavItems = [
  { name: 'Đề thi của tôi', href: '/personal/authoring', icon: FilePlus },
  { name: 'Phòng thi trực tiếp', href: '/personal/live-room', icon: Radio },
  { name: 'Bàn chấm bài', href: '/personal/grading', icon: CheckSquare },
  { name: 'Ngân hàng câu hỏi', href: '/personal/item-bank', icon: Database },
  { name: 'Gói & Nâng cấp', href: '/personal/billing', icon: CreditCard },
];

export function PersonalSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const isRouteActive = (href: string) => {
    if (href === '/personal/dashboard' || href === '/dashboard') {
      return (
        pathname === '/dashboard' ||
        pathname === '/personal/dashboard' ||
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

          {/* Quick Action Button: Góp đề thi cộng đồng */}
          <div className="p-3 shrink-0">
            <Link
              href="/personal/contribute"
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs ${
                isCollapsed ? 'px-0' : 'px-3'
              }`}
              title="Góp đề thi cộng đồng"
            >
              <PlusCircle className="w-4 h-4 shrink-0 text-sky-400" strokeWidth={1.75} />
              {!isCollapsed && <span className="truncate">Góp đề thi cộng đồng</span>}
            </Link>
          </div>

          {/* Navigation Items (Scrollable) */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
            {/* 1. Khám phá & Học tập */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Học tập & Năng lực
                </div>
              )}
              <div className="space-y-1">
                {mainNavItems.map((item) => {
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

            {/* 2. Cá nhân */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Cá nhân
                </div>
              )}
              <div className="space-y-1">
                {personalNavItems.map((item) => {
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

            {/* 3. Tạo & Tổ chức */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Tạo & Tổ chức
                </div>
              )}
              <div className="space-y-1">
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

          {/* Feedback Button at Sidebar Bottom */}
          <div className="p-3 border-t border-slate-100 shrink-0">
            <button
              onClick={() => setShowFeedback(true)}
              title="Đóng góp ý kiến cho NEXA"
              className={`w-full flex items-center gap-2.5 p-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs text-slate-700 transition-colors ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <MessageSquare className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />
              {!isCollapsed && (
                <div className="text-left">
                  <div className="font-semibold text-slate-900 leading-tight">Đóng góp ý kiến</div>
                  <div className="text-[10px] text-slate-500">Giúp hoàn thiện NEXA</div>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  );
}

export { PersonalSidebar as LearnerSidebar };
