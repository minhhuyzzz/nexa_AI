import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface EffectiveUser {
  id: string;
  email?: string;
  role: 'LEARNER' | 'EVALUATOR' | 'ADMIN';
  nickname?: string;
}

export async function getEffectiveUser(supabase: SupabaseClient): Promise<EffectiveUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role, nickname')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || profile?.email,
      role: (profile?.role as 'LEARNER' | 'EVALUATOR' | 'ADMIN') || 'LEARNER',
      nickname: profile?.nickname || user.user_metadata?.nickname || 'Người dùng',
    };
  }

  // Development / Demo mode fallback
  if (process.env.NODE_ENV !== 'production') {
    const cookieStore = await cookies();
    const demoRole = cookieStore.get('nexa_demo_role')?.value?.toUpperCase();
    if (demoRole === 'EVALUATOR') {
      return {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'evaluator@nexa.edu.vn',
        role: 'EVALUATOR',
        nickname: 'Người đánh giá (Demo)',
      };
    }
    if (demoRole === 'ADMIN') {
      return {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'admin.nexa@gmail.com',
        role: 'ADMIN',
        nickname: 'Quản trị viên (Demo)',
      };
    }
    if (demoRole === 'LEARNER') {
      return {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'learner@nexa.edu.vn',
        role: 'LEARNER',
        nickname: 'Học viên (Demo)',
      };
    }
  }

  return null;
}
