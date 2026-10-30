'use client';

import { useState, useEffect } from 'react';
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
  Cpu,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  LayoutDashboard,
  Shield,
} from 'lucide-react';

interface SubNavItem {
  name: string;
  href: string;
  icon: any;
  exact?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  icon: any;
  items: SubNavItem[];
}

const adminNavSections: NavSection[] = [
  {
    id: 'operations',
    label: 'ĐIỀU HÀNH',
    icon: LayoutDashboard,
    items: [
      { name: 'Trung tâm điều hành', href: '/admin/dashboard', icon: Home, exact: true },
      { name: 'Báo cáo nền tảng (5 Miền)', href: '/admin/analytics', icon: BarChart3, exact: false },
    ],
  },
  {
    id: 'business',
    label: 'KHÁCH HÀNG & KINH DOANH',
    icon: Users,
    items: [
      { name: 'Quản lý người dùng', href: '/admin/users', icon: Users, exact: false },
      { name: 'Khách hàng Business & Trường học', href: '/admin/organizations', icon: Building2, exact: false },
      { name: 'Gói & Quyền lợi', href: '/admin/plans', icon: CreditCard, exact: false },
      { name: 'Thanh toán & Đối soát', href: '/admin/transactions', icon: Receipt, exact: false },
    ],
  },
  {
    id: 'content',
    label: 'NỘI DUNG & KHẢO THÍ',
    icon: BookOpenCheck,
    items: [
      { name: 'Ngân hàng đề & Học liệu', href: '/admin/content', icon: BookOpenCheck, exact: false },
      { name: 'Khung 5 miền năng lực', href: '/admin/frameworks', icon: Layers, exact: false },
      { name: 'Kiểm duyệt nội dung', href: '/admin/contributions', icon: FileCheck2, exact: false },
    ],
  },
  {
    id: 'system',
    label: 'HẠ TẦNG & AN TOÀN',
    icon: Settings,
    items: [
      { name: 'AI Gateway & Chi phí', href: '/admin/ai-gateway', icon: Cpu, exact: false },
      { name: 'Bảo mật & Kiểm toán', href: '/admin/compliance', icon: Shield, exact: false },
      { name: 'Cài đặt nền tảng', href: '/admin/settings', icon: Settings, exact: false },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Accordion open sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    // Default open section matching current route
    const initial: Record<string, boolean> = {
      operations: true,
      business: true,
      content: true,
      system: true,
    };
    return initial;
  });

  // Ensure current section is open on navigation
  useEffect(() => {
    adminNavSections.forEach((section) => {
      const hasActiveChild = section.items.some((item) =>
        item.exact ? pathname === item.href : pathname.startsWith(item.href)
      );
      if (hasActiveChild) {
        setOpenSections((prev) => ({ ...prev, [section.id]: true }));
      }
    });
  }, [pathname]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={`border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-black flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-black z-10">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 overflow-hidden"
            title="NEXA Admin Portal"
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

        {/* Collapsible Accordion Navigation */}
        <nav className="p-3 space-y-1">
          {adminNavSections.map((section) => {
            const isOpen = Boolean(openSections[section.id]);
            const SectionIcon = section.icon;
            const hasActiveChild = section.items.some((item) =>
              item.exact ? pathname === item.href : pathname.startsWith(item.href)
            );

            if (isCollapsed) {
              // Collapsed mode: render top-level item with sub-links flyout or simple list
              return (
                <div key={section.id} className="py-1">
                  {section.items.map((item) => {
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                    const ItemIcon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.name}
                        className={`flex items-center justify-center p-2.5 rounded-md transition-colors my-1 ${
                          isActive
                            ? 'bg-slate-100 text-sky-700 font-semibold dark:bg-zinc-850 dark:text-zinc-100'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <ItemIcon
                          className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}
                          strokeWidth={1.75}
                        />
                      </Link>
                    );
                  })}
                </div>
              );
            }

            return (
              <div key={section.id} className="rounded-md overflow-hidden">
                {/* Accordion Group Header Button */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                    hasActiveChild
                      ? 'text-slate-900 font-bold bg-slate-50 dark:text-zinc-100 dark:bg-zinc-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <SectionIcon
                      className={`w-4 h-4 shrink-0 ${hasActiveChild ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}
                      strokeWidth={1.75}
                    />
                    <span className="truncate">{section.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-slate-600' : ''
                    }`}
                    strokeWidth={1.75}
                  />
                </button>

                {/* Accordion Sub-items (Xổ ra) */}
                {isOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-slate-100 dark:border-zinc-800 ml-4 mt-0.5">
                    {section.items.map((item) => {
                      const isActive = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href);
                      const ItemIcon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                            isActive
                              ? 'bg-sky-50 text-sky-700 font-semibold dark:bg-zinc-850 dark:text-zinc-100'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900'
                          }`}
                        >
                          <ItemIcon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-zinc-500'
                            }`}
                            strokeWidth={1.75}
                          />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Clean Bottom Status */}
      <div className="p-3 border-t border-slate-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-black">
        {!isCollapsed && (
          <div className="px-3 py-2 rounded-md bg-slate-50 dark:bg-zinc-900 text-xs flex items-center justify-between border border-slate-200/60 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-slate-700 dark:text-zinc-300 text-[11px]">Hệ thống</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400">
              v2.5 &bull; Hoạt động
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
