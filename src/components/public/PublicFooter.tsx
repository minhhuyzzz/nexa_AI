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
      className="relative overflow-hidden text-slate-200 transition-colors"
      style={{
        background: `
          radial-gradient(ellipse 65% 50% at 85% 15%, rgba(37,99,235,0.22), transparent 75%),
          radial-gradient(ellipse 55% 45% at 20% 90%, rgba(29,78,216,0.28), transparent 80%),
          linear-gradient(145deg, #071228 0%, #060e1f 50%, #030814 100%)
        `,
      }}
    >
      {/* High-Fidelity Fluid Silk Ribbon Vector Layer */}
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 w-full h-[220px] sm:h-[280px] md:h-[340px] z-0 select-none"
        viewBox="0 0 1680 340"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          {/* Silk Satin Sheen Multi-Stop Gradient (Deep Cobalt to Glowing Azure) */}
          <linearGradient id="footerSilkMain" x1="0%" y1="30%" x2="100%" y2="70%">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.45" />
            <stop offset="18%" stopColor="#1d4ed8" stopOpacity="0.75" />
            <stop offset="38%" stopColor="#2563eb" stopOpacity="0.9" />
            <stop offset="52%" stopColor="#60a5fa" stopOpacity="0.95" />
            <stop offset="68%" stopColor="#3b82f6" stopOpacity="0.85" />
            <stop offset="85%" stopColor="#1d4ed8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#172554" stopOpacity="0.4" />
          </linearGradient>

          {/* Underside Ribbon Fold Shadow Gradient */}
          <linearGradient id="footerSilkFold" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0b1633" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#102554" stopOpacity="0.75" />
            <stop offset="75%" stopColor="#1d4ed8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#070d1d" stopOpacity="0.85" />
          </linearGradient>

          {/* Luminous Specular Silk Edge Glow */}
          <linearGradient id="footerSilkEdge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="25%" stopColor="#60a5fa" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#93c5fd" stopOpacity="1" />
            <stop offset="75%" stopColor="#60a5fa" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
          </linearGradient>

          {/* Ambient Diffused Glow Filter */}
          <filter id="silkBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Deep Ambient Silk Backdrop (Ethereal flow) */}
        <path
          d="M0,180 C360,90 620,250 1020,130 C1360,50 1520,160 1680,95 L1680,340 L0,340 Z"
          fill="url(#footerSilkFold)"
          opacity="0.85"
        />

        {/* 2. Main Flowing Silk Ribbon (Smooth cubic bezier curve with satin texture) */}
        <path
          d="M0,170 C340,95 620,245 980,150 C1320,65 1490,195 1680,120 L1680,240 C1480,285 1300,165 960,230 C600,300 320,185 0,255 Z"
          fill="url(#footerSilkMain)"
          opacity="0.92"
        />

        {/* 3. Luminous Specular Silk Ridge Line (Upper spine of the ribbon) */}
        <path
          d="M0,170 C340,95 620,245 980,150 C1320,65 1490,195 1680,120"
          stroke="url(#footerSilkEdge)"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />

        {/* 4. Secondary Translucent Ribbon Swirl (Lower floating trail) */}
        <path
          d="M0,255 C320,185 600,300 960,230 C1300,165 1480,285 1680,240"
          stroke="#93c5fd"
          strokeWidth="1.2"
          strokeOpacity="0.45"
          fill="none"
        />
      </svg>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-12 pb-10 sm:pt-20 sm:pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 items-start">
          {/* Brand & Newsletter Column */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-4">
            <Link href="/" className="inline-block" aria-label="NEXA - Trang chủ">
              <NexaLogo variant="white" size="md" />
            </Link>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
              Nền tảng đo lường và phát triển năng lực số toàn diện. Chuẩn hóa theo các miền năng lực số và lộ trình bồi dưỡng cá nhân hóa.
            </p>

            {/* Newsletter Pill Box */}
            <form onSubmit={handleNewsletterSubmit} className="relative max-w-xs pt-1">
              <div className="flex items-center h-11 ring-1 ring-blue-400/40 rounded-full bg-blue-950/40 shadow-inner px-2.5 transition-all focus-within:ring-white/80">
                <Mail className="w-4 h-4 text-blue-300 ml-1 shrink-0" strokeWidth={1.8} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhận cập nhật qua email"
                  className="w-full bg-transparent text-white placeholder:text-blue-200/60 px-2.5 text-xs sm:text-sm focus:outline-none min-w-0"
                />
                <button
                  type="submit"
                  aria-label="Đăng ký nhận cập nhật"
                  className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 transition-all shadow-xs"
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
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-slate-300">
                <li>
                  <Link href="/framework" className="hover:text-white transition-colors">
                    Các miền năng lực số
                  </Link>
                </li>
                <li>
                  <Link href="/framework" className="hover:text-white transition-colors">
                    Hồ sơ năng lực
                  </Link>
                </li>
                <li>
                  <Link href="/faq#assessment-formats" className="hover:text-white transition-colors">
                    Định dạng khảo thí
                  </Link>
                </li>
                <li>
                  <Link href="/personal/learning-path" className="hover:text-white transition-colors">
                    Lộ trình bồi dưỡng
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Người dùng & Gói */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 sm:mb-4">
                Người dùng & Gói
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-slate-300">
                <li>
                  <Link href="/register" className="hover:text-white transition-colors">
                    Học viên & Cá nhân
                  </Link>
                </li>
                <li>
                  <Link href="/pricing#b2b" className="hover:text-white transition-colors">
                    Tổ chức khảo thí
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
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-slate-300">
                <li>
                  <Link
                    href="/faq"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Câu hỏi thường gặp
                  </Link>
                </li>
                <li>
                  <Link
                    href="/policies/security#dual-hash"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Xác thực chứng nhận số
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
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
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-slate-300">
                <li>
                  <Link
                    href="/policies/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Bảo vệ dữ liệu cá nhân
                  </Link>
                </li>
                <li>
                  <Link
                    href="/policies/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Điều khoản sử dụng
                  </Link>
                </li>
                <li>
                  <Link
                    href="/policies/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    An toàn dữ liệu & AI
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal (Zero horizontal borders) */}
        <div className="pt-8 sm:pt-10 mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} NEXA. Mọi quyền được bảo lưu.</p>

          <nav className="flex items-center gap-5" aria-label="Thông tin pháp lý">
            <Link
              href="/policies/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition-colors"
            >
              Điều khoản
            </Link>
            <span className="w-px h-3 bg-slate-700" aria-hidden="true" />
            <Link
              href="/policies/security"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition-colors"
            >
              Bảo mật
            </Link>
            <span className="w-px h-3 bg-slate-700" aria-hidden="true" />
            <Link
              href="/policies/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition-colors"
            >
              Quyền riêng tư
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
