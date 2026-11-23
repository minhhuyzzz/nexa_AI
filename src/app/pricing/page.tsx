'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Building2,
  FileSpreadsheet,
  Layers,
  Award,
  Zap,
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { EnterpriseContactModal } from '@/components/pricing/EnterpriseContactModal';

type FREQUENCY = 'monthly' | 'yearly';

interface FeatureItem {
  text: string;
  tooltip?: string;
}

interface Plan {
  id: string;
  name: string;
  badge?: string;
  trialTag?: string;
  info: string;
  price: {
    monthly: number;
    yearly: number;
  };
  customPriceText?: string;
  isPopular?: boolean;
  features: FeatureItem[];
  btn: {
    text: string;
    href: string;
  };
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Gói Cơ Bản',
    badge: 'TRẢI NGHIỆM',
    info: 'Khởi đầu thuận tiện để cá nhân khảo sát năng lực số và lưu trữ hồ sơ cá nhân.',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      {
        text: 'Khảo sát các miền năng lực số chuẩn hóa',
        tooltip: 'Làm bài kiểm tra nhận thức và tư duy số cơ bản, chấm tức thì trong 0.01 giây.',
      },
      {
        text: 'Lưu trữ hồ sơ năng lực số cá nhân',
        tooltip: 'Theo dõi tiến bộ điểm số theo thời gian thực trên hồ sơ cá nhân.',
      },
      {
        text: 'Cấp chứng chỉ số khi hoàn thành bài thi',
        tooltip: 'Xem và lưu chứng chỉ số khi hoàn thành bài khảo sát đạt chuẩn.',
      },
      {
        text: '10 AI credits phân tích năng lực mỗi tháng',
        tooltip: 'AI chẩn đoán điểm mạnh, kỹ năng còn hạn chế trên biểu đồ năng lực.',
      },
      {
        text: 'Tối đa 2 nhóm lớp (30 học viên/nhóm)',
        tooltip: 'Học viên tham gia qua liên kết mời, mã nhóm hoặc quét mã QR.',
      },
      {
        text: 'Mở phòng thi trực tiếp mã PIN tối đa 30 thí sinh',
        tooltip: 'Tổ chức phòng thi trực tiếp cơ bản không tốn chi phí.',
      },
    ],
    btn: {
      text: 'Bắt đầu miễn phí',
      href: '/register',
    },
  },
  {
    id: 'standard',
    name: 'Gói Tiêu Chuẩn',
    badge: 'PHỔ BIẾN NHẤT',
    trialTag: 'TẶNG 30 NGÀY DÙNG THỬ',
    info: 'Mở khóa trọn vẹn các miền bồi dưỡng và cấp chứng chỉ số.',
    price: {
      monthly: 49000,
      yearly: 468000,
    },
    isPopular: true,
    features: [
      {
        text: 'Toàn bộ quyền lợi của Gói Cơ Bản',
        tooltip: 'Thừa hưởng đầy đủ các tính năng của Gói Cơ Bản.',
      },
      {
        text: 'Tặng 30 ngày dùng thử 0đ tháng đầu tiên',
        tooltip: 'Trải nghiệm miễn phí trọn vẹn quyền lợi gói trong tháng đầu.',
      },
      {
        text: 'Mở trọn vẹn các miền năng lực số và học liệu bồi dưỡng',
        tooltip: 'Học tập toàn diện không giới hạn các nội dung và bài thi bồi dưỡng.',
      },
      {
        text: 'Lộ trình học tập cá nhân hóa được hỗ trợ bởi AI',
        tooltip: 'Gợi ý bài học và tài liệu bổ trợ tập trung đúng miền kỹ năng còn yếu.',
      },
      {
        text: '100 AI credits chẩn đoán và lộ trình học tập mỗi tháng',
        tooltip: 'AI phân tích chi tiết tư duy làm bài, chỉ rõ khoảng trống và cá nhân hóa lộ trình.',
      },
      {
        text: 'Tối đa 10 nhóm lớp (100 học viên/nhóm)',
        tooltip: 'Quản lý linh hoạt danh sách học viên và bài tập giao theo nhóm.',
      },
      {
        text: 'Mở phòng thi trực tiếp mã PIN tối đa 100 thí sinh',
        tooltip: 'Tổ chức thi tập trung với mã PIN bảo mật.',
      },
    ],
    btn: {
      text: 'Dùng thử 30 ngày (0đ)',
      href: '/register?plan=standard',
    },
  },
  {
    id: 'advanced',
    name: 'Gói Nâng Cao',
    badge: 'TOÀN DIỆN',
    info: 'Dành cho cá nhân bồi dưỡng chuyên sâu và tổ chức thi trực tiếp.',
    price: {
      monthly: 149000,
      yearly: 1428000,
    },
    features: [
      {
        text: 'Toàn bộ quyền lợi của Gói Tiêu Chuẩn',
        tooltip: 'Đầy đủ mọi tính năng học tập và bồi dưỡng nâng cao.',
      },
      {
        text: 'Không giới hạn nhóm lớp (500 học viên/nhóm)',
        tooltip: 'Thoải mái tạo nhóm lớp cho toàn bộ các khóa đào tạo mà không lo đầy sĩ số.',
      },
      {
        text: 'Mở phòng thi trực tiếp mã PIN thời gian thực (500 thí sinh)',
        tooltip: 'Tổ chức thi tập trung với giám sát thời gian thực và tự động khóa đề khi hết giờ.',
      },
      {
        text: '500 AI credits chuyên sâu mỗi tháng',
        tooltip: 'Giải thích chi tiết đáp án từng câu hỏi bằng AI và gợi ý học tập tức thì.',
      },
      {
        text: 'Xuất bảng điểm Excel, CSV và dữ liệu nghiên cứu',
        tooltip: 'Tải về đầy đủ điểm số chi tiết từng tiêu chí phục vụ báo cáo và nghiên cứu.',
      },
    ],
    btn: {
      text: 'Nâng cấp ngay',
      href: '/register?plan=advanced',
    },
  },
  {
    id: 'b2b',
    name: 'Gói Tổ Chức',
    badge: 'TRƯỜNG HỌC VÀ DOANH NGHIỆP',
    info: 'Khảo thí diện rộng toàn trường, hội đồng chấm tập trung và chứng nhận đơn vị.',
    price: {
      monthly: 0,
      yearly: 0,
    },
    customPriceText: 'Liên hệ B2B',
    features: [
      {
        text: 'Khảo thí diện rộng theo đợt tập trung (Campaigns)',
        tooltip: 'Vận hành các kỳ khảo sát đồng loạt hàng nghìn thí sinh với mã định danh.',
      },
      {
        text: 'Toàn bộ sinh viên và giảng viên được mở khóa theo đợt thi',
        tooltip: 'Sinh viên làm bài đánh giá theo chiến dịch của trường, mở khóa toàn bộ đề thi chỉ định.',
      },
      {
        text: 'Báo cáo và thống kê năng lực số cấp tổ chức',
        tooltip: 'Báo cáo số liệu tổng thể phục vụ công tác kiểm định chất lượng đào tạo.',
      },
      {
        text: 'Chứng chỉ số gắn Logo thương hiệu riêng của trường hoặc doanh nghiệp',
        tooltip: 'Chứng chỉ mang nhận diện chính thức và con dấu số của trường hoặc doanh nghiệp.',
      },
      {
        text: 'Hợp đồng dịch vụ, hóa đơn VAT và cam kết hỗ trợ',
        tooltip: 'Đảm bảo thủ tục tài chính hành chính đầy đủ và hỗ trợ kỹ thuật trực tiếp.',
      },
    ],
    btn: {
      text: 'Liên hệ tư vấn B2B',
      href: '#business-inquiry',
    },
  },
];

