'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NexaLogo } from '@/components/brand/NexaLogo';
import { SidebarFloatingTooltip, type TooltipState } from '@/components/dashboard/SidebarFloatingTooltip';
import {
  Home,
  BarChart3,
  Users,
  Building2,
  BookOpenCheck,
  FileCheck2,
  CreditCard,
  Receipt,
  Sparkles,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  MessageSquare,
  Compass,
  Target,
  GraduationCap,
  Shield,
  LucideIcon,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

const adminNavSections: NavSection[] = [
  {
    id: 'operations',
    label: 'Điều hành',
    items: [
      { name: 'Tổng quan nền tảng', href: '/admin/dashboard', icon: Home, exact: true },
    ],
  },
  {
    id: 'business',
    label: 'Khách hàng và kinh doanh',
    items: [
      { name: 'Người dùng', href: '/admin/users', icon: Users, exact: false },
      { name: 'Tổ chức Business', href: '/admin/organizations', icon: Building2, exact: false },
      { name: 'Gói dịch vụ', href: '/admin/plans', icon: CreditCard, exact: false },
      { name: 'Giao dịch đối soát', href: '/admin/transactions', icon: Receipt, exact: false },
    ],
  },
  {
    id: 'content',
    label: 'Năng lực và khảo thí',
    items: [
      { name: 'Khảo thí đầu vào', href: '/admin/baseline', icon: Target, exact: false },
      { name: 'Ngân hàng đề chuẩn', href: '/admin/content', icon: BookOpenCheck, exact: false },
      { name: 'Lộ trình học tập', href: '/admin/learning-paths', icon: GraduationCap, exact: false },
      { name: 'Phân tích năng lực số', href: '/admin/analytics', icon: BarChart3, exact: false },
    ],
  },
  {
    id: 'community',
    label: 'Cộng đồng và phản hồi',
    items: [
      { name: 'Hộp thư góp ý', href: '/admin/communications', icon: MessageSquare, exact: false },
      { name: 'Kiểm duyệt đóng góp', href: '/admin/contributions', icon: FileCheck2, exact: false },
    ],
  },
  {
    id: 'system',
    label: 'Hệ thống và bảo mật',
    items: [
      { name: 'Cổng kết nối AI', href: '/admin/ai-gateway', icon: Sparkles, exact: false },
      { name: 'Nhật ký kiểm toán', href: '/admin/compliance', icon: ShieldCheck, exact: false },
      { name: 'Cài đặt nền tảng', href: '/admin/settings', icon: Settings, exact: false },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<TooltipState | null>(null);

  return (
    <aside
      className={`border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0A0A0B] flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Brand Header */}
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
              href="/admin/dashboard"
              className="flex items-center gap-2 overflow-hidden"
              title="NEXA Admin Portal"
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

        {/* Navigation Sections */}
        <nav
          onScroll={() => setHoveredTooltip(null)}
          className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4 pb-8"
        >
          {adminNavSections.map((section) => (
            <div key={section.id} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 pt-1 pb-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  {section.label}
                </div>
              ) : (
                <div className="h-2" />
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href || (item.href === '/admin/dashboard' && pathname === '/admin')
                    : pathname.startsWith(item.href);
                  const ItemIcon = item.icon;

                  if (isCollapsed) {
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
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs ring-1 ring-blue-500/25'
                            : 'text-slate-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-zinc-850/60'
                        }`}
                      >
                        <ItemIcon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-zinc-400 group-hover:text-neutral-900 dark:group-hover:text-white'
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
                        isActive
                          ? 'bg-blue-50/90 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                          : 'text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-zinc-850/60'
                      }`}
                    >
                      <ItemIcon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-400'
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
        </nav>

        {/* Footer: System Status Telemetry Only */}
        <div className="shrink-0 pb-3">
          {!isCollapsed ? (
            <div className="px-3">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                    Dịch vụ sẵn sàng
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  LIVE
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredTooltip({ name: 'Hệ thống dịch vụ sẵn sàng (Live)', top: rect.top + rect.height / 2 });
                }}
                onMouseLeave={() => setHoveredTooltip(null)}
                className="w-10 h-8 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 flex items-center justify-center relative group cursor-default"
                title="Hệ thống dịch vụ sẵn sàng (Live)"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Tooltip outside scroll container */}
      <SidebarFloatingTooltip tooltip={isCollapsed ? hoveredTooltip : null} />
    </aside>
  );
}
