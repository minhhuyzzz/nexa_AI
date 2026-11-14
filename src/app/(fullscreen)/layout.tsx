import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NEXA | Phòng Kiểm chứng Năng lực Toàn màn hình',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fullscreen-shell min-h-screen w-full bg-white dark:bg-black text-slate-900 dark:text-neutral-100 transition-colors">
      {children}
    </div>
  );
}
