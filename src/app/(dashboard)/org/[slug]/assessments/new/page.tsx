import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { AssessmentStudio } from '@/features/assessments/components/AssessmentStudio';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Soạn Đề Khảo Thí Tổ Chức | NEXA B2B',
  description: 'Soạn đề khảo thí nội bộ gắn với không gian tổ chức',
};

export default async function OrgNewAssessmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const adminSupabase = createAdminClient();

  const { data: org } = await adminSupabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (!org) {
    notFound();
  }

  return (
    <AssessmentStudio
      role="EVALUATOR"
      organizationId={org.id}
      returnUrl={`/org/${slug}/assessments`}
    />
  );
}
