import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { OrgClassesDashboardClient } from '@/components/dashboard/org/classes/OrgClassesDashboardClient';
import type { OrgClassItem } from '@/components/dashboard/org/classes/types';

export const dynamic = 'force-dynamic';

export default async function OrgClassesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org } = await requireOrgPagePermission(slug, 'MANAGE_CLASSES');
  const adminSupabase = createAdminClient();

  // 1. Fetch organization classes with relations
  const { data: rawClasses } = await adminSupabase
    .from('evaluator_classes')
    .select(`
      id,
      name,
      class_code,
      description,
      group_type,
      status,
      term,
      instructor_id,
      instructor_name,
      max_capacity,
      settings,
      created_at,
      class_members ( id ),
      class_assignments ( id )
    `)
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false });

  // 2. Fetch real pending submissions count per class (No fake numbers)
  const classIds = (rawClasses || []).map((c: any) => c.id);
  const pendingByClass = new Map<string, number>();

  if (classIds.length > 0) {
    const { data: pendingSubs } = await adminSupabase
      .from('assessment_submissions')
      .select('id, class_id')
      .in('class_id', classIds)
      .eq('status', 'SUBMITTED');

    (pendingSubs || []).forEach((s: any) => {
      if (s.class_id) {
        pendingByClass.set(s.class_id, (pendingByClass.get(s.class_id) || 0) + 1);
      }
    });
  }

  const initialClasses: OrgClassItem[] = (rawClasses || []).map((cls: any) => {
    const membersCount = Array.isArray(cls.class_members) ? cls.class_members.length : 0;
    const assignmentsCount = Array.isArray(cls.class_assignments)
      ? cls.class_assignments.length
      : 0;

    return {
      id: cls.id,
      name: cls.name,
      classCode: cls.class_code,
      description: cls.description,
      groupType: cls.group_type || 'CLASS',
      status: cls.status || 'ACTIVE',
      term: cls.term || null,
      instructorId: null,
      instructorName: null,
      maxCapacity: cls.max_capacity || 1000,
      settings: cls.settings || {},
      createdAt: cls.created_at,
      membersCount,
      assignmentsCount,
      participationRate: null,
      pendingGradingCount: pendingByClass.get(cls.id) || 0,
    };
  });

  return (
    <OrgClassesDashboardClient
      organizationId={org.id}
      organizationName={org.name}
      slug={slug}
      initialClasses={initialClasses}
      isManager={true}
    />
  );
}
