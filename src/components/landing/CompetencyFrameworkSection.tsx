'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Search,
  Users,
  PenTool,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

interface DomainItem {
  id: string;
  order: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  subSkills: string[];
}

const DOMAINS: DomainItem[] = [
  {
    id: 'D1',
    order: 'Miền 01',
    icon: Search,
    title: 'Thông tin & Dữ liệu',
    desc: 'Tìm kiếm, đánh giá độ tin cậy của thông tin số và tổ chức, lưu trữ dữ liệu an toàn.',
    subSkills: ['Truy xuất dữ liệu', 'Đánh giá nguồn tin', 'Quản trị tệp tin'],
  },
  {
    id: 'D2',
    order: 'Miền 02',
    icon: Users,
    title: 'Giao tiếp & Hợp tác',
    desc: 'Tương tác văn minh, chia sẻ tài nguyên an toàn và làm việc nhóm hiệu quả trong môi trường số.',
    subSkills: ['Tương tác văn minh', 'Hợp tác đám mây', 'Danh tính số'],
  },
  {
    id: 'D3',
    order: 'Miền 03',
    icon: PenTool,
    title: 'Sáng tạo Nội dung số',
    desc: 'Biên soạn tài liệu, xử lý đa phương tiện, bảo hộ bản quyền và ứng dụng các công cụ trí tuệ nhân tạo hỗ trợ.',
    subSkills: ['Sản xuất đa phương tiện', 'Bản quyền số', 'Ứng dụng AI sáng tạo'],
  },
  {
    id: 'D4',
    order: 'Miền 04',
    icon: ShieldCheck,
    title: 'An toàn & Bảo mật',
    desc: 'Tự bảo vệ danh tính, thiết bị cá nhân, nhận diện rủi ro lừa đảo và duy trì sức khỏe số.',
    subSkills: ['Bảo vệ thiết bị & dữ liệu', 'Phòng chống lừa đảo', 'Sức khỏe thể chất số'],
  },
  {
    id: 'D5',
    order: 'Miền 05',
    icon: Cpu,
    title: 'Giải quyết Vấn đề',
    desc: 'Chẩn đoán và xử lý sự cố công nghệ, tự tin thích ứng và khai thác công cụ số để tối ưu công việc.',
    subSkills: ['Xử lý lỗi kỹ thuật', 'Lựa chọn công cụ số', 'Tư duy thích ứng công nghệ'],
  },
];

