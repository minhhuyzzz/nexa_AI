import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { OrgNewAssessmentView } from '@/components/dashboard/org/assessments/OrgNewAssessmentView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Soạn Đề Khảo Thí Tổ Chức | NEXA B2B',
  description: 'Soạn đề khảo thí nội bộ gắn với không gian tổ chức theo chuẩn 2 bước',
};

export default async function OrgNewAssessmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org } = await requireOrgPagePermission(slug, 'MANAGE_ASSESSMENTS');

  return (
    <OrgNewAssessmentView
      orgId={org.id}
      orgName={org.name}
      slug={slug}
    />
  );
}
