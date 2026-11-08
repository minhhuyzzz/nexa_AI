import { Suspense } from 'react';
import { AdminAssessmentPreviewClient } from './admin-preview-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Xem Trước Bài Khảo Thí | NEXA Admin',
  description: 'Chế độ thẩm định nội dung và đáp án chuẩn dành riêng cho Quản trị viên',
};

export default async function AdminAssessmentPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Đang tải dữ liệu thẩm định đề thi...
          </p>
        </div>
      }
    >
      <AdminAssessmentPreviewClient assessmentId={id} />
    </Suspense>
  );
}
