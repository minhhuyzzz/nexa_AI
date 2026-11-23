'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  ChevronDown,
  Search,
  Users,
  PenTool,
  ShieldCheck,
  Cpu,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';
import { NexaLogo } from '@/components/brand/NexaLogo';

interface PublicHeaderProps {
  activePath?: string;
}

export function PublicHeader({ activePath }: PublicHeaderProps) {
  const pathname = usePathname();
  const currentPath = activePath || pathname;
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Lock body scroll and handle Escape when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsMobileOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileOpen]);

  useEffect(() => {
    // Public pages are always in light mode
    document.documentElement.classList.remove('dark');

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      // Don't hide header if mobile menu is open
      if (isMobileOpen) return;

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
  }, [isMobileOpen]);

  const frameworkDomains = [
    {
      code: '01',
      title: 'Thông tin và Dữ liệu số',
      icon: Search,
      skills: [
        'Duyệt, tìm kiếm và lọc dữ liệu, thông tin',
        'Đánh giá dữ liệu, thông tin và nội dung số',
        'Quản lý dữ liệu, thông tin và nội dung số',
      ],
    },
    {
      code: '02',
      title: 'Giao tiếp và Hợp tác số',
      icon: Users,
      skills: [
        'Tương tác qua công nghệ số',
        'Chia sẻ qua công nghệ số',
        'Tham gia công dân qua công nghệ số',
        'Hợp tác qua công nghệ số',
        'Chuẩn mực ứng xử và văn hóa số',
        'Quản lý danh tính số',
      ],
    },
    {
      code: '03',
      title: 'Sáng tạo Nội dung số và AI',
      icon: PenTool,
      skills: [
        'Phát triển nội dung số',
        'Tích hợp và tái cấu trúc nội dung số',
        'Bản quyền và giấy phép',
        'Tư duy tính toán và lập trình',
      ],
    },
    {
      code: '04',
      title: 'An toàn và Bảo mật số',
      icon: ShieldCheck,
      skills: [
        'Bảo vệ thiết bị',
        'Bảo vệ dữ liệu cá nhân và riêng tư',
        'Hỗ trợ sức khỏe tinh thần và thể chất',
        'Tác động môi trường của công nghệ số',
      ],
    },
    {
      code: '05',
      title: 'Giải quyết Vấn đề số',
      icon: Cpu,
      skills: [
        'Xác định và giải quyết sự cố kỹ thuật',
        'Nhận diện nhu cầu và giải pháp công nghệ',
        'Giải pháp sáng tạo bằng công nghệ số',
        'Nhận diện và bồi dưỡng năng lực số',
      ],
    },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        visible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      } ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md shadow-xs'
          : 'bg-transparent shadow-none'
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
          <Link
            href="/"
            className={`transition-colors py-1 ${
              currentPath === '/'
                ? 'text-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trang chủ
          </Link>

          {/* Khung năng lực với Mega Dropdown Panel 3x2 */}
          <div className="relative group py-2">
            <Link
              href="/framework"
              className={`transition-colors py-1 inline-flex items-center gap-1.5 ${
                currentPath === '/framework'
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-600 group-hover:text-slate-900'
              }`}
            >
              <span>Khung năng lực</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 group-hover:rotate-180" />
            </Link>

            {/* Dropdown Panel Tinh Gọn — 5 Cột & Đầy đủ 21 Kỹ năng con */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-[1080px] xl:w-[1140px] max-w-[96vw] hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.12)] p-6 text-slate-900">
                <div className="grid grid-cols-5 gap-6">
                  {frameworkDomains.map((domain) => {
                    const IconComponent = domain.icon;
                    return (
                      <div key={domain.code} className="flex flex-col">
                        <Link
                          href="/framework"
                          className="group/domain flex items-center gap-2 mb-3.5 cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover/domain:bg-blue-600 group-hover/domain:text-white transition-colors duration-150">
                            <IconComponent className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </div>
                          <span className="text-xs font-bold text-slate-900 group-hover/domain:text-blue-600 transition-colors leading-tight">
                            {domain.title}
                          </span>
                        </Link>

                        <ul className="space-y-1.5 flex-1">
                          {domain.skills.map((skill, sIdx) => (
                            <li key={sIdx}>
                              <Link
                                href="/framework"
                                className="text-[11.5px] text-slate-600 hover:text-blue-600 leading-snug block py-0.5 group/skill transition-colors cursor-pointer"
                              >
                                <span className="inline-block group-hover/skill:translate-x-0.5 transition-transform duration-150">
                                  {skill}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 p-2.5 px-4 rounded-xl bg-slate-50 flex items-center justify-end">
                  <Link
                    href="/framework"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors group/cta"
                  >
                    <span>Xem toàn bộ khung năng lực</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/cta:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/pricing"
            className={`transition-colors py-1 ${
              currentPath === '/pricing'
                ? 'text-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bảng giá
          </Link>

          <Link
            href="/faq"
            target="_blank"
            rel="noopener noreferrer"
            className={`transition-colors py-1 ${
              currentPath === '/faq'
                ? 'text-blue-600 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hướng dẫn
          </Link>
        </nav>

        {/* Right: Actions & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-full hover:bg-slate-100/70 transition-colors hidden sm:inline-flex"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 px-3.5 sm:px-4 py-1.5 rounded-full transition-colors inline-flex items-center justify-center shadow-xs"
          >
            Đăng ký
          </Link>

          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label={isMobileOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 top-16 bg-black/40 backdrop-blur-xs z-40 animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-down Drawer Panel */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-white z-50 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currentPath === '/' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Trang chủ
            </Link>
            <Link
              href="/framework"
              onClick={() => setIsMobileOpen(false)}
              className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currentPath === '/framework' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Khung năng lực số
            </Link>
            <Link
              href="/pricing"
              onClick={() => setIsMobileOpen(false)}
              className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currentPath === '/pricing' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Bảng giá
            </Link>
            <Link
              href="/faq"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileOpen(false)}
              className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currentPath === '/faq' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Hướng dẫn
            </Link>
          </nav>

          <div className="pt-2 space-y-2">
            <Link
              href="/login"
              onClick={() => setIsMobileOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50 block transition-colors shadow-2xs"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              onClick={() => setIsMobileOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-center text-sm font-semibold text-white hover:bg-blue-700 block transition-colors shadow-xs"
            >
              Đăng ký tài khoản
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default PublicHeader;