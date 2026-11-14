import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { AdminSidebar } from '@/components/dashboard/admin/AdminSidebar';
import { AdminTopbar } from '@/components/dashboard/admin/AdminTopbar';
import { MobileNavProvider } from '@/contexts/MobileNavContext';

export const metadata: Metadata = {
  title: 'NEXA Platform Admin | Điều hành nền tảng',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

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
    <MobileNavProvider>
      <div className="dashboard-shell min-h-screen flex bg-white dark:bg-black text-slate-900 dark:text-neutral-100 transition-colors">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black">
          <AdminTopbar />
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </MobileNavProvider>
  );
}
