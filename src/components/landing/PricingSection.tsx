'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  Zap,
  Building2,
  GraduationCap,
  Users,
} from 'lucide-react';
import { EnterpriseContactModal } from '@/components/pricing/EnterpriseContactModal';

type Frequency = 'monthly' | 'yearly';

interface PlanDetail {
  id: string;
  name: string;
  badge: string;
  targetAudience: string;
  desc: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyMonthlyEquivalent: number;
  isPopular?: boolean;
  features: string[];
  ctaText: string;
  ctaHref: string;
}

const PLANS: PlanDetail[] = [
  {
    id: 'free',
    name: 'Gói FREE',
    badge: 'TRẢI NGHIỆM',
    targetAudience: 'Người học tự do & Giảng viên trải nghiệm',
    desc: 'Bắt đầu đánh giá năng lực số cá nhân và trải nghiệm tổ chức lớp học quy mô nhỏ.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthlyEquivalent: 0,
    features: [
      'Đánh giá toàn diện 5 miền năng lực số',
      'Kho đề chung trắc nghiệm tư duy phản xạ không giới hạn',
      '10 AI credits phân tích năng lực & gợi ý lộ trình mỗi tháng',
      'Chứng nhận số hoàn thành bài thi có mã QR xác thực',
      'Tạo tối đa 15 đề thi cá nhân',
      'Tạo tới 10 nhóm lớp học tập (tối đa 100 học viên/nhóm)',
      'Mở 3 phòng thi trực tiếp thời gian thực mã PIN (tối đa 50 thí sinh/phòng)',
      'Bàn chấm điểm thủ công cơ bản',
    ],
    ctaText: 'Bắt đầu miễn phí',
    ctaHref: '/register',
  },
  {
    id: 'pro',
    name: 'Gói PRO',
    badge: 'CÁ NHÂN & CHUYÊN GIA',
    targetAudience: 'Cá nhân bồi dưỡng chuyên sâu & Giảng viên độc lập',
    desc: 'Mở khóa toàn bộ ngân hàng đề chuyên sâu và bộ công cụ khảo thí, bàn chấm cao cấp.',
    monthlyPrice: 199000,
    yearlyPrice: 1890000,
    yearlyMonthlyEquivalent: 157500,
    isPopular: true,
    features: [
      'Mở khóa toàn bộ đề thi tình huống, thao tác thực hành & capstone',
      '1.000 AI credits chẩn đoán chi tiết & lập lộ trình bồi dưỡng cá nhân',
      'Chứng chỉ số nâng cao, huy hiệu Pro & vinh danh bảng xếp hạng',
      'Không giới hạn số lượng đề thi cá nhân & ngân hàng câu hỏi tùy biến',
      'Không giới hạn số nhóm lớp học tập (tối đa 1.000 học viên/nhóm)',
      'Mở tới 20 phòng thi trực tiếp đồng thời (500 thí sinh/phòng)',
      'Bàn chấm điểm Split-view chuyên nghiệp & AI hỗ trợ gợi ý chấm',
      'Xuất bảng điểm Excel, CSV & dữ liệu nghiên cứu 26 biến số',
      'Hỗ trợ kỹ thuật ưu tiên',
    ],
    ctaText: 'Nâng cấp gói Pro',
    ctaHref: '/register?plan=pro',
  },
  {
    id: 'business',
    name: 'Gói BUSINESS',
    badge: 'TỔ CHỨC & DOANH NGHIỆP',
    targetAudience: 'Trường Đại học, Cao đẳng, Viện & Doanh nghiệp',
    desc: 'Giải pháp chuẩn hóa năng lực số diện rộng, khảo thí định kỳ và tích hợp hệ thống đào tạo.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthlyEquivalent: 0,
    features: [
      'Mở đợt khảo thí diện rộng (Campaigns) theo quy mô sinh viên / nhân sự',
      'Hệ sinh thái phân quyền tổ chức: Org Admin, Giảng viên chấm thi, Thí sinh',
      'Tùy biến khung năng lực số và ngân hàng đề thi riêng của trường',
      'Bàn chấm tập trung cho hội đồng khảo thí & phân bổ bài chấm linh hoạt',
      'Báo cáo phân tích 5 miền tập thể & đo lường mức độ trưởng thành số',
      'Tích hợp đăng nhập một lần (SSO) và hệ thống LMS (Moodle, Canvas...)',
      'Chứng chỉ số đồng thương hiệu riêng (Co-branded Certificates)',
      'Hợp đồng pháp lý, hóa đơn VAT, cam kết SLA & hỗ trợ chuyên biệt',
    ],
    ctaText: 'Liên hệ tư vấn',
    ctaHref: '#business-inquiry',
  },
];

