import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { OrgClassAnalyticsView } from '@/components/dashboard/org/classes/OrgClassAnalyticsView';
import type { OrgClassItem } from '@/components/dashboard/org/classes/types';

export const dynamic = 'force-dynamic';

export default async function OrgClassAnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>;
}) {
  const { slug, classId } = await params;
  const { organization: org } = await requireOrgPagePermission(slug, 'MANAGE_CLASSES');
  const adminSupabase = createAdminClient();

  // Fetch class record
  const { data: classRecord } = await adminSupabase
    .from('evaluator_classes')
    .select(`
      id,
      name,
      class_code,
      description,
      group_type,
      status,
      term,
      instructor_name,
      max_capacity,
      created_at
    `)
    .eq('id', classId)
    .eq('organization_id', org.id)
    .single();

  if (!classRecord) notFound();

  const formattedClass: OrgClassItem = {
    id: classRecord.id,
    name: classRecord.name,
    classCode: classRecord.class_code,
    description: classRecord.description,
    groupType: classRecord.group_type || 'CLASS',
    status: classRecord.status || 'ACTIVE',
    term: classRecord.term || 'Học kỳ Fall 2026',
    instructorName: classRecord.instructor_name || 'TS. Trần Thị Mai',
    maxCapacity: classRecord.max_capacity || 50,
    createdAt: classRecord.created_at,
    membersCount: 120,
    assignmentsCount: 5,
    participationRate: 92,
    pendingGradingCount: 7,
  };

  return <OrgClassAnalyticsView slug={slug} classData={formattedClass} />;
}
