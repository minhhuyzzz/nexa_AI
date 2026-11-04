import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { OrgClassDetailView } from '@/components/dashboard/org/classes/OrgClassDetailView';
import type {
  OrgClassItem,
  ClassMemberItem,
  ClassAssignmentItem,
} from '@/components/dashboard/org/classes/types';

export const dynamic = 'force-dynamic';

export default async function OrgClassDetailPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>;
}) {
  const { slug, classId } = await params;
  const { organization: org, user } = await requireOrgPagePermission(slug, 'MANAGE_CLASSES');
  const adminSupabase = createAdminClient();

  // 1. Fetch class record (scoped to organization, support UUID or class_code)
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classId);

  let classQuery = adminSupabase
    .from('evaluator_classes')
    .select('*')
    .eq('organization_id', org.id);

  if (isUuid) {
    classQuery = classQuery.eq('id', classId);
  } else {
    classQuery = classQuery.eq('class_code', classId);
  }

  const { data: classRecord } = await classQuery.maybeSingle();

  if (!classRecord) notFound();

  const realClassId = classRecord.id;

  // 2. Fetch class members with profile info
  const { data: membersRaw } = await adminSupabase
    .from('class_members')
    .select(`
      id,
      joined_at,
      user_id,
      role_in_class,
      sub_group,
      student_code,
      profiles ( id, email, nickname, raw_user_meta_data )
    `)
    .eq('class_id', realClassId)
    .order('joined_at', { ascending: false });

  const members: ClassMemberItem[] = (membersRaw || []).map((m: any) => {
    const prof = m.profiles;
    const meta = prof?.raw_user_meta_data || {};
    const fullName = meta.full_name || meta.name || prof?.nickname || 'Học viên';
    const studentId = m.student_code || meta.student_id || `PH${m.user_id.slice(0, 5).toUpperCase()}`;

    return {
      id: m.id,
      userId: m.user_id,
      fullName,
      studentId,
      email: prof?.email || '',
      roleInClass: m.role_in_class || 'STUDENT',
      subGroup: m.sub_group || null,
      participationRate: 0,
      joinedAt: m.joined_at,
      lastActiveAt: null,
    };
  });

  // 3. Fetch assignments
  const { data: assignmentsRaw } = await adminSupabase
    .from('class_assignments')
    .select(`
      id,
      assessment_id,
      deadline,
      start_time,
      timezone,
      allow_late_submission,
      reminder_before_hours,
      ai_grading_enabled,
      shuffle_questions,
      immediate_results,
      require_evidence,
      allowed_evidence_types,
      max_evidence_mb,
      estimated_ai_credits,
      status,
      created_at,
      assessments ( id, title, duration_minutes, passing_score )
    `)
    .eq('class_id', realClassId)
    .order('created_at', { ascending: false });

  const assignments: ClassAssignmentItem[] = (assignmentsRaw || []).map((a: any) => ({
    id: a.id,
    assessmentId: a.assessment_id,
    title: a.assessments?.title || 'Đề khảo thí',
    durationMinutes: a.assessments?.duration_minutes || 60,
    passingScore: a.assessments?.passing_score || 70,
    startTime: a.start_time,
    deadline: a.deadline,
    timezone: a.timezone || 'Asia/Ho_Chi_Minh',
    allowLateSubmission: Boolean(a.allow_late_submission),
    reminderBeforeHours: a.reminder_before_hours || 24,
    aiGradingEnabled: Boolean(a.ai_grading_enabled),
    shuffleQuestions: Boolean(a.shuffle_questions),
    immediateResults: Boolean(a.immediate_results),
    requireEvidence: Boolean(a.require_evidence),
    allowedEvidenceTypes: a.allowed_evidence_types || ['PDF', 'DOCX'],
    maxEvidenceMb: a.max_evidence_mb || 50,
    estimatedAiCredits: a.estimated_ai_credits || 0,
    status: a.status || 'PUBLISHED',
    createdAt: a.created_at,
  }));

  // Real pending submissions count for this class (No fake numbers)
  const { count: pendingGradingCount } = await adminSupabase
    .from('assessment_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', realClassId)
    .eq('status', 'SUBMITTED');

  // 4. Fetch organization members to serve as candidates for drawer
  const { data: orgUsers } = await adminSupabase
    .from('user_organizations')
    .select(`
      user_id,
      org_role,
      profiles ( id, email, nickname, raw_user_meta_data )
    `)
    .eq('organization_id', org.id)
    .eq('status', 'ACTIVE');

  const enrolledUserIds = new Set(members.map((m) => m.userId));
  const orgCandidates = (orgUsers || [])
    .filter((u: any) => !enrolledUserIds.has(u.user_id))
    .map((u: any) => {
      const prof = u.profiles;
      const meta = prof?.raw_user_meta_data || {};
      const fullName = meta.full_name || meta.name || prof?.nickname || 'Nhân sự';
      return {
        userId: u.user_id,
        fullName,
        email: prof?.email || '',
        suggestedRole: u.org_role === 'ASSESSOR' ? 'ASSISTANT_TEACHER' : 'STUDENT',
      };
    });

  // 5. Available assessments for the class assignment modal
  const { data: rawAssessments } = await adminSupabase
    .from('assessments')
    .select('id, title, duration_minutes, assessment_items(id)')
    .or(`organization_id.eq.${org.id},organization_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(20);

  const availableAssessments = (rawAssessments || []).map((ass: any) => ({
    id: ass.id,
    title: ass.title,
    durationMinutes: ass.duration_minutes || 60,
    questionCount: Array.isArray(ass.assessment_items) ? ass.assessment_items.length : 0,
    rubricTitle: 'Thang điểm 100 DigComp',
  }));

  const formattedClass: OrgClassItem = {
    id: classRecord.id,
    name: classRecord.name,
    classCode: classRecord.class_code,
    description: classRecord.description,
    groupType: classRecord.group_type || 'CLASS',
    status: classRecord.status || 'ACTIVE',
    term: classRecord.term || null,
    instructorId: classRecord.instructor_id,
    instructorName: classRecord.instructor_name || null,
    maxCapacity: classRecord.max_capacity || 1000,
    settings: classRecord.settings || {},
    createdAt: classRecord.created_at,
    membersCount: members.length,
    assignmentsCount: assignments.length,
    participationRate: null,
    pendingGradingCount: pendingGradingCount || 0,
  };

  return (
    <OrgClassDetailView
      slug={slug}
      organizationId={org.id}
      organizationName={org.name}
      classData={formattedClass}
      members={members}
      assignments={assignments}
      orgCandidates={orgCandidates}
      availableAssessments={availableAssessments}
      currentUserId={user.id}
      isManager={true}
    />
  );
}
