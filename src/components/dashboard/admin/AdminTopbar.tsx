'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminAvatarMenu } from './AdminAvatarMenu';
import { NotificationBell } from '../NotificationBell';
import { ChevronRight } from 'lucide-react';

const adminRouteTitleMap: Record<string, string> = {
  '/admin': 'Tổng quan',
  '/admin/dashboard': 'Tổng quan',
  '/admin/analytics': 'Phân tích toàn diện',
  '/admin/frameworks': 'Khung năng lực số',
  '/admin/content': 'Đề thi & Học liệu',
  '/admin/contributions': 'Duyệt đề cộng đồng',
  '/admin/ai-gateway': 'Quản trị AI Gateway',
  '/admin/users': 'Người dùng & Chuyên gia',
  '/admin/plans': 'Cấu hình gói dịch vụ',
  '/admin/transactions': 'Giao dịch & Đối soát',
  '/admin/organizations': 'Trường học & Doanh nghiệp',
  '/admin/evaluators': 'Duyệt chuyên gia',
  '/admin/compliance': 'Tuân thủ & Kiểm toán',
  '/admin/settings': 'Cài đặt hệ thống',
};

export function AdminTopbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dynamic breadcrumb generation
  const renderBreadcrumbs = () => {
    // 1. Framework sub-route
    if (pathname.startsWith('/admin/frameworks/') && pathname !== '/admin/frameworks') {
      return (
        <>
          <Link
            href="/admin/dashboard"
            className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium transition-colors"
          >
            Quản trị hệ thống
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 shrink-0" strokeWidth={1.75} />
          <Link
            href="/admin/frameworks"
            className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium transition-colors"
          >
            Khung năng lực số
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 shrink-0" strokeWidth={1.75} />
          <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
            Chi tiết miền năng lực
          </span>
        </>
      );
    }

    // 2. Standard top-level routes
    const currentTitle = adminRouteTitleMap[pathname] || 'Điều phối';
    const isDashboard = pathname === '/admin' || pathname === '/admin/dashboard';

    return (
      <>
        {isDashboard ? (
          <span className="text-slate-500 dark:text-zinc-400 font-medium">Quản trị hệ thống</span>
        ) : (
          <Link
            href="/admin/dashboard"
            className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium transition-colors"
          >
            Quản trị hệ thống
          </Link>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 shrink-0" strokeWidth={1.75} />
        <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
          {currentTitle}
        </span>
      </>
    );
  };

  return (
    <header
      className={`h-16 px-6 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 shadow-xs'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      {/* Breadcrumb Path Navigation */}
      <nav aria-label="Đường dẫn điều hướng" className="flex items-center gap-2 text-xs">
        {renderBreadcrumbs()}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <NotificationBell />
        <AdminAvatarMenu />
      </div>
    </header>
  );
}
