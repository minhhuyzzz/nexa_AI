import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import {
  Building2,
  Shield,
  Layers,
  Key,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org, role, isSuperadmin } = await requireOrgPagePermission(slug, 'MANAGE_SETTINGS');
  const adminSupabase = createAdminClient();

  const userRole = isSuperadmin ? 'ORG_ADMIN' : role;
  const isManager = true;

  // 3. Count current active members
  const { count: memberCount } = await adminSupabase
    .from('user_organizations')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('status', 'ACTIVE');

  const currentMembers = memberCount || 1;
  const maxSeats = org.max_members || 50;
  const seatPercent = Math.min(100, Math.round((currentMembers / maxSeats) * 100));

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
          <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Cài đặt Không gian Tổ chức</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Cấu hình & Quản trị {org.name}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý thông tin định danh, hạn ngạch tài nguyên, chính sách truy cập và bảo mật cho tổ chức.
        </p>
      </div>

      {!isManager && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="font-semibold">Chế độ chỉ đọc (Read-only)</p>
            <p className="text-amber-700 mt-0.5">
              Bạn đang tham gia tổ chức này với vai trò <span className="font-mono font-bold">{userRole}</span>. Chỉ Quản trị viên (<span className="font-mono">ORG_ADMIN</span>) hoặc Chủ sở hữu (<span className="font-mono">ORG_OWNER</span>) mới có quyền chỉnh sửa cài đặt.
            </p>
          </div>
        </div>
      )}

      {/* Grid of Settings Cards */}
      <div className="space-y-6">
        {/* 1. General Profile */}
        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              <h2 className="text-sm font-bold text-slate-900">Thông tin Định danh Đơn vị</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              {org.is_active ? 'Đang hoạt động' : 'Tạm ngưng'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1.5">Tên Tổ chức / Đơn vị</label>
              <input
                type="text"
                readOnly
                defaultValue={org.name}
                className="w-full px-3 py-2 rounded border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1.5">Mã định danh (Slug URL)</label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-slate-100 text-slate-500 border border-r-0 border-slate-200 rounded-l font-mono text-[11px]">
                  /org/
                </span>
                <input
                  type="text"
                  readOnly
                  defaultValue={org.slug}
                  className="w-full px-3 py-2 rounded-r border border-slate-200 bg-slate-50 text-slate-800 font-mono font-medium focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1.5">Loại hình tổ chức</label>
              <input
                type="text"
                readOnly
                defaultValue={
                  org.type === 'EDUCATIONAL'
                    ? 'Trường học / Cơ sở Đào tạo'
                    : org.type === 'GOVERNMENT'
                    ? 'Cơ quan Quản lý / Nhà nước'
                    : 'Doanh nghiệp / Tập đoàn'
                }
                className="w-full px-3 py-2 rounded border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1.5">Ngày khởi tạo không gian</label>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded border border-slate-200 bg-slate-50 text-slate-700 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{org.created_at ? new Date(org.created_at).toLocaleDateString('vi-VN') : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. License & Capacities */}
        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              <h2 className="text-sm font-bold text-slate-900">Gói Dịch vụ & Hạn ngạch (Entitlements)</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 font-mono">
              B2B ENTERPRISE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Member Seats */}
            <div className="p-4 rounded border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                  Ghế thành viên (Member Seats)
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {currentMembers} / {maxSeats} ({seatPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full transition-all"
                  style={{ width: `${seatPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Tổ chức đã sử dụng {currentMembers} chỗ trên tổng hạn mức {maxSeats} thành viên được cấp phép.
              </p>
            </div>

            {/* Assessment Quota */}
            <div className="p-4 rounded border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                  Hạn ngạch Khảo thí Đơn vị
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {org.quota_assessments || 500} bài
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full w-1/4" />
              </div>
              <p className="text-[11px] text-slate-500">
                Cho phép tổ chức các kỳ thi trực tiếp và bài khảo thí tiêu chuẩn theo khung năng lực DigComp.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Policies & Security */}
        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Shield className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900">Chính sách Truy cập & Bảo mật Nội bộ</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-start justify-between py-2 border-b border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Quyền gửi lời mời thành viên</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Chỉ Quản trị viên (<span className="font-mono font-medium">ORG_ADMIN</span>) mới được tạo liên kết hoặc gửi email mời người dùng mới.
                </p>
              </div>
              <span className="px-2 py-1 bg-slate-100 text-slate-700 font-mono font-medium rounded text-[11px]">
                QUẢN TRỊ VIÊN
              </span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Phạm vi chia sẻ Đề thi (Visibility Scope)</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Mặc định đề thi tạo trong workspace này được gắn phạm vi <span className="font-mono font-medium">ORGANIZATION</span> và cách ly hoàn toàn với các đơn vị khác.
                </p>
              </div>
              <span className="px-2 py-1 bg-sky-50 text-sky-700 font-mono font-medium rounded text-[11px] border border-sky-100">
                ORGANIZATION ISOLATED
              </span>
            </div>

            <div className="flex items-start justify-between py-2">
              <div>
                <p className="font-semibold text-slate-800">Cơ chế bảo vệ dữ liệu thí sinh (PII Masking)</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Khử toàn bộ thông tin cá nhân và email người thi trước khi gửi dữ liệu sang AI Gateway để chấm Rubric hoặc phân tích năng lực.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Bật tự động (Tuân thủ ND13)
              </span>
            </div>
          </div>
        </div>

        {/* 4. Danger Zone (Only for ORG_OWNER / ORG_ADMIN) */}
        {isManager && (
          <div className="bg-white border border-rose-200 rounded-md p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-rose-100">
              <AlertTriangle className="w-4 h-4 text-rose-600" strokeWidth={1.75} />
              <h2 className="text-sm font-bold text-rose-900">Vùng Quản trị Nhạy cảm (Danger Zone)</h2>
            </div>

            <p className="text-xs text-slate-600">
              Các thao tác dưới đây có thể ảnh hưởng đến quyền truy cập của toàn bộ thành viên trong tổ chức. Vui lòng cẩn trọng.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <div>
                <p className="text-xs font-bold text-slate-900">Tạm ngưng không gian làm việc này</p>
                <p className="text-[11px] text-slate-500">
                  Chuyển toàn bộ dữ liệu tổ chức sang chế độ chỉ đọc. Thành viên vẫn giữ tài khoản cá nhân.
                </p>
              </div>
              <button
                type="button"
                disabled
                title="Tính năng do Superadmin kiểm soát"
                className="px-3.5 py-1.5 rounded bg-white border border-rose-300 text-rose-700 font-medium text-xs hover:bg-rose-50 opacity-60 cursor-not-allowed"
              >
                Tạm ngưng Tổ chức
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
