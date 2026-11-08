import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminNewAssessmentPage() {
  const supabase = createAdminClient();

  // Create an initial draft system assessment
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
    })
    .select('id')
    .single();

  if (error || !newAsm) {
    redirect('/admin/content');
  }

  redirect(`/admin/content/assessments/${newAsm.id}`);
}
