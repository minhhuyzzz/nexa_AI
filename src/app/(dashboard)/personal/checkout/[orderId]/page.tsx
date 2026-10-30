'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
  Clock,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

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
  checkoutUrl?: string;
  createdAt: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [transaction, setTransaction] = useState<CheckoutTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 minutes in seconds

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async (isManual = false) => {
    if (isManual) setIsChecking(true);
    try {
      const res = await fetch(`/api/billing/status?orderId=${orderId}`);
      const data = await res.json();

      if (!res.ok || !data.transaction) {
        if (!transaction) {
          setError(data.error || 'Không tìm thấy thông tin đơn hàng');
        }
        return;
      }

      const tx: CheckoutTransaction = data.transaction;
      setTransaction(tx);
      setError(null);

      // If already paid, redirect to result page
      if (tx.status === 'SUCCESS') {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        router.push(`/personal/billing/result?orderCode=${tx.orderCode || tx.referenceCode || orderId}&status=success`);
      }
    } catch (err) {
      if (!transaction) {
        setError(err instanceof Error ? err.message : 'Lỗi kết nối kiểm tra thanh toán');
      }
    } finally {
      setLoading(false);
      if (isManual) setIsChecking(false);
    }
  }, [orderId, router, transaction]);

  // Initial load and polling
  useEffect(() => {
    fetchStatus();

    pollIntervalRef.current = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchStatus]);

  // 15-minute countdown
  useEffect(() => {
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
  }, []);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSimulatePayment = async () => {
    if (!transaction) return;
    setIsSimulating(true);
    try {
      const res = await fetch('/api/billing/mock-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceCode: transaction.referenceCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/personal/billing/result?orderCode=${transaction.orderCode || transaction.referenceCode || orderId}&status=success`);
      } else {
        alert(data.error || 'Giả lập thanh toán không thành công');
      }
    } catch {
      alert('Lỗi kết nối tới máy chủ giả lập thanh toán');
    } finally {
      setIsSimulating(false);
    }
  };

  if (loading && !transaction) {
    return (
      <div className="py-24 text-center max-w-xl mx-auto space-y-4">
        <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto" strokeWidth={1.75} />
        <h2 className="text-base font-bold text-slate-800">Đang khởi tạo cổng thanh toán payOS...</h2>
        <p className="text-xs text-slate-500 font-mono">Mã đơn: #{orderId}</p>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4 bg-white border border-slate-200 rounded-md p-8 shadow-xs">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" strokeWidth={1.75} />
        <h2 className="text-base font-bold text-slate-900">Không tìm thấy phiên thanh toán</h2>
        <p className="text-xs text-slate-500">{error}</p>
        <div className="pt-2">
          <Link
            href="/personal/billing"
            className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Quay lại bảng giá</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <Link
          href="/personal/billing"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Hủy &amp; Chọn gói dịch vụ khác</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-semibold">
          <Clock className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
          <span>Hết hạn trong: {formatCountdown(timeLeft)}</span>
        </div>
      </div>

      {/* Main Grid: 2 Columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: VietQR Code Box */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-md p-6 space-y-5 text-center shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full mb-2">
              <QrCode className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
              <span>QUÉT MÃ VIETQR TỰ ĐỘNG</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900">Mã QR Thanh Toán Đơn Hàng</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mở ứng dụng ngân hàng bất kỳ để quét mã VietQR chuẩn NAPAS
            </p>
          </div>

          {/* QR Image Container */}
          <div className="relative mx-auto w-64 h-64 border border-slate-200 rounded-md p-3 bg-white flex items-center justify-center shadow-2xs">
            {transaction?.qrCodeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={transaction.qrCodeUrl}
                alt="VietQR payOS"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-xs text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-slate-400" strokeWidth={1.75} />
                <span>Đang sinh mã QR...</span>
              </div>
            )}
          </div>

          {/* Status Live Indicator */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center gap-2 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Đang lắng nghe chuyển khoản từ ngân hàng...</span>
          </div>

          {/* External payOS Checkout button if provided */}
          {transaction?.checkoutUrl && (
            <a
              href={transaction.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <span>Mở trang thanh toán payOS</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
            </a>
          )}
        </div>

        {/* Right Column: Order & Transfer Details */}
        <div className="md:col-span-7 space-y-5">
          {/* Order Summary Card */}
          <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  THÔNG TIN GÓI NÂNG CẤP
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {transaction?.planName || 'Gói Dịch Vụ NEXA'}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  SỐ TIỀN CẦN THANH TOÁN
                </span>
                <div className="text-2xl font-black font-mono tabular-nums text-slate-900">
                  {transaction?.amount.toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>

            {/* Transfer Information Breakdown */}
            <div className="space-y-3 pt-1">
              <span className="text-xs font-bold text-slate-700 block">
                Thông tin chuyển khoản thủ công (nếu không quét được QR):
              </span>

              {/* Ngân hàng */}
              <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Ngân hàng thụ hưởng</span>
                  <span className="font-semibold text-slate-800">{transaction?.bankName}</span>
                </div>
              </div>

              {/* Số tài khoản */}
              <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Số tài khoản</span>
                  <span className="font-bold text-slate-900 font-mono text-sm tracking-wide">
                    {transaction?.accountNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => transaction && copyToClipboard(transaction.accountNumber, 'acc')}
                  className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  {copiedKey === 'acc' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                      <span className="text-emerald-700">Đã chép</span>
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
              <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Tên chủ tài khoản</span>
                  <span className="font-semibold text-slate-800 uppercase">{transaction?.accountName}</span>
                </div>
              </div>

              {/* Nội dung chuyển khoản (BẮT BUỘC CHÍNH XÁC) */}
              <div className="p-3.5 rounded-md bg-amber-50/60 border border-amber-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide block">
                      Nội dung chuyển khoản (Bắt buộc giữ nguyên)
                    </span>
                    <span className="font-extrabold text-amber-950 font-mono text-sm tracking-wider">
                      {transaction?.transferContent}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => transaction && copyToClipboard(transaction.transferContent, 'content')}
                    className="px-3 py-1.5 rounded bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-semibold inline-flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    {copiedKey === 'content' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                        <span className="text-emerald-700">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-800" strokeWidth={1.75} />
                        <span>Sao chép mã</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Hệ thống đối soát tự động theo mã nội dung trên. Vui lòng không thay đổi hoặc ghi thêm từ ngữ khác để việc kích hoạt diễn ra trong 30 giây.
                </p>
              </div>
            </div>

            {/* Manual Check & Simulating actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => fetchStatus(true)}
                disabled={isChecking}
                className="flex-1 py-2.5 px-4 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`}
                  strokeWidth={1.75}
                />
                <span>{isChecking ? 'Đang kiểm tra...' : 'Tôi đã chuyển tiền xong'}</span>
              </button>

              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="py-2.5 px-3.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                title="Dùng cho môi trường thử nghiệm khi chưa có tiền chuyển thật từ ngân hàng"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
                <span>{isSimulating ? 'Đang xử lý...' : 'Thử nghiệm xác nhận (Test Mode)'}</span>
              </button>
            </div>
          </div>

          {/* Security Guarantee Note */}
          <div className="p-4 rounded-md border border-slate-200 bg-white flex items-start gap-3 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800 block">Thanh toán bảo mật chuẩn Open Banking</span>
              <p className="leading-relaxed">
                Đơn hàng được bảo hộ bởi cổng thanh toán payOS. Hệ thống tự động kích hoạt gói dịch vụ và cấp đầy đủ hạn mức AI ngay khi giao dịch được xác nhận.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}