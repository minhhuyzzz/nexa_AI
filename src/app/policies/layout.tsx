import React from 'react';
import { PolicyNavHeader } from '@/components/policies/PolicyNavHeader';
import { PolicyFooter } from '@/components/policies/PolicyFooter';

export const metadata = {
  title: {
    template: '%s | NEXA',
    default: 'Trung Tâm Chính Sách & Quy Định Pháp Lý | NEXA',
  },
  description:
    'Trung tâm chính sách, bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP, điều khoản dịch vụ khảo thí và cam kết bảo mật của Nền tảng NEXA.',
  metadataBase: new URL('https://nexa.edu.vn'),
  alternates: {
    canonical: '/policies',
  },
  openGraph: {
    title: 'Trung Tâm Chính Sách & Quy Định Pháp Lý | NEXA',
    description:
      'Quy chuẩn bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP, chuẩn mực trung thực học thuật và kiến trúc an toàn trí tuệ nhân tạo trên NEXA.',
    url: 'https://nexa.edu.vn/policies',
    siteName: 'NEXA',
    locale: 'vi_VN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 font-sans transition-colors">
      <PolicyNavHeader />
      <main className="flex-1 w-full">{children}</main>
      <PolicyFooter />
    </div>
  );
}
