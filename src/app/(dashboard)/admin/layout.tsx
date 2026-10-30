import { redirect } from 'next/navigation';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { AdminSidebar } from '@/components/dashboard/admin/AdminSidebar';
import { AdminTopbar } from '@/components/dashboard/admin/AdminTopbar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requirePlatformAdmin();

  if (!auth.isAuthorized) {
    if (!auth.user) {
      redirect('/login');
    }
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
