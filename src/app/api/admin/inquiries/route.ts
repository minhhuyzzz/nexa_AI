import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';

export const dynamic = 'force-dynamic';

const updateInquirySchema = z.object({
  id: z.string().uuid('ID hồ sơ không hợp lệ'),
  status: z.enum(['NEW', 'CONTACTED', 'PROPOSAL_SENT', 'REJECTED', 'APPROVED']),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const adminSupabase = createAdminClient();
    let query = adminSupabase
      .from('business_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      query = query.eq('status', status.toUpperCase());
    }

    const { data: inquiries, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      inquiries: inquiries || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminUser = auth.user!;
    const body = await request.json();
    const validation = updateInquirySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { id, status, notes } = validation.data;
    const adminSupabase = createAdminClient();

    const updatePayload: Record<string, unknown> = {
      status,
      reviewed_by: adminUser.id,
      reviewed_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      updatePayload.notes = notes.trim();
    }

    const { data: updated, error } = await adminSupabase
      .from('business_inquiries')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record audit log
    await recordAdminAudit({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'INQUIRY_STATUS_UPDATED',
      targetType: 'BUSINESS_INQUIRY',
      targetId: id,
      details: {
        newStatus: status,
        notes,
        orgName: updated?.org_name,
      },
    });

    return NextResponse.json({
      success: true,
      inquiry: updated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
