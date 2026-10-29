import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  Users,
  FilePlus,
  BarChart2,
  FolderKanban,
  ArrowRight,
  ShieldCheck,
  Building2,
  Cpu,
} from 'lucide-react';

export default async function OrgOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const adminSupabase = createAdminClient();

  const { data: org } = await adminSupabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!org) {
    notFound();
  }

  // 1. Count members
  const { count: membersCount } = await adminSupabase
    .from('user_organizations')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('status', 'ACTIVE');

  // 2. Count org assessments
  const { count: assessmentsCount } = await adminSupabase
    .from('assessments')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id);

  // 3. Count org classes
  const { count: classesCount } = await adminSupabase
    .from('evaluator_classes')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-5 rounded-md border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-md bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shrink-0">
              <Building2 className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">{org.name}</h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {org.type || 'ENTERPRISE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Không gian làm việc B2B — Quản trị đa thành viên, khảo thí tập trung và phân tích năng lực số.
              </p>
            </div>
          </div>

          <Link
            href={`/org/${slug}/members`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
          >
            <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Quản lý thành viên</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Thành viên hoạt động</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {membersCount || 1} <span className="text-xs text-slate-400 font-normal">/ {org.max_members || 50}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Giới hạn theo gói tổ chức</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Đề thi tổ chức</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {assessmentsCount || 0} <span className="text-xs text-slate-400 font-normal">/ {org.quota_assessments || 500}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Dùng chung cho toàn đơn vị</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Nhóm & Lớp học</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {classesCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Phân bổ theo phòng ban/lớp</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Trạng thái hạ tầng</div>
          <div className="text-xl font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-sm font-semibold">Hoạt động</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Bảo mật RLS đa thuê bao</div>
        </div>
      </div>

      {/* 3. Primary Sections Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={`/org/${slug}/members`}
          className="p-5 rounded-md border border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50 transition-all group shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded bg-sky-50 flex items-center justify-center text-sky-600 mb-3">
              <Users className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Thành viên & Phân quyền</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Mời giảng viên/nhân viên, cấp quyền ORG_ADMIN, ASSESSOR hoặc REPORT_VIEWER.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-sky-600 group-hover:text-sky-700">
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.75} />
          </div>
        </Link>

        <Link
          href={`/org/${slug}/assessments`}
          className="p-5 rounded-md border border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50 transition-all group shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
              <FilePlus className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Ngân hàng đề tổ chức</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Đề thi khảo sát năng lực số nội bộ, chuẩn hóa câu hỏi và phân bổ cho các đợt thi.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-sky-600 group-hover:text-sky-700">
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.75} />
          </div>
        </Link>

        <Link
          href={`/org/${slug}/analytics`}
          className="p-5 rounded-md border border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50 transition-all group shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center text-amber-600 mb-3">
              <BarChart2 className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Báo cáo & Phân tích</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Tổng hợp điểm số 5 Miền năng lực số DigComp của toàn bộ nhân sự và sinh viên.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-sky-600 group-hover:text-sky-700">
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.75} />
          </div>
        </Link>
      </div>
    </div>
  );
}
