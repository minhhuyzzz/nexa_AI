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
  Ban,
  ArrowRight,
  ShieldCheck,
  Send,
  Copy,
  Check,
  X,
  AlertCircle,
  FileText,
  FileCheck2,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface OrganizationItem {
  id: string;
  code: string;
  name: string;
  type: 'EDUCATIONAL' | 'ENTERPRISE' | 'ACADEMY' | 'COMMUNITY';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  expectedLearners: number;
  activeMembers: number;
  status: 'ACTIVE' | 'PENDING_CONTACT' | 'SUSPENDED';
  notes: string;
  createdAt: string;
}

interface BusinessInquiry {
  id: string;
  org_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  org_type: 'EDUCATIONAL' | 'ENTERPRISE' | 'COMMUNITY';
  expected_learners: number;
  notes: string | null;
  status: 'NEW' | 'CONTACTED' | 'PROPOSAL_SENT' | 'REJECTED' | 'APPROVED';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export default function AdminOrganizationsPage() {
  // Main view tab: 'inquiries' (pipeline) or 'active' (real tenants)
  const [mainView, setMainView] = useState<'inquiries' | 'organizations'>('inquiries');

  // Organizations state
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // Inquiries state
  const [inquiries, setInquiries] = useState<BusinessInquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<string>('ALL');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Create Org Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    type: 'ACADEMY',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    expectedLearners: 500,
    notes: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Invite Admin Modal
  const [inviteModalOrg, setInviteModalOrg] = useState<OrganizationItem | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ORG_ADMIN' | 'EVALUATOR'>('ORG_ADMIN');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Triage Inquiry Status Modal
  const [triageInquiry, setTriageInquiry] = useState<BusinessInquiry | null>(null);
  const [triageStatus, setTriageStatus] = useState<'NEW' | 'CONTACTED' | 'PROPOSAL_SENT' | 'REJECTED'>('CONTACTED');
  const [triageNotes, setTriageNotes] = useState('');
  const [triageSubmitting, setTriageSubmitting] = useState(false);
  const [triageError, setTriageError] = useState('');

  // Approve Inquiry Contract Modal
  const [approveInquiry, setApproveInquiry] = useState<BusinessInquiry | null>(null);
  const [approveForm, setApproveForm] = useState({
    contractNumber: '',
    orgCode: '',
    maxSeats: 100,
    maxAssessments: 1000,
    aiCredits: 2000,
    startsAt: '',
    expiresAt: '',
  });
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [approveError, setApproveError] = useState('');
  const [approvedResult, setApprovedResult] = useState<{
    orgName: string;
    inviteUrl: string;
  } | null>(null);

  const fetchOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const res = await fetch('/api/admin/organizations');
      const data = await res.json();
      if (data.organizations) {
        setOrganizations(data.organizations);
      }
    } catch (e) {
      console.error('Failed to load organizations', e);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      setLoadingInquiries(true);
      const res = await fetch('/api/admin/inquiries');
      const data = await res.json();
      if (data.inquiries) {
        setInquiries(data.inquiries);
      }
    } catch (e) {
      console.error('Failed to load inquiries', e);
    } finally {
      setLoadingInquiries(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    fetchInquiries();
  }, []);

