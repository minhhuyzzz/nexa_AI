import React from 'react';
import Link from 'next/link';

export function PolicyFooter() {
  return (
    <footer className="w-full bg-slate-50/80 dark:bg-zinc-950/80 py-8 text-xs text-neutral-500 dark:text-neutral-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-medium text-neutral-700 dark:text-neutral-300">
            © {new Date().getFullYear()} NEXA. Nền tảng Đánh giá & Phát triển Năng lực Số.
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
            Tuân thủ toàn diện Nghị định số 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-4 text-xs font-medium" aria-label="Liên kết pháp lý bổ sung">
          <Link href="/policies" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Tổng quan
          </Link>
          <Link href="/policies/privacy" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Bảo mật dữ liệu
          </Link>
          <Link href="/policies/terms" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Điều khoản dịch vụ
          </Link>
          <Link href="/policies/security" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            An toàn AI
          </Link>
          <Link href="/faq" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Hỏi đáp
          </Link>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Về trang chủ NEXA →
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default PolicyFooter;
