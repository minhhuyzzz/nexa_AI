'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NexaLogo } from '@/components/brand/NexaLogo';
import {
  Home,
  BarChart3,
  Users,
  Building2,
  BookOpenCheck,
  Layers,
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
      { name: 'Tổng quan', href: '/admin/dashboard', icon: Home, exact: true },
      { name: 'Phân tích 5 miền', href: '/admin/analytics', icon: BarChart3, exact: false },
      { name: 'Truyền thông & Góp ý', href: '/admin/communications', icon: MessageSquare, exact: false },
    ],
  },
  {
    id: 'business',
    label: 'Khách hàng & Kinh doanh',
    items: [
      { name: 'Người dùng', href: '/admin/users', icon: Users, exact: false },
      { name: 'Tổ chức B2B', href: '/admin/organizations', icon: Building2, exact: false },
      { name: 'Gói dịch vụ', href: '/admin/plans', icon: CreditCard, exact: false },
      { name: 'Thanh toán & Đối soát', href: '/admin/transactions', icon: Receipt, exact: false },
    ],
  },
  {
    id: 'content',
    label: 'Nội dung & Khảo thí',
    items: [
      { name: 'Khảo thí đầu vào', href: '/admin/baseline', icon: Target, exact: false },
      { name: 'Ngân hàng đề chuẩn', href: '/admin/content', icon: BookOpenCheck, exact: false },
      { name: 'Lộ trình học', href: '/admin/learning-paths', icon: Compass, exact: false },
      { name: 'Kiểm duyệt đóng góp', href: '/admin/contributions', icon: FileCheck2, exact: false },
    ],
  },
  {
    id: 'system',
    label: 'Hạ tầng & An toàn',
    items: [
      { name: 'AI Gateway', href: '/admin/ai-gateway', icon: Sparkles, exact: false },
      { name: 'Bảo mật & Kiểm toán', href: '/admin/compliance', icon: ShieldCheck, exact: false },
      { name: 'Cài đặt nền tảng', href: '/admin/settings', icon: Settings, exact: false },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-black flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between sticky top-0 bg-white dark:bg-black z-10">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 overflow-hidden"
            title="NEXA Admin Portal"
          >
            <NexaLogo size={28} showText={!isCollapsed} />
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-850 transition-colors"
            title={isCollapsed ? 'Mở rộng menu' : 'Thu nhỏ menu'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3 space-y-5">
          {adminNavSections.map((section) => (
            <div key={section.id} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 tracking-tight">
                  {section.label}
                </div>
              )}

              <div className="space-y-0.5">
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
                        title={item.name}
                        className={`flex items-center justify-center p-2.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <ItemIcon
                          className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-400'}`}
                          strokeWidth={1.75}
                        />
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-semibold dark:bg-blue-950/50 dark:text-blue-400'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <ItemIcon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-400 dark:text-zinc-400'
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
      </div>

      {/* Footer Status - Chuẩn 12 ảnh: "Hệ thống hoạt động ổn định" */}
      <div className="p-3.5 shrink-0 bg-white dark:bg-black">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {!isCollapsed && (
            <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">
              Hệ thống hoạt động ổn định
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
