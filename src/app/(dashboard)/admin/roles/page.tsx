'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Crown,
  Settings,
  GraduationCap,
  BookOpen,
  Building2,
  Users,
  Search,
  Upload,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import {
  AdminNoticeBanner,
} from '@/components/dashboard/admin/AdminUIComponents';

interface RoleItem {
  id: string;
  name: string;
  description: string;
  icon: any;
  accessLevel: 'Full' | 'Scoped' | 'Read only';
  usersCount: number;
  permissionsCount: number;
  lastReviewed: string;
  owner: string;
  status: 'ACTIVE' | 'NEEDS_REVIEW';
}

const nexaCoreRoles: RoleItem[] = [
  {
    id: 'super_admin',
    name: 'Super Admin (Quản trị nền tảng)',
    description: 'Toàn quyền điều hành cao nhất, quản lý hệ thống, phân quyền và cấu hình nền tảng NEXA.',
    icon: Crown,
    accessLevel: 'Full',
    usersCount: 2,
    permissionsCount: 48,
    lastReviewed: 'Hôm nay, 14:26',
    owner: 'NEXA Platform',
    status: 'ACTIVE',
  },
  {
    id: 'evaluator',
    name: 'Chuyên gia / Giảng viên (Evaluator)',
    description: 'Biên soạn đề thi, mở phòng thi trực tiếp mã PIN, chấm tự luận Split-view và quản lý nhóm lớp.',
    icon: GraduationCap,
    accessLevel: 'Scoped',
    usersCount: 18540,
    permissionsCount: 28,
    lastReviewed: 'Hôm qua, 16:15',
    owner: 'Khảo thí & Đào tạo',
    status: 'ACTIVE',
  },
  {
    id: 'org_admin',
    name: 'Quản trị viên Tổ chức (Org Admin)',
    description: 'Điều hành workspace đơn vị, tổ chức các đợt thi tập trung (Campaign), quản lý thành viên B2B.',
    icon: Building2,
    accessLevel: 'Scoped',
    usersCount: 412,
    permissionsCount: 24,
    lastReviewed: '28 Th10, 2026',
    owner: 'Khách hàng B2B',
    status: 'ACTIVE',
  },
  {
    id: 'learner',
    name: 'Học viên (Learner)',
    description: 'Tham gia làm bài đánh giá 5 miền, theo dõi lộ trình học tập, tích lũy điểm và nhận chứng chỉ số.',
    icon: BookOpen,
    accessLevel: 'Read only',
    usersCount: 262104,
    permissionsCount: 12,
    lastReviewed: '25 Th10, 2026',
    owner: 'NEXA Platform',
    status: 'ACTIVE',
  },
];

export default function AdminRolesPage() {
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'audit'>('roles');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredRoles = nexaCoreRoles.filter((r) => {
    const matchesSearch =
      searchQuery === '' ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header (Chuẩn Ảnh 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Vai trò &amp; phân quyền hệ thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Quản lý vai trò chuẩn hóa của nền tảng NEXA: Quản trị viên, Giảng viên khảo thí, Quản trị tổ chức và Học viên.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => alert('Xuất ma trận phân quyền JSON.')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import JSON</span>
          </button>
          <button
            onClick={() => alert('Tạo vai trò mở rộng mới.')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo vai trò</span>
          </button>
        </div>
      </div>

      {/* 2. Tabs (Pill Tabs, không gạch chân) */}
      <div>
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-zinc-900/80 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Vai trò
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Bộ quyền
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Rà soát truy cập
          </button>
        </div>
      </div>

      {/* 3. Amber Notice Banner (Chuẩn Ảnh 3) */}
      <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className="font-medium">
            Hệ thống tuân thủ mô hình phân quyền 3 không gian chuẩn của NEXA: Cá nhân (Personal), Tổ chức (Business B2B) và Nền tảng (Platform Admin).
          </span>
        </div>
        <Link
          href="/admin/users"
          className="font-semibold text-amber-800 dark:text-amber-300 hover:underline inline-flex items-center gap-1 shrink-0 ml-4"
        >
          <span>Xem phân bổ người dùng</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4. Toolbar Filter (Chuẩn Ảnh 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm vai trò, quyền hoặc chủ sở hữu..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">Trạng thái: Tất cả</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="NEEDS_REVIEW">Cần rà soát</option>
          </select>
        </div>
      </div>

      {/* 5. Roles Table (Chuẩn Ảnh 3) */}
      <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 dark:bg-zinc-900/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Cấp truy cập</th>
                <th className="py-3 px-4">Người dùng</th>
                <th className="py-3 px-4">Bộ quyền</th>
                <th className="py-3 px-4">Rà soát gần nhất</th>
                <th className="py-3 px-4">Chủ sở hữu</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="">
              {filteredRoles.map((role) => {
                const IconComponent = role.icon;
                return (
                  <tr
                    key={role.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {role.name}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {role.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {role.accessLevel === 'Full' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                          Full
                        </span>
                      ) : role.accessLevel === 'Scoped' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400">
                          Scoped
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                          Read only
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-neutral-800 dark:text-zinc-200 tabular-nums">
                      {role.usersCount.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-neutral-300 font-mono">
                      {role.permissionsCount} quyền
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-neutral-400">
                      {role.lastReviewed}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-800 dark:text-zinc-200">
                      {role.owner}
                    </td>
                    <td className="py-3.5 px-4">
                      {role.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Cần rà soát
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info matching Ảnh 3 */}
        <div className="p-4 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
          <span>Hiển thị 1 – 4 trên 4 vai trò chuẩn</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px]">NEXA RBAC v3.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
