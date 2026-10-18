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
  Users,
  Database,
  BarChart3,
  Layers,
} from 'lucide-react';

export default function EvaluatorBillingPage() {
  const [currentPlan, setCurrentPlan] = useState<'free' | 'plus' | 'pro'>('pro');
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
  const transferContent = selectedPlanForUpgrade === 'plus' ? 'NEXA EVA PLUS' : 'NEXA EVA PRO';

  return (
    <div className="max-w-6xl space-y-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-slate-200/80">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            KHẢO THÍ & HẠN MỨC
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Gói Dịch Vụ Khảo Thí & Hạn Mức Giảng Dạy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Quản lý gói chuyên môn, theo dõi hạn mức nhóm lớp, phòng thi PIN trực tiếp và hạn mức AI credits chấm Rubric.
        </p>
      </div>

      {/* Quota & Resource Usage Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>AI credits chấm Rubric</span>
            <span className="font-bold text-slate-900 font-mono">45 / 1.000</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-sky-600 h-2 rounded-full" style={{ width: '4.5%' }} />
          </div>
          <div className="text-[11px] text-slate-400">Còn lại 955 credits trong tháng này</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Nhóm lớp hoạt động</span>
            <span className="font-bold text-slate-900 font-mono">3 / Không giới hạn</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '25%' }} />
          </div>
          <div className="text-[11px] text-slate-400">Tổng số 85 học viên đã ghi danh</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Xuất dữ liệu nghiên cứu</span>
            <span className="font-bold text-emerald-600">Sẵn sàng 26 biến số</span>
          </div>
          <div className="text-xs font-semibold text-slate-800">
            Định dạng Excel, CSV, SPSS và R
          </div>
          <div className="text-[11px] text-slate-400">Không giới hạn số lượt xuất</div>
        </div>
      </div>

      {/* 4 Unified Plans Grid for Evaluator */}
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
                <p className="text-xs text-slate-500">Lớp học trải nghiệm</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                Miễn phí
              </span>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-slate-900 font-mono">0 đ</span>
              <span className="text-xs text-slate-500 ml-1">/ vĩnh viễn</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 mb-6">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1 nhóm lớp tối đa 15 học viên</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1 phòng thi trực tiếp mã PIN</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bàn chấm điểm thủ công</span>
              </li>
              <li className="flex items-center gap-2.5 text-slate-400">
                <span>Xuất dữ liệu: Không hỗ trợ</span>
              </li>
            </ul>
          </div>

          <button
            disabled
            className="w-full py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 cursor-default bg-slate-50"
          >
            {currentPlan === 'free' ? 'Gói hiện tại' : 'Gói cơ bản'}
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
                <p className="text-xs text-slate-500">Giảng dạy lớp nhỏ</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Cơ bản
              </span>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-slate-900 font-mono">69.000 đ</span>
              <span className="text-xs text-slate-500 ml-1">/ tháng</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-700 mb-6">
              <li className="flex items-center gap-2.5 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>3 nhóm lớp tối đa 50 học viên mỗi lớp</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>3 phòng thi trực tiếp đồng thời</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100 AI credits hỗ trợ chấm bài thực hành</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Xuất bảng điểm Excel và CSV</span>
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
            {currentPlan === 'plus' ? 'Đang sử dụng' : 'Nâng cấp gói Plus'}
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
          <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-sky-600 text-white text-[11px] font-bold shadow-xs">
            ĐANG SỬ DỤNG
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Gói PRO</h3>
                <p className="text-xs text-slate-500">Khảo thí & Nghiên cứu chuyên nghiệp</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 font-bold border border-sky-200">
                Nâng cao
              </span>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-slate-900 font-mono">199.000 đ</span>
              <span className="text-xs text-slate-500 ml-1">/ tháng</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-700 mb-6">
              <li className="flex items-center gap-2.5 font-semibold text-sky-800">
                <Check className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Không giới hạn số lớp và học viên</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Không giới hạn phòng thi trực tiếp</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Bàn chấm Split-view chuyên nghiệp</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-sky-600 shrink-0" />
                <span>1.000 AI credits chấm gợi ý bài làm</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Xuất dữ liệu nghiên cứu 26 biến số</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleOpenUpgrade('pro')}
            className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            Gia hạn gói PRO qua VietQR
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-slate-900 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                  <QrCode className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Gia hạn {upgradePlanName} qua VietQR
                  </h3>
                  <p className="text-[11px] text-slate-500">Quét mã VietQR để thanh toán tự động</p>
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
                  Gia hạn {upgradePlanName} thành công!
                </h4>
                <p className="text-xs text-slate-500">
                  Hạn mức AI credits và các quyền lợi phòng thi mới đã được cập nhật vào tài khoản của bạn.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="w-48 h-48 bg-white p-2 rounded-lg border border-slate-200 shadow-xs flex flex-col items-center justify-between">
                    <div className="text-[10px] font-bold text-slate-800 tracking-wider font-mono">
                      VIETQR • NAPAS 247
                    </div>
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

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 font-mono">0987654321 • MBBank</span>
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
                    <span className="font-bold text-slate-900 text-sm font-mono">{upgradeAmount}.000 đ</span>
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
