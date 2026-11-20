import React from 'react';
import { PolicyNavHeader } from '@/components/policies/PolicyNavHeader';
import { PolicyFooter } from '@/components/policies/PolicyFooter';

export const metadata = {
  title: 'Câu Hỏi Thường Gặp & Hướng Dẫn Khảo Thí | NEXA',
  description:
    'Giải đáp toàn diện về cơ chế làm bài, chấm trắc nghiệm tức thì, bàn chấm Rubric, mã phòng thi trực tiếp, chứng nhận số ký băm kép và chính sách an toàn trí tuệ nhân tạo trên NEXA.',
  metadataBase: new URL('https://nexa.edu.vn'),
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'Câu Hỏi Thường Gặp & Hướng Dẫn Khảo Thí | NEXA',
    description:
      'Giải đáp toàn diện về cơ chế làm bài, bàn chấm Rubric, chứng nhận số và an toàn trí tuệ nhân tạo trên Nền tảng NEXA.',
    url: 'https://nexa.edu.vn/faq',
    siteName: 'NEXA',
    locale: 'vi_VN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 font-sans transition-colors">
      <PolicyNavHeader />
      <main className="flex-1 w-full">{children}</main>
      <PolicyFooter />
    </div>
  );
}
