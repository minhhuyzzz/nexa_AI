'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Check,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  Users,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ServicePlan {
  id: string;
  code: string;
  role_target: 'LEARNER' | 'EVALUATOR' | 'ORGANIZATION';
  name: string;
  description: string;
  price_vnd: number;
  credits_included: number;
  max_members: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (e) {
      console.error('Failed to load plans', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPlan.id,
          name: editingPlan.name,
          description: editingPlan.description,
          priceVnd: Number(editingPlan.price_vnd),
          creditsIncluded: Number(editingPlan.credits_included),
          maxMembers: Number(editingPlan.max_members),
          features: editingPlan.features,
          isActive: editingPlan.is_active,
        }),
      });

      if (!res.ok) throw new Error('Không thể lưu gói dịch vụ');

      setMessage('Đã cập nhật cấu hình gói dịch vụ thành công vào CSDL!');
      setEditingPlan(null);
      await fetchPlans();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              TÀI CHÍNH &amp; THƯƠNG MẠI
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản Lý Cấu Hình Gói Dịch Vụ (Service Plans)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dữ liệu gói lưu trữ trực tiếp trong bảng database <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">public.service_plans</code>, không dùng mảng tĩnh.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid of Plans */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`p-6 rounded-md border flex flex-col justify-between bg-white shadow-xs transition-all ${
                plan.is_active ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 mb-1">
                      {plan.role_target} &bull; {plan.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                  </div>
                  <button
                    onClick={() => setEditingPlan({ ...plan })}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                    title="Chỉnh sửa gói"
                  >
                    <Edit2 className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>

                <p className="text-xs text-slate-500 min-h-[32px] mb-4">{plan.description}</p>

                <div className="mb-5 pb-4 border-b border-slate-100">
                  <span className="text-2xl font-bold font-mono text-slate-900">
                    {plan.price_vnd === 0 ? '0 đ' : `${plan.price_vnd.toLocaleString('vi-VN')} đ`}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">/ tháng</span>
                </div>

                <div className="space-y-2 text-xs text-slate-700 mb-6">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-sky-600 shrink-0" strokeWidth={1.75} />
                    <span>
                      Hạn mức AI: <strong className="font-mono">{plan.credits_included} credits</strong> / tháng
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={1.75} />
                    <span>
                      Quy mô tối đa: <strong className="font-mono">{plan.max_members} thành viên</strong>
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-slate-600 mb-6">
                  {Array.isArray(plan.features) &&
                    plan.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={1.75} />
                        <span className="text-[11px]">{f}</span>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Trạng thái phát hành:</span>
                <span
                  className={`px-2 py-0.5 rounded font-mono font-semibold ${
                    plan.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {plan.is_active ? 'ĐANG MỞ' : 'TẠM KHÓA'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-md border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-sm text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Cập Nhật Gói: {editingPlan.name}
                </h3>
                <p className="text-[11px] font-mono text-slate-500">{editingPlan.code}</p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên gói hiển thị</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giá (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPlan.price_vnd}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_vnd: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs font-mono focus:ring-1 focus:ring-sky-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">AI Credits</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPlan.credits_included}
                    onChange={(e) => setEditingPlan({ ...editingPlan, credits_included: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs font-mono focus:ring-1 focus:ring-sky-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quy mô tối đa</label>
                  <input
                    type="number"
                    min="1"
                    value={editingPlan.max_members}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_members: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs font-mono focus:ring-1 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editingPlan.is_active}
                  onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <label htmlFor="isActiveToggle" className="font-semibold text-slate-800">
                  Kích hoạt gói dịch vụ (cho phép người dùng đăng ký &amp; gia hạn)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Lưu thay đổi vào CSDL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
