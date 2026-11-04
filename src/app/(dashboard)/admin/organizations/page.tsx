'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Filter,
  AlertCircle,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { ActivateBusinessModal, BusinessInquiryTarget } from '@/components/dashboard/admin/ActivateBusinessModal';

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

  const countNew = inquiries.filter((i: any) => i.status === 'NEW').length;
  const countPendingRenewals = renewals.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Yêu cầu &amp; Quản trị Tổ chức
            </h1>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-neutral-900 dark:text-neutral-400'
          }`}
        >
          <span>Yêu cầu Business</span>
          {countNew > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono">
              {countNew} mới
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('organizations')}
          className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'organizations'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-neutral-900 dark:text-neutral-400'
          }`}
        >
          <span>Tổ chức &amp; Gói ({organizations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('renewals')}
          className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'renewals'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-neutral-900 dark:text-neutral-400'
          }`}
        >
          <span>Hàng đợi Gia hạn</span>
          {countPendingRenewals > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono">
              {countPendingRenewals} chờ duyệt
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: YÊU CẦU BUSINESS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Sub Header & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={inquiryStatusFilter}
                onChange={(e) => setInquiryStatusFilter(e.target.value)}
                className="h-8.5 px-3 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-800 dark:text-zinc-200"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="NEW">Mới ({countNew})</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="ACTIVATED">Đã kích hoạt</option>
              </select>

              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm đơn vị hoặc email..."
                  value={inquirySearch}
                  onChange={(e) => setInquirySearch(e.target.value)}
                  className="w-full h-8.5 pl-8 pr-3 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-neutral-400">
              3 trạng thái chuẩn: <strong className="text-neutral-900 dark:text-neutral-200">Mới &bull; Đang xử lý &bull; Đã kích hoạt</strong>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase">
                  <tr>
                    <th className="py-3 px-4">Đơn vị</th>
                    <th className="py-3 px-4">Người liên hệ</th>
                    <th className="py-3 px-4">Quy mô</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {loadingInquiries ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Đang tải danh sách yêu cầu...
                      </td>
                    </tr>
                  ) : filteredInquiries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Không tìm thấy yêu cầu nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredInquiries.map((inq: any) => {
                      const isActivated = ['ACTIVATED', 'APPROVED'].includes(inq.status);
                      const isNew = inq.status === 'NEW';

                      return (
                        <tr key={inq.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <strong className="block text-neutral-900 dark:text-neutral-100 font-semibold">
                              {inq.org_name}
                            </strong>
                            <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                              {inq.org_type || 'Giáo dục'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-neutral-800 dark:text-zinc-200 font-medium block">
                              {inq.contact_name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                              {inq.contact_email}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700 dark:text-zinc-300">
                            {inq.expected_learners || 100} người
                          </td>
                          <td className="py-3.5 px-4">
                            {isActivated ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                Đã kích hoạt
                              </span>
                            ) : isNew ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                                Mới
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                                <Clock className="w-3 h-3" />
                                Đang xử lý
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isActivated ? (
                              <button
                                onClick={() => setActiveTab('organizations')}
                                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 ml-auto"
                              >
                                <span>Xem tổ chức</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedInquiry(inq);
                                  setIsActivateModalOpen(true);
                                }}
                                className="h-7.5 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-xs"
                              >
                                Kích hoạt
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TỔ CHỨC & GÓI */}
      {activeTab === 'organizations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên, mã hoặc email tổ chức..."
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                className="w-full h-8.5 pl-8 pr-3 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400"
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-neutral-400">
              {filteredOrgs.length} tổ chức đang hoạt động
            </span>
          </div>

          <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase">
                  <tr>
                    <th className="py-3 px-4">Tổ chức</th>
                    <th className="py-3 px-4">Mã đơn vị</th>
                    <th className="py-3 px-4">Thành viên</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {loadingOrgs ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Đang tải danh sách tổ chức...
                      </td>
                    </tr>
                  ) : filteredOrgs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Chưa có tổ chức nào được kích hoạt.
                      </td>
                    </tr>
                  ) : (
                    filteredOrgs.map((org) => (
                      <tr key={org.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <strong className="block text-neutral-900 dark:text-neutral-100 font-semibold">
                            {org.name}
                          </strong>
                          <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                            {org.contactEmail} &bull; {org.contactName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {org.code}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700 dark:text-zinc-300">
                          {org.activeMembers} / {org.expectedLearners} ghế
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Đang hoạt động
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/org/${org.code.toLowerCase()}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 ml-auto"
                          >
                            <span>Vào không gian</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HÀNG ĐỢI GIA HẠN */}
      {activeTab === 'renewals' && (
        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase">
                  <tr>
                    <th className="py-3 px-4">Tổ chức</th>
                    <th className="py-3 px-4">Kỳ hạn đề xuất</th>
                    <th className="py-3 px-4">Ghế đề xuất</th>
                    <th className="py-3 px-4">Thời gian gửi</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {loadingRenewals ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Đang tải danh sách gia hạn...
                      </td>
                    </tr>
                  ) : renewals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Hiện không có yêu cầu gia hạn nào.
                      </td>
                    </tr>
                  ) : (
                    renewals.map((r) => {
                      const isPending = r.status === 'PENDING';
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <strong className="block text-neutral-900 dark:text-neutral-100 font-semibold">
                              {r.organizations?.name || 'Tổ chức'}
                            </strong>
                            {r.notes && (
                              <span className="text-[11px] text-slate-500 dark:text-neutral-400 block max-w-xs truncate">
                                Ghi chú: {r.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {r.period_months} tháng
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700 dark:text-zinc-300">
                            {r.requested_seats || 'Giữ nguyên'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                            {new Date(r.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-3.5 px-4">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                                <Clock className="w-3 h-3 animate-pulse" />
                                Chờ phê duyệt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                Đã duyệt
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isPending && (
                              <button
                                onClick={() => handleApproveRenewal(r.id)}
                                disabled={processingRenewalId === r.id}
                                className="h-7.5 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-xs disabled:opacity-50"
                              >
                                {processingRenewalId === r.id ? 'Đang duyệt...' : 'Xác nhận gia hạn'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kích hoạt */}
      <ActivateBusinessModal
        isOpen={isActivateModalOpen}
        onClose={() => {
          setIsActivateModalOpen(false);
          setSelectedInquiry(null);
        }}
        inquiry={selectedInquiry}
        onSuccess={() => {
          fetchInquiries();
          fetchOrganizations();
        }}
      />
    </div>
  );
}
