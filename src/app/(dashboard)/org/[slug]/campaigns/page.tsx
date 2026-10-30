import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  CalendarRange,
  Plus,
  Clock,
  BookOpen,
  Users,
  Award,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CampaignItem {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  status: string;
  passing_score: number;
  class_ids: string[];
  assessor_ids: string[];
  assessments?: {
    id: string;
    title: string;
    duration_minutes: number;
    passing_score: number;
    version?: string;
  } | null;
}

export default async function OrgCampaignsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const adminSupabase = createAdminClient();

  // 1. Fetch organization
  const { data: org } = await adminSupabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (!org) {
    notFound();
  }

  // 2. Fetch campaigns with assessment details
  const { data: campaignsRaw } = await adminSupabase
    .from('assessment_campaigns')
    .select(`
      id,
      title,
      description,
      starts_at,
      ends_at,
      status,
      passing_score,
      class_ids,
      assessor_ids,
      assessments (
        id,
        title,
        duration_minutes,
        passing_score,
        version
      )
    `)
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false });

  const campaigns = (campaignsRaw as unknown as CampaignItem[]) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-md border border-slate-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Đợt Đánh Giá Năng Lực</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-slate-100 text-slate-700">
              {campaigns.length} đợt
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Điều phối các đợt khảo thí tập trung, phân công người chấm và giao đề thi tới các lớp học của {org.name}.
          </p>
        </div>

        <Link
          href={`/org/${slug}/classes`}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Giao bài theo Lớp</span>
        </Link>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <div className="p-12 text-center rounded-md border border-slate-200 bg-white">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <CalendarRange className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Chưa có đợt đánh giá nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Tổ chức có thể mở đợt đánh giá định kỳ (Đầu kỳ, Giữa kỳ, Cuối kỳ) để đo lường mức độ phát triển năng lực số 5 miền.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const isCompleted = c.status === 'COMPLETED';
            const isActive = c.status === 'ACTIVE';

            return (
              <div
                key={c.id}
                className="p-5 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isCompleted
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-emerald-600' : 'bg-slate-500'
                        }`}
                      />
                      {isActive ? 'Đang diễn ra' : isCompleted ? 'Đã hoàn thành' : 'Đang chấm điểm'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {new Date(c.ends_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{c.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {c.description || 'Đợt khảo thí năng lực số chuẩn hóa'}
                  </p>

                  <div className="mt-4 p-2.5 rounded bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
                      <span className="truncate font-medium">{c.assessments?.title || 'Đề thi tổ chức'}</span>
                      {c.assessments?.version && (
                        <span className="text-[10px] font-mono px-1 rounded bg-slate-200 text-slate-700">
                          v{c.assessments.version}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                      <span>Lớp tham gia: {c.class_ids?.length || 0}</span>
                      <span>Chuẩn đạt: {c.passing_score}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/org/${slug}/grading`}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
                  >
                    <span>Vào bàn chấm bài</span>
                    <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
