'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NexaLogo } from '@/components/brand/NexaLogo';
import { FeedbackModal } from '@/components/dashboard/FeedbackModal';
import {
  Home,
  Users,
  Database,
  FileCheck,
  Radio,
  CheckSquare,
  BarChart3,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  CreditCard,
} from 'lucide-react';

const assessmentNavItems = [
  { name: 'Tổng quan', href: '/evaluator/dashboard', icon: Home, exact: true },
  { name: 'Lớp học & Học viên', href: '/evaluator/groups', icon: Users, exact: false },
  { name: 'Phòng thi trực tiếp', href: '/evaluator/live-room', icon: Radio, exact: false },
];

const resourceNavItems = [
  { name: 'Quản lý Đề thi', href: '/evaluator/assessments', icon: FileCheck, exact: false },
  { name: 'Báo cáo & Thống kê', href: '/evaluator/analytics', icon: BarChart3, exact: false },
];

export function EvaluatorSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <aside
        className={`border-r border-slate-200 dark:border-zinc-850 bg-white dark:bg-black flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-zinc-850">
            <Link
              href="/evaluator/dashboard"
              className="flex items-center gap-2 overflow-hidden"
              title="NEXA Evaluator"
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

          {/* Quick Action Button */}
          <div className="p-3">
            <Link
              href="/evaluator/live-room"
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs ${
                isCollapsed ? 'px-0' : 'px-4'
              }`}
              title="Mở phòng thi mới"
            >
              <Plus className="w-4 h-4 shrink-0" strokeWidth={2} />
              {!isCollapsed && <span>Mở phòng thi mới</span>}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-5">
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold">
                  Khảo thí
                </div>
              )}
              <div className="space-y-1">
                {assessmentNavItems.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        isCollapsed ? 'justify-center' : ''
                      } ${
                        isActive
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
                  Tài nguyên &amp; Báo cáo
                </div>
              )}
              <div className="space-y-1">
                {resourceNavItems.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        isCollapsed ? 'justify-center' : ''
                      } ${
                        isActive
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

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-850 space-y-2">
          <button
            onClick={() => setShowFeedback(true)}
            title="Đóng góp ý kiến cho NEXA"
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 dark:bg-zinc-900/60 dark:hover:bg-zinc-850 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" strokeWidth={1.75} />
            {!isCollapsed && (
              <span className="font-medium text-slate-800 dark:text-zinc-200">Đóng góp ý kiến</span>
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
