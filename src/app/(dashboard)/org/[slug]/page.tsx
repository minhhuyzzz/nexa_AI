import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { QuotaEnforcementService } from '@/features/billing/services/quota-enforcement.service';
import { OrgCompetencyAnalyticsService } from '@/features/analytics/services/org-competency-analytics.service';
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
  FileCheck,
  ChevronRight,
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
  const { organization: org, role, isSuperadmin } = context;
  const adminSupabase = createAdminClient();
  const isOwnerOrAdmin = isSuperadmin || role === 'ORG_OWNER' || role === 'ORG_ADMIN';

  // ==========================================
  // FETCH EXECUTIVE DATA
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

  const evaluatedCount = allSubmissions.filter((s) => s.status === 'EVALUATED').length;
  const competencySummary = OrgCompetencyAnalyticsService.aggregateOrgCompetency(allSubmissions);

  // Active or upcoming campaigns
  const activeCampaigns = rawCampaigns.filter((c) => c.status === 'ACTIVE');
  const latestActiveCampaign = activeCampaigns[0] || rawCampaigns[0] || null;

  return (
    <div className="space-y-6">
      {/* 1. Editorial Hero Banner (V4 Spec: Real Asset + Crisp SaaS Tone) */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm min-h-[220px] bg-[#111726] text-white flex flex-col justify-between p-6 sm:p-8">
        {/* Background Image with Clean Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/dashboard/Banner Tổng quan.jpg"
            alt="NEXA Organization Banner"
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover opacity-35 object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1424] via-[#0d1424]/90 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono font-bold tracking-[0.14em] text-blue-400 uppercase">
              BÀN ĐIỀU HÀNH TỔ CHỨC
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {entitlements.planName || 'BUSINESS'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 leading-tight">
            {org.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
            Quản trị khảo thí, theo dõi 5 miền năng lực số DigComp và phát triển nhân lực số theo chuẩn quốc tế.
          </p>
        </div>

        {/* CTAs */}
        <div className="relative z-10 flex items-center gap-3 mt-6 flex-wrap">
          {isOwnerOrAdmin && (
            <Link
              href={`/org/${slug}/campaigns/new`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" strokeWidth={1.75} />
              <span>Tạo đợt đánh giá mới</span>
            </Link>
          )}
          <Link
            href={`/org/${slug}/members`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 transition-colors"
          >
            <UserPlus className="w-4 h-4" strokeWidth={1.75} />
            <span>Mời thành viên</span>
          </Link>
        </div>
      </div>

      {/* 2. Direct Operational Summary Line (Spec V4: No chunky 4 boxes) */}
      <div className="px-5 py-3.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-300 flex-wrap">
          <span className="font-semibold text-slate-900 dark:text-neutral-100 font-mono tabular-nums">
            {membersCount}
          </span>{' '}
          <span className="text-slate-500 dark:text-neutral-400">thành viên</span>
          <span className="text-slate-300 dark:text-zinc-700">&bull;</span>
          <span className="font-semibold text-slate-900 dark:text-neutral-100 font-mono tabular-nums">
            {classesCount}
          </span>{' '}
          <span className="text-slate-500 dark:text-neutral-400">nhóm / lớp</span>
          <span className="text-slate-300 dark:text-zinc-700">&bull;</span>
          <span className="font-semibold text-slate-900 dark:text-neutral-100 font-mono tabular-nums">
            {rawCampaigns.length}
          </span>{' '}
          <span className="text-slate-500 dark:text-neutral-400">đợt khảo thí</span>
          <span className="text-slate-300 dark:text-zinc-700">&bull;</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {evaluatedCount}
          </span>{' '}
          <span className="text-slate-500 dark:text-neutral-400">bài đã chấm duyệt</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {pendingGradingCount > 0 ? (
            <Link
              href={`/org/${slug}/grading`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{pendingGradingCount} bài chờ chấm</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-neutral-400 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Hàng chờ chấm sạch</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. Attention Queue (Việc cần xử lý) */}
      {pendingGradingCount > 0 && (
        <div className="p-4 rounded-lg border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0 mt-0.5 sm:mt-0">
              <FileCheck className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Việc cần xử lý: Có {pendingGradingCount} bài nộp đang chờ giảng viên chấm điểm
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Các bài thi thực hành hoặc tự luận cần chấm theo Rubric trước khi kết quả được tổng hợp vào hồ sơ năng lực 5 miền.
              </p>
            </div>
          </div>
          <Link
            href={`/org/${slug}/grading`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shrink-0 self-start sm:self-auto shadow-2xs"
          >
            <span>Mở bàn chấm bài</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4. Active Campaigns & Competency Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Operational Campaigns List */}
        <div className="lg:col-span-7 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                Đợt Khảo Thí &amp; Hoạt Động Đánh Giá
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Các đợt khảo thí được thiết lập cho tổ chức.
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
            <div className="p-8 text-center my-auto">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-xs font-medium text-slate-700 dark:text-neutral-300">
                Chưa có đợt khảo thí nào được tạo.
              </p>
              <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5 mb-3">
                Khởi tạo đợt đánh giá để giao đề thi chuẩn DigComp cho các nhóm.
              </p>
              {isOwnerOrAdmin && (
                <Link
                  href={`/org/${slug}/campaigns/new`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Tạo đợt đầu tiên</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 overflow-y-auto max-h-[360px]">
              {rawCampaigns.map((camp: any) => {
                const asm = Array.isArray(camp.assessments) ? camp.assessments[0] : camp.assessments;
                const statusBadge =
                  camp.status === 'ACTIVE' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Đang diễn ra
                    </span>
                  ) : camp.status === 'SCHEDULED' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
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
                          <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
                            Hạn: {formatVnDate(camp.ends_at)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate">
                        {camp.title}
                      </h3>
                      {asm?.title && (
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                          Đề: {asm.title}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/org/${slug}/campaigns`}
                      className="px-2.5 py-1 rounded text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors shrink-0"
                    >
                      Chi tiết
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: DigComp 5-Domain Summary (Calm & Informative) */}
        <div className="lg:col-span-5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  Năng Lực Số 5 Miền Cốt Lõi
                </h3>
              </div>
              <Link
                href={`/org/${slug}/analytics`}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Báo cáo
              </Link>
            </div>

            {evaluatedCount === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-neutral-400">
                <p className="font-medium text-slate-800 dark:text-neutral-200 mb-1">
                  Chưa có dữ liệu khảo thí được phê duyệt
                </p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 leading-relaxed">
                  Khi các bài làm được chấm duyệt, phân tích năng lực 5 miền DigComp sẽ hiển thị tại đây theo thang điểm /100.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between text-xs pb-1">
                  <span className="text-slate-500 dark:text-neutral-400">Điểm trung bình toàn đơn vị:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-neutral-100 text-sm tabular-nums">
                    {competencySummary.overallAverageScore !== null
                      ? `${competencySummary.overallAverageScore}/100`
                      : '—'}
                  </span>
                </div>

                {/* 5 Domain Bars */}
                {competencySummary.domains.map((d) => (
                  <div key={d.domainCode} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 dark:text-neutral-300 font-medium truncate max-w-[200px]">
                        {d.domainCode}. {d.name}
                      </span>
                      <span className="font-mono text-slate-800 dark:text-neutral-200 text-[11px] font-semibold tabular-nums">
                        {d.score !== null ? `${d.score}đ` : '—'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, d.score ?? 0))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 mt-4 text-[11px] text-slate-500 dark:text-neutral-400 flex items-center justify-between">
            <span>Chuẩn DigComp 2.2</span>
            <span className="font-mono tabular-nums">{evaluatedCount} mẫu đánh giá</span>
          </div>
        </div>
      </div>
    </div>
  );
}
