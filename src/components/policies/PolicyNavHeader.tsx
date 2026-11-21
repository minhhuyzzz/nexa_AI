'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, FileText, Lock, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { NexaLogo } from '@/components/brand/NexaLogo';

export function PolicyNavHeader() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/policies', label: 'Tổng quan', icon: Sparkles },
    { href: '/policies/privacy', label: 'Bảo vệ dữ liệu cá nhân', icon: ShieldCheck },
    { href: '/policies/terms', label: 'Điều khoản dịch vụ', icon: FileText },
    { href: '/policies/security', label: 'An toàn dữ liệu và AI', icon: Lock },
    { href: '/faq', label: 'Câu hỏi thường gặp', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Branding Row */}
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 group" aria-label="NEXA - Trang chủ">
              <NexaLogo size="sm" />
            </Link>
            <span className="hidden sm:inline-block w-px h-4 bg-slate-200 dark:bg-zinc-800" aria-hidden="true" />
            <Link
              href="/policies"
              className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Chính sách và Quy định Pháp lý
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <span>Vào ứng dụng NEXA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Navigation Tabs Row */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar" aria-label="Điều hướng chính sách">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-50 dark:hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default PolicyNavHeader;
