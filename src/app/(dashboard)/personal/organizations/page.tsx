import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  Plus,
  ShieldCheck,
  Calendar,
  Layers,
  KeyRound,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PersonalOrganizationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirect=/personal/organizations');
  }

  const adminSupabase = createAdminClient();

  // 1. Fetch user organizations
  const { data: userOrgs } = await adminSupabase
    .from('user_organizations')
    .select(`
      id,
      org_role,
      status,
      created_at,
      organizations (
        id,
        name,
        slug,
        code,
        plan_tier,
        status
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE');

  // 2. Fetch classes user is enrolled in
  const { data: memberClasses } = await adminSupabase
    .from('class_members')
    .select(`
      class_id,
      role_in_class,
      evaluator_classes (
        id,
        name,
        organization_id
      )
    `)
    .eq('user_id', user.id);

  // Group classes by organization_id
  const orgClassesMap: Record<string, string[]> = {};
  (memberClasses || []).forEach((mc: any) => {
    const cls = mc.evaluator_classes;
    if (cls && cls.organization_id) {
      if (!orgClassesMap[cls.organization_id]) {
        orgClassesMap[cls.organization_id] = [];
      }
      orgClassesMap[cls.organization_id].push(cls.name);
    }
  });

  const rawOrgs = (userOrgs || []).map((uo: any) => ({
    id: uo.organizations?.id,
    name: uo.organizations?.name || 'Tổ chức',
    slug: uo.organizations?.slug || '',
    code: uo.organizations?.code || '',
    planTier: uo.organizations?.plan_tier || 'BUSINESS',
    role: uo.org_role,
    classes: uo.organizations?.id ? orgClassesMap[uo.organizations.id] || [] : [],
    joinedAt: uo.created_at,
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
            Tổ Chức Của Tôi
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Các trường học, doanh nghiệp và đội ngũ bạn đang tham gia phát triển năng lực số.
          </p>
        </div>

        {/* Join action */}
        <Link
          href="/join"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs self-start sm:self-auto"
        >
          <KeyRound className="w-4 h-4" />
          <span>Nhập mã tham gia tổ chức</span>
        </Link>
      </div>

      {rawOrgs.length === 0 ? (
        /* Empty State */
        <div className="p-10 text-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 mx-auto flex items-center justify-center">
            <Building2 className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              Bạn chưa tham gia tổ chức nào
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-md mx-auto leading-relaxed">
              Khi được trường học, doanh nghiệp hoặc trung tâm mời tham gia, tổ chức và các lớp học trực thuộc sẽ xuất hiện tại đây.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/join"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              <span>Nhập mã tham gia ngay</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Grid of Organization Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rawOrgs.map((org) => {
            const isAdmin = org.role === 'ORG_OWNER' || org.role === 'ORG_ADMIN';

            return (
              <div
                key={org.id}
                className="p-5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm">
                        {org.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100 leading-snug">
                          {org.name}
                        </h2>
                        <div className="text-[11px] text-slate-400 dark:text-neutral-500 flex items-center gap-1.5 mt-0.5">
                          <span>Mã đơn vị:</span>
                          <span className="font-mono font-medium text-slate-600 dark:text-zinc-300">
                            {org.code || org.slug}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        isAdmin
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                      }`}
                    >
                      {isAdmin ? 'Quản trị viên' : 'Thành viên'}
                    </span>
                  </div>

                  {/* Classes & Groups */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Nhóm / Đơn vị tham gia:</span>
                    </div>

                    {org.classes.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {org.classes.map((clsName: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
                          >
                            {clsName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 dark:text-neutral-500 italic">
                        Chưa phân vào nhóm hoặc lớp cụ thể
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 dark:text-neutral-500">
                    Gói {org.planTier}
                  </div>

                  <Link
                    href={`/org/${org.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <span>Vào không gian tổ chức</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
