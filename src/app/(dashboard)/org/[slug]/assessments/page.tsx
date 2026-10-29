import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { FilePlus, Clock, Award, CheckSquare, Plus, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrgAssessmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const adminSupabase = createAdminClient();

  const { data: org } = await adminSupabase
    .from('organizations')
    .select('id, name, slug, quota_assessments')
    .eq('slug', slug)
    .single();

  if (!org) {
    notFound();
  }

  // Fetch organization assessments
  const { data: assessments } = await adminSupabase
    .from('assessments')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-md border border-slate-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Đề thi tổ chức</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-slate-100 text-slate-700">
              {assessments?.length || 0} / {org.quota_assessments || 500}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ngân hàng đề thi chuẩn hóa dùng chung trong toàn đơn vị {org.name}.
          </p>
        </div>

        <Link
          href={`/org/${slug}/assessments/new`}
          className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Soạn đề mới</span>
        </Link>
      </div>

      {/* Assessment List */}
      {!assessments || assessments.length === 0 ? (
        <div className="p-12 text-center rounded-md border border-slate-200 bg-white">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <FilePlus className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Chưa có đề thi nào trong tổ chức</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Các thành viên có quyền Người đánh giá (ASSESSOR) có thể xuất bản đề thi vào ngân hàng chung của tổ chức.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map((a) => (
            <div
              key={a.id}
              className="p-5 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      a.is_published
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {a.is_published ? 'Đã xuất bản' : 'Bản nháp'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(a.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {a.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{a.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                  <span>{a.duration_minutes} phút</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                  <span>Đạt: {a.passing_score}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
