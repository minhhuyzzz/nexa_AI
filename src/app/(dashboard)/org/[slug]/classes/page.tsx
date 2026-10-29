import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { FolderKanban, Users, Plus, ArrowRight, BookOpen } from 'lucide-react';
import { CreateOrgClassButton } from '@/components/dashboard/org/CreateOrgClassButton';

export const dynamic = 'force-dynamic';

export default async function OrgClassesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const adminSupabase = createAdminClient();

  const { data: org } = await adminSupabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (!org) {
    notFound();
  }

  // Fetch organization classes
  const { data: classes } = await adminSupabase
    .from('evaluator_classes')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-md border border-slate-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Nhóm & Lớp học tổ chức</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-slate-100 text-slate-700">
              {classes?.length || 0} nhóm
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị các lớp học, phòng ban và kỳ thi khảo thí theo nhóm trong đơn vị {org.name}.
          </p>
        </div>

        <CreateOrgClassButton organizationId={org.id} orgName={org.name} />
      </div>

      {/* Classes Grid */}
      {!classes || classes.length === 0 ? (
        <div className="p-12 text-center rounded-md border border-slate-200 bg-white">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <FolderKanban className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Chưa có nhóm hoặc lớp học nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Tạo nhóm lớp để phân phối đề thi và theo dõi tiến độ học tập của từng tập thể.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="p-5 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    {cls.class_code}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(cls.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 leading-snug">{cls.name}</h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {cls.description || 'Lớp học thuộc tổ chức.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/personal/groups/${cls.id}`}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  <span>Vào lớp</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
