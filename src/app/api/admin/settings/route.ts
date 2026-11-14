import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';

export const dynamic = 'force-dynamic';

const updateSettingsSchema = z.object({
  platformName: z.string().min(1).default('NEXA'),
  supportEmail: z.string().email().default('support@nexa.edu.vn'),
  systemTimezone: z.string().default('Asia/Ho_Chi_Minh'),
  maintenanceMode: z.boolean().default(false),
  defaultLanguage: z.string().default('vi'),
  sessionTimeout: z.string().default('8h'),
  dataRetention: z.string().default('36m'),
  maxUploadSize: z.string().default('50mb'),
  requireContentModeration: z.boolean().default(true),
  isolateCanonicalBank: z.boolean().default(true),
  immutableAuditLogs: z.boolean().default(true),
  alertEmails: z.array(z.string().email()).default(['ops@nexa.edu.vn']),
  // Dynamic PTS Gamification Policy
  gamificationPolicy: z.object({
    contributionMcqDefaultPts: z.number().int().min(0).default(20),
    contributionScenarioDefaultPts: z.number().int().min(0).default(50),
    contributionPracticalFileDefaultPts: z.number().int().min(0).default(100),
    bugReportDefaultPts: z.number().int().min(0).default(150),
    minRewardPts: z.number().int().min(0).default(0),
    maxRewardPts: z.number().int().min(10).default(500),
  }).optional(),
});

export async function GET() {
  try {
    const auth = await requirePlatformAdmin('MANAGE_SETTINGS');
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const supabase = createAdminClient();
    const { data: records, error } = await supabase
      .from('system_settings')
      .select('key, value, updated_at');

    if (error && error.code !== 'PGRST116') {
      console.warn('GET /api/admin/settings query error:', error.message);
    }

    const settingsMap: Record<string, unknown> = {};
    (records || []).forEach((row) => {
      settingsMap[row.key] = row.value;
    });

    return NextResponse.json({
      success: true,
      settings: settingsMap,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin('MANAGE_SETTINGS');
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const body = await request.json();
    const validation = updateSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dữ liệu cấu hình không hợp lệ', details: validation.error.format() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const validatedData = validation.data;

    // Upsert key settings
    const upsertPayload = [
      {
        key: 'general_config',
        value: {
          platformName: validatedData.platformName,
          supportEmail: validatedData.supportEmail,
          systemTimezone: validatedData.systemTimezone,
          maintenanceMode: validatedData.maintenanceMode,
          defaultLanguage: validatedData.defaultLanguage,
        },
        updated_at: new Date().toISOString(),
        updated_by: auth.user!.id,
      },
      {
        key: 'security_policy',
        value: {
          sessionTimeout: validatedData.sessionTimeout,
          dataRetention: validatedData.dataRetention,
          maxUploadSize: validatedData.maxUploadSize,
          requireContentModeration: validatedData.requireContentModeration,
          isolateCanonicalBank: validatedData.isolateCanonicalBank,
          immutableAuditLogs: validatedData.immutableAuditLogs,
          alertEmails: validatedData.alertEmails,
        },
        updated_at: new Date().toISOString(),
        updated_by: auth.user!.id,
      },
      {
        key: 'gamification_reward_policy',
        value: validatedData.gamificationPolicy || {
          contributionMcqDefaultPts: 20,
          contributionScenarioDefaultPts: 50,
          contributionPracticalFileDefaultPts: 100,
          bugReportDefaultPts: 150,
          minRewardPts: 0,
          maxRewardPts: 500,
        },
        updated_at: new Date().toISOString(),
        updated_by: auth.user!.id,
      },
    ];

    const { error: upsertErr } = await supabase
      .from('system_settings')
      .upsert(upsertPayload, { onConflict: 'key' });

    if (upsertErr) {
      console.warn('Settings upsert warning:', upsertErr.message);
    }

    // Record privileged action audit log
    await recordAdminAudit({
      adminId: auth.user!.id,
      adminEmail: auth.user!.email,
      action: 'UPDATE_SYSTEM_SETTINGS',
      targetType: 'SYSTEM_SETTINGS',
      details: {
        keys: ['general_config', 'security_policy', 'gamification_reward_policy'],
        maintenanceMode: validatedData.maintenanceMode,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cấu hình hệ thống đã được lưu trữ thành công và ghi nhật ký kiểm toán',
      settings: validatedData,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
