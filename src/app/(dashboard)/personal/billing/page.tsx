'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Building2,
  Layers,
} from 'lucide-react';
import { EnterpriseContactModal } from '@/components/pricing/EnterpriseContactModal';

type Frequency = 'monthly' | 'yearly';

interface ServicePlan {
  id: string;
  code: string;
  name: string;
  description: string;
  price_vnd: number;
  credits_included: number;
  features: string[];
}

interface PlanDetails {
  planCode: string;
  planName: string;
  tier: string;
  credits: number;
  billingCycle: string;
  expiresAt: string | null;
}

// Bảng cấu hình chuẩn hóa định danh và tính năng súc tích cho 3 gói Cá nhân
const PLAN_CONFIG: Record<
  string,
  {
    name: string;
    badge: string;
    desc: string;
    isPopular?: boolean;
    trialTag?: string;
    monthlyPrice: number;
    yearlyPrice: number;
    yearlyMonthlyEquivalent: number;
    creditsMonthly: number;
    features: string[];
  }
> = {
  LEARNER_FREE: {
    name: 'Gói Cơ Bản',
    badge: 'TRẢI NGHIỆM',
    desc: 'Khảo sát năng lực số cơ bản và lưu trữ hồ sơ cá nhân.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthlyEquivalent: 0,
    creditsMonthly: 10,
    features: [
      'Tối đa 2 nhóm lớp (30 học viên/nhóm)',
      '10 AI credits / tháng',
      'Khảo thí chuẩn hóa & mở 1 miền bồi dưỡng',
      'Lưu trữ hồ sơ năng lực số cá nhân',
    ],
  },
  LEARNER_PLUS: {
    name: 'Gói Tiêu Chuẩn',
    badge: 'PHỔ BIẾN NHẤT',
    desc: 'Mở khóa trọn vẹn 5 miền bồi dưỡng và cấp chứng chỉ số.',
    isPopular: true,
    trialTag: 'TẶNG 30 NGÀY DÙNG THỬ',
    monthlyPrice: 49000,
    yearlyPrice: 468000,
    yearlyMonthlyEquivalent: 39000,
    creditsMonthly: 100,
    features: [
      'Mở trọn vẹn 5 miền & 21 trạm bồi dưỡng',
      'Tối đa 10 nhóm lớp (100 học viên/nhóm)',
      '100 AI credits / tháng',
      'Chứng chỉ số',
      'Lộ trình học tập cá nhân hóa',
    ],
  },
  LEARNER_PRO: {
    name: 'Gói Nâng Cao',
    badge: 'TOÀN DIỆN',
    desc: 'Dành cho cá nhân bồi dưỡng chuyên sâu và tổ chức thi trực tiếp.',
    monthlyPrice: 149000,
    yearlyPrice: 1428000,
    yearlyMonthlyEquivalent: 119000,
    creditsMonthly: 500,
    features: [
      'Toàn bộ quyền lợi gói Tiêu Chuẩn',
      'Không giới hạn nhóm lớp (500 học viên/nhóm)',
      '500 AI credits / tháng',
      'Mở phòng thi trực tiếp mã PIN thời gian thực',
      'Xuất bảng điểm Excel, CSV & dữ liệu nghiên cứu',
    ],
  },
};

interface PaymentHistoryItem {
  id: string;
  plan_code: string;
  amount: number;
  currency: string;
  transaction_reference: string;
  status: string;
  created_at: string;
  verified_at?: string | null;
}

