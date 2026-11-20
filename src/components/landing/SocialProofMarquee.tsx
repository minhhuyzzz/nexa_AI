'use client';

import React from 'react';
import Image from 'next/image';

interface Partner {
  id: string;
  name: string;
  shortName: string;
  src: string;
  showText?: boolean;
}

const PARTNERS: Partner[] = [
  {
    id: 'iuh',
    name: 'Đại học Công nghiệp TP.HCM',
    shortName: 'IUH',
    src: '/images/partners/iuh.png',
  },
  {
    id: 'hust',
    name: 'Đại học Bách Khoa Hà Nội',
    shortName: 'HUST',
    src: '/images/partners/hust.svg',
  },
  {
    id: 'vnu',
    name: 'Đại học Quốc gia Hà Nội',
    shortName: 'VNU',
    src: '/images/partners/vnu.svg',
    showText: true,
  },
  {
    id: 'fpt',
    name: 'Trường Đại học FPT',
    shortName: 'FPT University',
    src: '/images/partners/fpt.svg',
  },
  {
    id: 'ueh',
    name: 'Đại học Kinh tế TP.HCM',
    shortName: 'UEH',
    src: '/images/partners/ueh.png',
  },
  {
    id: 'hcmut',
    name: 'Đại học Bách Khoa TP.HCM',
    shortName: 'HCMUT',
    src: '/images/partners/hcmut.svg',
    showText: true,
  },
  {
    id: 'uit',
    name: 'ĐH Công nghệ Thông tin',
    shortName: 'UIT',
    src: '/images/partners/uit.svg',
    showText: true,
  },
  {
    id: 'ptit',
    name: 'Học viện Bưu chính Viễn thông',
    shortName: 'PTIT',
    src: '/images/partners/ptit.png',
    showText: true,
  },
];

export function SocialProofMarquee() {
  return (
    <section className="pt-8 pb-8 sm:pt-20 sm:pb-16 bg-white dark:bg-black transition-colors overflow-hidden select-none">
      <div className="relative w-full overflow-hidden">
        {/* Left Progressive Gradient Fade */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-28 md:w-44 z-10 bg-gradient-to-r from-white dark:from-black to-transparent"
        />
        {/* Right Progressive Gradient Fade */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-28 md:w-44 z-10 bg-gradient-to-l from-white dark:from-black to-transparent"
        />

        {/* Continuous Seamless Marquee Track (Logo thật 100%, đúng nhận diện, không viền khung, hòa vào nền) */}
        <div className="flex w-max items-center gap-8 sm:gap-16 md:gap-20 animate-marquee pause-on-hover py-2 sm:py-3">
          {/* Loop 1 */}
          {PARTNERS.map((partner) => (
            <div
              key={`p1-${partner.id}`}
              className="flex items-center gap-3 shrink-0 cursor-default transition-all duration-300 hover:scale-105 opacity-90 hover:opacity-100"
              title={partner.name}
            >
              <div className="relative h-9 sm:h-10 w-auto flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={partner.src}
                  alt={`Logo ${partner.name}`}
                  className="h-8 sm:h-9 w-auto max-w-[170px] sm:max-w-[200px] object-contain select-none"
                  loading="lazy"
                />
              </div>

              {partner.showText && (
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[11px] sm:text-xs font-bold text-neutral-800 dark:text-neutral-200 tracking-tight">
                    {partner.name}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500 dark:text-neutral-400 font-mono">
                    {partner.shortName}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Loop 2 (for continuous seamless loop) */}
          {PARTNERS.map((partner) => (
            <div
              key={`p2-${partner.id}`}
              className="flex items-center gap-3 shrink-0 cursor-default transition-all duration-300 hover:scale-105 opacity-90 hover:opacity-100"
              title={partner.name}
            >
              <div className="relative h-9 sm:h-10 w-auto flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={partner.src}
                  alt={`Logo ${partner.name}`}
                  className="h-8 sm:h-9 w-auto max-w-[170px] sm:max-w-[200px] object-contain select-none"
                  loading="lazy"
                />
              </div>

              {partner.showText && (
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[11px] sm:text-xs font-bold text-neutral-800 dark:text-neutral-200 tracking-tight">
                    {partner.name}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500 dark:text-neutral-400 font-mono">
                    {partner.shortName}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SocialProofMarquee;