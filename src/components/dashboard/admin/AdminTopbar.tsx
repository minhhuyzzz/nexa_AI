'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminAvatarMenu } from './AdminAvatarMenu';
import { NotificationBell } from '../NotificationBell';
import { Home, Menu } from 'lucide-react';
import { useMobileNav } from '@/contexts/MobileNavContext';
import { NexaLogo } from '@/components/brand/NexaLogo';
import { GlobalSearchInput } from '@/components/dashboard/search/GlobalSearchInput';

const adminRouteTitleMap: Record<string, string> = {
  '/admin': 'Tổng quan',
  '/admin/dashboard': 'Tổng quan',
  '/admin/analytics': 'Phân tích năng lực số',
  '/admin/communications': 'Truyền thông và Góp ý',
  '/admin/users': 'Học viên và Khách hàng',
  '/admin/roles': 'Quản trị viên và Phân quyền',
  '/admin/organizations': 'Tổ chức B2B',
  '/admin/plans': 'Gói dịch vụ',
  '/admin/transactions': 'Thanh toán và Đối soát',
  '/admin/baseline': 'Khảo thí đầu vào',
  '/admin/content': 'Ngân hàng đề chuẩn',
  '/admin/frameworks': 'Khung năng lực số',
  '/admin/learning-paths': 'Lộ trình học',
  '/admin/contributions': 'Kiểm duyệt đóng góp',
  '/admin/ai-gateway': 'Cổng kết nối AI',
  '/admin/compliance': 'Bảo mật và Kiểm toán',
  '/admin/settings': 'Cài đặt nền tảng',
};

export function AdminTopbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { toggleMobile } = useMobileNav();

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
      className={`h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-200 gap-3 ${
        scrolled
          ? 'bg-white/95 dark:bg-black/95 backdrop-blur-sm shadow-xs'
          : 'bg-white dark:bg-black'
      }`}
    >
      {/* Left: Mobile hamburger & breadcrumb navigation */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-1.5 md:hidden shrink-0">
          <button
            type="button"
            onClick={toggleMobile}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-neutral-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" strokeWidth={2} />
          </button>
          <Link href="/admin/dashboard" className="flex items-center" title="NEXA Admin">
            <NexaLogo size={24} showText={false} />
          </Link>
        </div>

        <nav aria-label="Đường dẫn điều hướng" className="flex items-center gap-2 text-xs min-w-0">
          <Link
            href="/admin/dashboard"
            className="hidden sm:inline-flex text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
            title="Trang chủ quản trị"
          >
            <Home className="w-4 h-4" strokeWidth={1.75} />
          </Link>
          <span className="hidden sm:inline text-slate-500 dark:text-zinc-400 font-medium">
            Quản trị hệ thống
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-zinc-700">/</span>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[120px] sm:max-w-none">
            {currentTitle}
          </span>
        </nav>
      </div>

      {/* Center: Global Search Input (Centered Max-w-lg) */}
      <div className="flex-1 flex justify-center max-w-lg mx-auto px-2 sm:px-4 min-w-0">
        <GlobalSearchInput scope="admin" />
      </div>

      {/* Right Actions: Bell + Avatar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <NotificationBell />
        <AdminAvatarMenu />
      </div>
    </header>
  );
}
