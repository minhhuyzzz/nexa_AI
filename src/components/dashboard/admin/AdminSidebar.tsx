'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { NexaLogo } from '@/components/brand/NexaLogo';
import { cn } from '@/lib/utils';
import {
  BarChart3, BookOpen, Building2, ChevronLeft, ChevronRight,
  CreditCard, FileCheck2, Layers3, LogOut, MessageSquare,
  ReceiptText, Route, Settings2, ShieldCheck, Sparkles,
  UsersRound, LayoutDashboard,
} from 'lucide-react';

type AdminNavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

const sections: { label: string; items: AdminNavItem[] }[] = [
  {
    label: 'Điều hành',
    items: [
      { label: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Báo cáo', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Khách hàng',
    items: [
      { label: 'Người dùng', href: '/admin/users', icon: UsersRound },
      { label: 'Tổ chức', href: '/admin/organizations', icon: Building2 },
      { label: 'Gói & quyền lợi', href: '/admin/plans', icon: CreditCard },
      { label: 'Thanh toán', href: '/admin/transactions', icon: ReceiptText },
    ],
  },
  {
    label: 'Nội dung NEXA',
    items: [
      { label: 'Đề đánh giá', href: '/admin/content', icon: BookOpen },
      { label: 'Lộ trình học', href: '/admin/learning-paths', icon: Route },
      { label: 'Khung năng lực', href: '/admin/frameworks', icon: Layers3 },
      { label: 'Kiểm duyệt', href: '/admin/contributions', icon: FileCheck2 },
    ],
  },
  {
    label: 'Vận hành',
    items: [
      { label: 'Hỗ trợ & thông báo', href: '/admin/communications', icon: MessageSquare },
      { label: 'AI Gateway', href: '/admin/ai-gateway', icon: Sparkles },
      { label: 'Bảo mật & kiểm toán', href: '/admin/compliance', icon: ShieldCheck },
      { label: 'Cấu hình', href: '/admin/settings', icon: Settings2 },
    ],
  },
];

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: () => void;
};

export function AdminSidebar({ collapsed, onToggleCollapse, onNavigate }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await createClient().auth.signOut();
      document.cookie = 'nexa_demo_role=; path=/; max-age=0';
      router.replace('/login');
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <aside className={cn(
      'flex h-full flex-col border-r border-zinc-200 bg-white transition-[width] duration-150',
      collapsed ? 'w-[72px]' : 'w-[236px]'
    )}>
      <div className={cn('flex h-16 shrink-0 items-center border-b border-zinc-100', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
        <Link href="/admin/dashboard" onClick={onNavigate} aria-label="NEXA Admin — Tổng quan" className="inline-flex items-center">
          <NexaLogo size={27} showText={!collapsed} />
        </Link>
        {!collapsed && (
          <button type="button" onClick={onToggleCollapse} aria-label="Thu gọn menu" title="Thu gọn menu" className="hidden rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 md:inline-flex">
            <ChevronLeft size={16} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {collapsed && (
        <button type="button" onClick={onToggleCollapse} aria-label="Mở rộng menu" title="Mở rộng menu" className="mx-auto mt-3 hidden rounded-md p-2 text-zinc-500 hover:bg-zinc-100 md:inline-flex">
          <ChevronRight size={16} strokeWidth={1.75} />
        </button>
      )}

      <nav aria-label="Điều hướng quản trị" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.label}>
            {!collapsed ? (
              <p className="mb-2 px-2 text-[11px] font-semibold tracking-[0.03em] text-zinc-400">
                {section.label}
              </p>
            ) : <div className="my-3 border-t border-zinc-100" aria-hidden="true" />}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex h-9 items-center gap-3 rounded-md px-2.5 text-[13px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-blue-600',
                      collapsed && 'justify-center px-0',
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                    )}
                  >
                    <Icon size={17} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-zinc-200 px-3 py-3">
        {!collapsed && <p className="mb-2 px-2 text-[11px] text-zinc-400">Quản trị hệ thống</p>}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          title={collapsed ? 'Đăng xuất' : undefined}
          className={cn('flex h-9 w-full items-center gap-3 rounded-md px-2.5 text-left text-[13px] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50', collapsed && 'justify-center px-0')}
        >
          <LogOut size={17} strokeWidth={1.75} aria-hidden="true" />
          {!collapsed && <span>{signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</span>}
        </button>
      </div>
    </aside>
  );
}
