'use client';

import { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Edit2,
  Check,
  X,
  Sparkles,
  Zap,
  Building2,
  User,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface ServicePlan {
  id: string;
  code: 'FREE' | 'PLUS' | 'PRO' | 'ENTERPRISE';
  name: string;
  targetAudience: string;
  monthlyPriceVnd: number;
  annualPriceVnd: number;
  monthlyAiGradingQuota: number;
  monthlyAssessmentsQuota: number | 'UNLIMITED';
  features: string[];
  isActive: boolean;
}

const defaultPlans: ServicePlan[] = [
  {
    id: 'plan-free',
    code: 'FREE',
    name: 'Gói FREE',
    targetAudience: 'Người học tự do và giáo viên mở lớp trải nghiệm',
    monthlyPriceVnd: 0,
    annualPriceVnd: 0,
    monthlyAiGradingQuota: 10,
    monthlyAssessmentsQuota: 'UNLIMITED',
    features: [
      'Kho đề chung trắc nghiệm không giới hạn',
      'Đề thi chuyên sâu nâng cao: Bị khóa',
      '10 AI credits phân tích năng lực mỗi tháng',
      '1 nhóm lớp tối đa 15 học viên',
      '1 phòng thi trực tiếp mã PIN',
      'Chứng chỉ',
      'Đóng góp đề thi cộng đồng',
    ],
    isActive: true,
  },
  {
    id: 'plan-plus',
    code: 'PLUS',
    name: 'Gói PLUS',
    targetAudience: 'Người học bồi dưỡng chuyên đề & giáo viên quản lý lớp nhỏ',
    monthlyPriceVnd: 69000,
    annualPriceVnd: 690000,
    monthlyAiGradingQuota: 100,
    monthlyAssessmentsQuota: 'UNLIMITED',
    features: [
      'Mở thêm bài thi tình huống thực tế',
      '100 AI credits phân tích và gợi ý lộ trình',
      'Đánh giá lại kỹ năng sau khi học',
      '3 nhóm lớp tối đa 50 học viên mỗi lớp',
      '3 phòng thi trực tiếp đồng thời',
      'Xuất bảng điểm Excel và CSV',
      'Chứng chỉ',
    ],
    isActive: true,
  },
  {
    id: 'plan-pro',
    code: 'PRO',
    name: 'Gói PRO',
    targetAudience: 'Người học bứt phá kỹ năng & chuyên gia khảo thí chuyên nghiệp',
    monthlyPriceVnd: 199000,
    annualPriceVnd: 1890000,
    monthlyAiGradingQuota: 1000,
    monthlyAssessmentsQuota: 'UNLIMITED',
    features: [
      'Mở khóa toàn bộ đề thi chuyên sâu',
      '1.000 AI credits phân tích chi tiết và lập lộ trình',
      'Không giới hạn số lớp và học viên',
      'Không giới hạn phòng thi trực tiếp',
      'Bàn chấm Split-view chuyên nghiệp',
      'Xuất dữ liệu nghiên cứu 26 biến số',
      'Chứng chỉ',
      'Huy hiệu Pro và ưu tiên xếp hạng',
    ],
    isActive: true,
  },
  {
    id: 'plan-ent',
    code: 'ENTERPRISE',
    name: 'Gói ENTERPRISE',
    targetAudience: 'Tổ chức, Doanh nghiệp, Tập đoàn và Đơn vị đào tạo quy mô lớn',
    monthlyPriceVnd: 25000, // tính theo đầu người học / tháng
    annualPriceVnd: 250000,
    monthlyAiGradingQuota: 10000,
    monthlyAssessmentsQuota: 'UNLIMITED',
    features: [
      'Toàn bộ người học nội bộ được kích hoạt đầy đủ tính năng Pro',
      'Chuyên gia & Người đánh giá dùng trọn bộ công cụ khảo thí',
      'Tùy biến khung năng lực số riêng',
      'Tạo ngân hàng đề thi và học liệu riêng',
      'Tích hợp đăng nhập một lần và LMS',
      'Chứng chỉ đồng thương hiệu riêng',
      'Báo cáo kiểm định chất lượng đào tạo',
    ],
    isActive: true,
  },
];

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<ServicePlan[]>(defaultPlans);
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setPlans((prev) =>
      prev.map((p) => (p.id === editingPlan.id ? editingPlan : p))
    );
    setToastMessage(`Đã cập nhật mức giá và hạn mức cho ${editingPlan.name}!`);
    setEditingPlan(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              QUẢN TRỊ KINH DOANH
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cấu Hình Gói Dịch Vụ & Bảng Giá Đồng Nhất
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập mức phí chung, hạn mức AI credits và các đặc quyền mở khóa cho cả Người học & Người đánh giá.
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Grid of 4 Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`p-6 rounded-md border bg-white flex flex-col justify-between transition-all ${
              plan.code === 'PRO'
                ? 'border-sky-600 shadow-xs ring-1 ring-sky-600/30'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                    plan.code === 'PRO'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : plan.code === 'ENTERPRISE'
                      ? 'bg-slate-900 text-white'
                      : plan.code === 'PLUS'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {plan.code}
                </span>

                <button
                  onClick={() => setEditingPlan(plan)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3 h-3" strokeWidth={1.75} />
                  <span>Sửa giá</span>
                </button>
              </div>

              <h2 className="text-base font-bold text-slate-900 mb-1">{plan.name}</h2>
              <p className="text-xs text-slate-500 mb-4 min-h-[2rem]">{plan.targetAudience}</p>

              {/* Pricing strip */}
              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200/80 mb-5">
                <div className="text-xl font-extrabold text-slate-900">
                  {plan.monthlyPriceVnd === 0
                    ? '0 VNĐ'
                    : `${plan.monthlyPriceVnd.toLocaleString('vi-VN')} đ`}
                  <span className="text-xs font-normal text-slate-500">
                    {plan.code === 'ENTERPRISE' ? ' / học viên / tháng' : ' / tháng'}
                  </span>
                </div>
                {plan.annualPriceVnd > 0 && (
                  <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                    Gói năm: {plan.annualPriceVnd.toLocaleString('vi-VN')} đ
                  </div>
                )}
              </div>

              {/* Quota breakdown */}
              <div className="space-y-2 mb-5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Hạn mức AI credits:</span>
                  <span className="font-bold text-slate-900">
                    {plan.monthlyAiGradingQuota >= 10000
                      ? 'Theo hạn mức trường'
                      : `${plan.monthlyAiGradingQuota.toLocaleString('vi-VN')} credits / tháng`}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Bài khảo thí tối đa:</span>
                  <span className="font-bold text-slate-900">Không giới hạn</span>
                </div>
              </div>

              {/* Features list */}
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Đặc quyền bao gồm:
                </div>
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-600">
                    <CheckCircle2
                      className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5"
                      strokeWidth={2}
                    />
                    <span className="leading-relaxed">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-md w-full shadow-sm space-y-4 text-slate-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Điều Chỉnh Giá &amp; Hạn Mức Gói
              </h2>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tên gói dịch vụ:
                </label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, name: e.target.value })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Giá theo tháng:
                  </label>
                  <input
                    type="number"
                    value={editingPlan.monthlyPriceVnd}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        monthlyPriceVnd: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Giá theo năm:
                  </label>
                  <input
                    type="number"
                    value={editingPlan.annualPriceVnd}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        annualPriceVnd: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Hạn mức AI credits / tháng:
                </label>
                <input
                  type="number"
                  value={editingPlan.monthlyAiGradingQuota}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      monthlyAiGradingQuota: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
