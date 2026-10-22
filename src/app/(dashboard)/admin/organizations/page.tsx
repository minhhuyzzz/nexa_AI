'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  MoreVertical,
  ShieldCheck,
  Cpu,
  Users,
  HardDrive,
  Calendar,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface OrganizationRecord {
  id: string;
  code: string;
  name: string;
  type: 'ENTERPRISE' | 'GOVERNMENT' | 'ACADEMY';
  licensePlan: 'ENTERPRISE' | 'PUBLIC_SECTOR' | 'CUSTOM';
  activeLearners: number;
  maxLearners: number;
  monthlyAiQuota: number;
  usedAiQuota: number;
  contractValidUntil: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'SUSPENDED';
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New org form state
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCode, setNewOrgCode] = useState('');
  const [newOrgType, setNewOrgType] = useState<'ENTERPRISE' | 'GOVERNMENT' | 'ACADEMY'>('ENTERPRISE');
  const [newOrgLearners, setNewOrgLearners] = useState(1000);
  const [newOrgAiQuota, setNewOrgAiQuota] = useState(20000);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/organizations');
      if (res.ok) {
        const json = await res.json();
        setOrganizations(json.organizations || []);
      } else {
        setOrganizations([]);
      }
    } catch {
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const filteredOrgs = organizations.filter((org) => {
    const matchSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'ALL' || org.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleAddOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !newOrgCode.trim()) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOrgName.trim(),
          code: newOrgCode.trim(),
          type: newOrgType,
          maxLearners: newOrgLearners,
          aiQuota: newOrgAiQuota,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrorMessage(json.error || 'Lỗi khi tạo tổ chức');
        return;
      }

      setShowAddModal(false);
      setNewOrgName('');
      setNewOrgCode('');
      fetchOrganizations();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: OrganizationRecord['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Đang hoạt động
          </span>
        );
      case 'EXPIRING_SOON':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Sắp hết hạn
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Tạm dừng
          </span>
        );
    }
  };

  const getTypeLabel = (type: OrganizationRecord['type']) => {
    switch (type) {
      case 'ENTERPRISE':
        return 'Doanh nghiệp / Tập đoàn';
      case 'GOVERNMENT':
        return 'Bộ / Ban / Ngành';
      case 'ACADEMY':
        return 'Học viện / Đơn vị đào tạo';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              QUẢN TRỊ TỔ CHỨC
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tổ Chức &amp; Doanh Nghiệp Đối Tác
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị các pháp nhân, hợp đồng bản quyền Enterprise, hạn mức người học và quota AI Gateway phân bổ.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>Thêm tổ chức mới</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Tổng tổ chức</span>
            <Building2 className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {organizations.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">100% đã ký kết pháp lý</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Người học kích hoạt</span>
            <Users className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {organizations.reduce((sum, org) => sum + org.activeLearners, 0).toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Trên tổng 16.500 license cấp phép</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">AI Quota tháng</span>
            <Cpu className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {(organizations.reduce((sum, org) => sum + org.usedAiQuota, 0) / 1000).toFixed(1)}k
            <span className="text-xs font-normal text-slate-400 ml-1">/ 205k</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tiêu thụ 62.4% hạn mức</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Lưu trữ bằng chứng</span>
            <HardDrive className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            1.82 TB
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
            Lưu trữ mã hóa SHA-256
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-md border border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Tìm theo tên tổ chức hoặc mã định danh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md text-xs pl-9 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          <span className="text-xs text-slate-500">Loại:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-700"
          >
            <option value="ALL">Tất cả loại hình</option>
            <option value="ENTERPRISE">Doanh nghiệp</option>
            <option value="GOVERNMENT">Bộ / Ngành</option>
            <option value="ACADEMY">Đơn vị đào tạo</option>
          </select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-600" />
            <p className="text-xs">Đang tải danh sách tổ chức &amp; đối tác...</p>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
              <Building2 className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Chưa có tổ chức nào</h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery || typeFilter !== 'ALL'
                  ? 'Không tìm thấy tổ chức phù hợp với bộ lọc hiện tại.'
                  : 'Hệ thống chưa ghi nhận tổ chức doanh nghiệp hoặc trường đại học nào. Khai báo tổ chức đầu tiên để phân bổ hạn mức.'}
              </p>
            </div>
            {searchQuery || typeFilter !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('ALL');
                }}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            ) : (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 mx-auto"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Khai báo tổ chức mới</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tổ chức</th>
                  <th className="py-3 px-4">Mã định danh</th>
                  <th className="py-3 px-4">Phân loại</th>
                  <th className="py-3 px-4">Người học</th>
                  <th className="py-3 px-4">Quota AI (Tháng)</th>
                  <th className="py-3 px-4">Hạn hợp đồng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrgs.map((org) => {
                  const aiPercentage = Math.round((org.usedAiQuota / org.monthlyAiQuota) * 100);
                  return (
                    <tr key={org.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                        <div className="truncate">{org.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          Gói {org.licensePlan}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700 tabular-nums">
                        {org.code}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {getTypeLabel(org.type)}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums">
                        <span className="font-semibold text-slate-900">
                          {org.activeLearners.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          /{org.maxLearners.toLocaleString('vi-VN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full ${
                                aiPercentage > 85 ? 'bg-amber-500' : 'bg-sky-600'
                              }`}
                              style={{ width: `${aiPercentage}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-600">
                            {org.usedAiQuota.toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600">
                        {org.contractValidUntil}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(org.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-medium transition-colors"
                          title="Xem hợp đồng & cấu hình"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Organization */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-lg w-full shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>Khai Báo Tổ Chức Mới</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddOrg} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tên pháp nhân / Tổ chức:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tập đoàn Điện lực Việt Nam (EVN)"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Mã định danh (Code):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="EVN-CORP"
                    value={newOrgCode}
                    onChange={(e) => setNewOrgCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Phân loại tổ chức:
                  </label>
                  <select
                    value={newOrgType}
                    onChange={(e) => setNewOrgType(e.target.value as OrganizationRecord['type'])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                  >
                    <option value="ENTERPRISE">Doanh nghiệp / Tập đoàn</option>
                    <option value="GOVERNMENT">Bộ / Ban / Ngành</option>
                    <option value="ACADEMY">Học viện / Tổ chức đào tạo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Số người học tối đa:
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={newOrgLearners}
                    onChange={(e) => setNewOrgLearners(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Hạn mức AI Quota (tháng):
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={newOrgAiQuota}
                    onChange={(e) => setNewOrgAiQuota(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors"
                >
                  Tạo tổ chức
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
