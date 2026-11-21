import { createAdminClient } from '@/lib/supabase/admin';
import { extractClientIp } from './client-ip';

export interface RecordAdminAuditParams {
  adminId?: string;
  actorId?: string;
  adminEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  oldValues?: Record<string, unknown>;
  ipAddress?: string;
  req?: any;
}

export { extractClientIp } from './client-ip';

/**
 * Persists an immutable privileged action audit record into public.admin_audit_logs.
 * Errors are caught and logged to console to prevent blocking administrative operations.
 */
export async function recordAdminAudit(params: RecordAdminAuditParams): Promise<void> {
  try {
    const supabase = createAdminClient();
    const details = params.details || {
      new_values: params.newValues,
      old_values: params.oldValues,
    };

    const targetAdminId = params.adminId || params.actorId || null;
    let resolvedEmail = params.adminEmail || null;
    const resolvedIp = params.ipAddress || (params.req ? extractClientIp(params.req) : null);

    // Tự động đối soát tìm email từ bảng profiles nếu caller chưa truyền adminEmail
    if (!resolvedEmail && targetAdminId) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', targetAdminId)
          .maybeSingle();
        if (profile?.email) {
          resolvedEmail = profile.email;
        }
      } catch {
        // Tiếp tục ghi log dù tra cứu phụ thất bại
      }
    }

    const { error } = await supabase.from('admin_audit_logs').insert({
      admin_id: targetAdminId,
      admin_email: resolvedEmail,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId || null,
      details,
      ip_address: resolvedIp || null,
    });

    if (error) {
      console.warn('Failed to insert admin audit log:', error.message);
    }
  } catch (err) {
    console.warn('Exception recording admin audit log:', err instanceof Error ? err.message : String(err));
  }
}
