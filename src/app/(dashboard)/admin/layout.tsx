import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/dashboard/admin/AdminSidebar';
import { AdminTopbar } from '@/components/dashboard/admin/AdminTopbar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, username')
    .eq('id', user.id)
    .single();

  const superadminConfig =
    process.env.SUPERADMIN_ACCOUNTS ||
    process.env.SUPERADMIN_EMAILS ||
    'admin,huy868762@gmail.com,admin@nexa.edu.vn';
  const superadminList = superadminConfig
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = (user.email || '').toLowerCase();
  const userName = (profile?.username || '').toLowerCase();
  const isAuthorizedAdmin =
    (userName && superadminList.includes(userName)) ||
    (userEmail && superadminList.includes(userEmail)) ||
    userName === 'admin';

  if (!isAuthorizedAdmin) {
    redirect('/login?error=unauthorized_admin_access');
  }

  return (
    <div className="dashboard-shell min-h-screen flex bg-white text-slate-900 transition-colors">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <AdminTopbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
