import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { QuotaEnforcementService } from '@/features/billing/services/quota-enforcement.service';

export const dynamic = 'force-dynamic';
import {
  Users,
  Calendar,
  CheckSquare,
  Award,
  ArrowRight,
  Building2,
  AlertCircle,
  PlusCircle,
  Clock,
  Sparkles,
  Cpu,
} from 'lucide-react';

export default async function OrgOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org } = await requireOrgPagePermission(slug, 'VIEW_WORKSPACE');
  const adminSupabase = createAdminClient();

  // 1. Get entitlements & member count
  const entitlements = await QuotaEnforcementService.getOrgEntitlements(adminSupabase, org.id);

  const { count: membersCount } = await adminSupabase
    .from('user_organizations')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('status', 'ACTIVE');

  // 2. Pending Membership Requests
  const { count: pendingRequestsCount } = await adminSupabase
    .from('organization_membership_requests')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('status', 'PENDING');

  // 3. Campaigns count and list
  const { data: campaigns, count: campaignsCount } = await adminSupabase
    .from('assessment_campaigns')
    .select(`
      id,
      title,
      status,
      starts_at,
      ends_at,
      created_at,
      assessments (
        title
      )
    `)
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const activeCampaigns = (campaigns || []).filter(
    (c) => c.status === 'ACTIVE' || c.status === 'SCHEDULED'
  );

  // 4. Pending Submissions to Grade
  const { count: pendingGradingCount } = await adminSupabase
    .from('assessment_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('status', 'SUBMITTED');

  const isBrandNewOrg = (membersCount || 0) <= 1 && (campaignsCount || 0) === 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">{org.name}</h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Gói Business &bull; {entitlements.contractNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                Không gian điều hành khảo thí tập trung, quản trị năng lực số và phát triển theo bằng chứng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={`/org/${slug}/campaigns/new`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Tạo đợt đánh giá</span>
            </Link>
            <Link
              href={`/org/${slug}/members`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-700 dark:text-zinc-300 text-xs font-semibold transition-colors shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" strokeWidth={1.75} />
              <span>Mời thành viên</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Operational Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
          <div className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium uppercase tracking-wider font-mono">Thành viên hoạt động</div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-2 tabular-nums">
            {membersCount || 1} <span className="text-sm font-normal text-slate-400 dark:text-neutral-500">/ {entitlements.maxSeats}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2">
            Còn lại <span className="font-mono text-neutral-800 dark:text-zinc-200 font-medium tabular-nums">{Math.max(0, entitlements.maxSeats - (membersCount || 1))}</span> ghế khả dụng
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
          <div className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium uppercase tracking-wider font-mono">Đợt đang triển khai</div>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-2 tabular-nums">
            {activeCampaigns.length} <span className="text-sm font-normal text-slate-400 dark:text-neutral-500">/ {campaignsCount || 0} đợt</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2">Đang mở làm bài &amp; thu thập bài thi</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
          <div className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium uppercase tracking-wider font-mono">Bài thi chờ chấm</div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            {pendingGradingCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2">Cần giảng viên hoặc AI hỗ trợ chấm</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
          <div className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium uppercase tracking-wider font-mono">AI Credits Hợp đồng</div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-2 tabular-nums">
            {entitlements.remainingCredits} <span className="text-sm font-normal text-slate-400 dark:text-neutral-500">/ {entitlements.aiCreditsGranted}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2">Số dư sẵn sàng cho tác vụ AI</div>
        </div>
      </div>

      {/* 3. Onboarding Wizard if Brand New Org (ORG-UI01) */}
      {isBrandNewOrg && (
        <div className="p-5 rounded-md border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
              3 Bước Thiết Lập Không Gian Vận Hành Đơn Vị
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link
              href={`/org/${slug}/members`}
              className="p-3.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-blue-300 dark:hover:border-blue-700 transition-colors block shadow-xs"
            >
              <div className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">01. Thêm thành viên</div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Tạo mã tham gia có hạn dùng hoặc tải lên tệp CSV danh sách nhân sự/học viên.
              </p>
            </Link>
            <Link
              href={`/org/${slug}/classes`}
              className="p-3.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-blue-300 dark:hover:border-blue-700 transition-colors block shadow-xs"
            >
              <div className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">02. Tạo lớp &amp; nhóm</div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Phân bổ thành viên theo khoa, phòng ban hoặc nhóm nghiên cứu để quản lý tập trung.
              </p>
            </Link>
            <Link
              href={`/org/${slug}/campaigns`}
              className="p-3.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-blue-300 dark:hover:border-blue-700 transition-colors block shadow-xs"
            >
              <div className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">03. Khởi tạo đợt đánh giá</div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Chọn đề thi DigComp chuẩn, phân công người chấm và phát hành bài khảo thí.
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* 4. Action Queue & Work Tasks (ORG-UI01) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Work Queue */}
        <div className="space-y-4 lg:col-span-1">
          <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-850">
              <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Công việc cần xử lý</h2>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>

            <div className="space-y-2">
              {/* Item 1: Pending Join Requests */}
              <Link
                href={`/org/${slug}/members`}
                className="flex items-center justify-between p-2.5 rounded border border-slate-100 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" strokeWidth={1.75} />
                  <span className="text-neutral-700 dark:text-zinc-300">Yêu cầu gia nhập chờ duyệt</span>
                </div>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded text-[11px] tabular-nums">
                  {pendingRequestsCount || 0}
                </span>
              </Link>

              {/* Item 2: Submissions pending grading */}
              <Link
                href={`/org/${slug}/grading`}
                className="flex items-center justify-between p-2.5 rounded border border-slate-100 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" strokeWidth={1.75} />
                  <span className="text-neutral-700 dark:text-zinc-300">Bài thi thực hành chờ chấm</span>
                </div>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded text-[11px] tabular-nums">
                  {pendingGradingCount || 0}
                </span>
              </Link>

              {/* Item 3: Active Campaigns */}
              <Link
                href={`/org/${slug}/campaigns`}
                className="flex items-center justify-between p-2.5 rounded border border-slate-100 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" strokeWidth={1.75} />
                  <span className="text-neutral-700 dark:text-zinc-300">Đợt thi đang mở</span>
                </div>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-[11px] tabular-nums">
                  {activeCampaigns.length}
                </span>
              </Link>
            </div>
          </div>

          {/* Quick link to Analytics */}
          <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs space-y-2">
            <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Báo cáo Năng lực 5 Miền</div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              Theo dõi sự phát triển năng lực số của đơn vị theo chuẩn DigComp và nhận diện khoảng trống.
            </p>
            <div className="pt-2">
              <Link
                href={`/org/${slug}/analytics`}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
              >
                <span>Xem báo cáo phân tích</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Campaigns Table */}
        <div className="lg:col-span-2">
          <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-850 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Đợt đánh giá gần đây</h2>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">Tiến độ và trạng thái các kỳ khảo thí đang triển khai</p>
              </div>
              <Link
                href={`/org/${slug}/campaigns`}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
                    <th className="py-2.5 px-4">Đợt đánh giá</th>
                    <th className="py-2.5 px-4">Đề thi</th>
                    <th className="py-2.5 px-4">Thời gian</th>
                    <th className="py-2.5 px-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-850 text-xs">
                  {!campaigns || campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-neutral-500 text-xs">
                        Chưa có đợt đánh giá nào. Bấm &quot;Tạo đợt đánh giá&quot; để khởi chạy kỳ thi đầu tiên.
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((c) => {
                      const assessmentTitle = Array.isArray(c.assessments)
                        ? c.assessments[0]?.title
                        : (c.assessments as any)?.title || 'Đề thi tổ chức';

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">{c.title}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-neutral-400 max-w-[200px] truncate">{assessmentTitle}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-neutral-400 tabular-nums">
                            {c.starts_at ? new Date(c.starts_at).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {c.status}
                            </span>
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
      </div>
    </div>
  );
}
