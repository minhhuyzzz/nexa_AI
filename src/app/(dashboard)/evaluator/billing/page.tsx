'use client';

import { useState, useEffect } from 'react';
import {
  Check,
  QrCode,
  CheckCircle2,
  X,
  Copy,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface ServicePlan {
  id: string;
  code: string;
  name: string;
  description: string;
  price_vnd: number;
  credits_included: number;
  max_members: number;
  features: string[];
}

interface PaymentIntent {
  transactionId: string;
  referenceCode: string;
  amount: number;
  currency: string;
  planCode: string;
  planName: string;
  accountNumber: string;
  bankName: string;
  accountName: string;
  qrCodeUrl: string;
  transferContent: string;
}

export default function EvaluatorBillingPage() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [quota, setQuota] = useState<any>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  const [currentPlanCode, setCurrentPlanCode] = useState<string>('EVALUATOR_PRO');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [activeIntent, setActiveIntent] = useState<PaymentIntent | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [plansRes, quotaRes] = await Promise.all([
        fetch('/api/plans?role=EVALUATOR'),
        fetch('/api/organizations/quota'),
      ]);

      if (plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData.plans || []);
      }

      if (quotaRes.ok) {
        const qData = await quotaRes.json();
        setQuota(qData.quota);
        if (qData.quota?.planCode) {
          setCurrentPlanCode(qData.quota.planCode);
        }
      }
    } catch (e) {
      console.error('Failed to load plans or quota', e);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenUpgrade = async (planCode: string) => {
    setIsCreatingIntent(true);
    setErrorMsg(null);
    setShowQrModal(true);
    setActiveIntent(null);
    setUpgradeSuccess(false);

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

      setActiveIntent(data.intent);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!activeIntent) return;
    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/billing/status?transactionId=${activeIntent.transactionId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Lỗi kiểm tra giao dịch');
      }

      if (data.transaction?.status === 'SUCCESS') {
        setUpgradeSuccess(true);
        setCurrentPlanCode(activeIntent.planCode);
        await fetchData();
        setTimeout(() => {
          setShowQrModal(false);
          setUpgradeSuccess(false);
          setActiveIntent(null);
        }, 2500);
      } else {
        setErrorMsg('Hệ thống chưa nhận được khoản chuyển. Quý khách vui lòng thử lại sau 30-60 giây.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi khi kiểm tra giao dịch');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateWebhook = async () => {
    if (!activeIntent) return;
    setIsSimulatingWebhook(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/webhooks/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceCode: activeIntent.referenceCode,
          content: `Chuyen khoan ${activeIntent.referenceCode}`,
          transferAmount: activeIntent.amount,
          gateway: 'SIMULATOR_TEST',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Giả lập webhook thất bại');
      }

      setUpgradeSuccess(true);
      setCurrentPlanCode(activeIntent.planCode);
      await fetchData();
      setTimeout(() => {
        setShowQrModal(false);
        setUpgradeSuccess(false);
        setActiveIntent(null);
      }, 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi giả lập webhook');
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-8">
      {/* Page Header */}
      <div className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            KHẢO THÍ & HẠN MỨC B2B
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Gói Dịch Vụ Khảo Thí & Hạn Mức Giảng Dạy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Dữ liệu gói đọc động từ máy chủ, kiểm soát hạn mức nhóm lớp, phòng thi trực tiếp và cơ chế thanh toán đối soát qua VietQR.
        </p>
      </div>

      {/* Quota & Resource Usage Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-md border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>AI credits chấm Rubric</span>
            <span className="font-bold text-slate-900">
              {quota ? `${quota.credits.available} / ${quota.credits.includedMonthly}` : '...'}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-sky-600 h-2 rounded-full"
              style={{
                width: quota?.credits.includedMonthly
                  ? `${Math.min(100, Math.round((quota.credits.available / quota.credits.includedMonthly) * 100))}%`
                  : '50%',
              }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            {quota ? `Đã sử dụng ~${quota.credits.estimatedUsed} credits` : 'Đang tải hạn mức...'}
          </div>
        </div>

        <div className="p-5 rounded-md border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Nhóm lớp khảo thí</span>
            <span className="font-bold text-slate-900">
              {quota ? `${quota.classes.current} / ${quota.classes.max === 9999 ? 'Không giới hạn' : quota.classes.max}` : '...'}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full"
              style={{
                width: quota && quota.classes.max < 9999
                  ? `${Math.min(100, (quota.classes.current / quota.classes.max) * 100)}%`
                  : '10%',
              }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            {quota?.members ? `Quy mô hiện tại: ${quota.members.current} thành viên` : 'Quản lý nhóm lớp'}
          </div>
        </div>

        <div className="p-5 rounded-md border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Gói dịch vụ hiện hành</span>
            <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px]">
              {quota?.planName || currentPlanCode}
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-800">
            Đối soát tự động qua Ngân hàng
          </div>
          <div className="text-[11px] text-slate-400">
            Kích hoạt hạn mức tức thì sau khi chuyển khoản
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
            const isCurrent = currentPlanCode === p.code;
            const isFree = p.price_vnd === 0;

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
                    {isCurrent ? 'Gói hiện tại' : 'Gói khởi đầu'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenUpgrade(p.code)}
                    disabled={isCurrent}
                    className={`w-full py-2.5 rounded-md text-xs font-semibold transition-colors shadow-xs ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-default'
                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                    }`}
                  >
                    {isCurrent ? 'Đang kích hoạt' : `Nâng cấp ${p.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Real Payment Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm max-w-md w-full p-6 text-slate-900 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                  <QrCode className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeIntent ? `Gia hạn ${activeIntent.planName}` : 'Khởi tạo phiên thanh toán'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Mã QR đối soát máy chủ tự động NAPAS 24/7</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isCreatingIntent ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto" />
                <p className="text-xs text-slate-500">Đang khởi tạo mã đối soát trên máy chủ...</p>
              </div>
            ) : upgradeSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">
                  Xác thực thanh toán thành công!
                </h4>
                <p className="text-xs text-slate-500">
                  Hạn mức AI credits và các tính năng khảo thí mới đã được cập nhật vào tài khoản của bạn.
                </p>
              </div>
            ) : activeIntent ? (
              <>
                {/* VietQR Image Container */}
                <div className="flex flex-col items-center justify-center p-4 rounded-md bg-slate-50 border border-slate-200">
                  <img
                    src={activeIntent.qrCodeUrl}
                    alt="VietQR Payment Code"
                    className="w-52 h-52 object-contain rounded-md border border-slate-200 bg-white p-2 shadow-xs"
                  />
                  <div className="text-[10px] text-slate-400 mt-2 font-medium">
                    Quét bằng ứng dụng Ngân hàng (VietQR / Mobile Banking)
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    {errorMsg}
                  </div>
                )}

                {/* Transfer Info */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">
                        {activeIntent.accountNumber} ({activeIntent.bankName})
                      </span>
                      <button
                        onClick={() => handleCopy(activeIntent.accountNumber, 'acc')}
                        className="text-sky-600 hover:text-sky-700 text-[11px] font-semibold"
                      >
                        {copiedField === 'acc' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <span className="font-semibold text-slate-800">{activeIntent.accountName}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Số tiền:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-700">
                        {activeIntent.amount.toLocaleString('vi-VN')} VNĐ
                      </span>
                      <button
                        onClick={() => handleCopy(String(activeIntent.amount), 'amount')}
                        className="text-sky-600 hover:text-sky-700 text-[11px] font-semibold"
                      >
                        {copiedField === 'amount' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-md bg-sky-50/70 border border-sky-200">
                    <div>
                      <span className="text-slate-600 font-medium">Nội dung chuyển:</span>
                      <p className="text-[10px] text-sky-700">Bắt buộc giữ nguyên mã này</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-900 bg-white px-2 py-0.5 rounded border border-sky-300">
                        {activeIntent.transferContent}
                      </span>
                      <button
                        onClick={() => handleCopy(activeIntent.transferContent, 'content')}
                        className="text-sky-600 hover:text-sky-700 text-[11px] font-semibold"
                      >
                        {copiedField === 'content' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleCheckPaymentStatus}
                    disabled={isVerifying}
                    className="w-full py-2.5 rounded-md bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
                    )}
                    <span>Kiểm tra trạng thái thanh toán</span>
                  </button>

                  {/* Dev/Demo Webhook Simulator Button */}
                  <button
                    onClick={handleSimulateWebhook}
                    disabled={isSimulatingWebhook}
                    className="w-full py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {isSimulatingWebhook && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>[Môi trường thử nghiệm] Giả lập Webhook đối soát</span>
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
