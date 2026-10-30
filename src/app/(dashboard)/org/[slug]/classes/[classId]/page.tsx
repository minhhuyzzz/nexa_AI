import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  FolderKanban,
  Users,
  BookOpen,
  Calendar,
  Clock,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ClassMemberRow {
  id: string;
  joined_at: string;
  user_id: string;
  profiles: {
    id: string;
    email: string;
    nickname: string;
    full_name?: string;
  } | null;
}

interface ClassAssignmentRow {
  id: string;
  deadline?: string | null;
  created_at: string;
  assessments: {
    id: string;
    title: string;
    duration_minutes: number;
    passing_score: number;
    version?: string;
  } | null;
}

export default async function OrgClassDetailPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>;
}) {
  const { slug, classId } = await params;
  const adminSupabase = createAdminClient();

  // 1. Fetch organization
  const { data: org } = await adminSupabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (!org) notFound();

  // 2. Fetch class record (scoped to organization)
  const { data: classRecord } = await adminSupabase
    .from('evaluator_classes')
    .select('*')
    .eq('id', classId)
    .eq('organization_id', org.id)
    .single();

  if (!classRecord) notFound();

  // 3. Fetch class members
  const { data: membersRaw } = await adminSupabase
    .from('class_members')
    .select(`
      id,
      joined_at,
      user_id,
      profiles ( id, email, nickname, full_name )
    `)
    .eq('class_id', classId)
    .order('joined_at', { ascending: false });

  const members = (membersRaw as unknown as ClassMemberRow[]) || [];

  // 4. Fetch assignments
  const { data: assignmentsRaw } = await adminSupabase
    .from('class_assignments')
    .select(`
      id,
      deadline,
      created_at,
      assessments ( id, title, duration_minutes, passing_score, version )
    `)
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  const assignments = (assignmentsRaw as unknown as ClassAssignmentRow[]) || [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href={`/org/${slug}`} className="hover:text-slate-800 transition-colors">
          {org.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
        <Link href={`/org/${slug}/classes`} className="hover:text-slate-800 transition-colors">
          Lớp học & Nhóm
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
        <span className="font-semibold text-slate-900">{classRecord.name}</span>
      </nav>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-md border border-slate-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{classRecord.name}</h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200">
              {classRecord.class_code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {classRecord.description || 'Lớp học đào tạo & khảo thí thuộc không gian tổ chức.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/org/${slug}/classes`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Quay lại danh sách</span>
          </Link>
        </div>
      </div>

      {/* Grid: Assignments & Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Assignments (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              <h2 className="text-sm font-bold text-slate-900">Bài khảo thí đã giao cho lớp</h2>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                {assignments.length}
              </span>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs">
            {assignments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Chưa có bài thi nào được giao cho lớp này. Vui lòng tạo Đợt đánh giá để giao đề thi.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Tên bài thi</th>
                    <th className="py-2.5 px-4">Thời lượng</th>
                    <th className="py-2.5 px-4">Chuẩn đạt</th>
                    <th className="py-2.5 px-4">Hạn nộp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{a.assessments?.title || 'Đề thi tổ chức'}</span>
                          {a.assessments?.version && (
                            <span className="text-[10px] font-mono px-1 rounded bg-slate-100 text-slate-600">
                              v{a.assessments.version}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                        {a.assessments?.duration_minutes || 45} phút
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                        {a.assessments?.passing_score || 70}%
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 tabular-nums text-[11px]">
                        {a.deadline ? new Date(a.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Members List (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              <h2 className="text-sm font-bold text-slate-900">Học viên trong lớp</h2>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                {members.length}
              </span>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs">
            {members.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Chưa có học viên nào tham gia lớp này. Hãy gửi mã {classRecord.class_code} cho học viên.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                {members.map((m) => (
                  <li key={m.id} className="p-3 hover:bg-slate-50/60 transition-colors flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0">
                      {(m.profiles?.nickname || m.profiles?.full_name || 'H').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {m.profiles?.nickname || m.profiles?.full_name || 'Học viên'}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 truncate">
                        {m.profiles?.email || '—'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
