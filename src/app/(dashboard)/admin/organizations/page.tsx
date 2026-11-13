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
  X,
  Copy,
  Check,
  Plus,
  AlertCircle,
  Shield,
  Loader2,
  Eye,
  Ban,
  Trash2,
} from 'lucide-react';
import { ActivateBusinessModal, BusinessInquiryTarget } from '@/components/dashboard/admin/ActivateBusinessModal';
import { AdminPagination } from '@/components/dashboard/admin/AdminUIComponents';
import { Skeleton } from '@/components/ui/Skeleton';
import { CelebrationCanvas } from '@/components/ui/CelebrationCanvas';

interface OrganizationItem {
  id: string;
  code: string;
  name: string;
  type: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  expectedLearners: number;
  maxMembers?: number;
  aiCredits?: number;
  aiCreditsUsed?: number;
  expiresAt?: string | null;
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


const renderAdminSkeletonRows = (colSpan = 7) => (
  <>
    {Array.from({ length: 5 }).map((_, rIdx) => (
      <tr key={rIdx} className="">
        <td className="py-3 px-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-4 w-36" />
          </div>
        </td>
        {Array.from({ length: colSpan - 1 }).map((_, cIdx) => (
          <td key={cIdx} className="py-3 px-4">
            <Skeleton className="h-4 w-20" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

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
  const [orgStatusFilter, setOrgStatusFilter] = useState<string>('ALL');

  // Renewals State
  const [renewals, setRenewals] = useState<RenewalItem[]>([]);
  const [loadingRenewals, setLoadingRenewals] = useState(true);
  const [processingRenewalId, setProcessingRenewalId] = useState<string | null>(null);

  // Activation Modal State
  const [selectedInquiry, setSelectedInquiry] = useState<BusinessInquiryTarget | null>(null);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);

  // Organization Details Modal State
  const [selectedOrgDetail, setSelectedOrgDetail] = useState<OrganizationItem | null>(null);
  const [detailInviteUrl, setDetailInviteUrl] = useState<string | null>(null);
  const [loadingDetailInvite, setLoadingDetailInvite] = useState(false);
  const [copiedDetailInvite, setCopiedDetailInvite] = useState(false);
  const [activeOrgMenuId, setActiveOrgMenuId] = useState<string | null>(null);

  // Create B2B Org & Invite Owner Modal State
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCode, setNewOrgCode] = useState('');
  const [newOrgOwnerEmail, setNewOrgOwnerEmail] = useState('');
  const [newOrgContactName, setNewOrgContactName] = useState('');
  const [newOrgSeats, setNewOrgSeats] = useState<number>(500);
  const [newOrgCredits, setNewOrgCredits] = useState<number>(10000);
  const [newOrgCycleMonths, setNewOrgCycleMonths] = useState<number>(12);
  const [cyclePreset, setCyclePreset] = useState<string>('12');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [createOrgError, setCreateOrgError] = useState<string | null>(null);

  // Edit Org Limits State
  const [editingSeats, setEditingSeats] = useState<number>(500);
  const [editingCredits, setEditingCredits] = useState<number>(10000);
  const [isEditingLimits, setIsEditingLimits] = useState(false);
  const [savingLimits, setSavingLimits] = useState(false);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    inviteUrl?: string;
    isDirectAssigned?: boolean;
    emailSent?: boolean;
    orgSlug?: string;
  } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);

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
      setShowCelebration(true);
      setActionToast('Đã phê duyệt và gia hạn hợp đồng B2B thành công!');
      setTimeout(() => {
        setActionToast(null);
        setShowCelebration(false);
      }, 4000);
      await fetchRenewals();
      await fetchOrganizations();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setProcessingRenewalId(null);
    }
  };

  const handleToggleOrgStatus = async (org: OrganizationItem) => {
    const nextStatus = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg =
      org.status === 'ACTIVE'
        ? `Bạn có chắc muốn tạm ngưng hoạt động của tổ chức "${org.name}"?`
        : `Bạn có chắc muốn kích hoạt lại tổ chức "${org.name}"?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: org.id, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật trạng thái');
      setActionToast(`Đã ${nextStatus === 'ACTIVE' ? 'kích hoạt' : 'tạm ngưng'} tổ chức thành công.`);
      setTimeout(() => setActionToast(null), 3000);
      await fetchOrganizations();
      if (selectedOrgDetail && selectedOrgDetail.id === org.id) {
        setSelectedOrgDetail({ ...selectedOrgDetail, status: nextStatus });
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi hệ thống');
    }
  };

  const handleDeleteOrg = async (org: OrganizationItem) => {
    const confirmMsg = `XÁC NHẬN XÓA TỔ CHỨC:\nBạn có chắc chắn muốn XÓA VĨNH VIỄN tổ chức "${org.name}"?\nThao tác này sẽ xóa sạch dữ liệu tổ chức, thành viên và các thiết lập liên quan.`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/organizations?id=${org.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa tổ chức');
      setActionToast(`Đã xóa vĩnh viễn tổ chức "${org.name}".`);
      setTimeout(() => setActionToast(null), 3000);
      if (selectedOrgDetail && selectedOrgDetail.id === org.id) {
        setSelectedOrgDetail(null);
      }
      await fetchOrganizations();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi hệ thống khi xóa tổ chức');
    }
  };

  const handleGenerateOwnerInvite = async (org: OrganizationItem) => {
    setLoadingDetailInvite(true);
    setDetailInviteUrl(null);
    try {
      const res = await fetch('/api/admin/organizations/invite-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: org.id, email: org.contactEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể tạo lời mời');
      setDetailInviteUrl(data.inviteUrl || null);
      if (data.isDirectAssigned) {
        setActionToast(`Tài khoản ${data.email} đã được tự động cấp quyền Owner!`);
        setTimeout(() => setActionToast(null), 3500);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoadingDetailInvite(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingOrg(true);
    setCreateOrgError(null);
    try {
      const cleanCode = newOrgCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOrgName.trim(),
          code: cleanCode,
          contactName: newOrgContactName.trim(),
          contactEmail: newOrgOwnerEmail.trim().toLowerCase(),
          expectedLearners: Number(newOrgSeats) || 500,
          aiCredits: Number(newOrgCredits) || 10000,
          cycleMonths: Number(newOrgCycleMonths) || 12,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể tạo tổ chức');
      setCreatedInviteUrl(data.inviteUrl || '');
      setCreatedResult({
        inviteUrl: data.inviteUrl || '',
        isDirectAssigned: Boolean(data.isDirectAssigned),
        emailSent: Boolean(data.emailSent),
        orgSlug: cleanCode.toLowerCase(),
      });
      await fetchOrganizations();
    } catch (err) {
      setCreateOrgError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo tổ chức');
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleSaveLimits = async (orgId: string) => {
    setSavingLimits(true);
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orgId,
          maxMembers: Number(editingSeats) || 500,
          aiCredits: Number(editingCredits) || 10000,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật hạn mức');
      setActionToast('Đã cập nhật hạn mức (Seats & AI Credits) thành công!');
      setTimeout(() => setActionToast(null), 3000);
      setIsEditingLimits(false);
      await fetchOrganizations();
      if (selectedOrgDetail && selectedOrgDetail.id === orgId) {
        setSelectedOrgDetail({
          ...selectedOrgDetail,
          expectedLearners: Number(editingSeats) || 500,
          maxMembers: Number(editingSeats) || 500,
          aiCredits: Number(editingCredits) || 10000,
        });
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi hệ thống');
    } finally {
      setSavingLimits(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const res = await fetch('/api/admin/organizations/export');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Xuất file Excel thất bại');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `nexa_b2b_organizations_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setActionToast('Đã xuất danh sách B2B ra file Excel (.xlsx) thành công!');
      setTimeout(() => setActionToast(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xuất file Excel');
    } finally {
      setExportingExcel(false);
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

  // Real KPI statistics computed from actual data
  const activeOrgs = organizations.filter((o) => o.status === 'ACTIVE');
  const activeOrgsCount = activeOrgs.length;
  const pendingInquiriesCount = inquiries.filter(
    (inq: any) => (inq.status || 'NEW') === 'NEW' || inq.status === 'PENDING'
  ).length;
  const pendingRenewalsCount = renewals.filter((r) => r.status === 'PENDING').length;

  const totalSeats = organizations.reduce((acc, o) => acc + (o.expectedLearners || 0), 0) || 500;
  const usedSeats = organizations.reduce((acc, o) => acc + (o.activeMembers || 0), 0);
  const seatPctNum = totalSeats > 0 ? (usedSeats / totalSeats) * 100 : 0;
  const seatPctStr = seatPctNum.toFixed(1).replace('.', ',');

  // Breakdown of organizations by operational status (All B2B orgs are on Gói Business)
  const totalOrgsCount = organizations.length;
  const activeCount = organizations.filter((o) => o.status === 'ACTIVE').length;
  const pendingCount = organizations.filter(
    (o) => o.status === 'PENDING_OWNER' || o.status === 'PENDING_CONTACT' || o.status === 'PROVISIONING'
  ).length;
  const suspendedCount = organizations.filter((o) => o.status === 'SUSPENDED').length;

  const activePct = totalOrgsCount > 0 ? ((activeCount / totalOrgsCount) * 100).toFixed(1).replace('.', ',') : '0,0';
  const pendingPct = totalOrgsCount > 0 ? ((pendingCount / totalOrgsCount) * 100).toFixed(1).replace('.', ',') : '0,0';
  const suspendedPct = totalOrgsCount > 0 ? ((suspendedCount / totalOrgsCount) * 100).toFixed(1).replace('.', ',') : '0,0';

  // Filter organizations
  const filteredOrgs = organizations.filter((org) => {
    const q = orgSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      org.name.toLowerCase().includes(q) ||
      org.code.toLowerCase().includes(q) ||
      org.contactEmail.toLowerCase().includes(q) ||
      org.contactName.toLowerCase().includes(q);

    const matchesStatus =
      orgStatusFilter === 'ALL' ||
      (orgStatusFilter === 'ACTIVE' && org.status === 'ACTIVE') ||
      (orgStatusFilter === 'SUSPENDED' && org.status === 'SUSPENDED') ||
      (orgStatusFilter === 'PENDING_OWNER' && (org.status === 'PENDING_OWNER' || org.status === 'PENDING_CONTACT'));

    return matchesSearch && matchesStatus;
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
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {exportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{exportingExcel ? 'Đang xuất...' : 'Xuất danh sách'}</span>
          </button>
          <button
            onClick={() => {
              setNewOrgName('');
              setNewOrgCode('');
              setNewOrgOwnerEmail('');
              setNewOrgContactName('');
              setNewOrgSeats(500);
              setNewOrgCredits(10000);
              setNewOrgCycleMonths(12);
              setCyclePreset('12');
              setCreatedInviteUrl(null);
              setCreatedResult(null);
              setCreateOrgError(null);
              setIsCreateOrgModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-xs font-semibold text-blue-700 dark:text-blue-300 transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Thêm tổ chức B2B</span>
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

      {actionToast && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
          <span>{actionToast}</span>
        </div>
      )}

      {/* 2. Tabs (Modern Pill Tabs, không gạch chân) */}
      <div>
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-zinc-900/80 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Yêu cầu Business</span>
          </button>
          <button
            onClick={() => setActiveTab('organizations')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'organizations'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tổ chức &amp; gói</span>
          </button>
          <button
            onClick={() => setActiveTab('renewals')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'renewals'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Hàng đợi gia hạn</span>
          </button>
        </div>
      </div>

      {/* 3. Main 2-Column Layout (Chuẩn Ảnh 4: 8 Cols Table + 4 Cols Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Data Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Sub-filter tabs for Organizations */}
          {activeTab === 'organizations' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOrgStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  orgStatusFilter === 'ALL'
                    ? 'bg-neutral-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-white dark:bg-[#111114] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850'
                }`}
              >
                <span>Tất cả</span>
                <span className="font-mono tabular-nums text-[11px] opacity-80">({totalOrgsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setOrgStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  orgStatusFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#111114] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Đang hoạt động</span>
                <span className="font-mono tabular-nums text-[11px] opacity-80">({activeCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setOrgStatusFilter('PENDING_OWNER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  orgStatusFilter === 'PENDING_OWNER'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#111114] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Chờ kích hoạt</span>
                <span className="font-mono tabular-nums text-[11px] opacity-80">({pendingCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setOrgStatusFilter('SUSPENDED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  orgStatusFilter === 'SUSPENDED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#111114] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Tạm ngưng / Cần gia hạn</span>
                <span className="font-mono tabular-nums text-[11px] opacity-80">({suspendedCount})</span>
              </button>
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={activeTab === 'organizations' ? orgSearch : inquirySearch}
                onChange={(e) => {
                  if (activeTab === 'organizations') {
                    setOrgSearch(e.target.value);
                  } else {
                    setInquirySearch(e.target.value);
                  }
                }}
                placeholder={
                  activeTab === 'organizations'
                    ? 'Tìm theo tên tổ chức, mã code, email người đại diện...'
                    : 'Tìm theo tên đơn vị, người liên hệ, email, mã hồ sơ...'
                }
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs text-neutral-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              />
            </div>

            {activeTab === 'organizations' ? (
              <select
                value={orgStatusFilter}
                onChange={(e) => setOrgStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              >
                <option value="ALL">Trạng thái: Tất cả</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="PENDING_OWNER">Chờ Owner kích hoạt</option>
                <option value="SUSPENDED">Đang tạm ngưng</option>
              </select>
            ) : (
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
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-medium">
                    {activeTab === 'requests' && (
                      <>
                        <th className="py-3 px-4">Đơn vị</th>
                        <th className="py-3 px-4">Người liên hệ</th>
                        <th className="py-3 px-4">Quy mô</th>
                        <th className="py-3 px-4">Gói đề xuất</th>
                        <th className="py-3 px-4">Trạng thái</th>
                        <th className="py-3 px-4">Cập nhật</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </>
                    )}
                    {activeTab === 'organizations' && (
                      <>
                        <th className="py-3 px-4">Tổ chức</th>
                        <th className="py-3 px-4">Người đại diện</th>
                        <th className="py-3 px-4">Hạn mức chỗ ngồi</th>
                        <th className="py-3 px-4">Thành viên thực</th>
                        <th className="py-3 px-4">Trạng thái</th>
                        <th className="py-3 px-4">Ngày tạo</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </>
                    )}
                    {activeTab === 'renewals' && (
                      <>
                        <th className="py-3 px-4">Tổ chức</th>
                        <th className="py-3 px-4">Thời hạn</th>
                        <th className="py-3 px-4">Chỗ ngồi yêu cầu</th>
                        <th className="py-3 px-4">Ghi chú</th>
                        <th className="py-3 px-4">Trạng thái</th>
                        <th className="py-3 px-4">Ngày gửi</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="">
                  {/* TAB 1: YÊU CẦU BUSINESS */}
                  {activeTab === 'requests' && (
                    loadingInquiries ? (
                      renderAdminSkeletonRows(7)
                    ) : filteredInquiries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          Không có yêu cầu B2B nào.
                        </td>
                      </tr>
                    ) : (
                      filteredInquiries.slice(0, 8).map((inq) => {
                        const rawStatus = (inq as any).status || 'NEW';
                        const isActivated = ['ACTIVATED', 'APPROVED'].includes(rawStatus);
                        const isInProgress = ['IN_PROGRESS', 'CONTACTED', 'PROPOSAL_SENT'].includes(rawStatus);

                        return (
                          <tr key={inq.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition-colors">
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
                            <td className="py-3 px-4">
                              <div className="font-medium text-neutral-800 dark:text-zinc-200">
                                {inq.contact_name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {inq.contact_email}
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-zinc-300">
                              {inq.expected_learners ? `${inq.expected_learners.toLocaleString('vi-VN')} người dùng` : '500 người dùng'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                                Gói Business
                              </span>
                            </td>
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
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              Hôm nay, 14:26
                            </td>
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
                    )
                  )}

                  {/* TAB 2: TỔ CHỨC & GÓI */}
                  {activeTab === 'organizations' && (
                    loadingOrgs ? (
                      renderAdminSkeletonRows(7)
                    ) : filteredOrgs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          Không có tổ chức nào.
                        </td>
                      </tr>
                    ) : (
                      filteredOrgs.slice(0, 8).map((org) => {
                        const isActive = org.status === 'ACTIVE';
                        const isMenuOpen = activeOrgMenuId === org.id;

                        return (
                          <tr key={org.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                                <div>
                                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                    {org.name}
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-400">
                                    {org.code}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-neutral-800 dark:text-zinc-200">
                                {org.contactName}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {org.contactEmail}
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-zinc-300 tabular-nums">
                              {org.expectedLearners.toLocaleString('vi-VN')} seat
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-medium text-neutral-900 dark:text-zinc-100 tabular-nums">
                              {org.activeMembers.toLocaleString('vi-VN')} thành viên
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Đang hoạt động
                                </span>
                              ) : org.status === 'SUSPENDED' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Đang tạm ngưng
                                </span>
                              ) : org.status === 'PENDING_OWNER' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Chờ Owner kích hoạt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                                  {org.status}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(org.createdAt).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap relative">
                              {!isActive && org.status === 'SUSPENDED' && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleOrgStatus(org)}
                                  className="mr-2 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors"
                                  title="Kích hoạt lại tổ chức này"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Kích hoạt lại</span>
                                </button>
                              )}

                              <button
                                onClick={() => setActiveOrgMenuId(isMenuOpen ? null : org.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                                title="Thao tác"
                                aria-label="Thao tác"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {isMenuOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-20"
                                    onClick={() => setActiveOrgMenuId(null)}
                                  />
                                  <div className="absolute right-4 top-10 w-44 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-lg py-1.5 z-30 text-left">
                                    <button
                                      onClick={() => {
                                        setActiveOrgMenuId(null);
                                        setDetailInviteUrl(null);
                                        setSelectedOrgDetail(org);
                                        setEditingSeats(org.maxMembers || org.expectedLearners || 500);
                                        setEditingCredits(org.aiCredits || 10000);
                                        setIsEditingLimits(false);
                                      }}
                                      className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Xem chi tiết</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveOrgMenuId(null);
                                        handleToggleOrgStatus(org);
                                      }}
                                      className={`w-full px-3 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${
                                        isActive
                                          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                          : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                      }`}
                                    >
                                      {isActive ? (
                                        <>
                                          <Ban className="w-3.5 h-3.5" />
                                          <span>Tạm ngưng</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>Kích hoạt lại</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )
                  )}

                  {/* TAB 3: HÀNG ĐỢI GIA HẠN */}
                  {activeTab === 'renewals' && (
                    loadingRenewals ? (
                      renderAdminSkeletonRows(7)
                    ) : renewals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          Không có yêu cầu gia hạn nào đang chờ xử lý.
                        </td>
                      </tr>
                    ) : (
                      renewals.slice(0, 8).map((r) => {
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {r.organizations?.name || 'Tổ chức B2B'}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400">
                                {r.organizations?.code || '—'}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-700 dark:text-zinc-300">
                              {r.period_months} tháng
                            </td>
                            <td className="py-3 px-4 tabular-nums text-slate-700 dark:text-zinc-300">
                              {r.requested_seats ? `${r.requested_seats.toLocaleString('vi-VN')} ghế` : 'Giữ nguyên'}
                            </td>
                            <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                              {r.notes || '—'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {r.status === 'PENDING' ? 'Chờ duyệt' : r.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(r.created_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {r.status === 'PENDING' ? (
                                <button
                                  onClick={() => handleApproveRenewal(r.id)}
                                  disabled={processingRenewalId === r.id}
                                  className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                >
                                  {processingRenewalId === r.id ? 'Đang duyệt...' : 'Phê duyệt'}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">Đã xử lý</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4">
              <AdminPagination
                currentPage={1}
                totalPages={Math.ceil(
                Math.max(
                  1,
                  activeTab === 'requests'
                    ? filteredInquiries.length
                    : activeTab === 'organizations'
                    ? filteredOrgs.length
                    : renewals.length
                ) / 8
              )}
                totalRecords={
                activeTab === 'requests'
                  ? filteredInquiries.length
                  : activeTab === 'organizations'
                  ? filteredOrgs.length
                  : renewals.length
              }
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
                  {activeOrgsCount}
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Tenant đang hoạt động</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                <span className="text-[11px] text-slate-500">Hồ sơ chờ duyệt</span>
                <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
                  {pendingInquiriesCount}
                </div>
                <span className="text-[10px] text-blue-600 font-medium">Hồ sơ B2B mới tiếp nhận</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                <span className="text-[11px] text-slate-500">Yêu cầu gia hạn</span>
                <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
                  {pendingRenewalsCount}
                </div>
                <span className="text-[10px] text-slate-400">Chờ xem xét duyệt</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                <span className="text-[11px] text-slate-500">Tỷ lệ sử dụng chỗ ngồi</span>
                <div className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums my-0.5">
                  {seatPctStr}%
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 mt-1.5 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, seatPctNum)}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">{usedSeats.toLocaleString('vi-VN')} / {totalSeats.toLocaleString('vi-VN')} seat</span>
              </div>
            </div>
          </div>

          {/* Card 2: Trạng thái vận hành tổ chức B2B (Donut Chart) */}
          <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Trạng thái vận hành tổ chức
              </h3>
              <p className="text-[11px] text-slate-400">
                Tổng số {totalOrgsCount} tổ chức B2B (Gói Business).
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Donut circle */}
              <div className="w-24 h-24 rounded-full flex flex-col items-center justify-center shrink-0">
                <span className="text-base font-bold text-neutral-900 dark:text-white tabular-nums">{totalOrgsCount}</span>
                <span className="text-[10px] text-slate-400">tổ chức</span>
              </div>

              {/* Legend breakdown: B2B Operational Status */}
              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 dark:text-zinc-200 font-medium">Đang hoạt động</span>
                  </div>
                  <div className="font-semibold tabular-nums text-slate-800 dark:text-zinc-100">
                    {activePct}% <span className="font-normal text-slate-400 text-[11px]">({activeCount})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-slate-600 dark:text-zinc-300">Chờ kích hoạt / Owner</span>
                  </div>
                  <div className="font-semibold tabular-nums text-slate-700 dark:text-zinc-300">
                    {pendingPct}% <span className="font-normal text-slate-400 text-[11px]">({pendingCount})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-slate-600 dark:text-zinc-300">Tạm ngưng</span>
                  </div>
                  <div className="font-semibold tabular-nums text-slate-700 dark:text-zinc-300">
                    {suspendedPct}% <span className="font-normal text-slate-400 text-[11px]">({suspendedCount})</span>
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

      {/* Organization Detail Modal */}
      {selectedOrgDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    {selectedOrgDetail.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[11px] text-slate-400">
                      Mã: {selectedOrgDetail.code}
                    </span>
                    <span className="text-slate-300 dark:text-zinc-700">•</span>
                    <a
                      href={`/org/${(selectedOrgDetail.code || '').toLowerCase()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      /org/{(selectedOrgDetail.code || '').toLowerCase()}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrgDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800">
                <div>
                  <span className="text-[11px] text-slate-400 block">Người đại diện</span>
                  <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                    {selectedOrgDetail.contactName || 'Chưa cập nhật'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Email liên hệ / Owner</span>
                  <span className="font-mono text-neutral-800 dark:text-zinc-200">
                    {selectedOrgDetail.contactEmail || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Hạn mức chỗ ngồi (seats)</span>
                  <span className="font-semibold text-neutral-800 dark:text-zinc-200 tabular-nums">
                    {selectedOrgDetail.expectedLearners.toLocaleString('vi-VN')} chỗ
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Thành viên thực tế</span>
                  <span className="font-semibold text-neutral-800 dark:text-zinc-200 tabular-nums">
                    {selectedOrgDetail.activeMembers.toLocaleString('vi-VN')} người
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Hạn mức AI Credits</span>
                  <span className="font-semibold text-neutral-800 dark:text-zinc-200 tabular-nums">
                    {(selectedOrgDetail.aiCredits ?? 10000).toLocaleString('vi-VN')} credits
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Trạng thái</span>
                  <span className={`inline-flex items-center gap-1 font-semibold ${
                    selectedOrgDetail.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      selectedOrgDetail.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`} />
                    {selectedOrgDetail.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngưng'}
                  </span>
                </div>
              </div>

              {/* Limit Configuration Card (Seats & AI Credits) */}
              <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Thiết lập hạn mức (Seats & AI Credits)</span>
                  </div>
                  {!isEditingLimits ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingLimits(true)}
                      className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 font-medium text-[11px] transition-colors"
                    >
                      Điều chỉnh hạn mức
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingLimits(false)}
                      className="px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium text-[11px] transition-colors"
                    >
                      Hủy
                    </button>
                  )}
                </div>

                {isEditingLimits ? (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 dark:text-zinc-300 mb-1">
                          Số lượng chỗ ngồi (Seats)
                        </label>
                        <input
                          type="number"
                          min={10}
                          value={editingSeats}
                          onChange={(e) => setEditingSeats(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 dark:text-zinc-300 mb-1">
                          Hạn mức AI Credits
                        </label>
                        <input
                          type="number"
                          min={1000}
                          step={1000}
                          value={editingCredits}
                          onChange={(e) => setEditingCredits(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={savingLimits}
                        onClick={() => handleSaveLimits(selectedOrgDetail.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50"
                      >
                        {savingLimits ? 'Đang lưu...' : 'Lưu hạn mức mới'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                    <span>
                      Chỗ ngồi: <strong className="text-neutral-900 dark:text-neutral-100 font-mono font-semibold">{selectedOrgDetail.expectedLearners} seat</strong>
                    </span>
                    <span>
                      AI Credits: <strong className="text-neutral-900 dark:text-neutral-100 font-mono font-semibold">{(selectedOrgDetail.aiCredits ?? 10000).toLocaleString('vi-VN')} credits</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Owner Invitation Generator */}
              <div className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-200">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Thư mời Chủ sở hữu (Owner)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateOwnerInvite(selectedOrgDetail)}
                    disabled={loadingDetailInvite}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] transition-colors disabled:opacity-50"
                  >
                    {loadingDetailInvite ? 'Đang tạo...' : 'Tạo / Lấy lại link mời'}
                  </button>
                </div>

                {detailInviteUrl && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={detailInviteUrl}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-zinc-900 font-mono text-[11px] text-neutral-800 dark:text-zinc-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(detailInviteUrl);
                          setCopiedDetailInvite(true);
                          setTimeout(() => setCopiedDetailInvite(false), 2000);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] shrink-0"
                      >
                        {copiedDetailInvite ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Gửi liên kết trên cho Owner. Nếu họ chưa có tài khoản, trang sẽ tự động hướng dẫn thiết lập mật khẩu và vào ngay workspace.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleOrgStatus(selectedOrgDetail)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedOrgDetail.status === 'ACTIVE'
                    ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {selectedOrgDetail.status === 'ACTIVE' ? 'Tạm ngưng tổ chức' : 'Kích hoạt lại'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrgDetail(null)}
                className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create B2B Org & Invite Owner Modal */}
      {isCreateOrgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  Thêm tổ chức B2B
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOrgModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdResult ? (
              <div className="py-4 space-y-3.5 text-xs">
                <CelebrationCanvas />
                {createdResult.isDirectAssigned ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-[13px]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      Tự động nâng quyền Owner thành công!
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Tài khoản <strong>{newOrgOwnerEmail}</strong> đã tồn tại trên NEXA. Hệ thống đã <strong>tự động cấp quyền Chủ sở hữu (ORG_OWNER)</strong> ngay lập tức vào tổ chức mới.
                    </p>
                    <div className="text-[11px] pt-1 flex items-center gap-1.5">
                      {createdResult.emailSent ? (
                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                          ✓ Đã gửi email thông báo bổ nhiệm tới {newOrgOwnerEmail}.
                        </span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                          <span>Chưa có RESEND_API_KEY (đã ghi log nội dung email ra terminal). Chủ sở hữu có thể đăng nhập ngay để vào workspace.</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-[13px]">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      Đã tạo tổ chức &amp; phát hành lời mời Owner!
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Tài khoản <strong>{newOrgOwnerEmail}</strong> chưa có trên NEXA. Hệ thống đã tạo lời mời với Gói Business (7 ngày hiệu lực).
                    </p>
                    <div className="text-[11px] pt-1">
                      {createdResult.emailSent ? (
                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                          ✓ Đã gửi email mời mở tài khoản tới {newOrgOwnerEmail}.
                        </span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                          <span>Chưa có RESEND_API_KEY. Hãy sao chép liên kết bên dưới để gửi cho Owner mở tài khoản:</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {createdResult.inviteUrl && (
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[11px] font-semibold text-neutral-700 dark:text-zinc-300">
                      Liên kết kích hoạt &amp; tạo tài khoản (Dự phòng):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={createdResult.inviteUrl}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (createdResult.inviteUrl) {
                            navigator.clipboard.writeText(createdResult.inviteUrl);
                            setCopiedInvite(true);
                            setTimeout(() => setCopiedInvite(false), 2000);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shrink-0"
                      >
                        {copiedInvite ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateOrgModalOpen(false);
                      setCreatedResult(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                  >
                    Hoàn tất
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateOrg} className="space-y-3.5 pt-4 text-xs">
                {createOrgError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                    {createOrgError}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                    Tên tổ chức <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Đại học Bách Khoa"
                    value={newOrgName}
                    onChange={(e) => {
                      setNewOrgName(e.target.value);
                      if (!newOrgCode) {
                        setNewOrgCode(e.target.value.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, ''));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                      Mã tổ chức <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="BK-HCM"
                      value={newOrgCode}
                      onChange={(e) => setNewOrgCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono uppercase text-neutral-900 dark:text-neutral-100"
                    />
                    <p className="mt-1 text-[11px] text-slate-400 font-mono truncate">
                      URL: /org/{newOrgCode ? newOrgCode.toLowerCase().replace(/[^a-z0-9_-]/g, '') : 'ma-to-chuc'}
                    </p>
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                      Số chỗ ngồi (Seats) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={10}
                      value={newOrgSeats}
                      onChange={(e) => setNewOrgSeats(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                    Email Quản trị viên (Owner) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@tochuc.vn"
                    value={newOrgOwnerEmail}
                    onChange={(e) => setNewOrgOwnerEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                    Người đại diện
                  </label>
                  <input
                    type="text"
                    placeholder="TS. Nguyễn Văn A"
                    value={newOrgContactName}
                    onChange={(e) => setNewOrgContactName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                      Thời hạn
                    </label>
                    <select
                      value={cyclePreset}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCyclePreset(val);
                        if (val !== 'custom') {
                          setNewOrgCycleMonths(Number(val));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="1">1 tháng (Thử nghiệm)</option>
                      <option value="3">3 tháng</option>
                      <option value="6">6 tháng</option>
                      <option value="12">12 tháng (1 năm)</option>
                      <option value="24">24 tháng (2 năm)</option>
                      <option value="36">36 tháng (3 năm)</option>
                      <option value="custom">Tùy chỉnh...</option>
                    </select>
                    {cyclePreset === 'custom' && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={newOrgCycleMonths}
                          onChange={(e) => setNewOrgCycleMonths(Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
                          className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono text-neutral-900 dark:text-neutral-100"
                          placeholder="Số tháng"
                        />
                        <span className="text-xs text-slate-500 font-medium">tháng</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                      AI Credits
                    </label>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      value={newOrgCredits}
                      onChange={(e) => setNewOrgCredits(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                    Gói dịch vụ
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Gói Business"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-medium cursor-not-allowed"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOrgModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 font-medium text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={creatingOrg}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50"
                  >
                    {creatingOrg ? 'Đang tạo...' : 'Tạo tổ chức & Mời'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Global Celebration Canvas */}
      {showCelebration && <CelebrationCanvas onComplete={() => setShowCelebration(false)} />}
    </div>
  );
}
