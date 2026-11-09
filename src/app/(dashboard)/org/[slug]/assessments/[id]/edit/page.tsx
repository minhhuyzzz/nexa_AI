import React from 'react';
import { notFound } from 'next/navigation';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { AuthoringEditorTwoPane } from '@/components/dashboard/authoring/AuthoringEditorTwoPane';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Biên soạn câu hỏi khảo thí | NEXA Tổ chức',
  description: 'Trình biên soạn câu hỏi 2 vùng chuẩn hóa 5 miền năng lực số',
};

export default async function OrgAuthoringEditPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { organization: org } = await requireOrgPagePermission(slug, 'MANAGE_ASSESSMENTS');

  return (
    <AuthoringEditorTwoPane
      assessmentId={id}
      returnUrl={`/org/${slug}/assessments`}
      previewUrl={`/org/${slug}/assessments/${id}/preview`}
      organizationId={org.id}
      workspaceMode="ORG"
      slug={slug}
    />
  );
}
