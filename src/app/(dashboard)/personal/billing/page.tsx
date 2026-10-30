'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Loader2,
  Sparkles,
  ShieldCheck,
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

export default function LearnerBillingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [currentPlanCode, setCurrentPlanCode] = useState<string>('LEARNER_FREE');
  const [credits, setCredits] = useState<number>(0);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [loadingPlanCode, setLoadingPlanCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [plansRes, profileRes] = await Promise.all([
        fetch('/api/plans?role=LEARNER'),
        fetch('/api/profile'),
      ]);

      if (plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData.plans || []);
      }

      if (profileRes.ok) {
        const prData = await profileRes.json();
        if (prData.data?.plan_tier) {
          setCurrentPlanCode(prData.data.plan_tier);
        }
        if (prData.data?.credits !== undefined) {
          setCredits(prData.data.credits);
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
            <h2 className="text-xl font-bold font-mono text-slate-900">
              {currentPlanCode}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              Đang hoạt động
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Số dư AI credits khả dụng:{' '}
            <span className="font-mono font-bold text-slate-800">{credits} credits</span>
          </p>
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
            const isCurrent = currentPlanCode === p.code;
            const isFree = p.price_vnd === 0;
            const isLoadingThis = loadingPlanCode === p.code;

            return (
              <div
                key={p.id}
                className={`p-6 rounded-md border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-sky-500 bg-sky-50/10 shadow-xs ring-1 ring-sky-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-500">{p.description}</p>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-sky-600 text-white shadow-xs">
                        HIỆN TẠI
                      </span>
                    )}
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-bold font-mono text-slate-900">
                      {isFree ? '0 đ' : `${p.price_vnd.toLocaleString('vi-VN')} đ`}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">/ tháng</span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-700 mb-6">
                    {Array.isArray(p.features) &&
                      p.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2.5">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
                          <span>{feat}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                {isFree ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-400 bg-slate-50 cursor-default"
                  >
                    {isCurrent ? 'Gói hiện tại' : 'Gói cơ bản'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenUpgrade(p.code)}
                    disabled={isCurrent || isLoadingThis}
                    className={`w-full py-2.5 rounded-md text-xs font-semibold transition-colors shadow-xs inline-flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-default'
                        : 'bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-60'
                    }`}
                  >
                    {isLoadingThis ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                        <span>Đang chuyển trang thanh toán...</span>
                      </>
                    ) : isCurrent ? (
                      'Đang kích hoạt'
                    ) : (
                      <>
                        <span>Nâng cấp {p.name}</span>
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Security Guarantee Note */}
      <div className="p-4 rounded-md border border-slate-200 bg-white flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" strokeWidth={1.75} />
        <div className="text-xs text-slate-600 space-y-1">
          <span className="font-semibold text-slate-800 block">Thanh toán bảo mật chuẩn Open Banking payOS</span>
          <p className="leading-relaxed">
            Hệ thống áp dụng thanh toán tự động qua mã VietQR chuẩn Napas 24/7. Toàn bộ giao dịch được kiểm tra và kích hoạt tức thì không cần gửi biên lai.
          </p>
        </div>
      </div>
    </div>
  );
}