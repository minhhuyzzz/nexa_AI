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
  BarChart2,
  Users,
  History,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  CreditCard,
  PlusCircle,
} from 'lucide-react';

const mainNavItems = [
  { name: 'Tổng quan', href: '/learner/dashboard', icon: Home },
  { name: 'Bài khảo thí', href: '/learner/assessments', icon: CheckSquare },
  { name: 'Lộ trình học tập', href: '/learner/learning-path', icon: Compass },
  { name: 'Bảng xếp hạng', href: '/learner/leaderboard', icon: Trophy },
];

const personalNavItems = [
  { name: 'Nhóm của tôi', href: '/learner/groups', icon: Users },
  { name: 'Nhiệm vụ & Hạn nộp', href: '/learner/submissions', icon: History },
  { name: 'Chứng chỉ của tôi', href: '/learner/credentials', icon: Award },
];

export function LearnerSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <aside
        className={`border-r border-slate-200 dark:border-zinc-850 bg-white dark:bg-black flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 ${isCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-zinc-850">
            <Link
              href="/learner/dashboard"
              className="flex items-center gap-2 overflow-hidden"
              title="NEXA Platform"
            >
              <NexaLogo size={28} showText={!isCollapsed} />
            </Link>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-850 transition-colors"
              title={isCollapsed ? 'Mở rộng menu' : 'Thu nhỏ menu'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
              ) : (
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
              )}
            </button>
          </div>

          {/* Quick Action Button: Góp đề thi cộng đồng */}
          <div className="p-3">
            <Link
              href="/learner/contribute"
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-zinc-900 dark:hover:bg-zinc-850 dark:border dark:border-zinc-800 text-white text-xs font-medium transition-colors shadow-xs ${isCollapsed ? 'px-0' : 'px-3'
                }`}
              title="Góp đề thi cộng đồng"
            >
              <PlusCircle className="w-4 h-4 shrink-0 text-sky-400" strokeWidth={1.75} />
              {!isCollapsed && <span className="truncate">Góp đề thi cộng đồng</span>}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-5">
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold">
                  Khám phá
                </div>
              )}
              <div className="space-y-1">
                {mainNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${isCollapsed ? 'justify-center' : ''
                        } ${isActive
                          ? 'bg-slate-100 text-slate-900 font-semibold dark:bg-zinc-850 dark:text-zinc-100'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-900 dark:text-sky-400' : 'text-slate-400 dark:text-zinc-500'}`}
                        strokeWidth={1.75}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold">
                  Cá nhân
                </div>
              )}
              <div className="space-y-1">
                {personalNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${isCollapsed ? 'justify-center' : ''
                        } ${isActive
                          ? 'bg-slate-100 text-slate-900 font-semibold dark:bg-zinc-850 dark:text-zinc-100'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-900 dark:text-sky-400' : 'text-slate-400 dark:text-zinc-500'}`}
                        strokeWidth={1.75}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Feedback Button at Sidebar Bottom */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-850">
          <button
            onClick={() => setShowFeedback(true)}
            title="Đóng góp ý kiến cho NEXA"
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200/80 dark:bg-zinc-900/60 dark:hover:bg-zinc-850 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 transition-colors ${isCollapsed ? 'justify-center' : ''
              }`}
          >
            <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" strokeWidth={1.75} />
            {!isCollapsed && (
              <div className="text-left">
                <div className="font-medium text-slate-900 dark:text-zinc-100 leading-tight">Đóng góp ý kiến</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Giúp hoàn thiện NEXA</div>
              </div>
            )}
          </button>
        </div>
      </aside>

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </>
  );
}
