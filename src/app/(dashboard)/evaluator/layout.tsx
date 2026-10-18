import { EvaluatorSidebar } from '@/components/dashboard/evaluator/EvaluatorSidebar';
import { EvaluatorTopbar } from '@/components/dashboard/evaluator/EvaluatorTopbar';
import { DemoRoleSwitcher } from '@/components/dashboard/DemoRoleSwitcher';

export default function EvaluatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      <EvaluatorSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <EvaluatorTopbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <DemoRoleSwitcher />
    </div>
  );
}
