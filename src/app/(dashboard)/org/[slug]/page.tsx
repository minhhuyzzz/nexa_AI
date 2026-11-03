import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { QuotaEnforcementService } from '@/features/billing/services/quota-enforcement.service';
import { OrgCompetencyAnalyticsService } from '@/features/analytics/services/org-competency-analytics.service';
import { OrgMemberOverviewView, type MemberAssignedCampaign } from '@/components/dashboard/org/OrgMemberOverviewView';
import {
  Building2,
  Users,
  FolderKanban,
  Calendar,
  BarChart2,
  PlusCircle,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatVnDate(dateStr?: string | null) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export default async function OrgOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await requireOrgPagePermission(slug, 'VIEW_WORKSPACE');
  const { organization: org, role, isSuperadmin, user } = context;
  const adminSupabase = createAdminClient();

  const isOwnerOrAdmin = isSuperadmin || role === 'ORG_OWNER' || role === 'ORG_ADMIN';
  const isMember = role === 'MEMBER';

  // ==========================================
  // 1. MEMBER ISOLATION VIEW (Sinh viên / Nhân sự)
  // ==========================================
  if (isMember && !isOwnerOrAdmin) {
    const { data: memberClasses } = await adminSupabase
      .from('class_members')
      .select('class_id, evaluator_classes!inner(organization_id)')
      .eq('user_id', user.id)
      .eq('evaluator_classes.organization_id', org.id);

    const classIds = (memberClasses || []).map((mc) => mc.class_id);

    let assignedCampaigns: MemberAssignedCampaign[] = [];
    if (classIds.length > 0) {
      const { data: campaigns } = await adminSupabase
        .from('assessment_campaigns')
        .select(`
          id,
          title,
          status,
          ends_at,
          class_ids,
          assessments (
            title,
            duration_minutes
          )
        `)
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false });

      const relevantCampaigns = (campaigns || []).filter((c) => {
        const cClassIds = Array.isArray(c.class_ids) ? c.class_ids : [];
        return cClassIds.some((cid) => classIds.includes(cid));
      });

      const cIds = relevantCampaigns.map((c) => c.id);
      let userSubmissions: any[] = [];
      if (cIds.length > 0) {
        const { data: subs } = await adminSupabase
          .from('assessment_submissions')
          .select('id, campaign_id, status, percentage, is_passed')
          .eq('user_id', user.id)
          .in('campaign_id', cIds);
        userSubmissions = subs || [];
      }

      assignedCampaigns = relevantCampaigns.map((c) => {
        const sub = userSubmissions.find((s) => s.campaign_id === c.id);
        const asm = Array.isArray(c.assessments) ? c.assessments[0] : (c.assessments as any);

        return {
          id: c.id,
          title: c.title,
          assessmentTitle: asm?.title || 'Đề thi đánh giá',
          durationMinutes: asm?.duration_minutes || 45,
          endsAt: c.ends_at,
          status: c.status,
          submissionStatus: sub ? sub.status : 'NOT_STARTED',
          score: sub?.percentage ?? null,
          isPassed: sub?.is_passed ?? null,
        };
      });
    }

    const { data: allUserSubs } = await adminSupabase
      .from('assessment_submissions')
      .select('status')
      .eq('user_id', user.id)
      .eq('organization_id', org.id);

    const evaluatedCount = (allUserSubs || []).filter((s) => s.status === 'EVALUATED').length;
    const pendingCount = (allUserSubs || []).filter((s) => s.status === 'SUBMITTED').length;

    return (
      <OrgMemberOverviewView
        orgName={org.name}
        orgSlug={slug}
        userEmail={user.email}
        assignedCampaigns={assignedCampaigns}
        evaluatedCount={evaluatedCount}
        pendingCount={pendingCount}
      />
    );
  }

  // ==========================================
  // 2. ADMIN & OPERATOR COMMAND CENTER (Clean Flat SaaS)
  // ==========================================
  const [
    entitlements,
    membersCountResult,
    classesCountResult,
    campaignsResult,
    pendingGradingResult,
    allSubmissionsResult,
  ] = await Promise.all([
    QuotaEnforcementService.getOrgEntitlements(adminSupabase, org.id),
    adminSupabase
      .from('user_organizations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('status', 'ACTIVE'),
    adminSupabase
      .from('evaluator_classes')
      .select('id, name', { count: 'exact' })
      .eq('organization_id', org.id),
    adminSupabase
      .from('assessment_campaigns')
      .select(`
        id,
        title,
        status,
        starts_at,
        ends_at,
        class_ids,
        created_at,
        assessments (
          title
        )
      `)
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(6),
    adminSupabase
      .from('assessment_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('status', 'SUBMITTED'),
    adminSupabase
      .from('assessment_submissions')
      .select('id, status, percentage, is_passed, domain_scores')
      .eq('organization_id', org.id),
  ]);

  const membersCount = membersCountResult.count || 1;
  const classesCount = classesCountResult.count || 0;
  const rawCampaigns = campaignsResult.data || [];
  const pendingGradingCount = pendingGradingResult.count || 0;
  const allSubmissions = allSubmissionsResult.data || [];

  const latestCampaign = rawCampaigns[0] || null;
  const latestCampaignTotalClasses = Array.isArray(latestCampaign?.class_ids) ? latestCampaign.class_ids.length : 0;
  const latestAsm = latestCampaign ? (Array.isArray(latestCampaign.assessments) ? latestCampaign.assessments[0] : latestCampaign.assessments) : null;

  const evaluatedCount = allSubmissions.filter((s) => s.status === 'EVALUATED').length;
  const competencySummary = OrgCompetencyAnalyticsService.aggregateOrgCompetency(allSubmissions);

  return (
    <div className="space-y-6">
      {/* 1. Unified Control Header */}
      <div className="p-5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
              {org.name}
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900">
              {entitlements.planName || 'Gói Doanh Nghiệp'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Không gian quản lý đánh giá, chẩn đoán khoảng trống và phát triển năng lực số đơn vị.
          </p>
        </div>

        {/* Quick CTA Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Link
            href={`/org/${slug}/campaigns/new`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Giao bài đánh giá</span>
          </Link>
          <Link
            href={`/org/${slug}/members`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-zinc-700 transition-colors shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Mời thành viên</span>
          </Link>
        </div>
      </div>

      {/* 2. Hero Split: Action Panel Màu Đen + Hoạt Động Gần Nhất */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Dark Action Banner */}
        <div className="lg:col-span-7 min-h-[220px] p-6 sm:p-7 rounded-xl bg-[#17213a] text-white relative overflow-hidden flex flex-col justify-between shadow-xs after:content-[''] after:absolute after:-right-[80px] after:-top-[80px] after:w-[280px] after:h-[280px] after:rounded-full after:border after:border-[#667aaf70] after:shadow-[0_0_0_40px_#28395750,0_0_0_85px_#38456633]">
          <div className="relative z-10">
            <div className="text-[10px] font-mono font-bold tracking-[0.15em] text-[#b7c6ff] uppercase mb-2">
              HÀNH ĐỘNG TIẾP THEO
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2 max-w-[380px] leading-snug">
              Tổ chức một đợt đánh giá mới.
            </h2>
            <p className="text-xs text-[#b8c1d2] max-w-[360px] leading-relaxed">
              Chọn đề đã phát hành, giao cho các nhóm/đơn vị và bắt đầu theo dõi tiến độ từ một nơi.
            </p>
          </div>
          {isOwnerOrAdmin && (
            <div className="relative z-10 mt-5">
              <Link
                href={`/org/${slug}/campaigns/new`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-[#edf2ff] text-[#17213a] text-xs font-bold transition-colors shadow-2xs self-start"
              >
                <span>Tạo đợt đánh giá</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Right: Next Panel (Hoạt động gần nhất / Sẵn sàng vận hành) */}
        <div className="lg:col-span-5 min-h-[220px] p-6 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-mono font-bold tracking-[0.14em] text-slate-400 dark:text-neutral-500 uppercase mb-2">
              HOẠT ĐỘNG GẦN NHẤT
            </div>
            {latestCampaign ? (
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${
                    latestCampaign.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : latestCampaign.status === 'SCHEDULED'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      latestCampaign.status === 'ACTIVE'
                        ? 'bg-emerald-600'
                        : latestCampaign.status === 'SCHEDULED'
                        ? 'bg-blue-600'
                        : 'bg-slate-400'
                    }`}
                  />
                  {latestCampaign.status === 'ACTIVE'
                    ? 'Đang diễn ra'
                    : latestCampaign.status === 'SCHEDULED'
                    ? 'Sắp diễn ra'
                    : 'Đã hoàn thành'}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100 mt-2.5 mb-1 line-clamp-1">
                  {latestCampaign.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                  {latestCampaignTotalClasses > 0
                    ? `${String(latestCampaignTotalClasses).padStart(2, '0')} nhóm/đơn vị tham gia`
                    : 'Toàn bộ thành viên'}
                  {latestCampaign.ends_at ? ` · Hạn nộp ngày ${formatVnDate(latestCampaign.ends_at)}` : ''}
                </p>
              </div>
            ) : (
              <div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  Sẵn sàng vận hành
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100 mt-2.5 mb-1">
                  Khởi tạo đánh giá đầu tiên
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Giao bài khảo thí chuẩn hoặc đề nội bộ tới các thành viên để bắt đầu thu thập dữ liệu năng lực số.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 dark:text-neutral-500">
              {latestCampaign ? 'Đang theo dõi' : 'Chưa có bài thi'}
            </span>
            <Link
              href={`/org/${slug}/assessments`}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Xem ngân hàng đề</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row (Calm & Balanced) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium uppercase tracking-wider">
            Thành viên hoạt động
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
            {membersCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1.5">
            Nhân sự, học viên trong tổ chức
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium uppercase tracking-wider">
            Nhóm & Đơn vị trực thuộc
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
            {classesCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1.5">
            Phòng ban, nhóm làm việc hoặc lớp học
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs">
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium uppercase tracking-wider">
            Bài khảo thí đã phê duyệt
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
            {evaluatedCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1.5">
            {pendingGradingCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {pendingGradingCount} bài đang chờ chấm
              </span>
            ) : (
              'Dữ liệu khảo thí hợp lệ'
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Operational Workbench */}
      <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              Hoạt Động Khảo Thí & Đánh Giá Năng Lực
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Các bài đánh giá mở hoặc đợt khảo thí định kỳ của tổ chức.
            </p>
          </div>
          <Link
            href={`/org/${slug}/campaigns`}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {rawCampaigns.length === 0 ? (
          /* Purposeful Minimal Onboarding (Không AI slop) */
          <div className="p-8 text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 mx-auto flex items-center justify-center">
              <Calendar className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                Sẵn sàng khởi tạo đánh giá đầu tiên
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Tổ chức có thể mở đánh giá linh hoạt bất kỳ lúc nào để khảo sát năng lực số đầu vào hoặc theo dõi định kỳ các nhóm làm việc.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2 text-left">
              <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 mb-1">
                  BƯỚC 1
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
                  Mời thành viên
                </div>
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
                  Mời nhân sự, học viên qua email hoặc mã đơn vị.
                </p>
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 mb-1">
                  BƯỚC 2
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
                  Giao bài khảo thí
                </div>
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
                  Chọn đề chuẩn DigComp hoặc biên soạn đề nội bộ.
                </p>
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 mb-1">
                  BƯỚC 3
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
                  Nhận báo cáo 5 miền
                </div>
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
                  Xem radar phân tích và đề xuất khóa bồi dưỡng.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/org/${slug}/campaigns/new`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Khởi tạo đánh giá ngay</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Structured Clean Activity Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-300 font-semibold">
                  <th className="py-2.5 px-4">Tên hoạt động khảo thí</th>
                  <th className="py-2.5 px-4 text-center">Trạng thái</th>
                  <th className="py-2.5 px-4">Thời gian</th>
                  <th className="py-2.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {rawCampaigns.map((camp: any) => {
                  const asm = Array.isArray(camp.assessments) ? camp.assessments[0] : camp.assessments;

                  return (
                    <tr key={camp.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-neutral-100">
                        <div>{camp.title}</div>
                        {asm?.title && (
                          <div className="text-[11px] text-slate-400 dark:text-neutral-500 font-normal">
                            Đề: {asm.title}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            camp.status === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40'
                              : camp.status === 'SCHEDULED'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          {camp.status === 'ACTIVE'
                            ? 'Đang diễn ra'
                            : camp.status === 'SCHEDULED'
                            ? 'Sắp diễn ra'
                            : 'Đã hoàn thành'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                        {camp.starts_at ? formatVnDate(camp.starts_at) : ''}
                        {camp.ends_at ? ` – ${formatVnDate(camp.ends_at)}` : ''}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/org/${slug}/campaigns`}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Chi tiết &amp; bài nộp
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. 5-Domain Quick Summary Card */}
      <div className="p-5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Báo Cáo Năng Lực 5 Miền Cốt Lõi
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            {evaluatedCount > 0
              ? `Điểm trung bình toàn đơn vị: ${competencySummary.overallAverageScore !== null ? `${competencySummary.overallAverageScore}đ` : 'Chưa có'} ${competencySummary.priorityGapDomain ? `· Miền ưu tiên bồi dưỡng: ${competencySummary.priorityGapDomain.domainCode} (${competencySummary.priorityGapDomain.score}đ)` : ''}`
              : 'Dữ liệu phân tích 5 miền sẽ tự động tổng hợp khi các bài thi được chấm duyệt.'}
          </p>
        </div>

        <Link
          href={`/org/${slug}/analytics`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-neutral-200 transition-colors shrink-0"
        >
          <span>Xem báo cáo chi tiết</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
