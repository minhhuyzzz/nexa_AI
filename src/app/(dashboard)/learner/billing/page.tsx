'use client';

import { useState } from 'react';
import {
  Sparkles,
  Check,
  CreditCard,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  X,
  Copy,
  ExternalLink,
  Lock,
} from 'lucide-react';

export default function LearnerBillingPage() {
  const [currentPlan, setCurrentPlan] = useState<'free' | 'plus' | 'pro'>('free');
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<'plus' | 'pro'>('pro');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenUpgrade = (plan: 'plus' | 'pro') => {
    setSelectedPlanForUpgrade(plan);
    setShowQrModal(true);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setUpgradeSuccess(true);
      setCurrentPlan(selectedPlanForUpgrade);
      setTimeout(() => {
        setShowQrModal(false);
        setUpgradeSuccess(false);
      }, 2000);
    }, 1500);
  };

  const upgradeAmount = selectedPlanForUpgrade === 'plus' ? '69.000' : '199.000';
  const upgradePlanName = selectedPlanForUpgrade === 'plus' ? 'Gói PLUS' : 'Gói PRO';
  const transferContent = selectedPlanForUpgrade === 'plus' ? 'NEXA PLUS 8842' : 'NEXA PRO 8842';

  return (
    <div className="max-w-6xl space-y-8">
      {/* Page Header */}
      <div className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            TÀI KHOẢN & HẠN MỨC
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Gói Dịch Vụ & Thanh Toán Cá Nhân
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Quản lý gói tài khoản, mở khóa các đề thi chuyên sâu và theo dõi hạn mức phân tích AI.
        </p>
      </div>

      {/* Current Subscription Status */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-slate-500">Gói tài khoản hiện tại</div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              {currentPlan === 'free'
                ? 'Gói FREE'
                : currentPlan === 'plus'
                ? 'Gói PLUS'
                : 'Gói PRO'}
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                currentPlan === 'pro'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : currentPlan === 'plus'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              Đang hoạt động
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {currentPlan === 'free'
              ? 'Bạn đang truy cập Kho đề chung. Nâng cấp lên PLUS hoặc PRO để mở khóa toàn bộ đề thi có Ổ khóa và AI credits.'
              : currentPlan === 'plus'
              ? 'Gói PLUS của bạn có hiệu lực đến ngày 18/11/2026. Còn 100 AI credits trong tháng này.'
              : 'Gói PRO của bạn có hiệu lực đến ngày 18/11/2026. Mở khóa 100% đề thi có Ổ khóa và 1.000 AI credits.'}
          </p>
        </div>

        {currentPlan === 'free' && (
          <button
            onClick={() => handleOpenUpgrade('pro')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
          >
            <Sparkles className="w-4 h-4 text-sky-200" />
            <span>Nâng cấp lên PRO ngay</span>
          </button>
        )}
      </div>

      {/* 3 Plans Selection Grid for Learner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Plan 1: Free */}
        <div
          className={`p-6 rounded-xl border flex flex-col justify-between transition-all ${
            currentPlan === 'free'
              ? 'border-slate-300 bg-white shadow-xs'
              : 'border-slate-200 bg-slate-50/50'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Gói FREE</h3>
                <p className="text-xs text-slate-500">Trải nghiệm tự học tập</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                Miễn phí
              </span>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-slate-900">0 đ</span>
              <span className="text-xs text-slate-500 ml-1">/ vĩnh viễn</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 mb-6">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Kho đề chung trắc nghiệm không giới hạn</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Chấm khách quan tức thì trong 0.01 giây</span>
              </li>
              <li className="flex items-center gap-2.5 text-slate-400">
                <Lock className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Đề thi chuyên sâu nâng cao: Bị khóa</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>10 AI credits phân tích năng lực mỗi tháng</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Chứng chỉ</span>
              </li>
            </ul>
          </div>

          <button
            disabled
            className="w-full py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 cursor-default bg-slate-50"
          >
            {currentPlan === 'free' ? 'Gói hiện tại của bạn' : 'Gói cơ bản'}
          </button>
        </div>

        {/* Plan 2: Plus */}
        <div
          className={`p-6 rounded-xl border flex flex-col justify-between transition-all ${
            currentPlan === 'plus'
              ? 'border-emerald-500 bg-emerald-50/10 shadow-xs ring-1 ring-emerald-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Gói PLUS</h3>
                <p className="text-xs text-slate-500">Bồi dưỡng kỹ năng chuyên đề</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Cơ bản
              </span>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-slate-900">69.000 đ</span>
              <span className="text-xs text-slate-500 ml-1">/ tháng</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-700 mb-6">
              <li className="flex items-center gap-2.5 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Toàn bộ quyền lợi của gói FREE</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mở thêm bài thi tình huống thực tế</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100 AI credits phân tích và gợi ý lộ trình</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đánh giá lại kỹ năng sau khi học</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Chứng chỉ</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleOpenUpgrade('plus')}
            disabled={currentPlan === 'plus'}
            className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
              currentPlan === 'plus'
                ? 'bg-slate-100 text-slate-700 border border-slate-200 cursor-default'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {currentPlan === 'plus' ? 'Bạn đang dùng gói Plus' : 'Nâng cấp gói Plus'}
          </button>
        </div>

        {/* Plan 3: Pro */}
        <div
          className={`p-6 rounded-xl border flex flex-col justify-between transition-all relative ${
            currentPlan === 'pro'
              ? 'border-sky-500 bg-sky-50/10 shadow-xs ring-1 ring-sky-500/20'
              : 'border-sky-300 bg-white shadow-md ring-1 ring-sky-500/30'
          }`}
        >
          {/* Badge */}
          <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-sky-600 text-white text-[11px] font-bold shadow-xs">
            KHUYÊN DÙNG
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Gói PRO</h3>
                <p className="text-xs text-slate-500">Mở khóa 100% đề thi chuyên sâu</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 font-bold border border-sky-200">
                Nâng cao
              </span>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-slate-900">199.000 đ</span>
              <span className="text-xs text-slate-500 ml-1">/ tháng</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-700 mb-6">
              <li className="flex items-center gap-2.5 font-semibold text-sky-800">
                <Check className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Mở khóa toàn bộ đề thi chuyên sâu</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Làm đề Prompt AI, xử lý dữ liệu và nộp tệp</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-sky-600 shrink-0" />
                <span>1.000 AI credits phân tích chi tiết và lập lộ trình</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Chứng chỉ</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Huy hiệu Pro và ưu tiên xếp hạng</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleOpenUpgrade('pro')}
            disabled={currentPlan === 'pro'}
            className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
              currentPlan === 'pro'
                ? 'bg-slate-100 text-slate-700 border border-slate-200 cursor-default'
                : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}
          >
            {currentPlan === 'pro' ? 'Bạn đang sử dụng gói Pro' : 'Nâng cấp gói Pro bằng VietQR'}
          </button>
        </div>
      </div>

      {/* Transaction History Mock */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Lịch sử giao dịch VietQR</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="pb-3 font-medium">Mã đơn hàng</th>
                <th className="pb-3 font-medium">Ngày thanh toán</th>
                <th className="pb-3 font-medium">Gói dịch vụ</th>
                <th className="pb-3 font-medium">Số tiền</th>
                <th className="pb-3 font-medium">Hình thức</th>
                <th className="pb-3 font-medium text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {currentPlan !== 'free' && (
                <tr className="bg-sky-50/30">
                  <td className="py-3 font-bold text-slate-900 font-mono">NEXA-ORD-8842</td>
                  <td className="py-3">Hôm nay, 17:45</td>
                  <td className="py-3 font-medium text-slate-900">{upgradePlanName} • 1 Tháng</td>
                  <td className="py-3 font-bold text-slate-900">{upgradeAmount}.000 đ</td>
                  <td className="py-3">VietQR</td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Thành công</span>
                    </span>
                  </td>
                </tr>
              )}
              <tr>
                <td className="py-3 text-slate-800 font-mono">NEXA-INIT-001</td>
                <td className="py-3">15/09/2026</td>
                <td className="py-3">Gói FREE</td>
                <td className="py-3">0 đ</td>
                <td className="py-3">Tạo tài khoản</td>
                <td className="py-3 text-right">
                  <span className="text-slate-500 font-medium text-[11px]">Hoàn thành</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive VietQR Payment Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-slate-900 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                  <QrCode className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Nâng cấp {upgradePlanName} qua VietQR
                  </h3>
                  <p className="text-[11px] text-slate-500">Tự động kích hoạt gói trong vài giây</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {upgradeSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-slate-900">
                  Nâng cấp {upgradePlanName} thành công!
                </h4>
                <p className="text-xs text-slate-500">
                  Tài khoản của bạn đã được mở khóa toàn bộ quyền lợi và cấp thêm AI credits mới.
                </p>
              </div>
            ) : (
              <>
                {/* QR Code Presentation */}
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="w-48 h-48 bg-white p-2 rounded-lg border border-slate-200 shadow-xs flex flex-col items-center justify-between">
                    <div className="text-[10px] font-bold text-slate-800 tracking-wider font-mono">
                      VIETQR • NAPAS 247
                    </div>
                    {/* QR Matrix Mockup */}
                    <div className="w-36 h-36 border border-slate-900 p-1.5 flex flex-wrap gap-1 items-center justify-center bg-slate-900/5">
                      <div className="w-8 h-8 border-4 border-slate-900 rounded-sm self-start" />
                      <div className="flex-1 h-8 flex items-center justify-center text-[10px] text-slate-600 font-semibold font-mono">
                        {selectedPlanForUpgrade.toUpperCase()}
                      </div>
                      <div className="w-8 h-8 border-4 border-slate-900 rounded-sm self-start" />
                      <div className="w-full text-center text-[11px] font-bold text-slate-900 my-1 font-mono">
                        {upgradeAmount}.000 VNĐ
                      </div>
                      <div className="w-8 h-8 border-4 border-slate-900 rounded-sm self-end" />
                      <div className="flex-1 text-[9px] text-slate-500 text-center font-mono">
                        {transferContent}
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-400">Quét bằng ứng dụng ngân hàng bất kỳ</div>
                  </div>
                </div>

                {/* Transfer Info */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <span className="font-bold text-slate-800">MBBank</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">0987654321</span>
                      <button
                        onClick={() => handleCopy('0987654321', 'acc')}
                        className="text-sky-600 hover:text-sky-700 text-[11px] font-semibold"
                      >
                        {copiedField === 'acc' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Số tiền:</span>
                    <span className="font-bold text-slate-900 text-sm">{upgradeAmount}.000 đ</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-sky-50/70 border border-sky-100">
                    <span className="text-sky-900 font-medium">Nội dung chuyển khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sky-900 font-mono">{transferContent}</span>
                      <button
                        onClick={() => handleCopy(transferContent, 'content')}
                        className="text-sky-600 hover:text-sky-700 text-[11px] font-semibold"
                      >
                        {copiedField === 'content' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Confirm Action */}
                <div className="pt-2">
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang đối soát giao dịch...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tôi đã hoàn tất chuyển khoản</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
