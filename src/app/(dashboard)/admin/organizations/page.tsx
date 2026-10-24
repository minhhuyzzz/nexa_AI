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
  ExternalLink,
} from 'lucide-react';

interface OrganizationItem {
  id: string;
  code: string;
  name: string;
  type: 'EDUCATIONAL' | 'ENTERPRISE' | 'ACADEMY';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  expectedLearners: number;
  activeMembers: number;
  status: 'ACTIVE' | 'PENDING_CONTACT' | 'SUSPENDED';
  notes: string;
  createdAt: string;
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal
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

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/organizations');
      const data = await res.json();
      if (data.organizations) {
        setOrganizations(data.organizations);
      }
    } catch (e) {
      console.error('Failed to load organizations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const activeOrgs = organizations.filter((o) => o.status === 'ACTIVE');
  const pendingOrgs = organizations.filter((o) => o.status === 'PENDING_CONTACT');

  const filteredList = organizations.filter((item) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'active' && item.status === 'ACTIVE') ||
      (activeTab === 'pending' && item.status === 'PENDING_CONTACT');

    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contactName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

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

      if (data.inviteUrl) {
        setIsCreateOpen(false);
        setInviteModalOrg({
          id: data.organization.id,
          name: data.organization.name,
          code: data.organization.code,
          type: data.organization.type,
          contactName: data.organization.contact_name,
          contactEmail: data.organization.contact_email,
          contactPhone: data.organization.contact_phone,
          expectedLearners: data.organization.expected_learners,
          activeMembers: 0,
          status: 'ACTIVE',
          notes: data.organization.notes,
          createdAt: data.organization.created_at,
        });
        setGeneratedInviteUrl(data.inviteUrl);
      } else {
        setIsCreateOpen(false);
      }

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
            Quản trị Trường học &amp; Doanh nghiệp
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý các cơ sở giáo dục, phân bổ tài khoản người đánh giá, hạn mức học viên và tiếp nhận nhu cầu hợp tác Campus.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/plans"
            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs"
          >
            Cấu hình gói Campus
          </Link>
          <button
            onClick={() => {
              setCreateError('');
              setIsCreateOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Thêm tổ chức mới</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-200">
        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Cơ sở đang hoạt động</span>
            <Building2 className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {activeOrgs.length}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 font-mono">
            Đã kích hoạt &amp; cấp mã PIN
          </div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Yêu cầu liên hệ B2B</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {pendingOrgs.length}
          </div>
          <div className="text-[10px] text-amber-700 mt-1 font-mono">
            Chờ tư vấn &amp; ký kết gói
          </div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Tổng thành viên tổ chức</span>
            <Users className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {organizations.reduce((sum, o) => sum + (o.activeMembers || 0), 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Giảng viên &amp; Học viên trực thuộc
          </div>
        </div>

        <div className="p-2.5 bg-white rounded border border-slate-200/80">
          <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
            <span>Hạn mức phục vụ cấp phép</span>
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {organizations.reduce((sum, o) => sum + (o.expectedLearners || 0), 0).toLocaleString('vi-VN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Quy mô sinh viên tối đa
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'active' ? 'bg-white' : 'bg-emerald-600'}`} />
            <span>Đang hoạt động ({activeOrgs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'pending' ? 'bg-white' : 'bg-amber-500'}`} />
            <span>Yêu cầu liên hệ B2B ({pendingOrgs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả ({organizations.length})
          </button>
        </div>

        <div className="relative text-xs min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên trường, mã, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
          />
        </div>
      </div>

      {/* 4. Organizations Table */}
      <div className="border border-slate-200 rounded-md overflow-hidden bg-white text-xs shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[11px] font-semibold font-mono">
                <th className="py-2.5 px-3.5 w-24">MÃ ĐƠN VỊ</th>
                <th className="py-2.5 px-3.5">TỔ CHỨC / TRƯỜNG HỌC</th>
                <th className="py-2.5 px-3.5">ĐẠI DIỆN LIÊN HỆ</th>
                <th className="py-2.5 px-3.5 text-center">QUY MÔ / THÀNH VIÊN</th>
                <th className="py-2.5 px-3.5 text-center">TRẠNG THÁI</th>
                <th className="py-2.5 px-3.5 text-right">THAO TÁC QUẢN TRỊ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Đang tải danh sách tổ chức đối tác...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy tổ chức nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredList.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-800">
                      {org.code}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-900">{org.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {org.type === 'EDUCATIONAL' || org.type === 'ACADEMY' ? 'Trường Đại học / Cao đẳng' : 'Doanh nghiệp'}
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
                      <span className="text-slate-400 text-[10px] ml-1">/ {org.expectedLearners} sv</span>
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
                          Chờ tư vấn
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <Ban className="w-3 h-3 text-rose-600" />
                          Tạm khóa
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {org.status === 'PENDING_CONTACT' ? (
                          <button
                            onClick={() => handleUpdateStatus(org.id, 'ACTIVE')}
                            className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold transition-colors shadow-xs"
                          >
                            Kích hoạt đơn vị
                          </button>
                        ) : (
                          <>
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
                          </>
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

      {/* CREATE MODAL */}
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

      {/* INVITE MODAL */}
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
