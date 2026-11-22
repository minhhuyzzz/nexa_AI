import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ canGrade: false, pendingCount: 0 });
    }

    // Check if user owns or evaluates at least one personal group (organization_id IS NULL)
    const { count, error } = await supabase
      .from('evaluator_classes')
      .select('id', { count: 'exact', head: true })
      .is('organization_id', null)
      .or(`evaluator_id.eq.${user.id},owner_user_id.eq.${user.id}`);

    const canGrade = Boolean(!error && count && count > 0);

    // Compute pending assignments count for the learner
    let pendingCount = 0;
    try {
      const { data: memberRows } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('user_id', user.id);

      const { data: managedRows } = await supabase
        .from('evaluator_classes')
        .select('id')
        .or(`evaluator_id.eq.${user.id},owner_user_id.eq.${user.id}`);

      const memberClassIds = (memberRows || []).map((m: any) => m.class_id).filter(Boolean);
      const managedClassIds = (managedRows || []).map((c: any) => c.id).filter(Boolean);
      const classIds = Array.from(new Set([...memberClassIds, ...managedClassIds]));

      if (classIds.length > 0) {
        const { data: assignments } = await supabase
          .from('class_assignments')
          .select('id, assessment_id')
          .in('class_id', classIds);

        const assignmentList = (assignments || []).filter((a: any) => Boolean(a.id));

        if (assignmentList.length > 0) {
          const { data: mySubmissions } = await supabase
            .from('assessment_submissions')
            .select('class_assignment_id, assessment_id')
            .eq('user_id', user.id)
            .in('status', ['SUBMITTED', 'EVALUATED']);

          const submittedAssignmentIds = new Set(
            (mySubmissions || []).map((s: any) => s.class_assignment_id).filter(Boolean)
          );
          const submittedAssessmentIds = new Set(
            (mySubmissions || []).map((s: any) => s.assessment_id).filter(Boolean)
          );

          pendingCount = assignmentList.filter((a: any) => {
            if (submittedAssignmentIds.has(a.id)) return false;
            if (a.assessment_id && submittedAssessmentIds.has(a.assessment_id)) return false;
            return true;
          }).length;
        }
      }
    } catch {
      // ignore
    }

    // Compute pending submissions to grade for personal groups
    let pendingGradeCount = 0;
    try {
      if (canGrade) {
        const { data: managedClasses } = await supabase
          .from('evaluator_classes')
          .select('id, class_members ( user_id )')
          .is('organization_id', null)
          .or(`evaluator_id.eq.${user.id},owner_user_id.eq.${user.id}`);

        const memberUserIds = Array.from(
          new Set(
            (managedClasses || []).flatMap((c: any) =>
              (c.class_members || []).map((m: any) => m.user_id)
            )
          )
        ).filter(Boolean);

        if (memberUserIds.length > 0) {
          const { count: pendingSubsCount } = await supabase
            .from('assessment_submissions')
            .select('id', { count: 'exact', head: true })
            .in('user_id', memberUserIds)
            .eq('status', 'SUBMITTED');

          pendingGradeCount = pendingSubsCount || 0;
        }
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ canGrade, pendingCount, pendingGradeCount });
  } catch {
    return NextResponse.json({ canGrade: false, pendingCount: 0 });
  }
}
