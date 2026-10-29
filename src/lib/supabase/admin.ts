import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Fail-closed security: Chặn đứng mọi hành vi thiếu key bảo mật trên Production
  if (!serviceRoleKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Bảo mật nghiêm ngặt: SUPABASE_SERVICE_ROLE_KEY bị thiếu trên môi trường Production. Không thể khởi tạo admin client.'
      );
    }
    console.warn(
      '[SECURITY WARNING] SUPABASE_SERVICE_ROLE_KEY không được tìm thấy. Tạm thời fallback sang ANON_KEY trên môi trường dev/test.'
    );
  }

  const effectiveKey =
    serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  return createClient(supabaseUrl, effectiveKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
