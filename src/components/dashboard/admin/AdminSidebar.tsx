'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NexaLogo } from '@/components/brand/NexaLogo';
import { FeedbackModal } from '@/components/dashboard/FeedbackModal';
import {
  Home,
  Layers,
  Building2,
  BookOpenCheck,
  UserCheck,
  Cpu,
  ShieldCheck,
  Settings,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  CreditCard,
} from 'lucide-react';

const mainNavItems = [
  { name: 'Tổng quan', href: '/admin/dashboard', icon: Home },
  { name: 'Khung năng lực', href: '/admin/frameworks', icon: Layers },
  { name: 'Đề thi & Học liệu', href: '/admin/content', icon: BookOpenCheck },
  { name: 'Duyệt đề cộng đồng', href: '/admin/contributions', icon: BookOpenCheck, badge: '1' },
  { name: 'Cấu hình AI', href: '/admin/ai-gateway', icon: Cpu },
];

const managementNavItems = [
  { name: 'Quản lý người dùng', href: '/admin/users', icon: Users },
  { name: 'Gói dịch vụ & Giá', href: '/admin/plans', icon: CreditCard },
  { name: 'Tổ chức & Doanh nghiệp', href: '/admin/organizations', icon: Building2 },
  { name: 'Duyệt chuyên gia', href: '/admin/evaluators', icon: UserCheck },
  { name: 'Bảo mật & Nhật ký', href: '/admin/compliance', icon: ShieldCheck },
  { name: 'Cài đặt hệ thống', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
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
          {/* Brand */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-zinc-850">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 overflow-hidden"
              title="NEXA Admin"
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

          {/* Navigation */}
          <nav className="p-3 space-y-5 mt-2">
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold">
                  Hệ thống
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
                      {!isCollapsed && item.badge && (
                        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold">
                  Quản trị
                </div>
              )}
              <div className="space-y-1">
                {managementNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
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
          {!isCollapsed && (
            <div className="p-2.5 rounded-md bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300 font-medium mb-0.5">
                <span>Hạ tầng AI</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Sẵn sàng</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">Gemini 2.5 Flash / Pro</div>
            </div>
          )}

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