export function CompetencyFrameworkSection() {
  const [activeDomainIdx, setActiveDomainIdx] = useState(0);

  const handleDomainScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el.children.length) return;
    const firstChild = el.children[0] as HTMLElement;
    const cardWidth = firstChild.offsetWidth + 16;
    const newIndex = Math.round(el.scrollLeft / cardWidth);
    if (newIndex >= 0 && newIndex < DOMAINS.length && newIndex !== activeDomainIdx) {
      setActiveDomainIdx(newIndex);
    }
  };

  return (
    <section className="py-12 sm:py-24 bg-white dark:bg-black transition-colors relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-14 gap-4 sm:gap-6">
          <div className="max-w-2xl text-left">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
              Các Miền Năng Lực Số
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
              Cấu trúc đo lường và phát triển toàn diện, liên kết chặt chẽ từ nhận thức dữ liệu đến khả năng giải quyết vấn đề bằng công nghệ.
            </p>
          </div>

          <Link
            href="/framework"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group self-start md:self-end pb-1"
          >
            <span>Xem chi tiết khung năng lực</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 5 Domains: Horizontal Snap Carousel on Mobile, Grid on Tablet/Desktop */}
        <div
          onScroll={handleDomainScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 items-stretch no-scrollbar"
        >
          {DOMAINS.map((domain, idx) => {
            const Icon = domain.icon;
            const isWide = idx === 4;

            return (
              <div
                key={domain.id}
                className={`relative rounded-3xl bg-white dark:bg-zinc-900/90 p-5 sm:p-8 ring-1 ring-slate-200/80 dark:ring-zinc-800 shadow-xs hover:shadow-xl hover:ring-blue-500/40 dark:hover:ring-blue-500/40 transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between group overflow-hidden w-[82vw] max-w-[320px] shrink-0 snap-center sm:w-auto sm:shrink sm:snap-align-none ${
                  isWide ? 'sm:col-span-2 lg:col-span-2' : ''
                }`}
              >
                {/* Fluid Vector Silk Ribbon STRICTLY INSIDE Card - Matching Brand Blue Palette */}
                <svg
                  className={`pointer-events-none absolute right-0 bottom-0 select-none z-0 opacity-30 dark:opacity-20 transition-all duration-500 group-hover:opacity-45 group-hover:scale-105 ${
                    isWide ? 'w-64 sm:w-[480px] h-32 sm:h-44' : 'w-44 sm:w-64 h-32 sm:h-44'
                  }`}
                  viewBox={isWide ? '0 0 480 180' : '0 0 260 180'}
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id={`silkMain-${domain.id}`} x1="0%" y1="20%" x2="100%" y2="80%">
                      <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.3" />
                      <stop offset="35%" stopColor="#1d4ed8" stopOpacity="0.65" />
                      <stop offset="65%" stopColor="#2563eb" stopOpacity="0.85" />
                      <stop offset="85%" stopColor="#60a5fa" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient id={`silkEdge-${domain.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                      <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>

                  {/* Standard Card Ribbons */}
                  {idx === 0 && (
                    <>
                      <path
                        d="M 20,180 C 60,110 130,150 180,85 C 220,40 250,55 260,35 L 260,180 Z"
                        fill={`url(#silkMain-${domain.id})`}
                      />
                      <path
                        d="M 20,180 C 60,110 130,150 180,85 C 220,40 250,55 260,35"
                        stroke={`url(#silkEdge-${domain.id})`}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </>
                  )}

                  {idx === 1 && (
                    <>
                      <path
                        d="M 0,140 C 60,170 120,95 175,120 C 220,140 245,95 260,80 L 260,180 L 0,180 Z"
                        fill={`url(#silkMain-${domain.id})`}
                      />
                      <path
                        d="M 0,140 C 60,170 120,95 175,120 C 220,140 245,95 260,80"
                        stroke={`url(#silkEdge-${domain.id})`}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </>
                  )}

                  {idx === 2 && (
                    <>
                      <path
                        d="M 40,180 C 85,130 130,165 185,105 C 220,65 240,75 260,50 L 260,180 Z"
                        fill={`url(#silkMain-${domain.id})`}
                      />
                      <path
                        d="M 40,180 C 85,130 130,165 185,105 C 220,65 240,75 260,50"
                        stroke={`url(#silkEdge-${domain.id})`}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </>
                  )}

                  {idx === 3 && (
                    <>
                      <path
                        d="M 10,180 C 60,120 125,145 175,95 C 215,60 245,85 260,60 L 260,180 Z"
                        fill={`url(#silkMain-${domain.id})`}
                      />
                      <path
                        d="M 10,180 C 60,120 125,145 175,95 C 215,60 245,85 260,60"
                        stroke={`url(#silkEdge-${domain.id})`}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </>
                  )}

                  {idx === 4 && (
                    <>
                      <path
                        d="M 0,150 C 90,100 210,165 330,110 C 400,75 450,120 480,85 L 480,180 L 0,180 Z"
                        fill={`url(#silkMain-${domain.id})`}
                      />
                      <path
                        d="M 0,150 C 90,100 210,165 330,110 C 400,75 450,120 480,85"
                        stroke={`url(#silkEdge-${domain.id})`}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </>
                  )}
                </svg>

                {/* Card Foreground Content */}
                <div className="relative z-10">
                  {/* Top Order & Icon Header */}
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/50 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-2xs">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.8} />
                    </div>

                    <span className="text-[11px] sm:text-xs font-bold font-mono px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-neutral-800 dark:text-neutral-200 ring-1 ring-slate-200/60 dark:ring-zinc-700/60 shadow-2xs">
                      {domain.order}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-2xl font-black text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {domain.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed font-normal">
                    {domain.desc}
                  </p>
                </div>

                {/* Sub-skills Pills at Bottom */}
                <div className="mt-5 sm:mt-7 pt-3 sm:pt-5 flex flex-wrap items-center gap-1.5 sm:gap-2 relative z-10">
                  {domain.subSkills.map((sub, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-slate-50 dark:bg-zinc-800/80 text-neutral-700 dark:text-neutral-300 ring-1 ring-slate-200/60 dark:ring-zinc-700/60 shadow-2xs"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Swipe Pagination Dots */}
        <div className="sm:hidden flex items-center justify-center gap-1.5 mt-2 select-none" aria-hidden="true">
          {DOMAINS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeDomainIdx === i ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-300 dark:bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CompetencyFrameworkSection;
