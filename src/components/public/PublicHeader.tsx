'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ChevronDown } from 'lucide-react';
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
    // Public pages are always in light mode
    document.documentElement.classList.remove('dark');

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

  const frameworkDomains = [
    {
      title: 'Tìm kiếm, đánh giá & quản lý thông tin',
      skills: [
        'Duyệt, tìm kiếm và lọc dữ liệu, thông tin',
        'Đánh giá dữ liệu, thông tin và nội dung số',
        'Quản lý dữ liệu, thông tin và nội dung số',
      ],
    },
    {
      title: 'Giao tiếp & hợp tác',
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
      title: 'Sáng tạo nội dung số',
      skills: [
        'Phát triển nội dung số',
        'Tích hợp và tái cấu trúc nội dung số',
        'Bản quyền và giấy phép',
        'Tư duy tính toán và lập trình',
      ],
    },
    {
      title: 'An toàn & trách nhiệm',
      skills: [
        'Bảo vệ thiết bị',
        'Bảo vệ dữ liệu cá nhân & riêng tư',
        'Hỗ trợ sức khỏe tinh thần và thể chất',
        'Tác động môi trường của công nghệ số',
      ],
    },
    {
      title: 'Nhận diện & giải quyết vấn đề',
      skills: [
        'Xác định & giải quyết sự cố kỹ thuật',
        'Nhận diện nhu cầu & giải pháp công nghệ',
        'Giải pháp sáng tạo bằng công nghệ số',
        'Nhận diện & bồi dưỡng năng lực số',
      ],
    },
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
          <Link
            href="/"
            className={`transition-colors py-1 ${
              currentPath === '/'
                ? 'text-slate-900 font-semibold border-b-2 border-sky-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trang chủ
          </Link>

          {/* Khung năng lực với Menu xổ ra các Miền và Kỹ năng thành phần */}
          <div className="relative group py-2">
            <Link
              href="/framework"
              className={`transition-colors py-1 inline-flex items-center gap-1 ${
                currentPath === '/framework'
                  ? 'text-slate-900 font-semibold border-b-2 border-sky-600'
                  : 'text-slate-600 group-hover:text-slate-900'
              }`}
            >
              <span>Khung năng lực</span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:rotate-180" />
            </Link>

            {/* Mega Dropdown Panel */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-[920px] max-w-[95vw] hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5 text-slate-900">
                <div className="grid grid-cols-5 divide-x divide-slate-100">
                  {frameworkDomains.map((domain) => (
                    <div key={domain.title} className="px-3.5 first:pl-0 last:pr-0 flex flex-col">
                      <div className="text-xs font-semibold text-slate-900 pb-2.5 border-b border-slate-100 min-h-[44px] flex items-start leading-snug">
                        {domain.title}
                      </div>
                      <div className="space-y-2 pt-2.5 flex-1">
                        {domain.skills.map((skill) => (
                          <div
                            key={skill}
                            className="flex items-start gap-1.5 text-[11px] text-slate-600 hover:text-sky-700 leading-snug cursor-default select-none transition-colors group/item"
                          >
                            <span className="w-1 h-1 rounded-full bg-slate-300 group-hover/item:bg-sky-500 shrink-0 mt-1.5 transition-colors" />
                            <span>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/pricing"
            className={`transition-colors py-1 ${
              currentPath === '/pricing'
                ? 'text-slate-900 font-semibold border-b-2 border-sky-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bảng giá
          </Link>

          <Link
            href="/faq"
            className={`transition-colors py-1 ${
              currentPath === '/faq'
                ? 'text-slate-900 font-semibold border-b-2 border-sky-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hướng dẫn
          </Link>
        </nav>

        {/* Right: Actions & Demo */}
        <div className="flex items-center gap-3">

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
            <span>Đăng ký miễn phí</span>
            <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default PublicHeader;
