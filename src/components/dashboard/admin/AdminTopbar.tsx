'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminAvatarMenu } from './AdminAvatarMenu';
import { NotificationBell } from '../NotificationBell';
import { Home, Search } from 'lucide-react';

const adminRouteTitleMap: Record<string, string> = {
  '/admin': 'Tổng quan',
  '/admin/dashboard': 'Tổng quan',
  '/admin/analytics': 'Phân tích 5 miền',
  '/admin/communications': 'Truyền thông & Góp ý',
  '/admin/users': 'Người dùng',
  '/admin/roles': 'Vai trò & phân quyền',
  '/admin/organizations': 'Tổ chức B2B',
  '/admin/plans': 'Gói dịch vụ',
  '/admin/transactions': 'Thanh toán & Đối soát',
  '/admin/content': 'Ngân hàng đề chuẩn',
  '/admin/frameworks': 'Khung 5 miền năng lực',
  '/admin/learning-paths': 'Lộ trình học',
  '/admin/contributions': 'Kiểm duyệt đóng góp',
  '/admin/ai-gateway': 'AI Gateway',
  '/admin/compliance': 'Bảo mật & Kiểm toán',
  '/admin/settings': 'Cài đặt nền tảng',
};

export function AdminTopbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentTitle = adminRouteTitleMap[pathname] || 'Tổng quan';

  return (
    <header
      className={`h-16 px-6 flex items-center justify-between sticky top-0 z-20 transition-all duration-200 border-b ${
        scrolled
          ? 'bg-white/95 dark:bg-black/95 backdrop-blur-sm border-slate-200 dark:border-zinc-800 shadow-xs'
          : 'bg-white dark:bg-black border-slate-200/80 dark:border-zinc-800'
      }`}
    >
      {/* Breadcrumb Path Navigation with Home Icon */}
      <nav aria-label="Đường dẫn điều hướng" className="flex items-center gap-2 text-xs">
        <Link
          href="/admin/dashboard"
          className="text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
          title="Trang chủ quản trị"
        >
          <Home className="w-4 h-4" strokeWidth={1.75} />
        </Link>
        <span className="text-slate-500 dark:text-zinc-400 font-medium">
          Quản trị hệ thống
        </span>
        <span className="text-slate-300 dark:text-zinc-700">/</span>
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {currentTitle}
        </span>
      </nav>

      {/* Right Actions: Search Box + Bell + Avatar */}
      <div className="flex items-center gap-3">
        {/* Global Search Input */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng, tổ chức, đề chuẩn..."
            className="pl-9 pr-3 py-1.5 w-64 lg:w-80 rounded-lg text-xs border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 text-neutral-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-black transition-all"
          />
        </div>

        <NotificationBell />
        <AdminAvatarMenu />
      </div>
    </header>
  );
}
