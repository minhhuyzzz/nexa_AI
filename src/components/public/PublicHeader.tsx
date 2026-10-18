'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ChevronDown, User, Award, Shield } from 'lucide-react';
import { NexaLogo } from '@/components/brand/NexaLogo';

interface PublicHeaderProps {
  activePath?: string;
}

export function PublicHeader({ activePath }: PublicHeaderProps) {
  const pathname = usePathname();
  const currentPath = activePath || pathname;
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Kiểm tra trạng thái cuộn khỏi đỉnh trang
      setScrolled(currentScrollY > 20);

      // Nếu đang ở gần đỉnh trang: luôn hiển thị
      if (currentScrollY <= 60) {
        setVisible(true);
        lastScrollY = currentScrollY;
        return;
      }

      // Bỏ qua các chuyển động cuộn quá nhỏ để tránh giật giao diện
      const scrollDelta = currentScrollY - lastScrollY;
      if (Math.abs(scrollDelta) < 6) return;

      if (scrollDelta > 0) {
        // Kéo xuống -> ẩn thanh điều hướng
        setVisible(false);
      } else {
        // Kéo lên -> hiển thị lại thanh điều hướng
        setVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Trang chủ' },
    { href: '/framework', label: 'Khung năng lực' },
    { href: '/pricing', label: 'Bảng giá' },
    { href: '/faq', label: 'Hướng dẫn' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-in-out ${
        visible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      } ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs'
          : 'bg-white/40 md:bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <NexaLogo size="sm" />
          </Link>
        </div>

        {/* Center: Navigation Menu */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium">
          {navLinks.map((link) => {
            const isActive = currentPath === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors py-1 ${
                  isActive
                    ? 'text-slate-900 font-semibold border-b-2 border-sky-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions & Demo */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Entrance */}
          <div className="relative group">
            <button className="text-xs font-medium px-2.5 py-1.5 rounded-full border border-slate-200 bg-white/80 hover:bg-white text-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Test Dashboard</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 hidden group-hover:block z-50">
              <div className="px-3 py-1 text-[10px] text-slate-400 border-b border-slate-100 uppercase font-semibold">
                Trải nghiệm không cần đăng nhập
              </div>
              <Link
                href="/api/auth/demo?role=LEARNER"
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                <span>Học viên (Learner)</span>
              </Link>
              <Link
                href="/api/auth/demo?role=EVALUATOR"
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Award className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                <span>Chuyên gia (Evaluator)</span>
              </Link>
              <Link
                href="/api/auth/demo?role=ADMIN"
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                <span>Quản trị viên (Admin)</span>
              </Link>
            </div>
          </div>

          <Link
            href="/login"
            className="text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-full hover:bg-slate-100/70 transition-colors"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 px-4 py-1.5 rounded-full transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <span>Bắt đầu</span>
            <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default PublicHeader;