export function PricingSection() {
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

  return (
    <section id="pricing" className="py-20 bg-slate-50/60 dark:bg-zinc-950/40 transition-colors scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-4 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Biểu phí minh bạch • Một tài khoản linh hoạt cho mọi nhu cầu</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Gói Dịch Vụ Khảo Thí & Bồi Dưỡng
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Lựa chọn gói dịch vụ phù hợp với nhu cầu nâng cao năng lực cá nhân hoặc triển khai quy mô lớp học và toàn trường.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-full bg-slate-200/80 dark:bg-zinc-800 border border-slate-300/80 dark:border-zinc-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setFrequency('monthly')}
              className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-full transition-all ${
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
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold rounded-full transition-all ${
                frequency === 'yearly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span>Theo năm</span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition-colors ${
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

        {/* 3-Column Centered Cards Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-12">
          {PLANS.map((plan) => {
            const isBusiness = plan.id === 'business';
            const isPro = plan.isPopular;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl bg-white dark:bg-zinc-900 border flex flex-col justify-between transition-all duration-200 ${
                  isPro
                    ? 'border-2 border-blue-600 dark:border-blue-500 shadow-xl ring-1 ring-blue-600/20 lg:-translate-y-2'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs'
                }`}
              >
                {/* Popular Highlight Tag for Pro */}
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-max px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold tracking-wide shadow-sm flex items-center gap-1.5 whitespace-nowrap z-10 select-none">
                    <Sparkles className="w-3.5 h-3.5 fill-current text-blue-200 shrink-0" />
                    <span className="whitespace-nowrap">KHUYÊN DÙNG NHẤT</span>
                  </div>
                )}

                <div className={`p-7 sm:p-8 flex-1 flex flex-col ${isPro ? 'pt-8 sm:pt-9' : ''}`}>
                  {/* Top Badge & Target Audience */}
                  <div className="flex items-center justify-between pb-3 mb-4">
                    <span
                      className={`text-[11px] font-extrabold uppercase tracking-wider ${
                        isPro
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>

                  {/* Plan Name & Short Description */}
                  <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-6">
                    {plan.desc}
                  </p>

                  {/* Price Block */}
                  <div className="pb-6 mb-6">
                    {isBusiness ? (
                      <div className="space-y-1">
                        <div className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                          Liên hệ
                        </div>
                        <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                          Báo giá linh hoạt theo quy mô triển khai
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
                          <span className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                            {frequency === 'monthly'
                              ? `${plan.monthlyPrice.toLocaleString('vi-VN')} đ`
                              : `${plan.yearlyMonthlyEquivalent.toLocaleString('vi-VN')} đ`}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
                            / tháng
                          </span>
                        </div>
                        {frequency === 'yearly' && (
                          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            Thanh toán {plan.yearlyPrice.toLocaleString('vi-VN')} đ / năm
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3.5 flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                      Tính năng bao gồm:
                    </div>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isPro
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                          strokeWidth={2}
                        />
                        <span className="leading-relaxed">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom CTA Action Button */}
                <div className="p-6 pt-0">
                  {isBusiness ? (
                    <button
                      type="button"
                      onClick={() => setShowEnterpriseModal(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white cursor-pointer active:scale-[0.98]"
                    >
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  ) : (
                    <Link
                      href={plan.ctaHref}
                      className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] ${
                        isPro
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Link to Detail Comparison Page */}
        <div className="text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-2"
          >
            <span>Xem bảng so sánh chi tiết tiêu chuẩn và chỉ số định lượng đầy đủ</span>
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
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
