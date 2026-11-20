'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  QrCode,
  Copy,
  Check,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Clock,
  AlertCircle,
  Building2,
  RotateCcw,
  Download,
  Tag,
  X,
  Sparkles,
} from 'lucide-react';

interface PlanPreviewData {
  id: string;
  code: string;
  name: string;
  description: string;
  baseMonthlyPrice: number;
  amount: number;
  monthlyEquivalent: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  durationDays: number;
  discountPercent: number;
  creditsIncluded: number;
  features: string[];
  isTrialEligible?: boolean;
  trialDays?: number;
  trialDiscount?: number;
  badge?: string | null;
}

interface CheckoutTransaction {
  id: string;
  transactionId: string;
  referenceCode: string;
  orderCode?: number;
  amount: number;
  currency: string;
  planCode: string;
  planName: string;
  status: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  qrCodeUrl: string;
  transferContent: string;
  createdAt: string;
}

const VIETQR_BANK_MAP: Record<string, { shortName: string; fullName: string }> = {
  '970418': { shortName: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  '970415': { shortName: 'VietinBank', fullName: 'Ngân hàng TMCP Công thương Việt Nam' },
  '970436': { shortName: 'Vietcombank', fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam' },
  '970422': { shortName: 'MBBank', fullName: 'Ngân hàng TMCP Quân đội' },
  '970407': { shortName: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
  '970423': { shortName: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong' },
  '970432': { shortName: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  '970416': { shortName: 'ACB', fullName: 'Ngân hàng TMCP Á Châu' },
  '970405': { shortName: 'Agribank', fullName: 'Ngân hàng Nông nghiệp & PTNT Việt Nam' },
};

function resolveBankInfo(rawBankName?: string): { shortName: string; fullName: string } {
  if (!rawBankName) {
    return { shortName: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' };
  }
  const binMatch = rawBankName.match(/\d{6}/)?.[0];
  if (binMatch && VIETQR_BANK_MAP[binMatch]) {
    return VIETQR_BANK_MAP[binMatch];
  }
  for (const info of Object.values(VIETQR_BANK_MAP)) {
    if (rawBankName.toUpperCase().includes(info.shortName.toUpperCase())) {
      return info;
    }
  }
  return { shortName: rawBankName, fullName: 'Ngân hàng chuyển khoản liên ngân hàng 24/7' };
}

function CheckoutClientContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Params
  const queryOrderId = searchParams.get('orderId') || '';
  const initialPlan = searchParams.get('plan') || 'LEARNER_PLUS';
  const initialCycle = (searchParams.get('cycle') || 'monthly') as 'monthly' | 'yearly';

  // Navigation Steps: 'REVIEW' (Bước 1: Xác nhận) -> 'PAYMENT' (Bước 2: Quét mã QR)
  const [step, setStep] = useState<'REVIEW' | 'PAYMENT'>(queryOrderId ? 'PAYMENT' : 'REVIEW');

  // Step 1: Order Review State
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>(initialPlan);
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>(initialCycle);
  const [planPreview, setPlanPreview] = useState<PlanPreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(!queryOrderId);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Coupon State
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
    message: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState<boolean>(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Step 2: Payment & QR State
  const [activeOrderId, setActiveOrderId] = useState<string>(queryOrderId);
  const [transaction, setTransaction] = useState<CheckoutTransaction | null>(null);
  const [loadingTx, setLoadingTx] = useState<boolean>(Boolean(queryOrderId));
  const [txError, setTxError] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState<boolean>(false);
  const [renderedQrDataUrl, setRenderedQrDataUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCheckingManual, setIsCheckingManual] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Plan Preview Data từ backend (Đảm bảo giá 100% từ backend)
  useEffect(() => {
    if (step === 'PAYMENT' && activeOrderId) return;

    let isCancelled = false;
    async function fetchPreview() {
      setLoadingPreview(true);
      setPreviewError(null);
      try {
        const res = await fetch(`/api/billing/preview?plan=${selectedPlanCode}&cycle=${selectedCycle}`);
        const data = await res.json();
        if (!res.ok || !data.plan) {
          throw new Error(data.error || 'Không thể tải thông tin gói dịch vụ');
        }
        if (!isCancelled) {
          setPlanPreview(data.plan);
          // Reset coupon khi đổi chu kỳ hoặc gói
          setAppliedCoupon(null);
          setCouponError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setPreviewError(err instanceof Error ? err.message : 'Lỗi tải thông tin');
        }
      } finally {
        if (!isCancelled) setLoadingPreview(false);
      }
    }

    fetchPreview();
    return () => {
      isCancelled = true;
    };
  }, [selectedPlanCode, selectedCycle, step, activeOrderId]);

  // Áp dụng mã giảm giá
  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !planPreview) return;
    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch('/api/billing/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          amount: planPreview.amount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Mã giảm giá không hợp lệ');
      }

      setAppliedCoupon(data.data);
      setCouponInput('');
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Mã giảm giá không hợp lệ');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // 2. Fetch Transaction Status khi đã có activeOrderId
  const fetchTxStatus = useCallback(
    async (isManual = false) => {
      if (!activeOrderId) return;
      if (isManual) setIsCheckingManual(true);
      try {
        const res = await fetch(`/api/billing/status?orderId=${activeOrderId}`);
        const data = await res.json();

        if (!res.ok || !data.transaction) {
          if (!transaction) {
            setTxError(data.error || 'Không tìm thấy thông tin đơn hàng');
          }
          return;
        }

        const tx: CheckoutTransaction = data.transaction;
        setTransaction(tx);
        setTxError(null);

        // Kích hoạt thành công: Tự động chuyển trang kết quả
        if (tx.status === 'SUCCESS') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          router.push(`/personal/billing/result?orderCode=${tx.orderCode || tx.referenceCode || activeOrderId}&status=success`);
        }
      } catch (err) {
        if (!transaction) {
          setTxError(err instanceof Error ? err.message : 'Lỗi kết nối đối soát');
        }
      } finally {
        setLoadingTx(false);
        if (isManual) setIsCheckingManual(false);
      }
    },
    [activeOrderId, router, transaction]
  );

  // Sinh ảnh QR sắc nét từ chuỗi EMVCo của payOS
  useEffect(() => {
    if (!transaction) return;

    const rawQr = transaction.qrCodeUrl;
    if (rawQr && (rawQr.startsWith('data:image') || rawQr.startsWith('http://') || rawQr.startsWith('https://'))) {
      setRenderedQrDataUrl(rawQr);
      return;
    }

    if (rawQr && rawQr.trim().length > 0) {
      QRCode.toDataURL(rawQr, {
        width: 380,
        margin: 1,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
      })
        .then((url) => setRenderedQrDataUrl(url))
        .catch(() => {
          const binMatch = transaction.bankName?.match(/\d{6}/)?.[0] || '970418';
          const fallbackUrl = `https://img.vietqr.io/image/${binMatch}-${transaction.accountNumber}-compact2.png?amount=${transaction.amount}&addInfo=${encodeURIComponent(transaction.transferContent)}&accountName=${encodeURIComponent(transaction.accountName)}`;
          setRenderedQrDataUrl(fallbackUrl);
        });
    } else if (transaction.accountNumber) {
      const binMatch = transaction.bankName?.match(/\d{6}/)?.[0] || '970418';
      const fallbackUrl = `https://img.vietqr.io/image/${binMatch}-${transaction.accountNumber}-compact2.png?amount=${transaction.amount}&addInfo=${encodeURIComponent(transaction.transferContent)}&accountName=${encodeURIComponent(transaction.accountName)}`;
      setRenderedQrDataUrl(fallbackUrl);
    }
  }, [transaction]);

  // Polling đối soát mỗi 3 giây khi ở bước PAYMENT
  useEffect(() => {
    if (step !== 'PAYMENT' || !activeOrderId) return;

    fetchTxStatus();
    pollIntervalRef.current = setInterval(() => {
      fetchTxStatus();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [step, activeOrderId, fetchTxStatus]);

  // Countdown timer 15 phút
  useEffect(() => {
    if (step !== 'PAYMENT') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Hành động: Người dùng xác nhận đơn hàng ở Bước 1 -> Mới gọi API tạo đơn
  const handleConfirmAndCreatePayment = async () => {
    if (!planPreview) return;
    setIsCreatingIntent(true);
    setTxError(null);

    try {
      // Đơn hàng dùng thử 0đ hoặc được miễn phí hoàn toàn
      if (payableAmount === 0 || planPreview.isTrialEligible) {
        const res = await fetch('/api/billing/confirm-trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planCode: planPreview.code,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Không thể kích hoạt dùng thử');
        }

        router.push(`/personal/billing/result?orderCode=${data.subscription?.id || 'TRIAL'}&status=success`);
        return;
      }

      const res = await fetch('/api/billing/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: planPreview.code,
          billingCycle: planPreview.billingCycle,
          couponCode: appliedCoupon?.code,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.intent) {
        throw new Error(data.error || 'Không thể khởi tạo đơn hàng thanh toán');
      }

      const newTxId = data.intent.transactionId || String(data.intent.orderCode);
      setActiveOrderId(newTxId);
      setStep('PAYMENT');
      setTimeLeft(15 * 60);

      // Cập nhật URL tránh tạo đơn trùng khi người dùng F5 refresh trang
      window.history.replaceState(null, '', `/personal/checkout?orderId=${newTxId}`);
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Lỗi khởi tạo thanh toán');
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Tải ảnh mã QR về máy
  const handleDownloadQrImage = () => {
    if (!renderedQrDataUrl) return;
    const link = document.createElement('a');
    link.href = renderedQrDataUrl;
    link.download = `vietqr-${transaction?.referenceCode || 'nexa'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const bankInfo = resolveBankInfo(transaction?.bankName);
  const cleanTransferContent = (transaction?.transferContent || '')
    .replace(/\bNEXA\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Tính số tiền thực thanh toán sau khi giảm giá (nếu có)
  const payableAmount = appliedCoupon
    ? appliedCoupon.finalAmount
    : planPreview?.amount || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* 1. Header & Stepper Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/personal/billing"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Quay lại Biểu phí và Gói dịch vụ</span>
        </Link>

        {/* 2-Step Interactive Breadcrumb Pill */}
        <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 text-xs font-mono select-none self-start sm:self-auto">
          <div
            className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
              step === 'REVIEW'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-500 dark:text-neutral-400 font-medium'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Xác nhận đơn</span>
          </div>
          <div
            className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
              step === 'PAYMENT'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 dark:text-neutral-500 font-medium'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Thanh toán VietQR</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BƯỚC 1: XÁC NHẬN ĐƠN HÀNG & MÃ GIẢM GIÁ (ORDER REVIEW - TINH GỌN, KHÔNG TEXT DƯ) */}
      {/* ========================================================================= */}
      {step === 'REVIEW' && (
        <div className="space-y-6">
          {previewError ? (
            <div className="p-8 text-center bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 rounded-3xl space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {previewError}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPlanCode('LEARNER_PLUS')}
                className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                Chọn lại gói Tiêu Chuẩn
              </button>
            </div>
          ) : loadingPreview || !planPreview ? (
            <div className="p-16 text-center bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 rounded-3xl space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Đang tải chi tiết đơn hàng...</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs max-w-2xl mx-auto">
              {/* Header Gói */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono uppercase tracking-wider">
                    GÓI DỊCH VỤ ĐÃ CHỌN
                  </span>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                    {planPreview.name}
                  </h2>
                </div>

                {/* Chu kỳ Switcher */}
                <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedCycle('monthly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedCycle === 'monthly'
                        ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Hàng tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCycle('yearly')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedCycle === 'yearly'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <span>1 Năm</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      -20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Chi tiết thanh toán & Bảng giá */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
                  <span>Thời hạn kích hoạt:</span>
                  <strong className="text-neutral-800 dark:text-zinc-200 font-mono">
                    {planPreview.billingCycle === 'yearly' ? '12 tháng (365 ngày)' : '1 tháng (30 ngày)'}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
                  <span>Đơn giá niêm yết:</span>
                  <span className="font-mono text-neutral-800 dark:text-zinc-200">
                    {planPreview.amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {/* Dòng ưu đãi dùng thử tháng đầu tiên nếu đủ điều kiện */}
                {planPreview.isTrialEligible && (
                  <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ưu đãi dùng thử tháng đầu ({planPreview.trialDays || 30} ngày):</span>
                    </span>
                    <span className="font-mono font-bold">
                      -{(planPreview.trialDiscount || 49000).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}

                {/* Dòng giảm giá nếu có coupon */}
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Mã giảm giá ({appliedCoupon.code}):</span>
                    </span>
                    <span className="font-mono font-bold">
                      -{appliedCoupon.discountAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}

                {/* Tổng thanh toán */}
                <div className="pt-2 flex items-baseline justify-between border-slate-200/60 dark:border-zinc-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 font-mono">
                    TỔNG THANH TOÁN
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                    {payableAmount.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              {/* Ô nhập mã giảm giá */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-neutral-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mã ưu đãi / Mã giảm giá:</span>
                </span>

                {appliedCoupon ? (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
                      <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                        Đã áp dụng mã <strong>{appliedCoupon.code}</strong> (giảm {appliedCoupon.discountAmount.toLocaleString('vi-VN')} đ)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="p-1 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer"
                      title="Gỡ mã giảm giá"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Nhập mã giảm giá (ví dụ: NEXA20)"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono uppercase text-neutral-900 dark:text-neutral-100 placeholder:normal-case placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {couponLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    {couponError}
                  </p>
                )}
              </div>

              {/* Nút CTA chuyển sang Bước 2 */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmAndCreatePayment}
                  disabled={isCreatingIntent}
                  className="w-full py-3.5 px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isCreatingIntent ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{payableAmount === 0 ? 'Đang kích hoạt gói dùng thử...' : 'Đang khởi tạo mã thanh toán...'}</span>
                    </>
                  ) : payableAmount === 0 ? (
                    <>
                      <span>Xác nhận dùng thử 30 ngày (0đ)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Xác nhận và Tạo mã thanh toán</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* BƯỚC 2: THANH TOÁN VIETQR (TINH GỌN, CÓ NÚT TẢI MÃ QR, KHÔNG LINK PAYOS)   */}
      {/* ========================================================================= */}
      {step === 'PAYMENT' && (
        <div className="space-y-6">
          {/* Header Action & Countdown Bar */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('REVIEW')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Xem lại thông tin đơn hàng</span>
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-mono font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
              <span>Hết hạn trong: {formatCountdown(timeLeft)}</span>
            </div>
          </div>

          {loadingTx && !transaction ? (
            <div className="p-16 text-center bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 rounded-3xl space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs text-slate-500">Đang chuẩn bị mã QR thanh toán...</p>
            </div>
          ) : txError && !transaction ? (
            <div className="p-8 text-center bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 rounded-3xl space-y-4">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{txError}</h3>
              <button
                type="button"
                onClick={() => setStep('REVIEW')}
                className="px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tạo lại đơn hàng mới</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: VietQR Code Box */}
              <div className="md:col-span-5 bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-4 text-center shadow-xs">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold">
                    <QrCode className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>VIETQR NAPAS 24/7</span>
                  </div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Quét mã chuyển khoản
                  </h2>
                </div>

                {/* QR Image Container (Sắc nét) */}
                <div className="relative mx-auto w-64 h-64 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3 bg-white flex items-center justify-center shadow-2xs">
                  {renderedQrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={renderedQrDataUrl}
                      alt="Mã QR thanh toán VietQR"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-slate-400 flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" strokeWidth={1.75} />
                      <span>Đang tạo mã QR...</span>
                    </div>
                  )}
                </div>

                {/* Status Chip & Download QR Button */}
                <div className="flex flex-col items-center gap-2 pt-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-600 dark:text-neutral-300">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                    <span>Chờ thanh toán...</span>
                  </div>

                  {/* Nút Tải ảnh mã QR về máy */}
                  {renderedQrDataUrl && (
                    <button
                      type="button"
                      onClick={handleDownloadQrImage}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer mt-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải mã QR về máy</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Order & Transfer Details (Digital Receipt) */}
              <div className="md:col-span-7 space-y-4">
                <div className="bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
                  {/* Header: Plan & Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider font-mono">
                        GÓI DỊCH VỤ
                      </span>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                        {transaction?.planName || 'Gói Dịch Vụ NEXA'}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider font-mono">
                        SỐ TIỀN
                      </span>
                      <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                        {transaction?.amount.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  </div>

                  {/* Transfer Information Breakdown */}
                  <div className="space-y-2.5">
                    {/* Ngân hàng */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-slate-400 dark:text-neutral-500 block">Ngân hàng thụ hưởng</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-mono">
                            {bankInfo.shortName}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-neutral-400 hidden sm:inline">
                            • {bankInfo.fullName}
                          </span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" strokeWidth={1.75} />
                      </div>
                    </div>

                    {/* Số tài khoản */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-slate-400 dark:text-neutral-500 block">
                          Số tài khoản ({bankInfo.shortName})
                        </span>
                        <span className="font-mono font-bold text-base text-neutral-900 dark:text-neutral-100 tracking-wider">
                          {transaction?.accountNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => transaction && copyToClipboard(transaction.accountNumber, 'acc')}
                        className="px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-neutral-800 dark:text-zinc-200 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer text-xs shadow-2xs"
                      >
                        {copiedKey === 'acc' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Chủ tài khoản */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-slate-400 dark:text-neutral-500 block">Tên chủ tài khoản</span>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                          {transaction?.accountName}
                        </span>
                      </div>
                    </div>

                    {/* Nội dung chuyển khoản (Đã bỏ chữ NEXA - chỉ còn mã số) */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 block uppercase tracking-wider">
                          Nội dung chuyển khoản
                        </span>
                        <span className="font-mono font-extrabold text-sm text-blue-950 dark:text-blue-200 tracking-wider">
                          {cleanTransferContent}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(cleanTransferContent, 'content')}
                        className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer text-xs"
                      >
                        {copiedKey === 'content' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                            <span>Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-blue-100" strokeWidth={1.75} />
                            <span>Sao chép mã</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Check Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => fetchTxStatus(true)}
                      disabled={isCheckingManual}
                      className="w-full py-3.5 px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCheckingManual ? 'animate-spin' : ''}`} strokeWidth={2} />
                      <span>{isCheckingManual ? 'Đang kiểm tra...' : 'Tôi đã chuyển tiền xong'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center max-w-xl mx-auto space-y-4">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Đang chuẩn bị trang thanh toán...</p>
        </div>
      }
    >
      <CheckoutClientContent />
    </Suspense>
  );
}
