'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Users,
  GraduationCap,
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
  info: string;
  price: {
    monthly: number;
    yearly: number;
  };
  customPriceText?: string;
  isPopular?: boolean;
  learnerFeatures: FeatureItem[];
  evaluatorFeatures: FeatureItem[];
  btn: {
    text: string;
    href: string;
  };
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gói FREE',
    badge: 'TRẢI NGHIỆM',
    info: 'Khởi đầu thuận tiện để cá nhân tự học và giáo viên mở lớp trải nghiệm.',
    price: {
      monthly: 0,
      yearly: 0,
    },
    learnerFeatures: [
      {
        text: 'Kho đề chung trắc nghiệm không giới hạn',
        tooltip: 'Làm bài kiểm tra nhận thức và tư duy số cơ bản, chấm tức thì trong 0.01 giây.',
      },
      {
        text: 'Đề thi chuyên sâu nâng cao: Bị khóa',
        tooltip: 'Các bài thi tình huống, prompt AI và thực hành nộp tệp yêu cầu nâng cấp gói.',
      },
      {
        text: '10 AI credits phân tích năng lực mỗi tháng',
        tooltip: 'AI chẩn đoán điểm mạnh, kỹ năng còn hạn chế trên biểu đồ radar năng lực.',
      },
      {
        text: 'Đóng góp đề thi cộng đồng',
        tooltip: 'Gửi đề bài mới vào kho cộng đồng để tích lũy điểm thưởng đua top bảng xếp hạng.',
      },
      {
        text: 'Chứng chỉ',
        tooltip: 'Chứng nhận hoàn thành bài đánh giá có mã QR tra cứu trực tuyến.',
      },
    ],
    evaluatorFeatures: [
      {
        text: '1 nhóm lớp tối đa 15 học viên',
        tooltip: 'Học viên tham gia qua liên kết mời, mã nhóm hoặc quét mã QR.',
      },
      {
        text: '1 phòng thi trực tiếp mã PIN',
        tooltip: 'Mở 1 phòng thi thời gian thực cho học viên làm bài tập trung.',
      },
      {
        text: 'Bàn chấm điểm thủ công',
        tooltip: 'Chấm điểm bằng tay theo tiêu chí sư phạm, không tốn chi phí AI.',
      },
      {
        text: 'Xuất dữ liệu: Không hỗ trợ',
        tooltip: 'Cần nâng cấp lên gói Plus trở lên để xuất bảng điểm Excel hoặc CSV.',
      },
    ],
    btn: {
      text: 'Bắt đầu miễn phí',
      href: '/register',
    },
  },
  {
    id: 'plus',
    name: 'Gói PLUS',
    badge: 'CƠ BẢN',
    info: 'Dành cho người học bồi dưỡng chuyên đề và giáo viên quản lý lớp nhỏ.',
    price: {
      monthly: 69000,
      yearly: 690000,
    },
    learnerFeatures: [
      {
        text: 'Mở thêm bài thi tình huống thực tế',
        tooltip: 'Luyện tập tình huống thực tế về an toàn số, xử lý sự cố dữ liệu và ứng xử số.',
      },
      {
        text: '100 AI credits phân tích và gợi ý lộ trình',
        tooltip: 'AI phân tích chi tiết khoảng trống năng lực và thiết kế lộ trình bồi dưỡng.',
      },
      {
        text: 'Đánh giá lại kỹ năng sau khi học',
        tooltip: 'Làm bài kiểm tra lại sau khi hoàn thành bài học để cải thiện điểm số radar.',
      },
      {
        text: 'Kho học liệu bồi dưỡng chuẩn',
        tooltip: 'Truy cập các bài đọc, video và bài tập chuyên đề gắn nhãn kỹ năng.',
      },
      {
        text: 'Chứng chỉ',
        tooltip: 'Chứng chỉ định dạng PDF chuẩn có mã xác thực điện tử.',
      },
    ],
    evaluatorFeatures: [
      {
        text: '3 nhóm lớp tối đa 50 học viên mỗi lớp',
        tooltip: 'Tạo và theo dõi tiến độ của 3 nhóm học viên độc lập.',
      },
      {
        text: '3 phòng thi trực tiếp đồng thời',
        tooltip: 'Tổ chức kiểm tra trực tiếp đồng thời cho nhiều ca thi qua mã PIN.',
      },
      {
        text: '100 AI credits hỗ trợ chấm bài thực hành',
        tooltip: 'AI chấm theo tiêu chí định sẵn, trích dẫn bằng chứng và tính độ tin cậy.',
      },
      {
        text: 'Xuất bảng điểm Excel và CSV',
        tooltip: 'Tải toàn bộ kết quả điểm số và tiến độ học tập của các lớp về máy.',
      },
    ],
    btn: {
      text: 'Chọn gói Plus',
      href: '/register?plan=plus',
    },
  },
  {
    id: 'pro',
    name: 'Gói PRO',
    badge: 'PHỔ BIẾN NHẤT',
    info: 'Mở khóa trọn bộ kho đề chuyên sâu cho người học và công cụ khảo thí cao cấp cho giảng viên.',
    price: {
      monthly: 199000,
      yearly: 1890000,
    },
    isPopular: true,
    learnerFeatures: [
      {
        text: 'Mở khóa toàn bộ đề thi chuyên sâu',
        tooltip: 'Toàn quyền làm đề thực hành Prompt AI, xử lý dữ liệu bảng tính và nộp sản phẩm số thực tế.',
      },
      {
        text: '1.000 AI credits phân tích chi tiết và lập lộ trình',
        tooltip: 'AI phân tích chi tiết tư duy làm bài, chỉ rõ lỗi sai và cá nhân hóa lộ trình tối ưu.',
      },
      {
        text: 'Chứng chỉ',
        tooltip: 'Chứng chỉ chuẩn nét cao bảo toàn chữ ký số vĩnh viễn, phù hợp đính kèm hồ sơ xin việc.',
      },
      {
        text: 'Huy hiệu Pro và ưu tiên xếp hạng',
        tooltip: 'Ưu tiên hiển thị và gắn huy hiệu Pro danh dự trên bảng xếp hạng top học viên.',
      },
    ],
    evaluatorFeatures: [
      {
        text: 'Không giới hạn số lớp và học viên',
        tooltip: 'Thoải mái tạo nhóm lớp cho toàn bộ các khóa đào tạo mà không lo đầy sĩ số.',
      },
      {
        text: 'Không giới hạn phòng thi trực tiếp',
        tooltip: 'Mở phòng thi bất cứ lúc nào với số lượng thí sinh đồng thời không giới hạn.',
      },
      {
        text: 'Bàn chấm Split-view chuyên nghiệp',
        tooltip: 'Màn hình chia đôi: Xem sản phẩm minh chứng bên trái, chấm tiêu chí bên phải.',
      },
      {
        text: '1.000 AI credits chấm gợi ý bài làm',
        tooltip: 'Hỗ trợ chấm bài cực nhanh kèm trích dẫn bằng chứng và lưu bài mẫu chuẩn.',
      },
      {
        text: 'Xuất dữ liệu nghiên cứu 26 biến số',
        tooltip: 'Bộ dữ liệu nghiên cứu khoa học ẩn danh theo quy định bảo vệ dữ liệu.',
      },
    ],
    btn: {
      text: 'Nâng cấp gói Pro',
      href: '/register?plan=pro',
    },
  },
  {
    id: 'enterprise',
    name: 'Gói ENTERPRISE',
    badge: 'DOANH NGHIỆP',
    info: 'Giải pháp khảo thí và chuẩn hóa diện rộng cho trường đại học, viện nghiên cứu và doanh nghiệp.',
    price: {
      monthly: 0,
      yearly: 0,
    },
    customPriceText: 'Liên hệ',
    learnerFeatures: [
      {
        text: 'Toàn bộ sinh viên được nâng cấp gói Pro',
        tooltip: 'Toàn bộ sinh viên trong trường được mở khóa toàn bộ đề thi, học liệu chuyên sâu và chứng chỉ.',
      },
      {
        text: 'Ngân hàng đề thi và học liệu riêng',
        tooltip: 'Luyện tập theo đúng chuẩn đầu ra của ngành nghề đào tạo tại trường.',
      },
    ],
    evaluatorFeatures: [
      {
        text: 'Giảng viên dùng trọn bộ công cụ khảo thí',
        tooltip: 'Mở phòng thi, bàn chấm chuyên nghiệp, xuất dữ liệu cho toàn thể cán bộ giảng viên.',
      },
      {
        text: 'Tùy biến khung năng lực số riêng',
        tooltip: 'Tự định nghĩa chuẩn đầu ra theo ngành y tế, sư phạm, kinh tế, công nghệ.',
      },
      {
        text: 'Tích hợp đăng nhập một lần và LMS',
        tooltip: 'Liên thông tài khoản nội bộ và hệ thống quản lý học tập của đơn vị.',
      },
      {
        text: 'Chứng chỉ đồng thương hiệu riêng',
        tooltip: 'Chứng chỉ mang nhận diện chính thức và con dấu số của đơn vị.',
      },
      {
        text: 'Báo cáo kiểm định chất lượng đào tạo',
        tooltip: 'Báo cáo số liệu tổng thể phục vụ công tác kiểm định chất lượng đào tạo.',
      },
    ],
    btn: {
      text: 'Đăng ký cho Tổ chức / Nhận tư vấn',
      href: '#enterprise-inquiry',
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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-14 w-full">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 mb-4 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            Minh bạch chi phí • Cùng một mức giá cho cả Người học và Người đánh giá
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Bảng Giá Dịch Vụ Khảo Thí &amp; Bồi Dưỡng
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

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-20">
          {plans.map((plan) => {
            const discount = getDiscountPercent(plan);

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl bg-white border flex flex-col justify-between transition-all duration-200 ${
                  plan.isPopular
                    ? 'border-sky-600 shadow-md ring-1 ring-sky-600/30'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Popular Pill */}
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-sky-600 text-white text-[11px] font-bold tracking-wide shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-200" />
                    <span>KHUYÊN DÙNG NHẤT</span>
                  </div>
                )}

                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      {plan.badge}
                    </span>

                    {frequency === 'yearly' && discount && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        Giảm {discount}%
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 mb-1.5">{plan.name}</h2>
                  <p className="text-xs text-slate-500 leading-relaxed min-h-[2.5rem] mb-5">
                    {plan.info}
                  </p>

                  {/* Pricing Display */}
                  <div className="pb-5 mb-5 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {formatPrice(plan)}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {getBillingPeriod(plan)}
                      </span>
                    </div>

                    {frequency === 'yearly' && plan.price.yearly > 0 && (
                      <div className="text-[11px] text-slate-500 mt-1 font-medium">
                        Thu {plan.price.yearly.toLocaleString('vi-VN')} đ / năm
                      </div>
                    )}
                  </div>

                  {/* Feature Group 1: CHO NGƯỜI HỌC */}
                  <div className="mb-6 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-100">
                      <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                      <span>Cho Người Học</span>
                    </div>

                    {plan.learnerFeatures.map((feat, idx) => (
                      <div key={idx} className="group/item relative flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" strokeWidth={2} />
                        <span className="leading-relaxed flex-1">{feat.text}</span>

                        {feat.tooltip && (
                          <div className="relative">
                            <button
                              type="button"
                              onMouseEnter={() => setActiveTooltip(`${plan.id}-lea-${idx}`)}
                              onMouseLeave={() => setActiveTooltip(null)}
                              onClick={() =>
                                setActiveTooltip(
                                  activeTooltip === `${plan.id}-lea-${idx}` ? null : `${plan.id}-lea-${idx}`
                                )
                              }
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                              title={feat.tooltip}
                              aria-label={feat.tooltip}
                            >
                              <HelpCircle className="w-3 h-3" />
                            </button>

                            {activeTooltip === `${plan.id}-lea-${idx}` && (
                              <div className="absolute right-0 bottom-full mb-1 w-48 p-2 rounded-md bg-slate-900 border border-slate-700 text-white text-[11px] leading-tight z-30 shadow-sm pointer-events-none animate-in fade-in-50">
                                {feat.tooltip}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Feature Group 2: CHO NGƯỜI ĐÁNH GIÁ */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-100">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cho Người Đánh Giá</span>
                    </div>

                    {plan.evaluatorFeatures.map((feat, idx) => (
                      <div key={idx} className="group/item relative flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2} />
                        <span className="leading-relaxed flex-1">{feat.text}</span>

                        {feat.tooltip && (
                          <div className="relative">
                            <button
                              type="button"
                              onMouseEnter={() => setActiveTooltip(`${plan.id}-eva-${idx}`)}
                              onMouseLeave={() => setActiveTooltip(null)}
                              onClick={() =>
                                setActiveTooltip(
                                  activeTooltip === `${plan.id}-eva-${idx}` ? null : `${plan.id}-eva-${idx}`
                                )
                              }
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                              title={feat.tooltip}
                              aria-label={feat.tooltip}
                            >
                              <HelpCircle className="w-3 h-3" />
                            </button>

                            {activeTooltip === `${plan.id}-eva-${idx}` && (
                              <div className="absolute right-0 bottom-full mb-1 w-48 p-2 rounded-md bg-slate-900 border border-slate-700 text-white text-[11px] leading-tight z-30 shadow-sm pointer-events-none animate-in fade-in-50">
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
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                  {plan.id === 'enterprise' ? (
                    <button
                      type="button"
                      onClick={() => setShowEnterpriseModal(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors shadow-xs bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                    >
                      <span>{plan.btn.text}</span>
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  ) : (
                    <Link
                      href={plan.btn.href}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors shadow-xs ${
                        plan.isPopular
                          ? 'bg-sky-600 text-white hover:bg-sky-700'
                          : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span>{plan.btn.text}</span>
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">Bảng So Sánh Tính Năng Chi Tiết 4 Gói</h3>
            <p className="text-xs text-slate-500 mt-1">
              Đối chiếu minh bạch toàn bộ các đặc quyền mở khóa giữa Người học và Người đánh giá trên cùng một biểu phí.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-4 font-semibold text-slate-700 w-1/3">Tiêu chí &amp; Quyền lợi</th>
                  <th className="py-3 px-3 font-semibold text-slate-700">Gói FREE</th>
                  <th className="py-3 px-3 font-semibold text-slate-700">Gói PLUS</th>
                  <th className="py-3 px-3 font-semibold text-sky-700 bg-sky-50/50">Gói PRO</th>
                  <th className="py-3 px-3 font-semibold text-slate-900">Gói ENTERPRISE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* General Pricing Row */}
                <tr className="bg-slate-50/30">
                  <td className="py-3 px-4 font-bold text-slate-900">Mức giá đồng nhất</td>
                  <td className="py-3 px-3 font-bold text-slate-800">0 đ</td>
                  <td className="py-3 px-3 font-bold text-slate-800">69.000 đ/tháng</td>
                  <td className="py-3 px-3 font-bold text-sky-700 bg-sky-50/30">199.000 đ/tháng</td>
                  <td className="py-3 px-3 font-bold text-slate-900">Theo quy mô</td>
                </tr>

                {/* Section Header: Learner */}
                <tr className="bg-slate-100/60">
                  <td colSpan={5} className="py-2 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    1. Quyền lợi dành cho Người Học
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Kho đề trắc nghiệm chung</td>
                  <td className="py-3 px-3 text-slate-600">Không giới hạn</td>
                  <td className="py-3 px-3 text-slate-600">Không giới hạn</td>
                  <td className="py-3 px-3 text-sky-700 font-semibold bg-sky-50/30">Không giới hạn</td>
                  <td className="py-3 px-3 text-slate-800">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Bài thi tình huống thực tế</td>
                  <td className="py-3 px-3 text-slate-400">Khóa</td>
                  <td className="py-3 px-3 text-emerald-600 font-semibold">Mở khóa</td>
                  <td className="py-3 px-3 text-sky-700 font-semibold bg-sky-50/30">Mở khóa</td>
                  <td className="py-3 px-3 text-slate-800">Mở khóa</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Đề thi chuyên sâu nâng cao</td>
                  <td className="py-3 px-3 text-slate-400">Khóa</td>
                  <td className="py-3 px-3 text-slate-400">Khóa</td>
                  <td className="py-3 px-3 text-sky-700 font-bold bg-sky-50/30">Mở khóa toàn bộ</td>
                  <td className="py-3 px-3 text-slate-800 font-bold">Mở khóa toàn bộ</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Hạn mức AI credits mỗi tháng</td>
                  <td className="py-3 px-3 text-slate-600">10 credits</td>
                  <td className="py-3 px-3 text-slate-600">100 credits</td>
                  <td className="py-3 px-3 text-sky-700 font-bold bg-sky-50/30">1.000 credits</td>
                  <td className="py-3 px-3 text-slate-800 font-bold">Theo hợp đồng</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Đánh giá lại kỹ năng</td>
                  <td className="py-3 px-3 text-slate-400">Không</td>
                  <td className="py-3 px-3 text-emerald-600 font-semibold">Có</td>
                  <td className="py-3 px-3 text-sky-700 font-semibold bg-sky-50/30">Có chuyên sâu</td>
                  <td className="py-3 px-3 text-slate-800 font-semibold">Có chuyên sâu</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Chứng chỉ</td>
                  <td className="py-3 px-3 text-slate-600">Chứng chỉ</td>
                  <td className="py-3 px-3 text-slate-600">Chứng chỉ</td>
                  <td className="py-3 px-3 text-sky-700 font-bold bg-sky-50/30">Chứng chỉ</td>
                  <td className="py-3 px-3 text-slate-900 font-bold">Chứng chỉ đồng thương hiệu</td>
                </tr>

                {/* Section Header: Evaluator */}
                <tr className="bg-slate-100/60">
                  <td colSpan={5} className="py-2 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    2. Quyền lợi dành cho Người Đánh Giá
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Số lượng nhóm lớp quản lý</td>
                  <td className="py-3 px-3 text-slate-600">1 lớp tối đa 15 học viên</td>
                  <td className="py-3 px-3 text-slate-600">3 lớp tối đa 50 học viên</td>
                  <td className="py-3 px-3 text-sky-700 font-bold bg-sky-50/30">Không giới hạn</td>
                  <td className="py-3 px-3 text-slate-800 font-bold">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Phòng thi trực tiếp mã PIN</td>
                  <td className="py-3 px-3 text-slate-600">1 phòng</td>
                  <td className="py-3 px-3 text-slate-600">3 phòng cùng lúc</td>
                  <td className="py-3 px-3 text-sky-700 font-bold bg-sky-50/30">Không giới hạn</td>
                  <td className="py-3 px-3 text-slate-800 font-bold">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Bàn chấm Split-view chuyên nghiệp</td>
                  <td className="py-3 px-3 text-slate-400">Không</td>
                  <td className="py-3 px-3 text-slate-400">Không</td>
                  <td className="py-3 px-3 text-sky-700 font-bold bg-sky-50/30">Có</td>
                  <td className="py-3 px-3 text-slate-800 font-bold">Có</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Hạn mức AI credits chấm bài mỗi tháng</td>
                  <td className="py-3 px-3 text-slate-600">Thủ công (0 credit)</td>
                  <td className="py-3 px-3 text-slate-600">100 credits</td>
                  <td className="py-3 px-3 text-sky-700 font-bold bg-sky-50/30">1.000 credits</td>
                  <td className="py-3 px-3 text-slate-800 font-bold">Theo hợp đồng</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Xuất dữ liệu nghiên cứu</td>
                  <td className="py-3 px-3 text-slate-400">Không</td>
                  <td className="py-3 px-3 text-slate-600">Bảng điểm Excel và CSV</td>
                  <td className="py-3 px-3 text-sky-700 font-bold bg-sky-50/30">Dữ liệu nghiên cứu 26 biến số</td>
                  <td className="py-3 px-3 text-slate-800 font-bold">Báo cáo kiểm định toàn trường</td>
                </tr>

                {/* Section Header: Organization */}
                <tr className="bg-slate-100/60">
                  <td colSpan={5} className="py-2 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    3. Đặc quyền Cấp Tổ Chức
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Tùy biến khung năng lực số riêng</td>
                  <td className="py-3 px-3 text-slate-400">Không</td>
                  <td className="py-3 px-3 text-slate-400">Không</td>
                  <td className="py-3 px-3 text-slate-400">Không</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Toàn quyền thiết kế</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Tích hợp đăng nhập một lần và LMS</td>
                  <td className="py-3 px-3 text-slate-400">Không</td>
                  <td className="py-3 px-3 text-slate-400">Không</td>
                  <td className="py-3 px-3 text-slate-400">Không</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">Hỗ trợ trọn gói</td>
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
