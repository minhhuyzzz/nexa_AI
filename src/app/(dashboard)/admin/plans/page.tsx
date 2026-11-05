'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Plus,
  Check,
  Building2,
  Zap,
  Layers,
  Crown,
  FileCheck2,
  Search,
  MoreVertical,
  ArrowRight,
  Package,
  Award,
  Sparkles,
  X,
  Coins,
  Settings,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface PlanConfig {
  aiCredits: number;
  monthlyPrice: number;
  annualPrice: number;
  maxExams: number;
  maxClasses: number;
  maxLiveParticipants: number;
  unlockAdvancedExams: boolean;
  sha256Certificate: boolean;
  exportCsvExcel: boolean;
}

export default function AdminPlansPage() {
  const [activeTab, setActiveTab] = useState<'b2c' | 'b2b'>('b2c');
  const [b2bSearch, setB2bSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Plan Quotas State
  const [freeConfig, setFreeConfig] = useState<PlanConfig>({
    aiCredits: 10,
    monthlyPrice: 0,
    annualPrice: 0,
    maxExams: 15,
    maxClasses: 10,
    maxLiveParticipants: 50,
    unlockAdvancedExams: false,
    sha256Certificate: false,
    exportCsvExcel: false,
  });

  const [proConfig, setProConfig] = useState<PlanConfig>({
    aiCredits: 1000,
    monthlyPrice: 199000,
    annualPrice: 1890000,
    maxExams: 9999,
    maxClasses: 9999,
    maxLiveParticipants: 500,
    unlockAdvancedExams: true,
    sha256Certificate: true,
    exportCsvExcel: true,
  });

  // Modal State
  const [editingPlan, setEditingPlan] = useState<'FREE' | 'PRO' | null>(null);
  const [editForm, setEditForm] = useState<PlanConfig>(freeConfig);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenEdit = (plan: 'FREE' | 'PRO') => {
    setEditingPlan(plan);
    setEditForm(plan === 'FREE' ? { ...freeConfig } : { ...proConfig });
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan === 'FREE') {
      setFreeConfig({ ...editForm });
      showToast(`Đã lưu cấu hình Gói Miễn phí (FREE): ${editForm.aiCredits.toLocaleString('vi-VN')} AI credits/tháng.`);
    } else if (editingPlan === 'PRO') {
      setProConfig({ ...editForm });
      showToast(`Đã lưu cấu hình Gói Chuyên nghiệp (PRO): ${editForm.aiCredits.toLocaleString('vi-VN')} AI credits/tháng, giá ${editForm.monthlyPrice.toLocaleString('vi-VN')} đ/tháng.`);
    }
    setEditingPlan(null);
  };

  const b2bContracts = [
    {
      name: 'Cơ bản Doanh nghiệp',
      code: 'HD-B2B-00124',
      seats: 50,
      credits: '50.000',
      activeAssessments: 'Tối đa 10',
      reporting: 'Cơ bản',
      liveRoom: true,
      exportFormats: 'CSV, Excel',
      status: 'ACTIVE',
    },
    {
      name: 'Tăng trưởng',
      code: 'HD-B2B-00117',
      seats: 200,
      credits: '250.000',
      activeAssessments: 'Tối đa 50',
      reporting: 'Nâng cao',
      liveRoom: true,
      exportFormats: 'CSV, Excel, PDF',
      status: 'ACTIVE',
    },
    {
      name: 'Chuyên sâu',
      code: 'HD-B2B-00098',
      seats: 500,
      credits: '800.000',
      activeAssessments: 'Tối đa 200',
      reporting: 'Nâng cao + So sánh chuẩn',
      liveRoom: true,
      exportFormats: 'CSV, Excel, PDF',
      status: 'ACTIVE',
    },
    {
      name: 'Toàn diện',
      code: 'HD-B2B-00076',
      seats: 1000,
      credits: '2.000.000',
      activeAssessments: 'Không giới hạn',
      reporting: 'Tùy chỉnh',
      liveRoom: true,
      exportFormats: 'CSV, Excel, PDF',
      status: 'PENDING_APPROVAL',
    },
  ];

  const filteredContracts = b2bContracts.filter((c) => {
    const matchesSearch =
      b2bSearch === '' ||
      c.name.toLowerCase().includes(b2bSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(b2bSearch.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. Header (Chuẩn Ảnh 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Quản lý gói dịch vụ &amp; định mức hợp đồng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Cấu hình sản phẩm B2C, quyền lợi và định mức tenant B2B.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/admin/organizations"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Phê duyệt hợp đồng B2B</span>
          </Link>
          <button
            onClick={() => alert('Mở trình cấu hình gói dịch vụ nền tảng.')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo gói mới</span>
          </button>
        </div>
      </div>

      {/* 2. Tabs (Chuẩn Ảnh 5) */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('b2c')}
          className={`pb-3 transition-colors ${
            activeTab === 'b2c'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          Gói cá nhân (B2C)
        </button>
        <button
          onClick={() => setActiveTab('b2b')}
          className={`pb-3 transition-colors ${
            activeTab === 'b2b'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          Hợp đồng tổ chức (B2B)
        </button>
      </div>

      {/* 3. Section 1: Gói cá nhân & nền tảng (Chuẩn đúng 3 gói của hệ thống NEXA: FREE, PRO, BUSINESS) */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Gói dịch vụ NEXA (3 Gói chuẩn hóa)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Quản lý các gói dịch vụ dành cho người dùng cá nhân và tổ chức, bao gồm giá niêm yết, định mức AI và quyền lợi tính năng thực tế.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Gói FREE */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 border border-slate-100 dark:border-zinc-800">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Mặc định
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Gói Miễn phí (FREE)
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Khởi đầu thuận tiện để cá nhân tự học và giáo viên mở lớp trải nghiệm.
                </p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                    0 đ
                  </span>
                  <span className="text-xs text-slate-400">/tháng</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{freeConfig.aiCredits.toLocaleString('vi-VN')} AI credits / tháng</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 space-y-2 text-xs text-slate-600 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Đánh giá năng lực 5 miền cơ bản</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Kho đề trắc nghiệm chung không giới hạn</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Tạo tối đa {freeConfig.maxExams} đề cá nhân &amp; {freeConfig.maxClasses} nhóm lớp</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Phòng thi trực tiếp tối đa {freeConfig.maxLiveParticipants} thí sinh</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => handleOpenEdit('FREE')}
                className="w-full py-2 text-center text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Cấu hình định mức Free</span>
              </button>
            </div>
          </div>

          {/* 2. Gói PRO (Phổ biến nhất - Viền xanh Cobalt) */}
          <div className="bg-white dark:bg-[#111114] border-2 border-blue-600 dark:border-blue-500 rounded-xl p-5 shadow-xs flex flex-col justify-between relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                  <Crown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-xs">
                  Phổ biến nhất
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Gói Chuyên nghiệp (PRO)
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Mở khóa trọn bộ kho đề chuyên sâu cho người học và công cụ khảo thí cho giảng viên.
                </p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {proConfig.monthlyPrice.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-xs text-slate-400">/tháng</span>
                  <span className="text-[11px] text-slate-400 ml-1">({proConfig.annualPrice.toLocaleString('vi-VN')} đ/năm)</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{proConfig.aiCredits.toLocaleString('vi-VN')} AI credits / tháng</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 space-y-2 text-xs text-slate-600 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Tất cả quyền lợi của gói FREE</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Mở khóa toàn bộ đề thi chuyên sâu &amp; thực hành AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Bàn chấm Split-view &amp; live room tới {proConfig.maxLiveParticipants} thí sinh</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Chứng chỉ số nâng cao (Xác thực 2 chiều SHA-256)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Xuất dữ liệu nghiên cứu 26 biến số (Excel / CSV)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => handleOpenEdit('PRO')}
                className="w-full py-2 text-center text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Cấu hình định mức Pro</span>
              </button>
            </div>
          </div>

          {/* 3. Gói BUSINESS (Tổ chức / Trường học) */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Doanh nghiệp / Trường học
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Gói Tổ chức (BUSINESS)
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Khảo thí và chuẩn hóa diện rộng cho trường đại học, viện và doanh nghiệp.
                </p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    Hợp đồng B2B
                  </span>
                  <span className="text-xs text-slate-400 ml-1">(Đơn giá thỏa thuận)</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                  <span>Theo quy mô người dùng (Seats)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 space-y-2 text-xs text-slate-600 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Trọn bộ quyền lợi gói Pro cho toàn thể giảng viên</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Tổ chức các đợt thi tập trung (Campaign) diện rộng</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Ngân hàng đề thi và học liệu riêng của nhà trường</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Báo cáo kiểm định chất lượng đào tạo (BI 5 miền)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Chứng chỉ đồng thương hiệu riêng &amp; Tích hợp SSO/LMS</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800">
              <Link
                href="/admin/organizations"
                className="block w-full py-2 text-center text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Quản trị hợp đồng B2B →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Section 2: Hợp đồng tổ chức (B2B) - Table (Chuẩn Ảnh 5) */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Hợp đồng tổ chức (B2B)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Quản lý các gói hợp đồng dành cho tổ chức, định mức sử dụng và trạng thái hợp đồng.
          </p>
        </div>

        {/* Toolbar Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={b2bSearch}
              onChange={(e) => setB2bSearch(e.target.value)}
              placeholder="Tìm gói hoặc hợp đồng..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">Trạng thái: Tất cả</option>
              <option value="ACTIVE">Đang hiệu lực</option>
              <option value="PENDING_APPROVAL">Chờ phê duyệt</option>
            </select>
          </div>
        </div>

        {/* B2B Table */}
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-zinc-900/50 border-b border-slate-200/80 dark:border-zinc-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Gói / Hợp đồng</th>
                  <th className="py-3 px-4">Seats (người dùng)</th>
                  <th className="py-3 px-4">AI credits / tháng</th>
                  <th className="py-3 px-4">Đánh giá đang hoạt động ⓘ</th>
                  <th className="py-3 px-4">Báo cáo (Reporting)</th>
                  <th className="py-3 px-4">Phòng trực tiếp (Live room)</th>
                  <th className="py-3 px-4">Xuất dữ liệu (Export)</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredContracts.map((c) => (
                  <tr
                    key={c.code}
                    className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                          <Package className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {c.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-800 dark:text-zinc-200 tabular-nums">
                      {c.seats.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-800 dark:text-zinc-200">
                      {c.credits}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-neutral-400">
                      {c.activeAssessments}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-neutral-400">
                      {c.reporting}
                    </td>
                    <td className="py-3 px-4 text-emerald-600 font-medium">
                      ✓ Có
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-neutral-400">
                      ✓ {c.exportFormats}
                    </td>
                    <td className="py-3 px-4">
                      {c.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          Đang hiệu lực
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          Chờ phê duyệt
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Cấu hình định mức gói (Free / Pro) */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${editingPlan === 'FREE' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'}`}>
                  {editingPlan === 'FREE' ? <Zap className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Cấu hình định mức {editingPlan === 'FREE' ? 'Gói Miễn phí (FREE)' : 'Gói Chuyên nghiệp (PRO)'}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                    Điều chỉnh hạn mức AI credits, dung lượng và các đặc quyền khảo thí của gói.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4 text-xs">
              {/* AI Credits Field */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 space-y-2">
                <label className="block font-bold text-blue-950 dark:text-blue-200">
                  Hạn mức AI Credits cấp phát / tháng *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={0}
                    step={10}
                    value={editForm.aiCredits}
                    onChange={(e) => setEditForm({ ...editForm, aiCredits: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full pl-9 pr-16 py-2 text-sm font-mono font-bold bg-white dark:bg-zinc-900 border border-blue-300 dark:border-blue-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <span className="text-xs font-semibold text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">
                    credits
                  </span>
                </div>
                <p className="text-[11px] text-blue-800 dark:text-blue-300/80 leading-relaxed">
                  AI credits dùng để trừ tự động khi học viên/giảng viên thực hiện chấm điểm Rubric tự động, gợi ý học tập và phân tích khoảng trống năng lực 5 miền.
                </p>
              </div>

              {/* Price Fields for PRO */}
              {editingPlan === 'PRO' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                      Giá niêm yết theo tháng (VNĐ)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={editForm.monthlyPrice}
                      onChange={(e) => setEditForm({ ...editForm, monthlyPrice: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-neutral-900 dark:text-neutral-100 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                      Giá ưu đãi theo năm (VNĐ)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={editForm.annualPrice}
                      onChange={(e) => setEditForm({ ...editForm, annualPrice: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-neutral-900 dark:text-neutral-100 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Quotas for Tests & Classes */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                    Đề thi tối đa
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.maxExams}
                    onChange={(e) => setEditForm({ ...editForm, maxExams: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-neutral-900 dark:text-neutral-100 text-xs font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                    Nhóm lớp tối đa
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.maxClasses}
                    onChange={(e) => setEditForm({ ...editForm, maxClasses: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-neutral-900 dark:text-neutral-100 text-xs font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                    Thí sinh Live Room
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={editForm.maxLiveParticipants}
                    onChange={(e) => setEditForm({ ...editForm, maxLiveParticipants: Math.max(10, parseInt(e.target.value) || 10) })}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-neutral-900 dark:text-neutral-100 text-xs font-mono font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu cấu hình định mức</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-neutral-700 animate-in slide-in-from-bottom-3 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
