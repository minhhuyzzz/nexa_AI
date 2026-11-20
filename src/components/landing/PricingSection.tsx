'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { EnterpriseContactModal } from '@/components/pricing/EnterpriseContactModal';

type Frequency = 'monthly' | 'yearly';

interface PlanDetail {
  id: string;
  name: string;
  badge: string;
  desc: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyMonthlyEquivalent: number;
  isPopular?: boolean;
  trialTag?: string;
  isB2B?: boolean;
  features: string[];
  ctaText: string;
  ctaHref: string;
}

const PLANS: PlanDetail[] = [
  {
    id: 'basic',
    name: 'Gói Cơ Bản',
    badge: 'TRẢI NGHIỆM',
    desc: 'Khảo sát năng lực số cơ bản và lưu trữ hồ sơ cá nhân.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthlyEquivalent: 0,
    features: [
      'Tối đa 2 nhóm lớp (30 học viên/nhóm)',
      '10 AI credits / tháng',
      'Khảo thí chuẩn hóa & mở 1 miền bồi dưỡng',
      'Lưu trữ hồ sơ năng lực số cá nhân',
    ],
    ctaText: 'Bắt đầu miễn phí',
    ctaHref: '/register',
  },
  {
    id: 'standard',
    name: 'Gói Tiêu Chuẩn',
    badge: 'PHỔ BIẾN NHẤT',
    trialTag: 'TẶNG 30 NGÀY DÙNG THỬ',
    desc: 'Mở khóa trọn vẹn các miền bồi dưỡng và cấp chứng chỉ số.',
    monthlyPrice: 49000,
    yearlyPrice: 468000,
    yearlyMonthlyEquivalent: 39000,
    isPopular: true,
    features: [
      'Mở trọn vẹn các miền năng lực số & trạm bồi dưỡng',
      'Tối đa 10 nhóm lớp (100 học viên/nhóm)',
      '100 AI credits / tháng',
      'Chứng chỉ số',
      'Lộ trình học tập cá nhân hóa',
    ],
    ctaText: 'Dùng thử 30 ngày (0đ)',
    ctaHref: '/register?plan=standard',
  },
  {
    id: 'advanced',
    name: 'Gói Nâng Cao',
    badge: 'TOÀN DIỆN',
    desc: 'Dành cho cá nhân bồi dưỡng chuyên sâu và tổ chức thi trực tiếp.',
    monthlyPrice: 149000,
    yearlyPrice: 1428000,
    yearlyMonthlyEquivalent: 119000,
    features: [
      'Toàn bộ quyền lợi gói Tiêu Chuẩn',
      'Không giới hạn nhóm lớp (500 học viên/nhóm)',
      '500 AI credits / tháng',
      'Mở phòng thi trực tiếp mã PIN thời gian thực',
      'Xuất bảng điểm Excel, CSV & dữ liệu nghiên cứu',
    ],
    ctaText: 'Nâng cấp ngay',
    ctaHref: '/register?plan=advanced',
  },
  {
    id: 'b2b',
    name: 'Gói Tổ Chức',
    badge: 'TRƯỜNG HỌC & DOANH NGHIỆP',
    desc: 'Khảo thí diện rộng toàn trường, hội đồng chấm tập trung & cấp chứng nhận đồng thương hiệu.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthlyEquivalent: 0,
    isB2B: true,
    features: [
      'Khảo thí diện rộng theo đợt (Campaigns)',
      'Báo cáo độ trưởng thành số cấp đơn vị',
      'Bàn chấm hội đồng tập trung & chấm chéo',
      'Chứng chỉ số gắn Logo thương hiệu riêng',
      'Tích hợp SSO & LMS (Canvas, Moodle...)',
      'Hợp đồng pháp lý, hóa đơn VAT & cam kết SLA',
    ],
    ctaText: 'Liên hệ tư vấn B2B',
    ctaHref: '#business-inquiry',
  },
];

