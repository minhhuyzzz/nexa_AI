'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Search,
  Download,
  FileCheck2,
  MoreHorizontal,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { ActivateBusinessModal, BusinessInquiryTarget } from '@/components/dashboard/admin/ActivateBusinessModal';
import { AdminPagination } from '@/components/dashboard/admin/AdminUIComponents';

interface OrganizationItem {
  id: string;
  code: string;
  name: string;
  type: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  expectedLearners: number;
  activeMembers: number;
  status: string;
  createdAt: string;
}

interface RenewalItem {
  id: string;
  organization_id: string;
  period_months: number;
  requested_seats?: number;
  requested_credits?: number;
  notes?: string;
  status: string;
  created_at: string;
  organizations?: {
    id: string;
    name: string;
    slug: string;
    code: string;
  };
}

export default function AdminOrganizationsPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'organizations' | 'renewals'>('requests');

  // Inquiries State
  const [inquiries, setInquiries] = useState<BusinessInquiryTarget[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<string>('ALL');
  const [inquirySearch, setInquirySearch] = useState('');

  // Organizations State
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [orgSearch, setOrgSearch] = useState('');

  // Renewals State
  const [renewals, setRenewals] = useState<RenewalItem[]>([]);
  const [loadingRenewals, setLoadingRenewals] = useState(true);
  const [processingRenewalId, setProcessingRenewalId] = useState<string | null>(null);

  // Activation Modal State
  const [selectedInquiry, setSelectedInquiry] = useState<BusinessInquiryTarget | null>(null);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);

  // Fetch Inquiries
  const fetchInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const res = await fetch('/api/admin/inquiries');
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
      }
    } catch (e) {
      console.error('Failed to fetch inquiries:', e);
    } finally {
      setLoadingInquiries(false);
    }
  };

  // Fetch Organizations
  const fetchOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const res = await fetch('/api/admin/organizations');
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations || []);
      }
    } catch (e) {
      console.error('Failed to fetch organizations:', e);
    } finally {
      setLoadingOrgs(false);
    }
  };

  // Fetch Renewals
  const fetchRenewals = async () => {
    setLoadingRenewals(true);
    try {
      const res = await fetch('/api/admin/business/renewals');
      if (res.ok) {
        const data = await res.json();
        setRenewals(data.renewals || []);
      }
    } catch (e) {
      console.error('Failed to fetch renewals:', e);
    } finally {
      setLoadingRenewals(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
    fetchOrganizations();
    fetchRenewals();
  }, []);

  const handleApproveRenewal = async (renewalId: string) => {
    if (!confirm('Xác nhận phê duyệt gia hạn cho tổ chức này?')) return;
    setProcessingRenewalId(renewalId);
    try {
      const res = await fetch(`/api/admin/business/renewals/${renewalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gia hạn thất bại');
      await fetchRenewals();
      await fetchOrganizations();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setProcessingRenewalId(null);
    }
  };

  // Filter inquiries
  const filteredInquiries = inquiries.filter((inq) => {
    const rawStatus = (inq as any).status || 'NEW';
    const matchesStatus =
      inquiryStatusFilter === 'ALL' ||
      (inquiryStatusFilter === 'NEW' && rawStatus === 'NEW') ||
      (inquiryStatusFilter === 'IN_PROGRESS' && ['IN_PROGRESS', 'CONTACTED', 'PROPOSAL_SENT'].includes(rawStatus)) ||
      (inquiryStatusFilter === 'ACTIVATED' && ['ACTIVATED', 'APPROVED'].includes(rawStatus));

    const matchesSearch =
      !inquirySearch ||
      inq.org_name.toLowerCase().includes(inquirySearch.toLowerCase()) ||
      inq.contact_email.toLowerCase().includes(inquirySearch.toLowerCase()) ||
      inq.contact_name.toLowerCase().includes(inquirySearch.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Filter organizations
  const filteredOrgs = organizations.filter((org) => {
    if (!orgSearch) return true;
    const q = orgSearch.toLowerCase();
    return (
      org.name.toLowerCase().includes(q) ||
      org.code.toLowerCase().includes(q) ||
      org.contactEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header (Chuẩn Ảnh 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Yêu cầu &amp; quản trị tổ chức B2B
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Xử lý hồ sơ Business, hợp đồng dịch vụ và gia hạn tenant.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => alert('Xuất danh sách hồ sơ B2B ra file Excel.')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất danh sách</span>
          </button>
          <button
            onClick={() => {
              if (inquiries.length > 0) {
                setSelectedInquiry(inquiries[0]);
                setIsActivateModalOpen(true);
              } else {
                alert('Không có hồ sơ B2B nào đang chờ duyệt.');
              }
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Duyệt hồ sơ B2B</span>
          </button>
        </div>
      </div>

      {/* 2. Tabs (Chuẩn Ảnh 4) */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'requests'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Yêu cầu Business</span>
        </button>
        <button
          onClick={() => setActiveTab('organizations')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'organizations'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tổ chức &amp; gói</span>
        </button>
        <button
          onClick={() => setActiveTab('renewals')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'renewals'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Hàng đợi gia hạn</span>
        </button>
      </div>

      {/* 3. Main 2-Column Layout (Chuẩn Ảnh 4: 8 Cols Table + 4 Cols Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Data Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                placeholder="Tìm theo tên đơn vị, người liên hệ, email, mã hồ sơ..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs text-neutral-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              />
            </div>

            <select
              value={inquiryStatusFilter}
              onChange={(e) => setInquiryStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              <option value="ALL">Trạng thái: Tất cả</option>
              <option value="NEW">Mới</option>
              <option value="IN_PROGRESS">Đang xử lý</option>
              <option value="ACTIVATED">Đã kích hoạt</option>
            </select>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-medium">
                    <th className="py-3 px-4">Đơn vị</th>
                    <th className="py-3 px-4">Người liên hệ</th>
                    <th className="py-3 px-4">Quy mô</th>
                    <th className="py-3 px-4">Gói đề xuất</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Cập nhật</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                  {filteredInquiries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {loadingInquiries ? 'Đang tải danh sách hồ sơ...' : 'Không có yêu cầu B2B nào.'}
                      </td>
                    </tr>
                  ) : (
                    filteredInquiries.slice(0, 8).map((inq) => {
                      const rawStatus = (inq as any).status || 'NEW';
                      const isActivated = ['ACTIVATED', 'APPROVED'].includes(rawStatus);
                      const isInProgress = ['IN_PROGRESS', 'CONTACTED', 'PROPOSAL_SENT'].includes(rawStatus);

                      return (
                        <tr key={inq.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition-colors">
                          {/* Đơn vị */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                              <div>
                                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                  {inq.org_name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {(inq as any).website || `${inq.org_name.toLowerCase().replace(/\s+/g, '')}.edu.vn`}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Người liên hệ */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-neutral-800 dark:text-zinc-200">
                              {inq.contact_name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {inq.contact_email}
                            </div>
                          </td>

                          {/* Quy mô */}
                          <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-zinc-300">
                            {inq.expected_learners ? `${inq.expected_learners.toLocaleString('vi-VN')} người dùng` : '500 người dùng'}
                          </td>

                          {/* Gói đề xuất */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                              {inq.expected_learners && inq.expected_learners > 1000 ? 'Enterprise' : 'Business Pro'}
                            </span>
                          </td>

                          {/* Trạng thái */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isActivated ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Đã kích hoạt
                              </span>
                            ) : isInProgress ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Đang xử lý
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Mới
                              </span>
                            )}
                          </td>

                          {/* Cập nhật */}
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            Hôm nay, 14:26
                          </td>

                          {/* Thao tác */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedInquiry(inq);
                                  setIsActivateModalOpen(true);
                                }}
                                className="text-xs font-semibold text-neutral-800 hover:text-blue-600 dark:text-zinc-200 dark:hover:text-blue-400"
                              >
                                Xem hồ sơ
                              </button>
                              <button className="p-1 rounded text-slate-400 hover:text-slate-600">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-zinc-800">
              <AdminPagination
                currentPage={1}
                totalPages={Math.ceil(Math.max(1, filteredInquiries.length) / 8)}
                totalRecords={filteredInquiries.length > 0 ? filteredInquiries.length : 284}
                recordsPerPage={8}
              />
            </div>
          </div>
        </div>

        {/* Right Column: 3 Analytics & Guidance Cards (4 Cols - Chuẩn Ảnh 4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Tổng quan hợp đồng B2B (Grid 2x2) */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
              <div>
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Tổng quan hợp đồng B2B
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tình hình tổ chức, phê duyệt và sử dụng dịch vụ trên toàn nền tảng.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                <span className="text-[11px] text-slate-500">Tổ chức đang hoạt động</span>
                <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
                  412
                </div>
                <span className="text-[10px] text-blue-600 font-medium">↗ 4,6% so với 30 ngày trước</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                <span className="text-[11px] text-slate-500">Hồ sơ chờ duyệt</span>
                <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
                  37
                </div>
                <span className="text-[10px] text-blue-600 font-medium">↗ 12,1% so với 7 ngày trước</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                <span className="text-[11px] text-slate-500">Gia hạn sắp đến hạn</span>
                <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
                  56
                </div>
                <span className="text-[10px] text-slate-400">Trong 30 ngày tới</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                <span className="text-[11px] text-slate-500">Tỷ lệ sử dụng chỗ ngồi</span>
                <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
                  76,4%
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 mt-1.5 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '76.4%' }} />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">313.620 / 410.000 seat</span>
              </div>
            </div>
          </div>

          {/* Card 2: Phân bổ tổ chức theo gói dịch vụ (Donut Chart representation) */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Tổ chức hoạt động theo gói dịch vụ
              </h3>
              <p className="text-[11px] text-slate-400">
                Phân bổ 412 tổ chức đang hoạt động.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Donut circle */}
              <div className="w-24 h-24 rounded-full border-8 border-blue-600 flex flex-col items-center justify-center shrink-0">
                <span className="text-base font-bold text-neutral-900 dark:text-white tabular-nums">412</span>
                <span className="text-[10px] text-slate-400">tổ chức</span>
              </div>

              {/* Legend breakdown */}
              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-slate-600 dark:text-zinc-300">Enterprise</span>
                  </div>
                  <div className="font-semibold tabular-nums text-slate-800 dark:text-zinc-200">
                    42,2% <span className="font-normal text-slate-400 text-[11px]">(174)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-slate-600 dark:text-zinc-300">Business Pro</span>
                  </div>
                  <div className="font-semibold tabular-nums text-slate-800 dark:text-zinc-200">
                    32,5% <span className="font-normal text-slate-400 text-[11px]">(134)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-300" />
                    <span className="text-slate-600 dark:text-zinc-300">Business</span>
                  </div>
                  <div className="font-semibold tabular-nums text-slate-800 dark:text-zinc-200">
                    20,4% <span className="font-normal text-slate-400 text-[11px]">(84)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-slate-600 dark:text-zinc-300">Khác</span>
                  </div>
                  <div className="font-semibold tabular-nums text-slate-800 dark:text-zinc-200">
                    4,9% <span className="font-normal text-slate-400 text-[11px]">(20)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Quy trình quản trị tổ chức B2B */}
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/25 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <h4 className="font-bold">Quy trình quản trị tổ chức B2B</h4>
            </div>
            <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
              Quản lý toàn bộ vòng đời tổ chức Business trên NEXA:
            </p>
            <ul className="text-[11px] text-blue-800/90 dark:text-blue-300/90 space-y-1.5 list-disc pl-5">
              <li>Tiếp nhận và thẩm định hồ sơ Business.</li>
              <li>Phê duyệt, kích hoạt tenant và gói dịch vụ.</li>
              <li>Theo dõi hợp đồng, sử dụng seat và gia hạn.</li>
              <li>Đảm bảo tuân thủ, an toàn và hiệu quả vận hành đa tổ chức.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Activation Modal */}
      {selectedInquiry && (
        <ActivateBusinessModal
          isOpen={isActivateModalOpen}
          inquiry={selectedInquiry}
          onClose={() => {
            setIsActivateModalOpen(false);
            setSelectedInquiry(null);
          }}
          onSuccess={() => {
            fetchInquiries();
            fetchOrganizations();
          }}
        />
      )}
    </div>
  );
}
