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
      code: '01',
      title: 'Tìm kiếm, đánh giá & quản lý thông tin',
      skills: [
        'Duyệt, tìm kiếm và lọc dữ liệu, thông tin',
        'Đánh giá dữ liệu, thông tin và nội dung số',
        'Quản lý dữ liệu, thông tin và nội dung số',
      ],
      icon: Search,
    },
    {
      code: '02',
      title: 'Giao tiếp & hợp tác',
      skills: [
        'Tương tác qua công nghệ số',
        'Chia sẻ qua công nghệ số',
        'Tham gia công dân qua công nghệ số',
        'Hợp tác qua công nghệ số',
        'Chuẩn mực ứng xử và văn hóa số',
        'Quản lý danh tính số',
      ],
      icon: Users,
    },
    {
      code: '03',
      title: 'Sáng tạo nội dung số',
      skills: [
        'Phát triển nội dung số',
        'Tích hợp và tái cấu trúc nội dung số',
        'Bản quyền và giấy phép',
        'Tư duy tính toán và lập trình',
      ],
      icon: PenTool,
    },
    {
      code: '04',
      title: 'An toàn & trách nhiệm',
      skills: [
        'Bảo vệ thiết bị',
        'Bảo vệ dữ liệu cá nhân & riêng tư',
        'Hỗ trợ sức khỏe tinh thần và thể chất',
        'Tác động môi trường của công nghệ số',
      ],
      icon: ShieldCheck,
    },
    {
      code: '05',
      title: 'Nhận diện & giải quyết vấn đề',
      skills: [
        'Xác định & giải quyết sự cố kỹ thuật',
        'Nhận diện nhu cầu & giải pháp công nghệ',
        'Giải pháp sáng tạo bằng công nghệ số',
        'Nhận diện & bồi dưỡng năng lực số',
      ],
      icon: Cpu,
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

            {/* Mega Dropdown Panel 5 Cột Rộng Rãi & Căn Đều */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[1140px] xl:w-[1200px] max-w-[96vw] hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.12)] p-6 sm:p-7 text-slate-900">
                {/* Header bar không dùng viền ngang */}
                <div className="flex items-center justify-between pb-5 px-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-slate-900 tracking-tight">
                      Khung 5 miền năng lực số
                    </span>
                    <span className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      Chuẩn hóa & Tin cậy
                    </span>
                  </div>
                  <Link
                    href="/framework"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5 group/all transition-colors"
                  >
                    <span>Xem toàn bộ đặc tả khung</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/all:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* 5 Cột Rộng Rãi & Căn Đều theo chiều dọc */}
                <div className="grid grid-cols-5 divide-x divide-slate-100">
                  {frameworkDomains.map((domain) => {
                    const IconComponent = domain.icon;
                    return (
                      <div
                        key={domain.code}
                        className="px-4 first:pl-0 last:pr-0 flex flex-col justify-between h-full group/col"
                      >
                        {/* Phần trên: Icon + Mã Miền + Tiêu đề + Danh sách kỹ năng */}
                        <div>
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover/col:bg-blue-600 group-hover/col:text-white transition-colors duration-200">
                              <IconComponent className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </div>
                            <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 group-hover/col:text-blue-600 uppercase transition-colors">
                              MIỀN {domain.code}
                            </span>
                          </div>

                          <Link
                            href={`/framework#domain-${domain.code}`}
                            className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors min-h-[42px] flex items-start leading-snug"
                          >
                            {domain.title}
                          </Link>

                          {/* Danh sách kỹ năng thành phần */}
                          <div className="space-y-2.5 pt-3">
                            {domain.skills.map((skill) => (
                              <Link
                                key={skill}
                                href={`/framework#domain-${domain.code}`}
                                className="flex items-start gap-2 text-[12px] text-slate-600 hover:text-blue-600 leading-snug transition-colors group/item select-none"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/item:bg-blue-600 shrink-0 mt-1.5 transition-colors" />
                                <span>{skill}</span>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Phần dưới: Nút neo chi tiết căn đều đáy hàng */}
                        <div className="pt-5 mt-auto">
                          <Link
                            href={`/framework#domain-${domain.code}`}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group/link transition-colors"
                          >
                            <span>Chi tiết Miền {domain.code}</span>
                            <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
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
            className={`transition-colors py-1 ${
              currentPath === '/faq'
                ? 'text-blue-600 font-bold'
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