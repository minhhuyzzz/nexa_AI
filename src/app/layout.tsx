import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NEXA — Nền tảng Đánh giá & Phát triển Năng lực Số',
  description: 'Hệ thống đánh giá, phân tích và chứng nhận phát triển năng lực số dựa trên trí tuệ nhân tạo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={plusJakartaSans.variable}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Playfair+Display:ital,wght@0,400..700;1,400..700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Dark mode is supported across Personal (/personal), Org (/org), Admin (/admin), and legacy routes (/learner, /evaluator)
                var p = window.location.pathname;
                var isDashboard = p.startsWith('/personal') || p.startsWith('/org') || p.startsWith('/admin') || p.startsWith('/learner') || p.startsWith('/evaluator');
                if (isDashboard) {
                  var saved = localStorage.getItem('nexa_theme');
                  if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="font-sans min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 antialiased selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-950 dark:selection:text-blue-200">
        {children}
      </body>
    </html>
  );
}