export default function LearnerBillingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [currentPlanCode, setCurrentPlanCode] = useState<string>('LEARNER_FREE');
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [loadingPlanCode, setLoadingPlanCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [transactions, setTransactions] = useState<PaymentHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchData = async () => {
    try {
      const [plansRes, profileRes, historyRes] = await Promise.all([
        fetch('/api/plans?role=LEARNER'),
        fetch('/api/personal/profile'),
        fetch('/api/personal/billing/history'),
      ]);

      if (plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData.plans || []);
      }

      if (historyRes.ok) {
        const hData = await historyRes.json();
        setTransactions(hData.transactions || []);
      }
      setLoadingHistory(false);

      if (profileRes.ok) {
        const prData = await profileRes.json();
        const details = prData.profile?.planDetails || prData.data?.planDetails;
        if (details) {
          setPlanDetails(details);
          setCurrentPlanCode(details.planCode);
          setCredits(details.credits);
        } else {
          const rawCode = prData.profile?.plan_tier || prData.data?.plan_tier;
          if (rawCode) setCurrentPlanCode(rawCode);
          const rawCreds = prData.profile?.credits ?? prData.data?.credits;
          if (rawCreds !== undefined) setCredits(rawCreds);
        }
      }
    } catch (e) {
      console.error('Failed to load learner plans', e);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenUpgrade = (planCode: string) => {
    // Chuẩn SaaS: Không tạo đơn ngay tại trang bảng giá
    // Chuyển sang trang Checkout để người dùng xem lại chi tiết và xác nhận đơn hàng
    router.push(`/personal/checkout?plan=${planCode}&cycle=${frequency}`);
  };

  // Danh sách các gói hiển thị: ưu tiên từ DB, nếu DB chưa nạp đủ thì dùng bộ mã chuẩn
  const displayPlans = plans.length > 0
    ? plans
    : [
        { id: '1', code: 'LEARNER_FREE', name: 'Gói Cơ Bản', description: '', price_vnd: 0, credits_included: 10, features: [] },
        { id: '2', code: 'LEARNER_PLUS', name: 'Gói Tiêu Chuẩn', description: '', price_vnd: 49000, credits_included: 100, features: [] },
        { id: '3', code: 'LEARNER_PRO', name: 'Gói Nâng Cao', description: '', price_vnd: 149000, credits_included: 500, features: [] },
      ];

  // Helper tìm tên gói hiện tại thân thiện
  const getCurrentPlanDisplayName = () => {
    if (planDetails?.planName) return planDetails.planName;
    if (currentPlanCode === 'LEARNER_FREE' || currentPlanCode === 'FREE') return 'Gói Cơ Bản';
    if (currentPlanCode === 'LEARNER_PLUS' || currentPlanCode === 'PLUS') return 'Gói Tiêu Chuẩn';
    if (currentPlanCode === 'LEARNER_PRO' || currentPlanCode === 'PRO') return 'Gói Nâng Cao';
    return currentPlanCode;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* 1. Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
            TÀI KHOẢN &amp; HẠN MỨC
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Biểu Phí &amp; Gói Dịch Vụ Cá Nhân
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
          Tùy chọn gói dịch vụ phù hợp để mở khóa toàn diện 5 miền năng lực số, nhận chứng chỉ số có mã QR và nâng cấp AI credits cho lộ trình cá nhân.
        </p>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Current Subscription Status Card */}
      <div className="p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">
            Gói tài khoản đang kích hoạt
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {getCurrentPlanDisplayName()}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Đang hoạt động
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-neutral-400 mt-1">
            <span>
              Số dư AI credits khả dụng:{' '}
              <strong className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                {credits} credits
              </strong>
            </span>
            {planDetails?.expiresAt && (
              <span>
                • Hạn dùng đến:{' '}
                <strong className="font-mono font-semibold text-neutral-800 dark:text-zinc-200">
                  {new Date(planDetails.expiresAt).toLocaleDateString('vi-VN')}
                </strong>
              </span>
            )}
          </div>
        </div>

        {currentPlanCode !== 'LEARNER_PRO' && currentPlanCode !== 'PRO' && (
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('pricing-cards-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <span>Nâng cấp quyền lợi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3. Monthly / Yearly Frequency Switcher */}
      <div id="pricing-cards-section" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Chọn gói bồi dưỡng cá nhân
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Linh hoạt chuyển đổi hoặc gia hạn gói bất kỳ lúc nào.
          </p>
        </div>

        {/* Toggle Pill Button */}
        <div className="inline-flex items-center p-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFrequency('monthly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
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
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              frequency === 'yearly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>Theo năm</span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
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

      {/* 4. 3-Column Plan Cards Grid (Form chuẩn giống Landing Page) */}
      {isLoadingPlans ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-6 overflow-visible">
          {displayPlans.map((p) => {
            const config = PLAN_CONFIG[p.code] || {
              name: p.name,
              badge: 'GÓI DỊCH VỤ',
              desc: p.description,
              isPopular: false,
              monthlyPrice: p.price_vnd,
              yearlyPrice: p.price_vnd * 10,
              yearlyMonthlyEquivalent: Math.round((p.price_vnd * 10) / 12),
              creditsMonthly: p.credits_included,
              features: Array.isArray(p.features) ? p.features : [],
            };

            const isCurrent =
              currentPlanCode === p.code ||
              (currentPlanCode === 'FREE' && p.code === 'LEARNER_FREE') ||
              (currentPlanCode === 'PLUS' && p.code === 'LEARNER_PLUS') ||
              (currentPlanCode === 'PRO' && p.code === 'LEARNER_PRO');

            const isFree = config.monthlyPrice === 0;
            const isLoadingThis = loadingPlanCode === p.code;
            const isPopular = config.isPopular;

            return (
              <div
                key={p.id || p.code}
                className={`relative rounded-3xl bg-white dark:bg-[#111114] border flex flex-col justify-between transition-all duration-200 ${
                  isPopular
                    ? 'border-2 border-blue-600 dark:border-blue-500 shadow-xl ring-1 ring-blue-600/20'
                    : 'border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs'
                }`}
              >
                {/* Popular Highlight Tag on top */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-max px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold tracking-wide shadow-sm flex items-center gap-1.5 whitespace-nowrap z-20 select-none">
                    <Sparkles className="w-3.5 h-3.5 fill-current text-blue-200 shrink-0" />
                    <span>{config.trialTag || 'KHUYÊN DÙNG NHẤT'}</span>
                  </div>
                )}

                <div className={`p-6 sm:p-7 flex-1 flex flex-col ${isPopular ? 'pt-8' : ''}`}>
                  {/* Badge & Current Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[11px] font-extrabold uppercase tracking-wider ${
                        isPopular
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-500 dark:text-neutral-400'
                      }`}
                    >
                      {config.badge}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Gói hiện tại
                      </span>
                    )}
                  </div>

                  {/* Plan Name & Desc */}
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                    {config.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 min-h-[36px] leading-relaxed">
                    {config.desc}
                  </p>

                  {/* Price Block */}
                  <div className="py-4 my-2">
                    {isFree ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                          0đ
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
                          / vĩnh viễn
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                            {frequency === 'monthly'
                              ? `${config.monthlyPrice.toLocaleString('vi-VN')} đ`
                              : `${config.yearlyMonthlyEquivalent.toLocaleString('vi-VN')} đ`}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
                            / tháng
                          </span>
                        </div>
                        {frequency === 'yearly' && (
                          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            Thanh toán {config.yearlyPrice.toLocaleString('vi-VN')} đ / năm
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist (Súc tích, không thừa chữ) */}
                  <div className="space-y-3 flex-1 pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                      Tính năng bao gồm:
                    </div>
                    {config.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isPopular
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                          strokeWidth={2}
                        />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom CTA Action Button */}
                <div className="p-6 pt-0">
                  {isCurrent && !isFree ? (
                    <button
                      type="button"
                      onClick={() => handleOpenUpgrade(p.code)}
                      disabled={Boolean(loadingPlanCode)}
                      className="w-full py-3 px-5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                    >
                      {isLoadingThis ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang tạo giao dịch...</span>
                        </>
                      ) : (
                        <>
                          <span>Gia hạn gói</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  ) : isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 px-5 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-neutral-500 cursor-default text-center"
                    >
                      Gói đang kích hoạt
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenUpgrade(p.code)}
                      disabled={Boolean(loadingPlanCode)}
                      className={`w-full py-3 px-5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98] whitespace-nowrap ${
                        isPopular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      {isLoadingThis ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang xử lý...</span>
                        </>
                      ) : (
                        <>
                          <span>{isFree ? 'Chuyển sang gói này' : isPopular ? 'Dùng thử ngay' : 'Nâng cấp ngay'}</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Lịch sử giao dịch & Hóa đơn */}
      <div className="space-y-3 pt-2">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Lịch sử giao dịch &amp; Hóa đơn
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Theo dõi chi tiết các lượt đăng ký, nâng cấp và gia hạn dịch vụ của tài khoản.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] overflow-hidden shadow-xs">
          {loadingHistory ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-neutral-500">
              Đang tải lịch sử thanh toán...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-neutral-400">
              Chưa có giao dịch phát sinh nào trên tài khoản này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-zinc-900/60 text-slate-500 dark:text-neutral-400 font-medium">
                    <th className="p-4 pl-6">Mã giao dịch</th>
                    <th className="p-4">Gói dịch vụ</th>
                    <th className="p-4">Số tiền</th>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4 pr-6 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isSuccess = tx.status === 'SUCCESS';
                    const isPending = tx.status === 'PENDING';
                    const planName =
                      tx.plan_code === 'LEARNER_PRO' || tx.plan_code === 'PRO'
                        ? 'Gói Nâng Cao'
                        : tx.plan_code === 'LEARNER_PLUS' || tx.plan_code === 'PLUS'
                        ? 'Gói Tiêu Chuẩn'
                        : tx.plan_code;

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="p-4 pl-6 font-mono font-medium text-neutral-800 dark:text-zinc-200">
                          {tx.transaction_reference}
                        </td>
                        <td className="p-4 font-semibold text-neutral-900 dark:text-neutral-100">
                          {planName}
                        </td>
                        <td className="p-4 font-mono font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                          {Number(tx.amount || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-4 font-mono text-slate-500 dark:text-neutral-400">
                          {new Date(tx.created_at).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                              isSuccess
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : isPending
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400'
                            }`}
                          >
                            {isSuccess ? 'Thành công' : isPending ? 'Chờ thanh toán' : tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 6. Organization B2B Banner (Trường học & Doanh nghiệp) */}
      <div className="relative rounded-3xl bg-slate-900 text-white p-7 sm:p-9 shadow-md overflow-hidden">
        {/* Ambient subtle glow decor */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-mono font-bold tracking-wider uppercase border border-white/15">
              <Building2 className="w-3.5 h-3.5 text-blue-300" />
              <span>DÀNH CHO TỔ CHỨC &amp; TRƯỜNG HỌC</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Bạn đang đại diện cho Trường học hoặc Doanh nghiệp?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              NEXA cung cấp giải pháp khảo thí năng lực số diện rộng cho toàn trường, hội đồng chấm tập trung, tích hợp đăng nhập SSO/LMS và cấp chứng chỉ số đồng thương hiệu.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Khảo thí diện rộng theo đợt (Campaigns)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Bàn chấm hội đồng tập trung &amp; chấm chéo</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Báo cáo độ trưởng thành số cấp đơn vị</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Chứng chỉ số gắn Logo thương hiệu riêng</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 lg:self-center">
            <button
              type="button"
              onClick={() => setShowEnterpriseModal(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              <span>Liên hệ tư vấn B2B</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Inquiry B2B */}
      <EnterpriseContactModal
        isOpen={showEnterpriseModal}
        onClose={() => setShowEnterpriseModal(false)}
      />
    </div>
  );
}
