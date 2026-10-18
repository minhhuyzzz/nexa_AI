import { AdminSidebar } from '@/components/dashboard/admin/AdminSidebar';
import { AdminTopbar } from '@/components/dashboard/admin/AdminTopbar';
import { DemoRoleSwitcher } from '@/components/dashboard/DemoRoleSwitcher';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <AdminTopbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <DemoRoleSwitcher />
    </div>
  );
}
