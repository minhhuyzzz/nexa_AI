import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { OrgSidebar } from '@/components/dashboard/org/OrgSidebar';
import { OrgTopbar } from '@/components/dashboard/org/OrgTopbar';
import { isSuperadminEmail } from '@/lib/auth/superadmin';

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
    .select('id, name, slug, is_active')
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
    redirect('/dashboard');
  }

  const userRole = isSuperadmin ? 'ORG_ADMIN' : membership?.org_role || 'MEMBER';

  return (
    <div className="dashboard-shell min-h-screen flex bg-white text-slate-900 transition-colors">
      <OrgSidebar orgSlug={org.slug} orgName={org.name} userRole={userRole} />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <OrgTopbar orgName={org.name} orgSlug={org.slug} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
