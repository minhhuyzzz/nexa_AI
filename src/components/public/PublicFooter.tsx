import Link from 'next/link';
import { ShieldCheck, BookOpen, Award, FileCheck2, ExternalLink } from 'lucide-react';
import { NexaLogo } from '@/components/brand/NexaLogo';

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Column 1: Brand & Standard (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <NexaLogo size="md" />
            </Link>

            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              Nền tảng đánh giá và chứng nhận phát triển năng lực số dựa trên trí tuệ nhân tạo. Chuẩn hóa theo Khung tham chiếu Năng lực số Châu Âu.
            </p>

            <div className="flex flex-col gap-2 pt-2 text-xs text-slate-500">
              <div className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Bảo vệ dữ liệu cá nhân </span>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                <span>bảo đảm toàn vẹn tài liệu</span>
              </div>
            </div>
          </div>

          {/* Column 2: Khảo thí & Năng lực */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Khảo thí & Năng lực
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/framework" className="hover:text-slate-900 transition-colors">
                  5 Miền năng lực số
                </Link>
              </li>
              <li>
                <Link href="/framework" className="hover:text-slate-900 transition-colors">
                  21 Kỹ năng thành phần
                </Link>
              </li>
              <li>
                <Link href="/faq#assessment-formats" className="hover:text-slate-900 transition-colors">
                  4 Định dạng khảo thí
                </Link>
              </li>

            </ul>
          </div>

          {/* Column 3: Dành cho Ai & Gói */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Dành cho Người dùng
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register?role=LEARNER" className="hover:text-slate-900 transition-colors">
                  Người học & Sinh viên
                </Link>
              </li>
              <li>
                <Link href="/register?role=EVALUATOR" className="hover:text-slate-900 transition-colors">
                  Chuyên gia Khảo thí
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-slate-900 transition-colors">
                  Bảng giá dịch vụ
                </Link>
              </li>
              <li>
                <Link href="/pricing#b2b" className="hover:text-slate-900 transition-colors">
                  Giải pháp Trường & Viện
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-slate-900 transition-colors">
                  Đăng nhập Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Xác thực & Hướng dẫn */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Xác thực & Pháp lý
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="hover:text-slate-900 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/faq#dual-hash" className="hover:text-slate-900 transition-colors">
                  Xác thực chứng chỉ
                </Link>
              </li>
              <li>
                <Link href="/faq#privacy" className="hover:text-slate-900 transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/faq#terms" className="hover:text-slate-900 transition-colors">
                  Điều khoản sử dụng
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-medium text-slate-800">NEXA Assessment Platform</span>
            <span>•</span>
            <span>Bản quyền © 2026. Mọi quyền được bảo lưu.</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Nền tảng đánh giá năng lực số chuẩn hóa</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
