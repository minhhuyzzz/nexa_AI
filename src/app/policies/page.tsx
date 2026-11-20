import React from 'react';
import Link from 'next/link';
import {
  Shield,
  FileText,
  Lock,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Cpu,
} from 'lucide-react';

export const metadata = {
  title: 'Tổng Quan Chính Sách & Quy Định Pháp Lý',
  description:
    'Trung tâm chính sách, bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP, điều khoản dịch vụ khảo thí và cam kết bảo mật của Nền tảng NEXA.',
  alternates: {
    canonical: '/policies',
  },
  openGraph: {
    title: 'Tổng Quan Chính Sách & Quy Định Pháp Lý | NEXA',
    description:
      'Quy chuẩn bảo vệ dữ liệu cá nhân, điều khoản dịch vụ khảo thí và kiến trúc an toàn trí tuệ nhân tạo của Nền tảng NEXA.',
    url: 'https://nexa.edu.vn/policies',
  },
};

export default function PoliciesOverviewPage() {
  const policyCards = [
    {
      title: 'Bảo vệ dữ liệu cá nhân',
      desc: 'Quy định chi tiết việc thu thập, xử lý và bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP. Cơ chế bóc tách định danh tự động loại bỏ thông tin nhạy cảm trước khi xử lý.',
      href: '/policies/privacy',
      icon: Shield,
      accent: 'text-blue-600 dark:text-blue-400',
      badge: 'Nghị định 13',
    },
    {
      title: 'Điều khoản dịch vụ khảo thí',
      desc: 'Mô tả quy tắc và thỏa thuận khi sử dụng nền tảng khảo thí số NEXA. Quyền sở hữu bài làm, hạn mức tài khoản cá nhân và cam kết chất lượng dịch vụ cho tổ chức.',
      href: '/policies/terms',
      icon: FileText,
      accent: 'text-indigo-600 dark:text-indigo-400',
      badge: 'Thỏa thuận dịch vụ',
    },
    {
      title: 'An toàn dữ liệu & Trí tuệ nhân tạo',
      desc: 'Nguyên tắc vận hành trí tuệ nhân tạo theo yêu cầu, cơ chế băm kép SHA-256 ký số chứng chỉ và hệ thống phân quyền cách ly tuyệt đối giữa các tổ chức.',
      href: '/policies/security',
      icon: Lock,
      accent: 'text-emerald-600 dark:text-emerald-400',
      badge: 'Băm kép & An toàn AI',
    },
    {
      title: 'Câu hỏi thường gặp',
      desc: 'Giải đáp toàn diện các thắc mắc thực tế về quy trình làm bài, bàn chấm Rubric, mã PIN phòng thi trực tiếp và cách tra cứu chứng chỉ trên cổng xác thực.',
      href: '/faq',
      icon: HelpCircle,
      accent: 'text-sky-600 dark:text-sky-400',
      badge: 'Hỏi đáp tương tác',
    },
  ];

  const corePrinciples = [
    {
      title: 'Bảo mật ngay từ khâu thiết kế',
      desc: 'Hệ thống tự động khử thông tin định danh cá nhân trước khi bất kỳ bài thi nào được chuyển qua cổng phân tích trí tuệ nhân tạo.',
      icon: ShieldCheck,
    },
    {
      title: 'Con người làm chủ thẩm định sau cùng',
      desc: 'Trí tuệ nhân tạo chỉ đóng vai trò trợ lý đề xuất điểm nháp. Khảo thí viên có toàn quyền kiểm tra, điều chỉnh và công bố kết quả.',
      icon: Cpu,
    },
    {
      title: 'Bảo chứng tính toàn vẹn vĩnh viễn',
      desc: 'Chứng chỉ chuẩn nét cao được ký số bằng thuật toán băm kép SHA-256, ngăn chặn tuyệt đối mọi hành vi làm giả hoặc can thiệp nội dung.',
      icon: FileCheck2,
    },
    {
      title: 'Tuyệt đối không thương mại hóa dữ liệu',
      desc: 'Dữ liệu học tập và kết quả bài làm của cá nhân lẫn tổ chức được bảo mật nghiêm ngặt, không bán hoặc chia sẻ cho bên thứ ba.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="max-w-3xl mb-12 text-left">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 ring-1 ring-slate-200 dark:ring-zinc-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-4 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          <span>Chính sách minh bạch • Học thuật tin cậy</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
          Chính Sách & Quy Định Pháp Lý
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
          Chúng tôi cam kết bảo vệ dữ liệu người học theo tiêu chuẩn cao nhất của pháp luật Việt Nam, vận hành trí tuệ nhân tạo có trách nhiệm và bảo đảm tính trung thực, minh bạch của mọi kết quả khảo thí.
        </p>
      </div>

      {/* 4 Main Policy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {policyCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group relative rounded-3xl bg-white dark:bg-zinc-900/80 p-7 sm:p-8 ring-1 ring-slate-200/80 dark:ring-zinc-800 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center ring-1 ring-blue-100 dark:ring-blue-900/50 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300 ring-1 ring-slate-200/60 dark:ring-zinc-700/60">
                    {card.badge}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                  {card.title}
                </h2>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
                  {card.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                <span>Xem chi tiết nội dung</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* 4 Core Pillars Section */}
      <div className="rounded-3xl bg-slate-50/70 dark:bg-zinc-900/40 p-8 sm:p-12 ring-1 ring-slate-200/70 dark:ring-zinc-800">
        <div className="max-w-2xl mb-8">
          <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100">
            4 Nguyên Tắc Pháp Lý & Bảo Mật Nền Tảng
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-neutral-400">
            Mọi tính năng và quy trình xử lý dữ liệu trên NEXA đều tuân thủ nghiêm ngặt các nguyên tắc bất biến này.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {corePrinciples.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-slate-200/60 dark:ring-zinc-800 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                  {item.title}
                </h4>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