  // Filtered inquiries
  const filteredInquiries = inquiries.filter((inq) => {
    const matchesStatus =
      inquiryStatusFilter === 'ALL' || inq.status === inquiryStatusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      inq.org_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.contact_phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  // Filtered active organizations
  const activeOrgs = organizations.filter((o) => o.status === 'ACTIVE');
  const filteredOrgs = organizations.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Inquiry Counts
  const countNew = inquiries.filter((i) => i.status === 'NEW').length;
  const countContacted = inquiries.filter((i) => i.status === 'CONTACTED').length;
  const countProposal = inquiries.filter((i) => i.status === 'PROPOSAL_SENT').length;
  const countRejected = inquiries.filter((i) => i.status === 'REJECTED').length;
  const countApproved = inquiries.filter((i) => i.status === 'APPROVED').length;

  const handleUpdateStatus = async (id: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        await fetchOrganizations();
      }
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError('');

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || 'Lỗi khi tạo tổ chức');
        return;
      }

      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        code: '',
        type: 'ACADEMY',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        expectedLearners: 500,
        notes: '',
      });
      await fetchOrganizations();
    } catch (err) {
      setCreateError('Lỗi kết nối máy chủ');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteModalOrg || !inviteEmail.trim()) return;

    setInviteSubmitting(true);
    setInviteError('');
    setGeneratedInviteUrl('');

    try {
      const res = await fetch('/api/organizations/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: inviteModalOrg.id,
          email: inviteEmail.trim(),
          orgRole: inviteRole,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error || 'Lỗi khi tạo lời mời');
        return;
      }

      if (data.invitation?.inviteUrl) {
        setGeneratedInviteUrl(data.invitation.inviteUrl);
      }
    } catch (err) {
      setInviteError('Lỗi kết nối máy chủ');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triageInquiry) return;

    setTriageSubmitting(true);
    setTriageError('');

    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: triageInquiry.id,
          status: triageStatus,
          notes: triageNotes,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setTriageError(data.error || 'Lỗi cập nhật tiến độ hồ sơ');
        return;
      }

      setTriageInquiry(null);
      await fetchInquiries();
    } catch (err) {
      setTriageError('Lỗi kết nối máy chủ');
    } finally {
      setTriageSubmitting(false);
    }
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveInquiry) return;

    setApproveSubmitting(true);
    setApproveError('');
    setApprovedResult(null);

    try {
      const res = await fetch('/api/admin/organizations/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: approveInquiry.id,
          contractNumber: approveForm.contractNumber,
          orgCode: approveForm.orgCode,
          maxSeats: approveForm.maxSeats,
          maxAssessments: approveForm.maxAssessments,
          aiCredits: approveForm.aiCredits,
          startsAt: approveForm.startsAt || undefined,
          expiresAt: approveForm.expiresAt || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setApproveError(data.error || 'Lỗi phê duyệt tổ chức');
        return;
      }

      setApprovedResult({
        orgName: data.organization.name,
        inviteUrl: data.inviteUrl,
      });

      await fetchInquiries();
      await fetchOrganizations();
    } catch (err) {
      setApproveError('Lỗi kết nối máy chủ');
    } finally {
      setApproveSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              B2B ENTERPRISE &amp; ACADEMIC HUB
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản trị Khách hàng Business &amp; Trường học
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy trình phê duyệt hợp đồng, hạn mức số ghế, AI credits và bàn giao Workspace tổ chức.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              fetchInquiries();
              fetchOrganizations();
            }}
            className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
          <Link
            href="/admin/plans"
            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs"
          >
            Cấu hình hạn mức B2B
          </Link>
          <button
            onClick={() => {
              setCreateError('');
              setIsCreateOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Thêm tổ chức trực tiếp</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-200">
        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Hồ sơ liên hệ mới (Leads)</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {countNew}
          </div>
          <div className="text-[10px] text-amber-700 mt-1 font-mono">
            {countContacted + countProposal} đang tư vấn / báo giá
          </div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Tổ chức đang hoạt động</span>
            <Building2 className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {activeOrgs.length}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-mono">
            Đã cấp Entitlement &amp; Owner
          </div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Tổng thành viên hiện tại</span>
            <Users className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {organizations.reduce((sum, o) => sum + (o.activeMembers || 0), 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Giảng viên, Thẩm định &amp; Học viên
          </div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Tổng số ghế cấp phép</span>
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {organizations.reduce((sum, o) => sum + (o.expectedLearners || 0), 0).toLocaleString('vi-VN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Hạn mức hợp đồng cam kết
          </div>
        </div>
      </div>

      {/* 3. Primary Workspace Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setMainView('inquiries')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            mainView === 'inquiries'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Hồ sơ tư vấn &amp; Khách hàng tiềm năng</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">
            {inquiries.length}
          </span>
          {countNew > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500" title="Có hồ sơ mới" />
          )}
        </button>

        <button
          onClick={() => setMainView('organizations')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            mainView === 'organizations'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Tổ chức đang hoạt động (Active Tenants)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">
            {activeOrgs.length}
          </span>
        </button>
      </div>

      {/* 4. Search and Subfilters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {mainView === 'inquiries' ? (
          <div className="flex items-center gap-1.5 text-xs font-medium overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: `Tất cả (${inquiries.length})` },
              { id: 'NEW', label: `Mới (${countNew})`, dot: 'bg-amber-500' },
              { id: 'CONTACTED', label: `Đã liên hệ (${countContacted})`, dot: 'bg-sky-500' },
              { id: 'PROPOSAL_SENT', label: `Đã gửi báo giá (${countProposal})`, dot: 'bg-blue-600' },
              { id: 'APPROVED', label: `Đã duyệt (${countApproved})`, dot: 'bg-emerald-500' },
              { id: 'REJECTED', label: `Từ chối (${countRejected})`, dot: 'bg-slate-400' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setInquiryStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  inquiryStatusFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-mono">
            {filteredOrgs.length} đơn vị trong cơ sở dữ liệu
          </div>
        )}

        <div className="relative text-xs min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              mainView === 'inquiries'
                ? 'Tìm theo tên trường, người liên hệ, email...'
                : 'Tìm theo tên trường, mã đơn vị, email...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
          />
        </div>
      </div>

      {/* 5. VIEW: BUSINESS INQUIRIES PIPELINE */}
      {mainView === 'inquiries' && (
        <div className="border border-slate-200 rounded-md overflow-hidden bg-white text-xs shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[11px] font-semibold font-mono">
                  <th className="py-2.5 px-3.5 w-28">NGÀY TIẾP NHẬN</th>
                  <th className="py-2.5 px-3.5">ĐƠN VỊ / LOẠI HÌNH</th>
                  <th className="py-2.5 px-3.5">ĐẠI DIỆN LIÊN HỆ</th>
                  <th className="py-2.5 px-3.5 text-center">QUY MÔ DỰ KIẾN</th>
                  <th className="py-2.5 px-3.5 text-center">TIẾN ĐỘ TƯ VẤN</th>
                  <th className="py-2.5 px-3.5 text-right">THAO TÁC XỬ LÝ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {loadingInquiries ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Đang tải danh sách hồ sơ tư vấn B2B...
                    </td>
                  </tr>
                ) : filteredInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Không có hồ sơ nào trong trạng thái đã chọn.
                    </td>
                  </tr>
                ) : (
                  filteredInquiries.map((inq) => {
                    const statusMeta = {
                      NEW: { label: 'Mới nhận', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                      CONTACTED: { label: 'Đã liên hệ', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
                      PROPOSAL_SENT: { label: 'Đã gửi báo giá', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
                      APPROVED: { label: 'Đã duyệt hợp đồng', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      REJECTED: { label: 'Từ chối', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
                    }[inq.status];

                    return (
                      <tr key={inq.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3.5 font-mono text-slate-600 whitespace-nowrap">
                          {new Date(inq.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-900">{inq.org_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {inq.org_type === 'EDUCATIONAL'
                              ? 'Trường Đại học / Cao đẳng'
                              : inq.org_type === 'ENTERPRISE'
                              ? 'Doanh nghiệp / Tập đoàn'
                              : 'Tổ chức cộng đồng'}
                          </div>
                          {inq.notes && (
                            <div className="text-[11px] text-slate-600 mt-1 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                              &ldquo;{inq.notes}&rdquo;
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-slate-600">
                          <div className="font-medium text-slate-800">{inq.contact_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {inq.contact_email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {inq.contact_phone}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono tabular-nums">
                          <span className="font-bold text-slate-900">{inq.expected_learners}</span>
                          <span className="text-slate-400 text-[10px] ml-1">học viên</span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${statusMeta?.cls}`}
                          >
                            {statusMeta?.label}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {inq.status !== 'APPROVED' && (
                              <button
                                onClick={() => {
                                  setTriageInquiry(inq);
                                  setTriageStatus(
                                    inq.status === 'NEW'
                                      ? 'CONTACTED'
                                      : inq.status === 'CONTACTED'
                                      ? 'PROPOSAL_SENT'
                                      : (inq.status as any)
                                  );
                                  setTriageNotes(inq.notes || '');
                                  setTriageError('');
                                }}
                                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition-colors shadow-xs"
                              >
                                Tiến độ
                              </button>
                            )}

                            {inq.status !== 'APPROVED' ? (
                              <button
                                onClick={() => {
                                  setApproveInquiry(inq);
                                  const autoCode = inq.org_name
                                    .split(' ')
                                    .map((w) => w[0])
                                    .join('')
                                    .toUpperCase()
                                    .replace(/[^A-Z0-9]/g, '')
                                    .slice(0, 8);
                                  setApproveForm({
                                    contractNumber: `HD-${new Date().getFullYear()}-${autoCode || 'B2B'}-01`,
                                    orgCode: autoCode || 'ORG',
                                    maxSeats: Math.max(inq.expected_learners, 50),
                                    maxAssessments: Math.max(inq.expected_learners * 2, 500),
                                    aiCredits: Math.max(inq.expected_learners * 4, 1000),
                                    startsAt: new Date().toISOString().split('T')[0],
                                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                                      .toISOString()
                                      .split('T')[0],
                                  });
                                  setApproveError('');
                                  setApprovedResult(null);
                                }}
                                className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1"
                              >
                                <FileCheck2 className="w-3 h-3" />
                                <span>Phê duyệt hợp đồng</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-mono font-medium">
                                Đã kích hoạt tenant
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. VIEW: ACTIVE TENANT ORGANIZATIONS */}
      {mainView === 'organizations' && (
        <div className="border border-slate-200 rounded-md overflow-hidden bg-white text-xs shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[11px] font-semibold font-mono">
                  <th className="py-2.5 px-3.5 w-24">MÃ ĐƠN VỊ</th>
                  <th className="py-2.5 px-3.5">TỔ CHỨC / TRƯỜNG HỌC</th>
                  <th className="py-2.5 px-3.5">ĐẠI DIỆN LIÊN HỆ</th>
                  <th className="py-2.5 px-3.5 text-center">THÀNH VIÊN / HẠN MỨC</th>
                  <th className="py-2.5 px-3.5 text-center">TRẠNG THÁI</th>
                  <th className="py-2.5 px-3.5 text-right">THAO TÁC QUẢN TRỊ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {loadingOrgs ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Đang tải danh sách tổ chức...
                    </td>
                  </tr>
                ) : filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Không tìm thấy tổ chức nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-800">
                        {org.code}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900">{org.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {org.type === 'EDUCATIONAL' || org.type === 'ACADEMY'
                            ? 'Trường Đại học / Cao đẳng'
                            : 'Doanh nghiệp'}
                          {org.notes && ` &bull; ${org.notes}`}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        <div className="font-medium text-slate-800">{org.contactName}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          {org.contactEmail !== '—' && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {org.contactEmail}
                            </span>
                          )}
                          {org.contactPhone !== '—' && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {org.contactPhone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono tabular-nums">
                        <span className="font-bold text-slate-900">{org.activeMembers}</span>
                        <span className="text-slate-400 text-[10px] ml-1">/ {org.expectedLearners} ghế</span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {org.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Hoạt động
                          </span>
                        ) : org.status === 'PENDING_CONTACT' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Chờ kích hoạt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <Ban className="w-3 h-3 text-rose-600" />
                            Tạm khóa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/org/${org.code.toLowerCase()}/overview`}
                            className="px-2 py-1 rounded text-slate-600 hover:text-sky-600 hover:bg-slate-50 text-[11px] font-medium transition-colors"
                            title="Truy cập Workspace tổ chức"
                          >
                            Xem Org
                          </Link>
                          <button
                            onClick={() => {
                              setInviteModalOrg(org);
                              setInviteEmail(org.contactEmail !== '—' ? org.contactEmail : '');
                              setGeneratedInviteUrl('');
                              setInviteError('');
                            }}
                            className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition-colors shadow-xs"
                          >
                            Mời QTV
                          </button>
                          {org.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleUpdateStatus(org.id, 'SUSPENDED')}
                              className="px-2 py-1 rounded text-slate-400 hover:text-rose-600 text-[11px] transition-colors"
                              title="Đình chỉ tạm thời"
                            >
                              Khóa
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(org.id, 'ACTIVE')}
                              className="px-2 py-1 rounded text-emerald-600 hover:bg-emerald-50 text-[11px] font-medium transition-colors"
                            >
                              Mở khóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: TRIAGE INQUIRY STATUS */}
      {triageInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-md w-full shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Cập Nhật Tiến Độ Tư Vấn
                </h2>
                <div className="text-[11px] text-slate-500 font-mono">
                  {triageInquiry.org_name}
                </div>
              </div>
              <button
                onClick={() => setTriageInquiry(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {triageError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{triageError}</span>
              </div>
            )}

            <form onSubmit={handleTriageSubmit} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Trạng thái xử lý:
                </label>
                <select
                  value={triageStatus}
                  onChange={(e) => setTriageStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none text-xs"
                >
                  <option value="NEW">Mới (Chưa tiếp cận)</option>
                  <option value="CONTACTED">Đã liên hệ trao đổi sơ bộ</option>
                  <option value="PROPOSAL_SENT">Đã gửi bản chào giá &amp; Kế hoạch</option>
                  <option value="REJECTED">Từ chối / Không phù hợp nhu cầu</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Ghi chú nội bộ:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú về nhu cầu, cuộc gọi, thỏa thuận..."
                  value={triageNotes}
                  onChange={(e) => setTriageNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none text-xs"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTriageInquiry(null)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={triageSubmitting}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50"
                >
                  {triageSubmitting ? 'Đang lưu...' : 'Lưu trạng thái'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APPROVE INQUIRY & PROVISION ENTITLEMENT */}
      {approveInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-lg w-full shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Phê Duyệt Hợp Đồng &amp; Cấp Entitlement B2B
                </h2>
                <div className="text-[11px] text-slate-500 font-mono">
                  {approveInquiry.org_name} &bull; {approveInquiry.contact_email}
                </div>
              </div>
              <button
                onClick={() => setApproveInquiry(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {approveError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{approveError}</span>
              </div>
            )}

            {approvedResult ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đã kích hoạt tổ chức &ldquo;{approvedResult.orgName}&rdquo; và cấp hạn mức hợp đồng thành công!</span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block text-[11px]">
                    Đường dẫn kích hoạt dành cho đại diện tổ chức (ORG_OWNER):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={approvedResult.inviteUrl}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-700 select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(approvedResult.inviteUrl)}
                      className="px-3 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shrink-0 inline-flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Đã sao chép' : 'Chép link'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Gửi đường dẫn này cho khách hàng để họ kích hoạt quyền sở hữu Workspace tổ chức.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setApproveInquiry(null)}
                    className="px-4 py-1.5 rounded bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Hoàn tất &amp; Đóng
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApproveSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      Số hợp đồng: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={approveForm.contractNumber}
                      onChange={(e) => setApproveForm({ ...approveForm, contractNumber: e.target.value })}
                      placeholder="HD-2026-FPTU-01"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      Mã tổ chức (Slug code): <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={approveForm.orgCode}
                      onChange={(e) => setApproveForm({ ...approveForm, orgCode: e.target.value.toUpperCase() })}
                      placeholder="FPTU"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs uppercase focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      Số ghế học viên:
                    </label>
                    <input
                      type="number"
                      min={5}
                      required
                      value={approveForm.maxSeats}
                      onChange={(e) => setApproveForm({ ...approveForm, maxSeats: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      Lượt thi cấp phép:
                    </label>
                    <input
                      type="number"
                      min={10}
                      required
                      value={approveForm.maxAssessments}
                      onChange={(e) => setApproveForm({ ...approveForm, maxAssessments: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      AI Credits cấp:
                    </label>
                    <input
                      type="number"
                      min={50}
                      required
                      value={approveForm.aiCredits}
                      onChange={(e) => setApproveForm({ ...approveForm, aiCredits: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      Ngày bắt đầu:
                    </label>
                    <input
                      type="date"
                      value={approveForm.startsAt}
                      onChange={(e) => setApproveForm({ ...approveForm, startsAt: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      Ngày hết hạn hợp đồng:
                    </label>
                    <input
                      type="date"
                      value={approveForm.expiresAt}
                      onChange={(e) => setApproveForm({ ...approveForm, expiresAt: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600">
                  <div className="font-semibold text-slate-800 mb-0.5">Xác nhận phê duyệt:</div>
                  Hệ thống sẽ tạo tổ chức trạng thái ACTIVE, cấp hạn mức Entitlement nguyên tử, và sinh link kích hoạt bàn giao quyền ORG_OWNER cho email <strong>{approveInquiry.contact_email}</strong>.
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setApproveInquiry(null)}
                    className="px-3 py-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={approveSubmitting}
                    className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {approveSubmitting ? 'Đang kích hoạt...' : 'Xác nhận phê duyệt hợp đồng'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE ORG MANUALLY */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-lg w-full shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Thêm Cơ sở Trường học / Doanh nghiệp Mới
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Tên tổ chức / Trường học: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đại học Bách Khoa Hà Nội"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Mã định danh (Org Code): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="HUST, VNU, FPT..."
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Loại hình:
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none text-xs"
                  >
                    <option value="ACADEMY">Trường Đại học / Cao đẳng</option>
                    <option value="ENTERPRISE">Doanh nghiệp / Tập đoàn</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Người đại diện:
                  </label>
                  <input
                    type="text"
                    placeholder="TS. Nguyễn Văn A"
                    value={createForm.contactName}
                    onChange={(e) => setCreateForm({ ...createForm, contactName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Hạn mức người học:
                  </label>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    value={createForm.expectedLearners}
                    onChange={(e) => setCreateForm({ ...createForm, expectedLearners: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Email liên hệ:
                  </label>
                  <input
                    type="email"
                    placeholder="admin@hust.edu.vn"
                    value={createForm.contactEmail}
                    onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Số điện thoại:
                  </label>
                  <input
                    type="text"
                    placeholder="0912345678"
                    value={createForm.contactPhone}
                    onChange={(e) => setCreateForm({ ...createForm, contactPhone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Ghi chú hợp đồng / Phạm vi:
                </label>
                <textarea
                  rows={2}
                  placeholder="Gói khảo thí chuẩn đầu ra khóa 2024-2028..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none text-xs"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50"
                >
                  {createSubmitting ? 'Đang tạo...' : 'Tạo tổ chức'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: INVITE ADMIN MODAL */}
      {inviteModalOrg && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-md w-full shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Mời Quản Trị Viên Tổ Chức
                </h2>
                <div className="text-[11px] text-slate-500 font-mono">
                  {inviteModalOrg.name} ({inviteModalOrg.code})
                </div>
              </div>
              <button
                onClick={() => setInviteModalOrg(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            {generatedInviteUrl ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Lời mời kích hoạt đã được tạo thành công!</span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block text-[11px]">
                    Đường dẫn chấp nhận lời mời (Hiệu lực 7 ngày):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteUrl}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-700 select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedInviteUrl)}
                      className="px-3 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shrink-0 inline-flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Đã sao chép' : 'Chép link'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setInviteModalOrg(null)}
                    className="px-4 py-1.5 rounded bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-3.5">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Email người nhận lời mời: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="truongkhoa@hust.edu.vn"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Vai trò trong tổ chức:
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none text-xs"
                  >
                    <option value="ORG_ADMIN">Quản trị viên Tổ chức (ORG_ADMIN - Quản lý phòng thi &amp; sinh viên)</option>
                    <option value="EVALUATOR">Người đánh giá / Giảng viên (EVALUATOR - Coi thi &amp; Chấm bài)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOrg(null)}
                    className="px-3 py-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={inviteSubmitting || !inviteEmail.trim()}
                    className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{inviteSubmitting ? 'Đang tạo...' : 'Tạo link kích hoạt'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
