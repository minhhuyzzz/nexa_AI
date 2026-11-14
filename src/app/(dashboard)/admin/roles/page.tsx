'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Crown,
  Settings,
  BookOpenCheck,
  Building2,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Receipt,
  Lock,
} from 'lucide-react';

interface PlatformRoleItem {
  id: string;
  name: string;
  description: string;
  icon: any;
  accessLevel: 'Full' | 'Scoped';
  capabilitiesCount: number;
  capabilities: string[];
  owner: string;
  status: 'ACTIVE';
}

const nexaPlatformAdminRoles: PlatformRoleItem[] = [
  {
    id: 'SUPER_ADMIN',
    name: 'Super Admin (Toàn quyền quản trị)',
    description: 'Toàn quyền điều hành cao nhất, quản lý hệ thống, phân bổ quyền và cấu hình nền tảng NEXA.',
    icon: Crown,
    accessLevel: 'Full',
    capabilitiesCount: 8,
    capabilities: [
      'MANAGE_USERS',
      'MANAGE_ROLES',
      'VIEW_FINANCE',
      'MANAGE_FINANCE',
      'MANAGE_CONTENT',
      'OPERATE_AI',
      'MANAGE_ORGANIZATIONS',
      'MANAGE_SETTINGS',
    ],
    owner: 'NEXA Platform Core',
    status: 'ACTIVE',
  },
  {
    id: 'OPERATIONS_ADMIN',
    name: 'Quản trị Vận hành (Operations Admin)',
    description: 'Quản lý tài khoản người dùng, kích hoạt hoặc tạm dừng tổ chức B2B và điều phối vận hành.',
    icon: Building2,
    accessLevel: 'Scoped',
    capabilitiesCount: 3,
    capabilities: ['MANAGE_USERS', 'MANAGE_ORGANIZATIONS', 'MANAGE_SETTINGS'],
    owner: 'Khối Vận hành',
    status: 'ACTIVE',
  },
  {
    id: 'CONTENT_ADMIN',
    name: 'Quản trị Nội dung và Khảo thí (Content Admin)',
    description: 'Biên soạn đề thi chuẩn, quản trị cây khung năng lực số và phê duyệt câu hỏi đóng góp.',
    icon: BookOpenCheck,
    accessLevel: 'Scoped',
    capabilitiesCount: 1,
    capabilities: ['MANAGE_CONTENT'],
    owner: 'Ban Khảo thí và Đào tạo',
    status: 'ACTIVE',
  },
  {
    id: 'FINANCE_ADMIN',
    name: 'Quản trị Tài chính và Đối soát (Finance Admin)',
    description: 'Theo dõi doanh thu, đối soát thanh toán tự động, hoàn tiền và điều chỉnh gói dịch vụ.',
    icon: Receipt,
    accessLevel: 'Scoped',
    capabilitiesCount: 2,
    capabilities: ['VIEW_FINANCE', 'MANAGE_FINANCE'],
    owner: 'Phòng Tài chính',
    status: 'ACTIVE',
  },
  {
    id: 'AI_OPERATOR',
    name: 'Điều hành Cổng kết nối AI (AI Operator)',
    description: 'Cấu hình Model Router, định tuyến mô hình, kiểm soát ngân sách trần và đo lường telemetry.',
    icon: Sparkles,
    accessLevel: 'Scoped',
    capabilitiesCount: 1,
    capabilities: ['OPERATE_AI'],
    owner: 'Kỹ thuật AI',
    status: 'ACTIVE',
  },
];

const platformCapabilities = [
  {
    id: 'MANAGE_USERS',
    name: 'Quản lý người dùng',
    description: 'Tìm kiếm, xem hồ sơ, khóa hoặc mở khóa tài khoản người dùng toàn hệ thống.',
    module: 'admin-users',
  },
  {
    id: 'MANAGE_ROLES',
    name: 'Phân bổ vai trò quản trị',
    description: 'Chỉ định và thu hồi vai trò quản trị nội bộ của nền tảng.',
    module: 'admin-rbac-security',
  },
  {
    id: 'VIEW_FINANCE',
    name: 'Xem báo cáo tài chính',
    description: 'Xem bảng tổng hợp doanh thu, biến động dòng tiền và lịch sử giao dịch.',
    module: 'admin-finance',
  },
  {
    id: 'MANAGE_FINANCE',
    name: 'Đối soát và điều chỉnh tài chính',
    description: 'Thao tác đối soát ngân hàng, hoàn tiền và cập nhật trạng thái đơn hàng.',
    module: 'admin-finance',
  },
  {
    id: 'MANAGE_CONTENT',
    name: 'Quản trị khảo thí và nội dung',
    description: 'Quản trị ngân hàng đề thi chuẩn, cây khung năng lực số và duyệt bài đóng góp.',
    module: 'admin-content-staging',
  },
  {
    id: 'OPERATE_AI',
    name: 'Điều hành cổng kết nối AI',
    description: 'Cấu hình nhà cung cấp AI, quy tắc định tuyến Router và ngân sách trần hàng tháng.',
    module: 'admin-ai-gateway',
  },
  {
    id: 'MANAGE_ORGANIZATIONS',
    name: 'Quản trị tổ chức B2B',
    description: 'Kích hoạt hồ sơ B2B, gia hạn gói dịch vụ và tạm dừng tổ chức an toàn.',
    module: 'admin-org-business',
  },
  {
    id: 'MANAGE_SETTINGS',
    name: 'Cài đặt tham số hệ thống',
    description: 'Bảo trì hệ thống, chính sách điểm PTS động, SMTP và Webhook đối soát.',
    module: 'admin-system-settings',
  },
];

