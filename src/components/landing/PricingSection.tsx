'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Users,
} from 'lucide-react';
import { EnterpriseContactModal } from '@/components/pricing/EnterpriseContactModal';

type Frequency = 'monthly' | 'yearly';

interface PlanSummary {
  id: string;
  name: string;
  badge: string;
  desc: string;
  monthlyPrice: number;
  yearlyPrice: number;
  customPriceText?: string;
  isPopular?: boolean;
  learnerHighlights: string[];
  evaluatorHighlights: string[];
  ctaText: string;
  ctaHref: string;
}

const landingPlans: PlanSummary[] = [
  {
    id: 'free',
    name: 'Gói FREE',
    badge: 'TRẢI NGHIỆM',
    desc: 'Tự học tập cá nhân và mở lớp trải nghiệm cho giáo viên.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    learnerHighlights: [
      'Kho đề chung trắc nghiệm không giới hạn',
      '10 AI credits phân tích năng lực mỗi tháng',
      'Chứng chỉ',
    ],
    evaluatorHighlights: [
      '1 nhóm lớp tối đa 15 học viên',
      '1 phòng thi trực tiếp mã PIN',
      'Bàn chấm điểm thủ công',
    ],
    ctaText: 'Bắt đầu miễn phí',
    ctaHref: '/register',
  },
  {
    id: 'pro',
    name: 'Gói PRO',
    badge: 'KHUYÊN DÙNG',
    desc: 'Mở khóa trọn bộ kho đề chuyên sâu và bàn chấm khảo thí cao cấp.',
    monthlyPrice: 199000,
    yearlyPrice: 1890000,
    isPopular: true,
    learnerHighlights: [
      'Mở khóa toàn bộ đề thi chuyên sâu',
      '1.000 AI credits phân tích chi tiết và lập lộ trình',
      'Chứng chỉ',
      'Huy hiệu Pro và ưu tiên xếp hạng',
    ],
    evaluatorHighlights: [
      'Không giới hạn số lớp và học viên',
      'Không giới hạn phòng thi trực tiếp',
      'Bàn chấm Split-view chuyên nghiệp',
      '1.000 AI credits chấm gợi ý bài làm',
      'Xuất dữ liệu nghiên cứu 26 biến số',
    ],
    ctaText: 'Nâng cấp gói Pro',
    ctaHref: '/register?plan=pro',
  },
  {
    id: 'business',
    name: 'Gói BUSINESS',
    badge: 'DOANH NGHIỆP',
    desc: 'Giải pháp chuẩn hóa diện rộng cho trường đại học và tổ chức.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    customPriceText: 'Liên hệ tư vấn',
    learnerHighlights: [
      'Toàn bộ sinh viên được mở khóa theo đợt thi (Campaign)',
      'Ngân hàng đề thi và học liệu riêng của trường',
    ],
    evaluatorHighlights: [
      'Giảng viên dùng trọn bộ công cụ khảo thí & bàn chấm',
      'Tùy biến khung năng lực số riêng',
      'Tích hợp đăng nhập một lần và LMS',
      'Chứng chỉ đồng thương hiệu riêng',
    ],
    ctaText: 'Đăng ký cho Tổ chức / Nhận tư vấn',
    ctaHref: '#business-inquiry',
  },
];

export function PricingSection() {
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

  const formatPrice = (plan: PlanSummary) => {
    if (plan.customPriceText) return plan.customPriceText;
    if (plan.monthlyPrice === 0) return '0 đ';

    if (frequency === 'monthly') {
      return `${plan.monthlyPrice.toLocaleString('vi-VN')} đ`;
    } else {
      const monthlyEquiv = Math.round(plan.yearlyPrice / 12);
      return `${monthlyEquiv.toLocaleString('vi-VN')} đ`;
    }
  };

  const getBillingPeriod = (plan: PlanSummary) => {
    if (plan.customPriceText) return 'theo quy mô';
    if (plan.monthlyPrice === 0) return '/ vĩnh viễn';
    if (frequency === 'monthly') return '/ tháng';
    return '/ tháng khi thanh toán theo năm';
  };

  return (
    <section id="pricing" className="py-20 border-t border-slate-200/80 bg-slate-50/60 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 mb-3 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            Biểu phí minh bạch • Cùng một mức giá cho cả Người học & Người đánh giá
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Gói Dịch Vụ Khảo Thí & Bồi Dưỡng
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Lựa chọn gói dịch vụ phù hợp với nhu cầu nâng cao năng lực cá nhân hoặc triển khai quy mô lớp học và toàn trường.
          </p>

          {/* Toggle Monthly / Yearly */}
          <div className="mt-6 inline-flex items-center p-1 rounded-full bg-slate-200/70 border border-slate-300/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setFrequency('monthly')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                frequency === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo tháng
            </button>
            <button
              type="button"
              onClick={() => setFrequency('yearly')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all inline-flex items-center gap-1.5 ${
                frequency === 'yearly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Theo năm</span>
              <span className="px-1.5 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold">
                Tiết kiệm ~20%
              </span>
            </button>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-10">
          {landingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl bg-white border flex flex-col justify-between transition-all duration-200 ${
                plan.isPopular
                  ? 'border-sky-600 shadow-md ring-1 ring-sky-600/30'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-sky-600 text-white text-[11px] font-bold tracking-wide shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-200" />
                  <span>KHUYÊN DÙNG NHẤT</span>
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    {plan.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed min-h-[2.5rem] mb-4">
                  {plan.desc}
                </p>

                {/* Price */}
                <div className="pb-4 mb-5 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {formatPrice(plan)}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {getBillingPeriod(plan)}
                    </span>
                  </div>
                </div>

                {/* Learner Value */}
                <div className="mb-5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-100">
                    <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                    <span>Người Học</span>
                  </div>
                  {plan.learnerHighlights.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="leading-relaxed">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Evaluator Value */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-100">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Người Đánh Giá</span>
                  </div>
                  {plan.evaluatorHighlights.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="leading-relaxed">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                {plan.id === 'business' || plan.id === 'enterprise' ? (
                  <button
                    type="button"
                    onClick={() => setShowEnterpriseModal(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors shadow-xs bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                ) : (
                  <Link
                    href={plan.ctaHref}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors shadow-xs ${
                      plan.isPopular
                        ? 'bg-sky-600 text-white hover:bg-sky-700'
                        : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Link to full comparison page */}
        <div className="text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-sky-700 hover:text-sky-800 transition-colors p-2"
          >
            <span>Xem bảng so sánh tính năng và tiêu chí chi tiết của cả 4 gói</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      <EnterpriseContactModal
        isOpen={showEnterpriseModal}
        onClose={() => setShowEnterpriseModal(false)}
      />
    </section>
  );
}
