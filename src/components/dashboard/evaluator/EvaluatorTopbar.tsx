'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EvaluatorAvatarMenu } from './EvaluatorAvatarMenu';
import { NotificationBell } from '../NotificationBell';
import { ChevronRight } from 'lucide-react';

const routeTitleMap: Record<string, string> = {
  '/evaluator': 'Tổng quan',
  '/evaluator/dashboard': 'Tổng quan',
  '/evaluator/grading': 'Bàn chấm bài Rubric',
  '/evaluator/live-room': 'Phòng thi trực tiếp PIN/QR',
  '/evaluator/analytics': 'Báo cáo & Thống kê',
  '/evaluator/groups': 'Nhóm đánh giá',
  '/evaluator/item-bank': 'Ngân hàng câu hỏi',
  '/evaluator/exams': 'Đề thi & Đợt khảo thí',
  '/evaluator/assessments': 'Bài khảo thí',
  '/evaluator/assessments/new': 'Tạo bài khảo thí',
  '/evaluator/profile': 'Hồ sơ người đánh giá',
  '/evaluator/settings': 'Cài đặt chuyên gia',
  '/evaluator/billing': 'Gói dịch vụ & Bản quyền',
};

export function EvaluatorTopbar() {
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
    // 1. Group detail sub-route
    if (pathname.startsWith('/evaluator/groups/') && pathname !== '/evaluator/groups') {
      return (
        <>
          <Link
            href="/evaluator/dashboard"
            className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium transition-colors"
          >
            Người đánh giá
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 shrink-0" strokeWidth={1.75} />
          <Link
            href="/evaluator/groups"
            className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium transition-colors"
          >
            Nhóm đánh giá
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 shrink-0" strokeWidth={1.75} />
          <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
            Chi tiết nhóm
          </span>
        </>
      );
    }

    // 2. Assessment creation sub-route
    if (pathname === '/evaluator/assessments/new') {
      return (
        <>
          <Link
            href="/evaluator/dashboard"
            className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium transition-colors"
          >
            Người đánh giá
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 shrink-0" strokeWidth={1.75} />
          <Link
            href="/evaluator/item-bank"
            className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium transition-colors"
          >
            Bài khảo thí
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 shrink-0" strokeWidth={1.75} />
          <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
            Tạo bài mới
          </span>
        </>
      );
    }

    // 3. Standard top-level routes
    const currentTitle = routeTitleMap[pathname] || 'Bàn làm việc';
    const isDashboard = pathname === '/evaluator' || pathname === '/evaluator/dashboard';

    return (
      <>
        {isDashboard ? (
          <span className="text-slate-500 dark:text-zinc-400 font-medium">Người đánh giá</span>
        ) : (
          <Link
            href="/evaluator/dashboard"
            className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium transition-colors"
          >
            Người đánh giá
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
        <EvaluatorAvatarMenu />
      </div>
    </header>
  );
}
