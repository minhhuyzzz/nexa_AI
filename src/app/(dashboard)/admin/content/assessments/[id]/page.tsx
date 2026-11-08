import React from 'react';
import { AuthoringEditorTwoPane } from '@/components/dashboard/authoring/AuthoringEditorTwoPane';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Biên Soạn Đề Khảo Thí Chuẩn | NEXA Admin',
  description: 'Trình biên soạn câu hỏi 2 vùng chuẩn hóa 5 miền năng lực số',
};

export default async function AdminAssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AuthoringEditorTwoPane
      assessmentId={id}
      workspaceMode="ADMIN"
      returnUrl="/admin/content"
      previewUrl={`/admin/content/assessments/${id}/preview`}
    />
  );
}