export function PricingSection() {
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [activePlanIdx, setActivePlanIdx] = useState(0);

  const handlePlanScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el.children.length) return;
    const firstChild = el.children[0] as HTMLElement;
    const cardWidth = firstChild.offsetWidth + 16;
    const newIndex = Math.round(el.scrollLeft / cardWidth);
    if (newIndex >= 0 && newIndex < PLANS.length && newIndex !== activePlanIdx) {
      setActivePlanIdx(newIndex);
    }
  };

  return (
    <section id="pricing" className="py-12 sm:py-24 bg-slate-50/60 dark:bg-zinc-950/40 transition-colors scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white dark:bg-zinc-900 ring-1 ring-slate-200 dark:ring-zinc-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-3 sm:mb-4 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Biểu phí minh bạch • Bồi dưỡng cá nhân & Quy mô tổ chức</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Chọn gói bồi dưỡng phù hợp
          </h2>
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-base text-slate-600 dark:text-neutral-400 leading-relaxed font-normal">
            Linh hoạt chuyển đổi hoặc gia hạn gói bất kỳ lúc nào với đầy đủ quyền lợi và hạn mức rõ ràng.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-6 sm:mt-8 inline-flex items-center p-1 sm:p-1.5 rounded-full bg-slate-200/80 dark:bg-zinc-800 ring-1 ring-slate-300/80 dark:ring-zinc-700 shadow-2xs max-w-full">
            <button
              type="button"
              onClick={() => setFrequency('monthly')}
              className={`px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-full transition-all cursor-pointer ${
                frequency === 'monthly'
                  ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Theo tháng
            </button>
            <button
              type="button"
              onClick={() => setFrequency('yearly')}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-full transition-all cursor-pointer ${
                frequency === 'yearly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span>Theo năm</span>
              <span
                className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full transition-colors ${
                  frequency === 'yearly'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                }`}
              >
                Tiết kiệm ~20%
              </span>
            </button>
          </div>
        </div>

        {/* 4-Column Responsive Cards: Horizontal Snap Carousel on Mobile, Grid on Desktop */}
        <div
          onScroll={handlePlanScroll}
          className="flex overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none gap-4 pt-8 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pt-8 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 items-stretch no-scrollbar mb-4 sm:mb-12"
        >
          {PLANS.map((plan) => {
            const isPopular = plan.isPopular;
            const isB2B = plan.isB2B;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl bg-white dark:bg-zinc-900 ring-1 flex flex-col justify-between transition-all duration-300 w-[84vw] max-w-[320px] shrink-0 snap-center sm:w-auto sm:shrink sm:snap-align-none ${
                  isPopular
                    ? 'ring-2 ring-blue-600 dark:ring-blue-500 shadow-xl'
                    : isB2B
                    ? 'ring-slate-300 dark:ring-zinc-700 bg-gradient-to-b from-white via-white to-blue-50/20 dark:from-zinc-900 dark:to-zinc-900 shadow-sm hover:shadow-md'
                    : 'ring-slate-200 dark:ring-zinc-800 hover:ring-slate-300 dark:hover:ring-zinc-700 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Popular Highlight Tag with Trial Benefit */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-max px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 text-white text-[11px] font-bold tracking-wide shadow-sm flex items-center gap-1.5 whitespace-nowrap z-20 select-none">
                    <Sparkles className="w-3.5 h-3.5 fill-current text-blue-200 shrink-0" />
                    <span>{plan.trialTag || 'PHỔ BIẾN NHẤT'}</span>
                  </div>
                )}

                <div className={`p-5 sm:p-7 flex-1 flex flex-col ${isPopular ? 'pt-7 sm:pt-9' : ''}`}>
                  {/* Badge */}
                  <div className="flex items-center justify-between pb-2 mb-3">
                    <span
                      className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${
                        isPopular
                          ? 'text-blue-600 dark:text-blue-400'
                          : isB2B
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>

                  {/* Plan Name & Short Description */}
                  <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed mb-6 min-h-[36px]">
                    {plan.desc}
                  </p>

                  {/* Price Block */}
                  <div className="pb-6 mb-6">
                    {isB2B ? (
                      <div className="space-y-1">
                        <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                          Liên hệ B2B
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                          Báo giá linh hoạt theo quy mô tổ chức
                        </div>
                      </div>
                    ) : plan.monthlyPrice === 0 ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                          0đ
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
                          / vĩnh viễn
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                            {frequency === 'monthly'
                              ? `${plan.monthlyPrice.toLocaleString('vi-VN')} đ`
                              : `${plan.yearlyMonthlyEquivalent.toLocaleString('vi-VN')} đ`}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
                            / tháng
                          </span>
                        </div>
                        {frequency === 'yearly' && (
                          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Thanh toán {plan.yearlyPrice.toLocaleString('vi-VN')} đ / năm
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                      Tính năng bao gồm:
                    </div>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            isPopular
                              ? 'text-blue-600 dark:text-blue-400'
                              : isB2B
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                          strokeWidth={2.2}
                        />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom CTA Action Button */}
                <div className="p-5 pt-0 sm:p-6 sm:pt-0">
                  {isB2B ? (
                    <button
                      type="button"
                      onClick={() => setShowEnterpriseModal(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs bg-neutral-900 hover:bg-neutral-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-neutral-900 cursor-pointer active:scale-[0.98] whitespace-nowrap"
                    >
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    </button>
                  ) : (
                    <Link
                      href={plan.ctaHref}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] whitespace-nowrap ${
                        isPopular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Swipe Pagination Dots */}
        <div className="sm:hidden flex items-center justify-center gap-1.5 mb-6 select-none" aria-hidden="true">
          {PLANS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activePlanIdx === i ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-300 dark:bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Link to Detail Comparison Page */}
        <div className="text-center px-2">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-2 text-balance max-w-lg mx-auto"
          >
            <span>Xem bảng so sánh chi tiết tiêu chuẩn và chỉ số định lượng đầy đủ</span>
            <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2} />
          </Link>
        </div>
      </div>

      {/* Modal Inquiry */}
      <EnterpriseContactModal
        isOpen={showEnterpriseModal}
        onClose={() => setShowEnterpriseModal(false)}
      />
    </section>
  );
}

export default PricingSection;