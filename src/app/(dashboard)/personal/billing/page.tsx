'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

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

export default function LearnerBillingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [currentPlanCode, setCurrentPlanCode] = useState<string>('LEARNER_FREE');
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [loadingPlanCode, setLoadingPlanCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [plansRes, profileRes] = await Promise.all([
        fetch('/api/plans?role=LEARNER'),
        fetch('/api/personal/profile'),
      ]);

      if (plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData.plans || []);
      }

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

  const handleOpenUpgrade = async (planCode: string) => {
    setLoadingPlanCode(planCode);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/billing/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo phiên thanh toán');
      }

      const orderKey = data.intent?.orderCode || data.intent?.transactionId;
      if (orderKey) {
        router.push(`/personal/checkout/${orderKey}`);
      } else {
        throw new Error('Dữ liệu phiên thanh toán không hợp lệ');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo đơn hàng');
      setLoadingPlanCode(null);
    }
  };

  return (
    <div className="max-w-6xl space-y-8 pb-16">
      {/* Page Header */}
      <div className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            TÀI KHOẢN &amp; HẠN MỨC
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Gói Dịch Vụ &amp; Thanh Toán Cá Nhân
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Quản lý gói tài khoản người học, nhận chứng chỉ số có mã QR tra cứu và nâng cấp AI credits cho lộ trình cá nhân.
        </p>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Current Subscription Status */}
      <div className="p-6 rounded-md border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-slate-500">Gói tài khoản hiện tại</div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              {planDetails?.planName || currentPlanCode}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              Đang hoạt động
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
            <span>
              Số dư AI credits khả dụng:{' '}
              <span className="font-mono font-bold text-slate-800">{credits} credits</span>
            </span>
            {planDetails?.expiresAt && (
              <span>
                &bull; Hạn dùng đến: <span className="font-mono font-semibold text-slate-800">{new Date(planDetails.expiresAt).toLocaleDateString('vi-VN')}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Plans Grid from Database */}
      {isLoadingPlans ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent =
              currentPlanCode === p.code ||
              (currentPlanCode === 'FREE' && p.code === 'LEARNER_FREE') ||
              (currentPlanCode === 'PRO' && p.code === 'LEARNER_PRO');
            const isFree = p.price_vnd === 0;
            const isLoadingThis = loadingPlanCode === p.code;

            return (
              <div
                key={p.id}
                className={`flex flex-col justify-between rounded-md border p-6 transition-all duration-200 ${
                  isCurrent
                    ? 'border-sky-600 bg-sky-50/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {p.code}
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-sky-600 text-white rounded">
                        Gói hiện tại
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px] leading-relaxed">
                    {p.description}
                  </p>

                  <div className="my-5 pb-5 border-b border-slate-200">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                        {isFree ? 'Miễn phí' : `${p.price_vnd.toLocaleString('vi-VN')} đ`}
                      </span>
                      {!isFree && (
                        <span className="text-xs text-slate-500">/ tháng</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                      <span>Bao gồm:</span>
                      <strong className="font-mono text-slate-800">
                        {p.credits_included} AI credits
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Quyền lợi bao gồm
                    </div>
                    {Array.isArray(p.features) &&
                      p.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <Check className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" strokeWidth={2} />
                          <span>{feat}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 rounded-md text-xs font-semibold bg-slate-100 text-slate-500 cursor-default"
                    >
                      Đang sử dụng
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenUpgrade(p.code)}
                      disabled={Boolean(loadingPlanCode)}
                      className="w-full py-2.5 px-4 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isLoadingThis ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang khởi tạo...</span>
                        </>
                      ) : (
                        <>
                          <span>{isFree ? 'Chuyển sang gói này' : 'Nâng cấp ngay'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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
    </div>
  );
}
