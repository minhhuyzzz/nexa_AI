import type { Metadata } from 'next';
import { PersonalSidebar } from '@/components/dashboard/personal/PersonalSidebar';
import { PersonalTopbar } from '@/components/dashboard/personal/PersonalTopbar';

export const metadata: Metadata = {
  title: 'NEXA Personal | Hồ sơ năng lực số',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell min-h-screen flex bg-white dark:bg-black text-slate-900 dark:text-neutral-100 transition-colors">
      <PersonalSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black">
        <PersonalTopbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
