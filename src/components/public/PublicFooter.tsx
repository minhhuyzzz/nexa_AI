'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';
import { NexaLogo } from '@/components/brand/NexaLogo';

export function PublicFooter() {
  const [email, setEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setNewsletterMsg({
        text: 'Vui lòng nhập địa chỉ email hợp lệ.',
        type: 'error',
      });
      return;
    }

    setNewsletterMsg({
      text: 'Cảm ơn bạn! Chúng tôi đã ghi nhận thông tin nhận cập nhật.',
      type: 'success',
    });
    setEmail('');
  };

  return (
    <footer
      id="footer"
      className="relative isolation-isolate overflow-hidden text-slate-200"
      style={{
        background: `
          radial-gradient(ellipse 41% 34% at 107% -12%, rgba(10,104,255,.5), transparent 95%),
          radial-gradient(ellipse 59% 34% at 66% 107%, rgba(33,100,221,.18), transparent 100%),
          linear-gradient(135deg, #102759 0%, #0a1a3c 47%, #0c2453 100%)
        `,
      }}
    >
      {/* Top ambient swoosh SVG */}
      <svg
        className="pointer-events-none absolute left-0 top-0 w-full h-[120px] sm:h-[150px] md:h-[180px] z-0"
        viewBox="0 0 1672 245"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="footerTop" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#0c275d" stopOpacity="0" />
            <stop offset=".6" stopColor="#0a48b9" stopOpacity=".55" />
            <stop offset="1" stopColor="#0566ff" stopOpacity=".82" />
          </linearGradient>
        </defs>
        <path
          d="M775 240C1022 197 1254 104 1476 -7h196V0C1550 96 1267 204 775 240Z"
          fill="url(#footerTop)"
        />
        <path
          d="M799 235C1102 189 1320 81 1500 -20"
          stroke="#398cff"
          strokeWidth="1.5"
          fill="none"
          opacity=".8"
        />
      </svg>

      {/* Bottom ambient swoosh SVG */}
      <svg
        className="pointer-events-none absolute left-0 bottom-0 w-full h-[140px] sm:h-[180px] md:h-[220px] z-0"
        viewBox="0 0 1672 285"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="footerWave1" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#215ce0" stopOpacity=".8" />
            <stop offset=".52" stopColor="#1342a8" stopOpacity=".49" />
            <stop offset="1" stopColor="#09265a" stopOpacity=".6" />
          </linearGradient>
          <linearGradient id="footerWave2" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#163a8c" stopOpacity=".26" />
            <stop offset=".5" stopColor="#2366ea" stopOpacity=".75" />
            <stop offset="1" stopColor="#1246b8" stopOpacity=".65" />
          </linearGradient>
        </defs>
        <path
          d="M0 126C178 44 294 70 536 124c243 54 405 131 642 75 199-46 329-111 494-120v206H0Z"
          fill="url(#footerWave1)"
        />
        <path
          d="M0 127C172 57 303 74 538 126c232 52 417 128 638 78 215-47 314-114 496-120"
          stroke="#3c8dff"
          strokeWidth="1.8"
          fill="none"
          opacity=".93"
        />
        <path
          d="M0 282c280-17 456-36 671-48 258-15 402-130 660-155 151-14 220-14 341-14v220H0Z"
          fill="url(#footerWave2)"
        />
        <path
          d="M675 233c255-14 411-132 666-155 151-14 224-14 331-14"
          stroke="#5ea6ff"
          strokeWidth="1.2"
          fill="none"
          opacity=".9"
        />
      </svg>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16 pb-12 sm:pt-20 sm:pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
          {/* Brand & Newsletter Column */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-4">
            <Link href="/" className="inline-block" aria-label="NEXA - Trang chủ">
              <NexaLogo variant="white" size="md" />
            </Link>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
              Nền tảng đánh giá và phát triển năng lực số toàn diện. Chuẩn hóa theo mô hình 5 miền năng lực số và lộ trình cá nhân hóa.
            </p>

            {/* Newsletter Pill Box - Compact & Refined */}
            <form onSubmit={handleNewsletterSubmit} className="relative max-w-xs pt-1">
              <div className="flex items-center h-11 border border-blue-400/50 rounded-full bg-[#13326d]/40 shadow-inner px-2.5 transition-all focus-within:border-white/80">
                <Mail className="w-4 h-4 text-blue-200 ml-1 shrink-0" strokeWidth={1.8} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhận cập nhật qua email"
                  className="w-full bg-transparent text-white placeholder:text-blue-200/70 px-2.5 text-xs sm:text-sm focus:outline-none min-w-0"
                />
                <button
                  type="submit"
                  aria-label="Đăng ký nhận cập nhật"
                  className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center shrink-0 hover:scale-105 transition-all shadow-sm"
                >
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                </button>
              </div>

              {newsletterMsg.text && (
                <div
                  className={`mt-2 text-xs font-medium ${
                    newsletterMsg.type === 'error' ? 'text-amber-300' : 'text-blue-200'
                  }`}
                >
                  {newsletterMsg.text}
                </div>
              )}
            </form>
          </div>

          {/* 4 Clean Columns */}
          <div className="lg:col-span-8 xl:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-6 pt-1">
            {/* Column 1: Khảo thí & Năng lực */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 sm:mb-4">
                Khảo thí & Năng lực
              </h3>
              <ul className="space-y-2 text-xs sm:text-[13px] text-slate-300">
                <li>
                  <Link href="/framework" className="hover:text-white transition-colors">
                    5 Miền năng lực số
                  </Link>
                </li>
                <li>
                  <Link href="/framework" className="hover:text-white transition-colors">
                    Lộ trình phát triển
                  </Link>
                </li>
                <li>
                  <Link href="/faq#assessment-formats" className="hover:text-white transition-colors">
                    4 Định dạng khảo thí
                  </Link>
                </li>
                <li>
                  <Link href="/personal/learning-path" className="hover:text-white transition-colors">
                    Lộ trình học tập
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Dành cho Người dùng */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 sm:mb-4">
                Người dùng & Gói
              </h3>
              <ul className="space-y-2 text-xs sm:text-[13px] text-slate-300">
                <li>
                  <Link href="/register" className="hover:text-white transition-colors">
                    Học viên & Cá nhân
                  </Link>
                </li>
                <li>
                  <Link href="/pricing#b2b" className="hover:text-white transition-colors">
                    Tổ chức & Doanh nghiệp
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Bảng giá dịch vụ
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Đăng nhập Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Xác thực & Trợ giúp */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 sm:mb-4">
                Xác thực & Trợ giúp
              </h3>
              <ul className="space-y-2 text-xs sm:text-[13px] text-slate-300">
                <li>
                  <Link href="/faq" className="hover:text-white transition-colors">
                    Trung tâm trợ giúp (FAQ)
                  </Link>
                </li>
                <li>
                  <Link href="/faq#dual-hash" className="hover:text-white transition-colors">
                    Xác thực chứng chỉ số
                  </Link>
                </li>
                <li>
                  <Link href="/faq#guidelines" className="hover:text-white transition-colors">
                    Hướng dẫn khảo thí
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Pháp lý & Bảo mật */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 sm:mb-4">
                Pháp lý & Bảo mật
              </h3>
              <ul className="space-y-2 text-xs sm:text-[13px] text-slate-300">
                <li>
                  <Link href="/faq#privacy" className="hover:text-white transition-colors">
                    Bảo vệ dữ liệu cá nhân
                  </Link>
                </li>
                <li>
                  <Link href="/faq#terms" className="hover:text-white transition-colors">
                    Điều khoản sử dụng
                  </Link>
                </li>
                <li>
                  <Link href="/faq#privacy" className="hover:text-white transition-colors">
                    Chính sách quyền riêng tư
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal (Không hr viền ngang) */}
        <div className="pt-8 sm:pt-10 mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} NEXA. Mọi quyền được bảo lưu.</p>

          <nav className="flex items-center gap-5" aria-label="Thông tin pháp lý">
            <Link href="/faq#terms" className="hover:text-slate-200 transition-colors">
              Điều khoản
            </Link>
            <span className="w-px h-3 bg-slate-600" aria-hidden="true" />
            <Link href="/faq#privacy" className="hover:text-slate-200 transition-colors">
              Bảo mật
            </Link>
            <span className="w-px h-3 bg-slate-600" aria-hidden="true" />
            <Link href="/faq#privacy" className="hover:text-slate-200 transition-colors">
              Quyền riêng tư
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;