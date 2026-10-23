import type { SupabaseClient } from '@supabase/supabase-js';

export interface ClassAccessResult {
  isEvaluator: boolean;
  isMember: boolean;
  hasAccess: boolean;
}

export async function verifyClassAccess(
  supabase: SupabaseClient,
  classId: string,
  userId: string,
  role?: string
): Promise<ClassAccessResult> {
  if (role === 'ADMIN') {
    return { isEvaluator: true, isMember: true, hasAccess: true };
  }

  // Check if user is the class evaluator
  const { data: cls } = await supabase
    .from('evaluator_classes')
    .select('id, evaluator_id')
    .eq('id', classId)
    .single();

  if (cls && cls.evaluator_id === userId) {
    return { isEvaluator: true, isMember: true, hasAccess: true };
  }

  // Check if user is an enrolled member
  const { data: member } = await supabase
    .from('class_members')
    .select('id')
    .eq('class_id', classId)
    .eq('user_id', userId)
    .single();

  const isMember = Boolean(member);
  return {
    isEvaluator: false,
    isMember,
    hasAccess: isMember,
  };
}
