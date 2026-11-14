import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { OrgSidebar } from '@/components/dashboard/org/OrgSidebar';
import { OrgTopbar } from '@/components/dashboard/org/OrgTopbar';
import { OrgSuspendedView } from '@/components/dashboard/org/OrgSuspendedView';
import { isSuperadminEmail } from '@/lib/auth/superadmin';
import { normalizeOrgRole } from '@/lib/auth/org-roles';
import { MobileNavProvider } from '@/contexts/MobileNavContext';

export const metadata: Metadata = {
  title: 'NEXA Business | Quản trị tổ chức',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const dynamic = 'force-dynamic';

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/org/${slug}`);
  }

  const adminSupabase = createAdminClient();

  // 1. Fetch organization details
  const { data: org, error: orgError } = await adminSupabase
    .from('organizations')
    .select('id, name, slug, is_active, status')
    .eq('slug', slug)
    .single();

  if (orgError || !org) {
    redirect('/dashboard');
  }

  // 2. Check user membership or superadmin
  const isSuperadmin = isSuperadminEmail(user.email);

  const { data: membership } = await adminSupabase
    .from('user_organizations')
    .select('org_role, status')
    .eq('user_id', user.id)
    .eq('organization_id', org.id)
    .single();

  if (!isSuperadmin && (!membership || membership.status !== 'ACTIVE')) {
    redirect('/personal/dashboard');
  }

  const rawRole = isSuperadmin ? 'ORG_ADMIN' : membership?.org_role || 'MEMBER';
  const userRole = isSuperadmin ? 'ORG_ADMIN' : normalizeOrgRole(rawRole);

  // RBAC Rule: Org Workspace allows ORG_OWNER, ORG_ADMIN, ASSESSOR. MEMBER redirected to Personal.
  const ALLOWED_ROLES = ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'];
  if (!isSuperadmin && !ALLOWED_ROLES.includes(userRole)) {
    redirect('/personal/groups?notice=org_restricted');
  }

  // 3. Organization Suspension & Contract Renewal Check
  // Never kick users out silently! If organization is suspended, display the OrgSuspendedView.
  const isSuspended = !org.is_active || org.status === 'SUSPENDED';

  if (isSuspended) {
    return (
      <OrgSuspendedView
        orgId={org.id}
        orgName={org.name}
        orgSlug={org.slug}
        userRole={userRole}
        userEmail={user.email}
      />
    );
  }

  return (
    <MobileNavProvider>
      <div className="dashboard-shell min-h-screen flex bg-white dark:bg-black text-slate-900 dark:text-neutral-100 transition-colors">
        <OrgSidebar orgSlug={org.slug} orgName={org.name} userRole={userRole} />
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black">
          <OrgTopbar orgName={org.name} orgSlug={org.slug} userRole={userRole} />
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </MobileNavProvider>
  );
}
