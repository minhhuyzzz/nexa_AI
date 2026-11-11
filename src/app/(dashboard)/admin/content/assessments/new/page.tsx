import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

export default async function AdminNewAssessmentPage() {
  const auth = await requirePlatformAdmin();
  if (!auth.isAuthorized || !auth.user) {
    redirect('/admin/content');
  }

  const supabase = await createClient();

  // 1. Fetch default framework
  const { data: framework } = await supabase
    .from('assessment_frameworks')
    .select('id')
    .limit(1)
    .single();

  // 2. Create an initial draft system assessment
  const { data: newAsm, error } = await supabase
    .from('assessments')
    .insert({
      title: 'Đề Khảo Thí Chuẩn Mới (Bản nháp)',
      description: 'Bài khảo thí chuẩn hóa đo lường 5 miền năng lực số toàn diện.',
      duration_minutes: 45,
      passing_score: 70,
      point_reward: 50,
      is_published: false,
      is_vip: false,
      access_tier: 'FREE',
      visibility: 'PUBLIC',
      framework_id: framework?.id || null,
      created_by: auth.user.id,
      owner_user_id: auth.user.id,
      organization_id: null,
    })
    .select('id')
    .single();

  if (error || !newAsm) {
    console.error('Error creating new assessment in AdminNewAssessmentPage:', error);
    redirect('/admin/content');
  }

  redirect(`/admin/content/assessments/${newAsm.id}`);
}