export default function PricingPage() {
  const [frequency, setFrequency] = useState<FREQUENCY>('monthly');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

  const formatPrice = (plan: Plan) => {
    if (plan.customPriceText) return plan.customPriceText;
    if (plan.price.monthly === 0) return '0 đ';

    if (frequency === 'monthly') {
      return `${plan.price.monthly.toLocaleString('vi-VN')} đ`;
    } else {
      const monthlyEquiv = Math.round(plan.price.yearly / 12);
      return `${monthlyEquiv.toLocaleString('vi-VN')} đ`;
    }
  };

  const getBillingPeriod = (plan: Plan) => {
    if (plan.customPriceText) return 'theo quy mô';
    if (plan.price.monthly === 0) return '/ vĩnh viễn';
    if (frequency === 'monthly') return '/ tháng';
    return '/ tháng khi thanh toán theo năm';
  };

  const getDiscountPercent = (plan: Plan) => {
    if (plan.price.monthly === 0) return null;
    const fullYearCost = plan.price.monthly * 12;
    const discount = Math.round(((fullYearCost - plan.price.yearly) / fullYearCost) * 100);
    return discount > 0 ? discount : null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <PublicHeader activePath="/pricing" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 w-full">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Bảng Giá Dịch Vụ
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Chọn gói dịch vụ phù hợp với mục tiêu nâng cao năng lực cá nhân hoặc nhu cầu tổ chức thi tập trung của nhà trường.
          </p>

          {/* Frequency Toggle Button */}
          <div className="mt-8 inline-flex items-center p-1 rounded-full bg-slate-200/70 border border-slate-300/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setFrequency('monthly')}
              className={`px-5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                frequency === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thanh toán theo tháng
            </button>
            <button
              type="button"
              onClick={() => setFrequency('yearly')}
              className={`px-5 py-1.5 text-xs font-semibold rounded-full transition-all inline-flex items-center gap-1.5 ${
                frequency === 'yearly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Thanh toán theo năm</span>
              <span className="px-1.5 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold">
                Tiết kiệm ~20%
              </span>
            </button>
          </div>
        </div>

        {/* 4-Column Responsive Cards Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch pt-8 mb-20 overflow-visible">
          {plans.map((plan) => {
            const discount = getDiscountPercent(plan);
            const isPro = plan.isPopular;
            const isBusiness = plan.id === 'b2b';

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl bg-white border flex flex-col justify-between transition-all duration-200 ${
                  isPro
                    ? 'border-2 border-blue-600 shadow-xl ring-1 ring-blue-600/20'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Popular Pill */}
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-max px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold tracking-wide shadow-sm flex items-center gap-1.5 whitespace-nowrap z-20 select-none">
                    <Sparkles className="w-3.5 h-3.5 fill-current text-blue-200 shrink-0" />
                    <span className="whitespace-nowrap">KHUYÊN DÙNG NHẤT</span>
                  </div>
                )}

                <div className={`p-7 sm:p-8 ${isPro ? 'pt-8 sm:pt-9' : ''}`}>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 mb-4">
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                      isPro ? 'text-blue-600' : 'text-slate-500'
                    }`}>
                      {plan.badge}
                    </span>

                    {frequency === 'yearly' && discount && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        Giảm {discount}%
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-black text-slate-900 mb-1.5">{plan.name}</h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[2.5rem] mb-5">
                    {plan.info}
                  </p>

                  {/* Pricing Display */}
                  <div className="pb-5 mb-5">
                    {isBusiness ? (
                      <div className="space-y-1">
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                          Liên hệ
                        </div>
                        <div className="text-xs font-medium text-slate-500">
                          Báo giá linh hoạt theo quy mô triển khai
                        </div>
                      </div>
                    ) : plan.price.monthly === 0 ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tabular-nums">
                          0đ
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          / vĩnh viễn
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tabular-nums">
                            {frequency === 'monthly'
                              ? `${plan.price.monthly.toLocaleString('vi-VN')} đ`
                              : `${Math.round(plan.price.yearly / 12).toLocaleString('vi-VN')} đ`}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            / tháng
                          </span>
                        </div>
                        {frequency === 'yearly' && (
                          <div className="text-[11px] font-medium text-emerald-600">
                            Thanh toán {plan.price.yearly.toLocaleString('vi-VN')} đ / năm
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* DANH SÁCH TÍNH NĂNG HỢP NHẤT (MỘT DANH TÍNH CÁ NHÂN) */}
                  <div className="space-y-3 flex-1 pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                      Tính năng bao gồm:
                    </div>

                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="group/item relative flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            plan.isPopular ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                          strokeWidth={2}
                        />
                        <span className="leading-relaxed flex-1">{feat.text}</span>

                        {feat.tooltip && (
                          <div className="relative">
                            <button
                              type="button"
                              onMouseEnter={() => setActiveTooltip(`${plan.id}-feat-${idx}`)}
                              onMouseLeave={() => setActiveTooltip(null)}
                              onClick={() =>
                                setActiveTooltip(
                                  activeTooltip === `${plan.id}-feat-${idx}` ? null : `${plan.id}-feat-${idx}`
                                )
                              }
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                              title={feat.tooltip}
                              aria-label={feat.tooltip}
                            >
                              <HelpCircle className="w-3 h-3" />
                            </button>

                            {activeTooltip === `${plan.id}-feat-${idx}` && (
                              <div className="absolute right-0 bottom-full mb-1 w-52 p-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-[11px] leading-tight z-30 shadow-md pointer-events-none animate-in fade-in-50">
                                {feat.tooltip}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="p-6 pt-0">
                  {plan.id === 'b2b' || plan.id === 'business' || plan.id === 'enterprise' ? (
                    <button
                      type="button"
                      onClick={() => setShowEnterpriseModal(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-[0.98] whitespace-nowrap"
                    >
                      <span>{plan.btn.text}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    </button>
                  ) : (
                    <Link
                      href={plan.btn.href}
                      className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] whitespace-nowrap ${
                        plan.isPopular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <span>{plan.btn.text}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl ring-1 ring-slate-200/80 dark:ring-zinc-800 p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Bảng So Sánh Tính Năng Chi Tiết 4 Gói Dịch Vụ
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
              Đối chiếu minh bạch toàn bộ các đặc quyền mở khóa giữa Cá nhân và Tổ chức trên cùng một biểu phí chuẩn hóa.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-800/70 rounded-xl">
                  <th className="py-3.5 px-4 font-bold text-neutral-700 dark:text-neutral-300 w-1/4 rounded-l-xl">
                    Tiêu chí và Quyền lợi
                  </th>
                  <th className="py-3.5 px-3 font-bold text-neutral-700 dark:text-neutral-300">
                    Gói Cơ Bản
                  </th>
                  <th className="py-3.5 px-3 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/50">
                    Gói Tiêu Chuẩn
                  </th>
                  <th className="py-3.5 px-3 font-bold text-neutral-800 dark:text-neutral-200">
                    Gói Nâng Cao
                  </th>
                  <th className="py-3.5 px-3 font-bold text-neutral-900 dark:text-neutral-100 rounded-r-xl">
                    Gói Tổ Chức
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* General Pricing Row */}
                <tr className="bg-slate-50/40 dark:bg-zinc-800/20">
                  <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-neutral-100">Mức giá dịch vụ</td>
                  <td className="py-3.5 px-3 font-bold text-neutral-700 dark:text-neutral-300">0 đ / vĩnh viễn</td>
                  <td className="py-3.5 px-3 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
                    {frequency === 'monthly' ? '49.000 đ/tháng' : '39.000 đ/tháng'}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-neutral-800 dark:text-neutral-200">
                    {frequency === 'monthly' ? '149.000 đ/tháng' : '119.000 đ/tháng'}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-neutral-900 dark:text-neutral-100">Liên hệ tư vấn B2B</td>
                </tr>

                {/* Section Header: Competency & Learning */}
                <tr className="bg-slate-100/70 dark:bg-zinc-800/50">
                  <td colSpan={5} className="py-2.5 px-4 font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider text-[11px] rounded-lg">
                    1. Bồi dưỡng và Khảo thí Năng lực số
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-neutral-800 dark:text-neutral-200">Khảo thí và Miền bồi dưỡng</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-neutral-400">Khảo thí chuẩn hóa</td>
                  <td className="py-3 px-3 text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-950/30">
                    Mở trọn vẹn các miền năng lực số
                  </td>
                  <td className="py-3 px-3 text-neutral-800 dark:text-neutral-200 font-medium">Toàn bộ quyền lợi và chuyên đề nâng cao</td>
                  <td className="py-3 px-3 text-neutral-900 dark:text-neutral-100 font-semibold">Khảo thí diện rộng toàn đơn vị</td>
                </tr>
                <tr className="bg-slate-50/30 dark:bg-zinc-800/10">
                  <td className="py-3 px-4 font-medium text-neutral-800 dark:text-neutral-200">Lộ trình bồi dưỡng</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-neutral-400">Lưu trữ hồ sơ cá nhân</td>
                  <td className="py-3 px-3 text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-950/30">
                    Lộ trình học tập cá nhân hóa
                  </td>
                  <td className="py-3 px-3 text-neutral-800 dark:text-neutral-200 font-medium">Lộ trình thích ứng và gợi ý học tập AI</td>
                  <td className="py-3 px-3 text-neutral-900 dark:text-neutral-100 font-semibold">Báo cáo độ trưởng thành số cấp trường</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-neutral-800 dark:text-neutral-200">Hạn mức AI credits mỗi tháng</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-neutral-400">10 credits / tháng</td>
                  <td className="py-3 px-3 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30">
                    100 credits / tháng
                  </td>
                  <td className="py-3 px-3 text-neutral-800 dark:text-neutral-200 font-bold">500 credits / tháng</td>
                  <td className="py-3 px-3 text-neutral-900 dark:text-neutral-100 font-bold">Tùy chỉnh theo hợp đồng</td>
                </tr>
                <tr className="bg-slate-50/30 dark:bg-zinc-800/10">
                  <td className="py-3 px-4 font-medium text-neutral-800 dark:text-neutral-200">Chứng chỉ số</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-neutral-400">Chứng chỉ số</td>
                  <td className="py-3 px-3 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30">
                    Chứng chỉ số
                  </td>
                  <td className="py-3 px-3 text-neutral-800 dark:text-neutral-200 font-bold">Chứng chỉ số</td>
                  <td className="py-3 px-3 text-neutral-900 dark:text-neutral-100 font-bold">Chứng chỉ số gắn Logo đơn vị</td>
                </tr>

                {/* Section Header: Classroom & Live Room */}
                <tr className="bg-slate-100/70 dark:bg-zinc-800/50">
                  <td colSpan={5} className="py-2.5 px-4 font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider text-[11px] rounded-lg">
                    2. Quản lý Nhóm lớp và Tổ chức Khảo nghiệm
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-neutral-800 dark:text-neutral-200">Số lượng nhóm lớp quản lý</td>
                  <td className="py-3 px-3 text-slate-700 dark:text-neutral-300">Tối đa 2 nhóm (30 hv/nhóm)</td>
                  <td className="py-3 px-3 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30">
                    Tối đa 10 nhóm (100 hv/nhóm)
                  </td>
                  <td className="py-3 px-3 text-neutral-800 dark:text-neutral-200 font-bold">Không giới hạn (500 hv/nhóm)</td>
                  <td className="py-3 px-3 text-neutral-900 dark:text-neutral-100 font-bold">Không giới hạn (Toàn trường)</td>
                </tr>
                <tr className="bg-slate-50/30 dark:bg-zinc-800/10">
                  <td className="py-3 px-4 font-medium text-neutral-800 dark:text-neutral-200">Phòng thi trực tiếp mã PIN</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-neutral-400">1 phòng (30 thí sinh)</td>
                  <td className="py-3 px-3 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30">
                    Tối đa 5 phòng (100 thí sinh/phòng)
                  </td>
                  <td className="py-3 px-3 text-neutral-800 dark:text-neutral-200 font-bold">Mở phòng thi thời gian thực</td>
                  <td className="py-3 px-3 text-neutral-900 dark:text-neutral-100 font-bold">Phòng thi đồng loạt toàn trường</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-neutral-800 dark:text-neutral-200">Bàn chấm Rubric</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-neutral-400">Bàn chấm thủ công cơ bản</td>
                  <td className="py-3 px-3 text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-950/30">
                    Bàn chấm Rubric và tự động
                  </td>
                  <td className="py-3 px-3 text-neutral-800 dark:text-neutral-200 font-bold">Rubric chuyên sâu</td>
                  <td className="py-3 px-3 text-neutral-900 dark:text-neutral-100 font-bold">Hội đồng chấm tập trung</td>
                </tr>
                <tr className="bg-slate-50/30 dark:bg-zinc-800/10">
                  <td className="py-3 px-4 font-medium text-neutral-800 dark:text-neutral-200">Xuất bảng điểm và dữ liệu</td>
                  <td className="py-3 px-3 text-slate-400 dark:text-neutral-500">Điểm số cơ bản</td>
                  <td className="py-3 px-3 text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-950/30">
                    Xuất bảng điểm Excel, CSV
                  </td>
                  <td className="py-3 px-3 text-neutral-800 dark:text-neutral-200 font-bold">Xuất Excel, CSV và dữ liệu nghiên cứu</td>
                  <td className="py-3 px-3 text-neutral-900 dark:text-neutral-100 font-bold">Báo cáo kiểm định toàn trường (BI)</td>
                </tr>

                {/* Section Header: Organization */}
                <tr className="bg-slate-100/70 dark:bg-zinc-800/50">
                  <td colSpan={5} className="py-2.5 px-4 font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider text-[11px] rounded-lg">
                    3. Đặc quyền Cấp Tổ Chức (Trường học và Doanh nghiệp)
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-neutral-800 dark:text-neutral-200">Khảo thí diện rộng (Campaigns)</td>
                  <td className="py-3 px-3 text-slate-400 dark:text-neutral-500">Không</td>
                  <td className="py-3 px-3 text-slate-400 dark:text-neutral-500 bg-blue-50/50 dark:bg-blue-950/30">Không</td>
                  <td className="py-3 px-3 text-slate-400 dark:text-neutral-500">Không</td>
                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">Toàn quyền khởi tạo theo đợt</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-neutral-800 dark:text-neutral-200">Hỗ trợ kỹ thuật chuyên trách</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-neutral-400">Cộng đồng</td>
                  <td className="py-3 px-3 text-slate-700 dark:text-neutral-300 bg-blue-50/50 dark:bg-blue-950/30">Hỗ trợ trực tuyến</td>
                  <td className="py-3 px-3 text-neutral-800 dark:text-neutral-200 font-medium">Hỗ trợ ưu tiên</td>
                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">Chuyên trách theo kỳ thi</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <EnterpriseContactModal
        isOpen={showEnterpriseModal}
        onClose={() => setShowEnterpriseModal(false)}
      />

      <PublicFooter />
    </div>
  );
}
