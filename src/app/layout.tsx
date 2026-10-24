import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Alex_Brush, Playfair_Display } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});

const alexBrush = Alex_Brush({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-script',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-serif',
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
      className={`${plusJakartaSans.variable} ${alexBrush.variable} ${playfairDisplay.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Dark mode is STRICTLY for dashboard routes (/learner, /evaluator, /admin)
                var p = window.location.pathname;
                var isDashboard = p.startsWith('/learner') || p.startsWith('/evaluator') || p.startsWith('/admin');
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
      <body suppressHydrationWarning className="font-sans min-h-screen bg-white text-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900">
        {children}
      </body>
    </html>
  );
}
