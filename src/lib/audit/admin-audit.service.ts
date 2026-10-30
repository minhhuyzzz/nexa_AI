import { createAdminClient } from '@/lib/supabase/admin';

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
}

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

    const { error } = await supabase.from('admin_audit_logs').insert({
      admin_id: params.adminId || params.actorId || null,
      admin_email: params.adminEmail || null,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId || null,
      details,
      ip_address: params.ipAddress || null,
    });

    if (error) {
      console.warn('Failed to insert admin audit log:', error.message);
    }
  } catch (err) {
    console.warn('Exception recording admin audit log:', err instanceof Error ? err.message : String(err));
  }
}
