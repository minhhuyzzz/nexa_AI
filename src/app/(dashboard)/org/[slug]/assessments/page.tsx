import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import {
  FilePlus,
  Clock,
  Award,
  Plus,
  ArrowRight,
  BookOpen,
  CalendarPlus,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { OrgEmptyState } from '@/components/dashboard/org/org-ui/OrgEmptyState';

export const dynamic = 'force-dynamic';

export default async function OrgAssessmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org, isSuperadmin, role } = await requireOrgPagePermission(
    slug,
    'VIEW_WORKSPACE'
  );
  const adminSupabase = createAdminClient();
  const isManager = isSuperadmin || role === 'ORG_OWNER' || role === 'ORG_ADMIN';

  // 1. Fetch organization assessments + global published assessments
  const [orgAssessmentsResult, globalAssessmentsResult] = await Promise.all([
    adminSupabase
      .from('assessments')
      .select('*')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('assessments')
      .select('*')
      .is('organization_id', null)
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
  ]);

  const orgAssessments = orgAssessmentsResult.data || [];
  const globalAssessments = globalAssessmentsResult.data || [];
  const allAssessments = [...orgAssessments, ...globalAssessments];

  return (
    <div className="space-y-6">
      {/* 1. Editorial Hero Banner (Spec V4: Banner Thư viện đề đánh giá.jpg) */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm min-h-[200px] bg-[#111726] text-white flex flex-col justify-between p-6 sm:p-7">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/dashboard/Banner Thư viện đề đánh giá.jpg"
            alt="NEXA Assessment Bank Banner"
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover opacity-35 object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1424] via-[#0d1424]/90 to-transparent" />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono font-bold tracking-[0.14em] text-blue-400 uppercase">
              NGÂN HÀNG KHẢO THÍ &amp; ĐÁNH GIÁ
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {allAssessments.length} BỘ ĐỀ SẴN SÀNG
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 leading-tight">
            Thư Viện Đề Đánh Giá
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
            Bộ đề đánh giá chuẩn hóa theo khung DigComp 2.2 và các đề nội bộ do {org.name} phát hành.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 mt-5 flex-wrap">
          {isManager && (
            <Link
              href={`/org/${slug}/assessments/new`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              <span>Soạn đề nội bộ mới</span>
            </Link>
          )}
          <Link
            href={`/org/${slug}/campaigns/new`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 transition-colors"
          >
            <CalendarPlus className="w-4 h-4" strokeWidth={1.75} />
            <span>Khởi tạo đợt khảo thí</span>
          </Link>
        </div>
      </div>

      {/* 2. Assessment Cards Grid */}
      {allAssessments.length === 0 ? (
        <OrgEmptyState
          iconName="book"
          title="Chưa có đề đánh giá nào sẵn sàng"
          description="Khởi tạo hoặc nhập đề đánh giá để bắt đầu tổ chức các đợt khảo thí năng lực số."
          actionText={isManager ? "Soạn đề thi mới" : undefined}
          actionHref={isManager ? `/org/${slug}/assessments/new` : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allAssessments.map((a) => {
            const isCustom = Boolean(a.organization_id);

            return (
              <div
                key={a.id}
                className="p-5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                        isCustom
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {isCustom ? 'Nội bộ tổ chức' : 'Chuẩn DigComp'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500 tabular-nums">
                      {new Date(a.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {a.description || 'Bài đánh giá năng lực số toàn diện.'}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 font-mono mb-3.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      <span className="tabular-nums">{a.duration_minutes || 45} phút</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      <span className="tabular-nums">Đạt: {a.passing_score || 70}/100</span>
                    </div>
                  </div>

                  {/* Primary CTA: "Tạo đợt từ đề này" */}
                  {isManager && (
                    <Link
                      href={`/org/${slug}/campaigns/new?assessmentId=${a.id}`}
                      className="w-full h-8 px-3 rounded bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-blue-200/80 dark:border-blue-900"
                    >
                      <span>Tạo đợt từ đề này</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
