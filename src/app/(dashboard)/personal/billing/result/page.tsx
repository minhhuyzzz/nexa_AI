'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Award,
  Zap,
} from 'lucide-react';
import { CelebrationCanvas } from '@/components/ui/CelebrationCanvas';

function BillingResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderCode = searchParams.get('orderCode') || searchParams.get('orderId') || searchParams.get('transactionId');
  const urlStatus = searchParams.get('status');

  const [loading, setLoading] = useState(true);
  const [txStatus, setTxStatus] = useState<'PENDING' | 'SUCCESS' | 'CANCELLED' | 'UNKNOWN'>('PENDING');
  const [planCode, setPlanCode] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (urlStatus === 'cancelled') {
      setTxStatus('CANCELLED');
      setLoading(false);
      return;
    }

    if (!orderCode) {
      setTxStatus('UNKNOWN');
      setLoading(false);
      return;
    }

    let isMounted = true;
    let timer: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/billing/status?orderCode=${orderCode}`);
        if (res.ok) {
          const json = await res.json();
          if (json.transaction) {
            if (isMounted) {
              setPlanCode(json.transaction.plan_code);
              setAmount(json.transaction.amount);
            }
            if (json.transaction.status === 'SUCCESS') {
              if (isMounted) {
                setTxStatus('SUCCESS');
                setLoading(false);
              }
              return;
            }
          }
        }
      } catch {
        // Fallback
      }

      if (isMounted && retryCount < 6) {
        setRetryCount((prev) => prev + 1);
        timer = setTimeout(checkStatus, 2500);
      } else if (isMounted) {
        setLoading(false);
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [orderCode, urlStatus, retryCount]);

  return (
    <>
      {txStatus === 'SUCCESS' && <CelebrationCanvas />}

      <div className="max-w-xl mx-auto py-12 px-4 font-sans">
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200/90 dark:border-zinc-800 shadow-xl p-6 sm:p-8 text-center space-y-6">
          {loading ? (
            <div className="space-y-4 py-8">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400 mx-auto" strokeWidth={1.75} />
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Đang xác thực thanh toán từ payOS...
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                  Hệ thống đang đối soát chữ ký số và cập nhật gói dịch vụ. Vui lòng giữ màn hình trong giây lát.
                </p>
              </div>
              {orderCode && (
                <div className="inline-block px-3 py-1 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-600 dark:text-neutral-300">
                  Mã đơn hàng: #{orderCode}
                </div>
              )}
            </div>
          ) : txStatus === 'SUCCESS' ? (
            <div className="space-y-6 py-2">
              {/* Badge & Title */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono tracking-wide shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
                  <span>NEXA PRO VIP • GIAO DỊCH THÀNH CÔNG</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Nâng Cấp Gói Hoàn Tất!
                </h1>

                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                  Khoản thanh toán qua payOS đã được xác nhận. Tài khoản của bạn đã được nâng hạng thành công với toàn bộ đặc quyền cao cấp.
                </p>
              </div>

              {/* Unlocked Perks Grid */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-left space-y-3">
                <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider font-mono">
                  QUYỀN LỢI ĐÃ KÍCH HOẠT
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-2 text-xs">
                    <Award className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
                    <span className="font-semibold text-neutral-800 dark:text-zinc-200">Bài khảo thí không giới hạn</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-2 text-xs">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={1.75} />
                    <span className="font-semibold text-neutral-800 dark:text-zinc-200">Lộ trình AI 5 miền chuyên sâu</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-2 text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
                    <span className="font-semibold text-neutral-800 dark:text-zinc-200">5,000 AI Credits ưu tiên</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-2 text-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
                    <span className="font-semibold text-neutral-800 dark:text-zinc-200">Huy hiệu PRO trên hồ sơ</span>
                  </div>
                </div>
              </div>

              {/* Receipt Details Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-left space-y-2 text-xs">
                {orderCode && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-neutral-400">Mã đơn hàng payOS:</span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">#{orderCode}</span>
                  </div>
                )}
                {planCode && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-neutral-400">Gói kích hoạt:</span>
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{planCode}</span>
                  </div>
                )}
                {amount !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-neutral-400">Số tiền thanh toán:</span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {amount.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-neutral-400">Cổng thanh toán:</span>
                  <span className="font-medium text-slate-700 dark:text-zinc-300">payOS (VietQR NAPAS 24/7)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Link
                  href="/personal/dashboard"
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                  <span>Vào Bảng điều khiển</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </Link>
                <Link
                  href="/personal/billing"
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Xem chi tiết gói
                </Link>
              </div>
            </div>
          ) : txStatus === 'CANCELLED' ? (
            <div className="space-y-5 py-4">
              <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" strokeWidth={1.75} />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                  Giao dịch đã hủy
                </span>
                <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Thanh Toán Không Thành Công
                </h1>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
                  Phiên thanh toán đã bị hủy hoặc chưa hoàn tất trên cổng payOS. Bạn chưa bị trừ tiền.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Link
                  href="/personal/billing"
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
                  <span>Thử thanh toán lại</span>
                </Link>
                <Link
                  href="/personal/dashboard"
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Về Bảng điều khiển
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5 py-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-zinc-700 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Đang chờ ghi nhận thanh toán
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
                  Nếu bạn vừa chuyển khoản thành công trên app ngân hàng, payOS sẽ gửi thông báo trong 30-60 giây. Bạn có thể nhấn kiểm tra lại hoặc kiểm tra số dư credits tại trang cá nhân.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => router.refresh()}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
                  <span>Kiểm tra lại</span>
                </button>
                <Link
                  href="/personal/billing"
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Quay về trang Gói
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function BillingResultPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <BillingResultContent />
    </Suspense>
  );
}
