'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';

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
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="bg-white rounded-md border border-slate-200 shadow-xs p-6 md:p-8 text-center space-y-6">
        {loading ? (
          <div className="space-y-4 py-8">
            <Loader2 className="w-10 h-10 animate-spin text-sky-600 mx-auto" strokeWidth={1.75} />
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Đang xác thực thanh toán từ payOS...
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Hệ thống đang đối soát chữ ký số và cập nhật gói dịch vụ. Vui lòng giữ màn hình trong giây lát.
              </p>
            </div>
            {orderCode && (
              <div className="inline-block px-3 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
                Mã đơn hàng: #{orderCode}
              </div>
            )}
          </div>
        ) : txStatus === 'SUCCESS' ? (
          <div className="space-y-5 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" strokeWidth={1.75} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Giao dịch thành công
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Nâng Cấp Gói Dịch Vụ Hoàn Tất
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Hệ thống đã nhận được khoản thanh toán qua payOS và tự động kích hoạt tài khoản của bạn cùng hạn mức AI credits tương ứng.
              </p>
            </div>

            <div className="p-4 rounded-md bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              {orderCode && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã đơn hàng payOS:</span>
                  <span className="font-mono font-semibold text-slate-900">#{orderCode}</span>
                </div>
              )}
              {planCode && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Gói kích hoạt:</span>
                  <span className="font-mono font-semibold text-sky-700">{planCode}</span>
                </div>
              )}
              {amount !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tiền:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {amount.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200/80">
                <span className="text-slate-500">Cổng thanh toán:</span>
                <span className="font-medium text-slate-700">payOS (VietQR NAPAS 24/7)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                href="/personal/dashboard"
                className="w-full sm:flex-1 py-2.5 px-4 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span>Vào Bảng điều khiển</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </Link>
              <Link
                href="/personal/billing"
                className="w-full sm:w-auto py-2.5 px-4 rounded-md text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Xem chi tiết gói
              </Link>
            </div>
          </div>
        ) : txStatus === 'CANCELLED' ? (
          <div className="space-y-5 py-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" strokeWidth={1.75} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                Giao dịch đã hủy
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Thanh Toán Không Thành Công
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Phiên thanh toán đã bị hủy hoặc chưa hoàn tất trên cổng payOS. Bạn chưa bị trừ tiền.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                href="/personal/billing"
                className="w-full sm:flex-1 py-2.5 px-4 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
                <span>Thử thanh toán lại</span>
              </Link>
              <Link
                href="/personal/dashboard"
                className="w-full sm:w-auto py-2.5 px-4 rounded-md text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Về Bảng điều khiển
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Đang chờ ghi nhận thanh toán
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Nếu bạn vừa chuyển khoản thành công trên app ngân hàng, payOS sẽ gửi thông báo trong 30-60 giây. Bạn có thể nhấn kiểm tra lại hoặc kiểm tra số dư credits tại trang cá nhân.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => router.refresh()}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
                <span>Kiểm tra lại</span>
              </button>
              <Link
                href="/personal/billing"
                className="w-full sm:w-auto py-2.5 px-4 rounded-md text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Quay về trang Gói
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BillingResultPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      }
    >
      <BillingResultContent />
    </Suspense>
  );
}
