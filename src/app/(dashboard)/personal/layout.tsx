import { PersonalSidebar } from '@/components/dashboard/personal/PersonalSidebar';
import { PersonalTopbar } from '@/components/dashboard/personal/PersonalTopbar';
import { DemoRoleSwitcher } from '@/components/dashboard/DemoRoleSwitcher';

export default function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell min-h-screen flex bg-white text-slate-900 transition-colors">
      <PersonalSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <PersonalTopbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <DemoRoleSwitcher />
    </div>
  );
}
