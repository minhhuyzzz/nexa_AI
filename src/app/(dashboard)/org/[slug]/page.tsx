import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { QuotaEnforcementService } from '@/features/billing/services/quota-enforcement.service';
import { OrgCompetencyAnalyticsService } from '@/features/analytics/services/org-competency-analytics.service';
import { OrgCodeCopyPill } from '@/components/dashboard/org/OrgCodeCopyPill';
import {
  Users,
  FolderKanban,
  Calendar,
  BarChart2,
  PlusCircle,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  ChevronRight,
  GraduationCap,
  FileText,
  Radio,
  ShieldCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatVnDate(dateStr?: string | null) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
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
  const { organization: org, role, isSuperadmin } = context;
  const adminSupabase = createAdminClient();
  const isOwnerOrAdmin = isSuperadmin || role === 'ORG_OWNER' || role === 'ORG_ADMIN';

  // ==========================================
  // FETCH EXECUTIVE OPERATIONAL DATA
  // ==========================================
  const [
    entitlements,
    membersCountResult,
    classesResult,
    campaignsResult,
    orgAssessmentsResult,
  ] = await Promise.all([
    QuotaEnforcementService.getOrgEntitlements(adminSupabase, org.id),
    adminSupabase
      .from('user_organizations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('status', 'ACTIVE'),
    adminSupabase
      .from('evaluator_classes')
      .select(`
        id,
        name,
        class_code,
        term,
        group_type,
        status,
        created_at,
        class_members ( id ),
        class_assignments ( id )
      `)
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false }),
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
          id,
          title
        )
      `)
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(5),
    adminSupabase
      .from('assessments')
      .select('id, title, status')
      .eq('organization_id', org.id),
  ]);

  const rawClasses = classesResult.data || [];
  const rawCampaigns = campaignsResult.data || [];
  const classIds = rawClasses.map((c: any) => c.id);
  const campaignIds = rawCampaigns.map((c: any) => c.id);
  const assessmentIds = (orgAssessmentsResult.data || []).map((a: any) => a.id);

  // Fetch assignments belonging to org classes
  let assignmentIds: string[] = [];
  if (classIds.length > 0) {
    const { data: assignments } = await adminSupabase
      .from('class_assignments')
      .select('id')
      .in('class_id', classIds);
    assignmentIds = (assignments || []).map((a: any) => a.id);
  }

  // Build OR condition for submissions belonging to org
  const conditions: string[] = [];
  if (assignmentIds.length > 0) {
    conditions.push(`class_assignment_id.in.(${assignmentIds.join(',')})`);
  }
  if (campaignIds.length > 0) {
    conditions.push(`campaign_id.in.(${campaignIds.join(',')})`);
  }
  if (assessmentIds.length > 0) {
    conditions.push(`assessment_id.in.(${assessmentIds.join(',')})`);
  }

  let allSubmissions: any[] = [];
  let pendingGradingCount = 0;

  if (conditions.length > 0) {
    const { data: subs } = await adminSupabase
      .from('assessment_submissions')
      .select('id, status, percentage, is_passed, domain_scores')
      .or(conditions.join(','));

    allSubmissions = subs || [];
    pendingGradingCount = allSubmissions.filter((s: any) => s.status === 'SUBMITTED').length;
  }

  const membersCount = membersCountResult.count || 1;
  const classesCount = rawClasses.length;
  const evaluatedCount = allSubmissions.filter((s: any) => s.status === 'EVALUATED').length;
  const competencySummary = OrgCompetencyAnalyticsService.aggregateOrgCompetency(allSubmissions);

  // Active campaigns
  const activeCampaigns = rawCampaigns.filter((c: any) => c.status === 'ACTIVE');
  const recentClasses = rawClasses.slice(0, 4);

  // Monogram letters
  const orgInitials = org.name
    ? org.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
    : 'NX';

  return (
    <div className="space-y-6 pb-12">
      {/* ============================================================ */}
      {/* 1. EXECUTIVE COMMAND BANNER WITH ARTWORK BACKGROUND         */}
      {/* ============================================================ */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 sm:p-6 shadow-xs">
        {/* Background Banner Image with Refined Contrast Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <Image
            src="/images/dashboard/Banner Tổng quan.jpg"
            alt="NEXA Organization Banner"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-right opacity-30 dark:opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-[#111114] dark:via-[#111114]/90 dark:to-transparent" />
        </div>

        {/* Banner Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Org Identity */}
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-blue-600 text-white font-extrabold text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-sm tracking-wider select-none border border-blue-500/30">
              {orgInitials}
            </div>
            <div>
              <div className="mb-0.5">
                <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">
                  @{org.slug}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {org.name}
              </h1>
            </div>
          </div>

          {/* Fast Action Command Bar */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {isOwnerOrAdmin && (
              <Link
                href={`/org/${slug}/campaigns/new`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <PlusCircle className="w-4 h-4" strokeWidth={1.75} />
                <span>Giao đề đánh giá</span>
              </Link>
            )}
            <Link
              href={`/org/${slug}/classes`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors shadow-xs backdrop-blur-xs"
            >
              <FolderKanban className="w-4 h-4 text-slate-500 dark:text-neutral-400" strokeWidth={1.75} />
              <span>Tạo Lớp học</span>
            </Link>
            <Link
              href={`/org/${slug}/members`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors shadow-xs backdrop-blur-xs"
            >
              <UserPlus className="w-4 h-4 text-slate-500 dark:text-neutral-400" strokeWidth={1.75} />
              <span>Mời thành viên</span>
            </Link>
            <Link
              href={`/org/${slug}/live-room`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors shadow-xs backdrop-blur-xs"
            >
              <Radio className="w-4 h-4 text-slate-500 dark:text-neutral-400" strokeWidth={1.75} />
              <span>Phòng thi Live</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. EXECUTIVE 4-PILLAR KPI METRICS GRID                       */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Thành viên & Người học */}
        <Link
          href={`/org/${slug}/members`}
          className="group p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Thành viên đơn vị
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
              {membersCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Nhân sự &amp; người học hoạt động
            </div>
          </div>
          <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
            <span>Quản lý thành viên</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Card 2: Lớp học & Không gian đào tạo */}
        <Link
          href={`/org/${slug}/classes`}
          className="group p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Lớp học &amp; Đơn vị
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
              {classesCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Không gian đào tạo đang mở
            </div>
          </div>
          <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
            <span>Danh sách lớp học</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Card 3: Đợt khảo thí số */}
        <Link
          href={`/org/${slug}/campaigns`}
          className="group p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Đợt khảo thí
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
              {rawCampaigns.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {activeCampaigns.length > 0
                ? `${activeCampaigns.length} đợt đang diễn ra`
                : 'Chưa có đợt mở thi'}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
            <span>Xem đợt khảo thí</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Card 4: Thẩm định & Bài nộp */}
        <Link
          href={`/org/${slug}/grading`}
          className="group p-4 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Bàn thẩm định bài
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${
                pendingGradingCount > 0
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
              }`}
            >
              <FileCheck className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
              {evaluatedCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5">
              {pendingGradingCount > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {pendingGradingCount} bài chờ chấm
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Hàng chờ chấm sạch
                </span>
              )}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
            <span>Mở bàn chấm bài</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </Link>
      </div>

      {/* ============================================================ */}
      {/* 3. ATTENTION BANNER (Khi có bài nộp chờ chấm)                */}
      {/* ============================================================ */}
      {pendingGradingCount > 0 && (
        <div className="p-4 rounded-xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0 mt-0.5 sm:mt-0">
              <FileCheck className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Việc cần xử lý: Có {pendingGradingCount} bài nộp đang chờ giám khảo thẩm định
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Các bài thi tự luận hoặc sản phẩm thực hành số cần chấm theo Rubric trước khi kết quả được tổng hợp vào phổ điểm 5 miền.
              </p>
            </div>
          </div>
          <Link
            href={`/org/${slug}/grading`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shrink-0 self-start sm:self-auto shadow-2xs"
          >
            <span>Mở bàn chấm bài</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. ONBOARDING ROADMAP (Khi tổ chức mới / chưa có đợt thi)   */}
      {/* ============================================================ */}
      {rawCampaigns.length === 0 && (
        <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/30 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Quy trình thiết lập khảo thí số
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                Tiến độ:
              </span>
              <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 px-2.5 py-1 rounded-md">
                {(classesCount > 0 ? 1 : 0) + (membersCount > 1 ? 1 : 0)}/4 bước hoàn tất
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 flex flex-col justify-between shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                    BƯỚC 01
                  </span>
                  {classesCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Hoàn tất
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-full">
                      Chưa tạo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Lớp học &amp; Đơn vị
                  </h3>
                </div>
              </div>
              <Link
                href={`/org/${slug}/classes`}
                className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-between transition-colors bg-slate-50 dark:bg-zinc-900 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-neutral-800 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-800 group"
              >
                <span>{classesCount > 0 ? 'Xem danh sách lớp' : 'Tạo lớp học'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 flex flex-col justify-between shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                    BƯỚC 02
                  </span>
                  {membersCount > 1 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Hoàn tất
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-full">
                      Chưa mời
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Mời thành viên
                  </h3>
                </div>
              </div>
              <Link
                href={`/org/${slug}/members`}
                className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-between transition-colors bg-slate-50 dark:bg-zinc-900 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-neutral-800 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-800 group"
              >
                <span>{membersCount > 1 ? 'Xem thành viên' : 'Mời thành viên'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#111114] border border-blue-200 dark:border-blue-900/60 flex flex-col justify-between shadow-2xs ring-1 ring-blue-500/10 hover:border-blue-400 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    BƯỚC 03
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 px-2 py-0.5 rounded-full">
                    Trọng tâm
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Khởi tạo đợt thi
                  </h3>
                </div>
              </div>
              <Link
                href={`/org/${slug}/campaigns/new`}
                className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-between transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-xs group"
              >
                <span>Tạo đợt thi ngay</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 flex flex-col justify-between shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                    BƯỚC 04
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 px-2 py-0.5 rounded-full">
                    Tự động hóa
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Thẩm định &amp; Phổ điểm
                  </h3>
                </div>
              </div>
              <Link
                href={`/org/${slug}/grading`}
                className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-between transition-colors bg-slate-50 dark:bg-zinc-900 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-neutral-800 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-800 group"
              >
                <span>Bàn chấm bài</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MAIN OPERATIONAL GRID (8 COLS LEFT + 4 COLS RIGHT)       */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CAMPAIGNS & CLASSES (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Module 1: Đợt Khảo Thí Gần Đây */}
          <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Đợt Khảo Thí &amp; Hoạt Động Đánh Giá
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400">
                    {rawCampaigns.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Các đợt khảo thí được thiết lập và quản lý cho đơn vị.
                </p>
              </div>
              <Link
                href={`/org/${slug}/campaigns`}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {rawCampaigns.length === 0 ? (
              <div className="p-8 text-center my-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center text-slate-400 dark:text-neutral-500 mx-auto mb-3">
                  <Calendar className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-3.5">
                  Chưa có đợt khảo thí nào được tạo
                </p>
                {isOwnerOrAdmin && (
                  <Link
                    href={`/org/${slug}/campaigns/new`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Khởi tạo đợt đầu tiên</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="">
                {rawCampaigns.map((camp: any) => {
                  const asm = Array.isArray(camp.assessments) ? camp.assessments[0] : camp.assessments;
                  const statusBadge =
                    camp.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Đang diễn ra
                      </span>
                    ) : camp.status === 'SCHEDULED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        Sắp diễn ra
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                        Đã kết thúc
                      </span>
                    );

                  return (
                    <div
                      key={camp.id}
                      className="p-4 hover:bg-slate-50/60 dark:hover:bg-zinc-900/40 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          {statusBadge}
                          {camp.ends_at && (
                            <span
                              suppressHydrationWarning
                              className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono"
                            >
                              Hạn: {formatVnDate(camp.ends_at)}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {camp.title}
                        </h3>
                        {asm?.title && (
                          <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                            Đề: {asm.title}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/org/${slug}/grading?campaignId=${camp.id}`}
                          className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 transition-colors"
                        >
                          Chấm bài
                        </Link>
                        <Link
                          href={`/org/${slug}/campaigns`}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                        >
                          Chi tiết
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Module 2: Lớp Học & Không Gian Đang Vận Hành */}
          <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Lớp Học &amp; Không Gian Đào Tạo
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400">
                    {classesCount}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Các đơn vị, nhóm trực thuộc và mã tham gia của thành viên.
                </p>
              </div>
              <Link
                href={`/org/${slug}/classes`}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Quản lý tất cả lớp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {classesCount === 0 ? (
              <div className="p-8 text-center my-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center text-slate-400 dark:text-neutral-500 mx-auto mb-3">
                  <GraduationCap className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-3.5">
                  Chưa có lớp học nào được tạo
                </p>
                <Link
                  href={`/org/${slug}/classes`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Tạo lớp học mới</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x">
                {recentClasses.map((cls: any) => {
                  const studentCount = Array.isArray(cls.class_members) ? cls.class_members.length : 0;
                  const assignCount = Array.isArray(cls.class_assignments) ? cls.class_assignments.length : 0;

                  return (
                    <div
                      key={cls.id}
                      className="p-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {cls.term || 'Khóa hiện tại'}
                          </span>
                          {cls.class_code && (
                            <OrgCodeCopyPill code={cls.class_code} label="mã lớp" />
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {cls.name}
                        </h3>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-neutral-400 mt-1.5">
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400 dark:text-neutral-500" />
                            {studentCount} thành viên
                          </span>
                          <span className="text-slate-300 dark:text-zinc-700">&bull;</span>
                          <span className="inline-flex items-center gap-1">
                            <FileText className="w-3 h-3 text-slate-400 dark:text-neutral-500" />
                            {assignCount} bài đã giao
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 flex items-center justify-between">
                        <Link
                          href={`/org/${slug}/grading?classId=${cls.id}`}
                          className="text-[11px] font-medium text-slate-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Chấm bài lớp
                        </Link>
                        <Link
                          href={`/org/${slug}/classes/${cls.id}`}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Quản lý</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DIGCOMP 5 DOMAINS SNAPSHOT & COMMAND DOCK (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Năng Lực Số 5 Miền Cốt Lõi (Luôn hiện sẵn khung 5 miền chuẩn hóa) */}
          <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <BarChart2 className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-900 dark:text-neutral-100">
                      Năng Lực Số &bull; 5 Miền
                    </h3>
                  </div>
                </div>
                <Link
                  href={`/org/${slug}/analytics`}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Báo cáo</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Điểm trung bình đơn vị */}
              <div className="flex items-baseline justify-between text-xs pb-3 mb-3">
                <span className="text-slate-500 dark:text-neutral-400 font-medium">
                  Điểm trung bình toàn đơn vị:
                </span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 text-sm tabular-nums">
                  {competencySummary.overallAverageScore !== null
                    ? `${competencySummary.overallAverageScore}/100đ`
                    : 'Chờ dữ liệu'}
                </span>
              </div>

              {/* 5 Domain Bars (LUÔN HIỆN SẴN KHUNG 5 MIỀN CHUẨN HÓA) */}
              <div className="space-y-3.5">
                {competencySummary.domains.map((d: any) => {
                  const hasScore = d.score !== null;
                  const isPassing = hasScore && d.score >= 70;

                  return (
                    <div key={d.domainCode} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0 text-[11px]">
                            {d.domainCode}
                          </span>
                          <span className="text-neutral-800 dark:text-neutral-200 font-medium truncate text-xs">
                            {d.name}
                          </span>
                        </div>
                        <span className="font-mono text-xs tabular-nums text-neutral-900 dark:text-neutral-100 font-semibold shrink-0">
                          {hasScore ? `${d.score}đ` : '—'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        {hasScore ? (
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isPassing
                                ? 'bg-blue-600 dark:bg-blue-500'
                                : 'bg-amber-500 dark:bg-amber-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, d.score))}%` }}
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-100 dark:bg-zinc-800/60 rounded-full" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3.5 mt-4 text-[11px] text-slate-500 dark:text-neutral-400 flex items-center justify-between">
              <span>Chuẩn hóa 5 miền năng lực</span>
              <span className="font-mono tabular-nums font-medium text-neutral-800 dark:text-neutral-200">
                {evaluatedCount} mẫu đánh giá
              </span>
            </div>
          </div>

          {/* Card 2: Phím Tắt Khảo Thí & Điều Hành Nhanh (Executive Dock) */}
          <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-900 dark:text-neutral-100">
                Phím Tắt Điều Hành
              </h3>
              <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                Lối tắt
              </span>
            </div>

            <div className="">
              {/* Shortcut 1: Bàn chấm bài */}
              <Link
                href={`/org/${slug}/grading`}
                className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <FileCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Bàn thẩm định bài nộp
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-neutral-500">
                      {pendingGradingCount > 0 ? `${pendingGradingCount} bài chờ chấm` : 'Sạch hàng chờ'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Shortcut 2: Phòng thi Live */}
              <Link
                href={`/org/${slug}/live-room`}
                className="py-2.5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Phòng thi trực tiếp (Mã PIN)
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-neutral-500">
                      Điều hành phiên thi realtime
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Shortcut 3: Ngân hàng đề */}
              <Link
                href={`/org/${slug}/assessments`}
                className="py-2.5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Ngân hàng đề khảo thí
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-neutral-500">
                      {(orgAssessmentsResult.data || []).length} đề nội bộ đơn vị
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Shortcut 4: Báo cáo phân tích */}
              <Link
                href={`/org/${slug}/analytics`}
                className="py-2.5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Báo cáo &amp; Phân tích phổ điểm
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-neutral-500">
                      Khoảng trống &amp; Đề xuất học phần
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Shortcut 5: Gói & Hạn mức */}
              <Link
                href={`/org/${slug}/plan`}
                className="py-2.5 last:pb-1 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Gói bản quyền &amp; Quota
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-neutral-500">
                      {entitlements.planName || 'Business'} &bull; Tra cứu hạn mức
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