export default function AdminRolesPage() {
  const [activeTab, setActiveTab] = useState<'roles' | 'capabilities' | 'audit'>('roles');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoles = nexaPlatformAdminRoles.filter((r) => {
    return (
      searchQuery === '' ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.owner.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredCapabilities = platformCapabilities.filter((c) => {
    return (
      searchQuery === '' ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Phân quyền quản trị nền tảng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Bản đồ 8 năng lực bảo mật (Capabilities) và 5 vai trò quản trị nội bộ của hệ thống NEXA Platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/admin/compliance"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Nhật ký kiểm toán</span>
          </Link>
          <Link
            href="/admin/users?role=ADMIN"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Danh sách quản trị viên</span>
          </Link>
        </div>
      </div>

      {/* 2. Tabs */}
      <div>
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-zinc-900/80 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Vai trò quản trị ({nexaPlatformAdminRoles.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('capabilities')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'capabilities'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Danh mục năng lực bảo mật ({platformCapabilities.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Rà soát cơ chế bảo vệ
          </button>
        </div>
      </div>

      {/* 3. Architecture Notice Banner */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
            <Shield className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
              Kiến trúc bảo mật ba không gian, một danh tính
            </div>
            <p className="text-slate-500 dark:text-neutral-400 mt-0.5">
              Học viên (Learner) và Quản trị viên Tổ chức (Org Admin) thuộc không gian Cá nhân và Tổ chức, không phải vai trò nền tảng. Phân hệ Platform Admin được kiểm soát nghiêm ngặt bằng 8 Capability Guards ở tầng máy chủ.
            </p>
          </div>
        </div>
        <Link
          href="/admin/compliance"
          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 shrink-0"
        >
          <span>Xem kiểm toán máy chủ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4. Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm vai trò, năng lực hoặc đơn vị phụ trách..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* 5. Tab Content: Roles */}
      {activeTab === 'roles' && (
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-zinc-900/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Vai trò quản trị</th>
                  <th className="py-3 px-4">Cấp bảo mật</th>
                  <th className="py-3 px-4">Số năng lực</th>
                  <th className="py-3 px-4">Danh sách năng lực cấp phát</th>
                  <th className="py-3 px-4">Đơn vị chủ quản</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => {
                  const IconComponent = role.icon;
                  return (
                    <tr
                      key={role.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {role.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                              {role.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {role.accessLevel === 'Full' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                            Toàn quyền
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                            Phân định
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-neutral-800 dark:text-zinc-200 tabular-nums">
                        {role.capabilitiesCount} năng lực
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {role.capabilities.map((cap) => (
                            <span
                              key={cap}
                              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono text-slate-700 dark:text-zinc-300"
                            >
                              {cap}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-800 dark:text-zinc-200">
                        {role.owner}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Chuẩn hóa
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
            <span>Hiển thị {filteredRoles.length} vai trò quản trị hệ thống</span>
            <span className="font-mono text-[11px]">NEXA CAPABILITY RBAC 2026</span>
          </div>
        </div>
      )}

      {/* 5. Tab Content: Capabilities */}
      {activeTab === 'capabilities' && (
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-zinc-900/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mã năng lực (Capability)</th>
                  <th className="py-3 px-4">Tên năng lực</th>
                  <th className="py-3 px-4">Mô tả thẩm quyền</th>
                  <th className="py-3 px-4">Module bảo vệ</th>
                </tr>
              </thead>
              <tbody>
                {filteredCapabilities.map((cap) => (
                  <tr
                    key={cap.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {cap.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                      {cap.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-neutral-300">
                      {cap.description}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[11px] font-mono text-slate-700 dark:text-zinc-300">
                        {cap.module}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
            <span>Hiển thị {filteredCapabilities.length} năng lực bảo vệ máy chủ</span>
            <span className="font-mono text-[11px]">Server Guard: requirePlatformAdmin(cap)</span>
          </div>
        </div>
      )}

      {/* 5. Tab Content: Audit */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Lock className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Nguyên tắc xác thực và kiểm soát quyền truy cập
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Quy trình xác minh ba bước trên mọi yêu cầu gửi tới /api/admin/*
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                1. Phiên đăng nhập hợp lệ
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Kiểm tra người dùng đã xác thực danh tính qua Supabase Auth và phiên chưa bị thu hồi.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                2. Kiểm tra trạng thái tạm khóa
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Nếu hồ sơ có is_suspended = true, mọi yêu cầu quản trị bị chặn ngay lập tức với mã lỗi 403.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                3. Thẩm định Capability
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Hàm requirePlatformAdmin(capability) đối chiếu quyền được cấp của vai trò với hành động cụ thể.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
