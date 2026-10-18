import { LearnerSidebar } from '@/components/dashboard/learner/LearnerSidebar';
import { LearnerTopbar } from '@/components/dashboard/learner/LearnerTopbar';
import { DemoRoleSwitcher } from '@/components/dashboard/DemoRoleSwitcher';

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      <LearnerSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <LearnerTopbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <DemoRoleSwitcher />
    </div>
  );
}
