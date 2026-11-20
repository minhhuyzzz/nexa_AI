'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Building2,
  Zap,
  Crown,
  FileCheck2,
  Search,
  Sparkles,
  X,
  Coins,
  Settings,
  Sliders,
  CheckCircle2,
  Loader2,
  Users,
  Radio,
  ExternalLink,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface ServicePlan {
  id: string;
  code: string;
  name: string;
  badge?: string | null;
  description?: string | null;
  price_vnd: number;
  annual_price_vnd?: number;
  yearly_monthly_equivalent?: number;
  trial_days?: number;
  credits_included: number;
  max_classes?: number;
  max_class_members?: number;
  max_live_participants?: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface B2BOrganizationItem {
  id: string;
  code: string;
  name: string;
  contactName: string;
  contactEmail: string;
  expectedLearners: number;
  aiCredits?: number;
  aiCreditsUsed?: number;
  status: string;
  createdAt: string;
}

export default function AdminPlansPage() {
  const [activeTab, setActiveTab] = useState<'b2c' | 'b2b'>('b2c');
  const [b2bSearch, setB2bSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Real Database Plans State
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  // Real B2B Organizations State
  const [organizations, setOrganizations] = useState<B2BOrganizationItem[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Modal State
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);
  const [editName, setEditName] = useState('');
  const [editBadge, setEditBadge] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMonthlyPrice, setEditMonthlyPrice] = useState(0);
  const [editAnnualPrice, setEditAnnualPrice] = useState(0);
  const [editTrialDays, setEditTrialDays] = useState(0);
  const [editAiCredits, setEditAiCredits] = useState(0);
  const [editMaxClasses, setEditMaxClasses] = useState(2);
  const [editMaxClassMembers, setEditMaxClassMembers] = useState(30);
  const [editMaxLiveParticipants, setEditMaxLiveParticipants] = useState(30);
  const [editFeaturesText, setEditFeaturesText] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Real Plans from /api/admin/plans
  const fetchPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      setPlansError(null);
      const res = await fetch('/api/admin/plans');
      const data = await res.json();
      if (res.ok && data.plans) {
        // Khóa chặt hiển thị đúng 4 gói chuẩn: BASIC, STANDARD, ADVANCED, ENTERPRISE
        const CANONICAL_CODES = ['BASIC', 'STANDARD', 'ADVANCED', 'ENTERPRISE'];
        const primaryPlans = (data.plans as ServicePlan[]).filter((p) =>
          CANONICAL_CODES.includes(p.code)
        );
        primaryPlans.sort(
          (a, b) => CANONICAL_CODES.indexOf(a.code) - CANONICAL_CODES.indexOf(b.code)
        );
        setPlans(primaryPlans);
      } else {
        setPlansError(data.error || 'Không thể tải danh sách gói dịch vụ từ máy chủ.');
      }
    } catch {
      setPlansError('Lỗi kết nối máy chủ khi tải danh sách gói dịch vụ.');
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  // 2. Fetch Real Organizations for Tab B2B
  const fetchOrganizations = useCallback(async () => {
    try {
      setLoadingOrgs(true);
      const res = await fetch('/api/admin/organizations');
      const data = await res.json();
      if (res.ok && data.organizations) {
        setOrganizations(data.organizations);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoadingOrgs(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (activeTab === 'b2b' && organizations.length === 0) {
      fetchOrganizations();
    }
  }, [activeTab, organizations.length, fetchOrganizations]);

  // Open Edit Modal
  const handleOpenEdit = (plan: ServicePlan) => {
    setEditingPlan(plan);
    setEditName(plan.name || '');
    setEditBadge(plan.badge || '');
    setEditDesc(plan.description || '');
    setEditMonthlyPrice(plan.price_vnd || 0);
    setEditAnnualPrice(plan.annual_price_vnd || 0);
    setEditTrialDays(plan.trial_days || 0);
    setEditAiCredits(plan.credits_included || 0);
    setEditMaxClasses(plan.max_classes || 2);
    setEditMaxClassMembers(plan.max_class_members || 30);
    setEditMaxLiveParticipants(plan.max_live_participants || 30);
    setEditIsActive(plan.is_active !== false);

    const rawFeats = Array.isArray(plan.features) ? plan.features : [];
    setEditFeaturesText(rawFeats.join('\n'));
  };

  // Save Plan Config via PATCH /api/admin/plans
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setSaving(true);
    const parsedFeatures = editFeaturesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPlan.id,
          name: editName,
          badge: editBadge,
          description: editDesc,
          priceVnd: Number(editMonthlyPrice),
          annualPriceVnd: Number(editAnnualPrice),
          trialDays: Number(editTrialDays),
          creditsIncluded: Number(editAiCredits),
          maxClasses: Number(editMaxClasses),
          maxClassMembers: Number(editMaxClassMembers),
          maxLiveParticipants: Number(editMaxLiveParticipants),
          features: parsedFeatures,
          isActive: editIsActive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Đã lưu cấu hình ${editName} thành công vào CSDL.`);
        setEditingPlan(null);
        fetchPlans();
      } else {
        alert(data.error || 'Lỗi lưu cấu hình gói dịch vụ.');
      }
    } catch {
      alert('Lỗi kết nối máy chủ khi lưu cấu hình gói.');
    } finally {
      setSaving(false);
    }
  };

  // Filter B2B Orgs
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      b2bSearch === '' ||
      org.name.toLowerCase().includes(b2bSearch.toLowerCase()) ||
      org.code.toLowerCase().includes(b2bSearch.toLowerCase()) ||
      org.contactName.toLowerCase().includes(b2bSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
            Quản lý gói dịch vụ và định mức hợp đồng
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/admin/organizations"
            className="px-3.5 py-2 rounded-xl ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-bold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Phê duyệt hợp đồng B2B</span>
          </Link>
          <Link
            href="/pricing"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <span>Xem trang Bảng giá công khai</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Tabs (Pill Tabs, Zero Horizontal Borders) */}
      <div>
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('b2c')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'b2c'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Gói dịch vụ nền tảng (4 Gói chuẩn hóa)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('b2b')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'b2b'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Hợp đồng tổ chức B2B ({organizations.length})
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-200 dark:ring-blue-800 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. TAB 1: GÓI CÁ NHÂN VÀ NỀN TẢNG (4 GÓI CHUẨN HÓA) */}
      {activeTab === 'b2c' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Danh mục 4 Gói Dịch Vụ Chuẩn Hóa
              </h2>
            </div>
            <button
              type="button"
              onClick={fetchPlans}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Làm mới dữ liệu
            </button>
          </div>

          {loadingPlans ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-slate-500 font-medium">Đang tải danh sách 4 gói dịch vụ từ CSDL...</p>
            </div>
          ) : plansError ? (
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-200 dark:ring-rose-800 text-rose-800 dark:text-rose-200 text-xs">
              <p className="font-bold">Lỗi tải dữ liệu gói dịch vụ:</p>
              <p className="mt-1">{plansError}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
              {plans.map((p) => {
                const isFree = p.price_vnd === 0 && p.code === 'BASIC';
                const isStandard = p.code === 'STANDARD';
                const isAdvanced = p.code === 'ADVANCED';
                const isEnterprise = p.code === 'ENTERPRISE';

                return (
                  <div
                    key={p.id}
                    className={`bg-white dark:bg-[#111114] rounded-2xl ring-1 p-5 shadow-xs flex flex-col justify-between transition-all duration-200 ${
                      isStandard
                        ? 'ring-2 ring-blue-600 dark:ring-blue-500 shadow-md'
                        : isEnterprise
                        ? 'ring-indigo-300 dark:ring-indigo-800/80 bg-gradient-to-b from-white to-indigo-50/20 dark:from-[#111114] dark:to-indigo-950/20'
                        : 'ring-slate-200 dark:ring-zinc-800 hover:ring-slate-300 dark:hover:ring-zinc-700'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top Badge & Tag */}
                      <div className="flex items-center justify-between">
                        <div
                          className={`p-2 rounded-xl text-xs ${
                            isStandard
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                              : isEnterprise
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                              : isAdvanced
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {isStandard ? (
                            <Sparkles className="w-4 h-4" />
                          ) : isEnterprise ? (
                            <Building2 className="w-4 h-4" />
                          ) : isAdvanced ? (
                            <Crown className="w-4 h-4" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            isStandard
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                              : isEnterprise
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {p.badge || (isFree ? 'MẶC ĐỊNH' : p.code)}
                        </span>
                      </div>

                      {/* Plan Name & Desc */}
                      <div>
                        <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 min-h-[36px] leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      {/* Price Section */}
                      <div className="pt-1">
                        {isEnterprise ? (
                          <div className="space-y-0.5">
                            <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                              Hợp đồng B2B
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                              Báo giá linh hoạt theo quy mô
                            </p>
                          </div>
                        ) : isFree ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                              0 đ
                            </span>
                            <span className="text-xs text-slate-400 font-semibold">/ vĩnh viễn</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                                {p.price_vnd.toLocaleString('vi-VN')} đ
                              </span>
                              <span className="text-xs text-slate-400 font-semibold">/ tháng</span>
                            </div>
                            {isStandard && (
                              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                <span>✦ Tặng 30 ngày dùng thử (0đ tháng đầu)</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Credits Badge */}
                        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                          <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-mono tabular-nums">
                            {p.credits_included.toLocaleString('vi-VN')} AI credits / tháng
                          </span>
                        </div>
                      </div>

                      {/* Quotas Breakdown */}
                      <div className="pt-2 space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {p.max_classes && p.max_classes >= 999
                              ? 'Không giới hạn nhóm lớp'
                              : `Tối đa ${p.max_classes || 2} nhóm lớp`}
                            {p.max_class_members ? ` (${p.max_class_members} HV/nhóm)` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Radio className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {p.max_live_participants && p.max_live_participants >= 1000
                              ? 'Phòng thi tập trung không giới hạn'
                              : `Live room tối đa ${p.max_live_participants || 30} thí sinh`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Button Open Config Modal */}
                    <div className="pt-5 mt-4">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] ${
                          isStandard
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Cấu hình định mức {p.name}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: HỢP ĐỒNG VÀ TỔ CHỨC B2B (DỮ LIỆU THẬT TỪ CSDL) */}
      {activeTab === 'b2b' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Danh sách Tổ chức và Hợp đồng B2B thực tế
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên trường, mã đơn vị..."
                  value={b2bSearch}
                  onChange={(e) => setB2bSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 w-64 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 focus:outline-hidden"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="PENDING">Chờ kích hoạt</option>
                <option value="SUSPENDED">Tạm ngưng</option>
              </select>
            </div>
          </div>

          {loadingOrgs ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500 font-medium">Đang tải danh sách tổ chức từ CSDL...</p>
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111114] ring-1 ring-slate-200 dark:ring-zinc-800">
              <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Chưa tìm thấy tổ chức nào phù hợp
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Các tổ chức khi được Admin duyệt tại trang Tổ chức Business sẽ tự động xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#111114] rounded-2xl ring-1 ring-slate-200 dark:ring-zinc-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-zinc-900/80 text-slate-600 dark:text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Tổ chức / Trường học</th>
                      <th className="py-3 px-4">Mã định danh</th>
                      <th className="py-3 px-4">Người liên hệ</th>
                      <th className="py-3 px-4">Dung lượng học viên</th>
                      <th className="py-3 px-4">Hạn mức AI Credits</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0 text-slate-700 dark:text-zinc-300">
                    {filteredOrgs.map((org) => (
                      <tr key={org.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-neutral-100">
                          {org.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {org.code}
                        </td>
                        <td className="py-3.5 px-4">
                          <div>{org.contactName}</div>
                          <div className="text-[11px] text-slate-400">{org.contactEmail}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums">
                          {org.expectedLearners.toLocaleString('vi-VN')} học viên
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-amber-600 dark:text-amber-400 font-bold">
                          {(org.aiCredits || 10000).toLocaleString('vi-VN')} credits
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              org.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                            }`}
                          >
                            {org.status === 'ACTIVE' ? 'Đang hoạt động' : org.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href="/admin/organizations"
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <span>Quản trị</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MODAL CẤU HÌNH GÓI DỊCH VỤ NỀN TẢNG (LƯU TRỰC TIẾP VÀO CSDL) */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111114] w-full max-w-2xl rounded-3xl ring-1 ring-slate-200 dark:ring-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Cấu hình CSDL: {editingPlan.code}
                </span>
                <h3 className="text-xl font-black text-neutral-900 dark:text-neutral-100 mt-0.5">
                  Chỉnh sửa {editingPlan.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tên gói */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                    Tên hiển thị gói
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Nhãn nổi bật */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                    Nhãn nổi bật (Badge)
                  </label>
                  <input
                    type="text"
                    value={editBadge}
                    placeholder="PHỔ BIẾN NHẤT, TOÀN DIỆN..."
                    onChange={(e) => setEditBadge(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                  Mô tả ngắn gọn
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Bảng giá & Dùng thử */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                    Giá tháng (VND)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editMonthlyPrice}
                    onChange={(e) => setEditMonthlyPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 font-mono tabular-nums text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                    Giá năm (VND)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editAnnualPrice}
                    onChange={(e) => setEditAnnualPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 font-mono tabular-nums text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                    Số ngày dùng thử 0đ
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={editTrialDays}
                    onChange={(e) => setEditTrialDays(Number(e.target.value))}
                    placeholder="30 cho Gói Tiêu Chuẩn"
                    className="w-full px-3.5 py-2 text-xs rounded-xl ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 font-mono tabular-nums text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Định mức kỹ thuật */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                    AI Credits / tháng
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editAiCredits}
                    onChange={(e) => setEditAiCredits(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 font-mono tabular-nums text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                    Số nhóm lớp tối đa
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editMaxClasses}
                    onChange={(e) => setEditMaxClasses(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 font-mono tabular-nums text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                    Học viên / nhóm
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editMaxClassMembers}
                    onChange={(e) => setEditMaxClassMembers(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 font-mono tabular-nums text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                    Live room (thí sinh)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editMaxLiveParticipants}
                    onChange={(e) => setEditMaxLiveParticipants(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 font-mono tabular-nums text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Tính năng (Textarea) */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1">
                  Danh sách quyền lợi tính năng (Mỗi dòng một tính năng)
                </label>
                <textarea
                  rows={4}
                  value={editFeaturesText}
                  onChange={(e) => setEditFeaturesText(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl ring-1 ring-slate-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Lưu cấu hình vào CSDL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
