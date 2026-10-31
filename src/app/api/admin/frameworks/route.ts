import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';
import { FrameworkService } from '@/features/framework/services/framework.service';

// GET: Fetch framework with all domains & competencies
export async function GET() {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();
    const { data: framework, error: fwErr } = await adminSupabase
      .from('assessment_frameworks')
      .select('id, code, title, version, description, status')
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (fwErr || !framework) {
      return NextResponse.json({ error: 'Không tìm thấy khung năng lực' }, { status: 404 });
    }

    const lockInfo = await FrameworkService.isFrameworkLocked(adminSupabase, framework.id);

    const { data: domains, error: domErr } = await adminSupabase
      .from('competency_domains')
      .select(`
        id,
        domain_index,
        code,
        title,
        description,
        competencies (
          id,
          skill_code,
          title,
          description,
          target_level,
          display_order
        )
      `)
      .eq('framework_id', framework.id)
      .order('domain_index', { ascending: true });

    if (domErr) {
      return NextResponse.json({ error: domErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      framework: {
        ...framework,
        isLocked: lockInfo.isLocked,
        historicalSubmissionsCount: lockInfo.historicalSubmissionsCount,
      },
      domains: domains || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: Update Domain/Competency OR Create New Framework Version
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();
    const body = await request.json();

    // 1. Branch: Create New Framework Version (ADM-04)
    if (body.action === 'CREATE_NEW_VERSION') {
      const { frameworkId, nextVersion, description } = body;
      if (!frameworkId || !nextVersion) {
        return NextResponse.json(
          { error: 'Vui lòng cung cấp frameworkId và số hiệu phiên bản mới (ví dụ: 1.1)' },
          { status: 400 }
        );
      }

      const newFw = await FrameworkService.createNewVersion(
        adminSupabase,
        frameworkId,
        nextVersion.trim(),
        description
      );

      await recordAdminAudit({
        actorId: auth.user!.id,
        action: 'CREATE',
        targetType: 'FRAMEWORK_VERSION',
        targetId: newFw.id,
        newValues: { version: nextVersion, previousId: frameworkId },
      });

      return NextResponse.json({
        success: true,
        message: `Đã phát hành phiên bản khung năng lực ${nextVersion} thành công`,
        framework: newFw,
      });
    }

    const { entityType, id, title, code, skill_code, description, target_level, allowLockedEdit } = body;

    if (!id || !entityType) {
      return NextResponse.json({ error: 'Thiếu thông tin entityType hoặc id' }, { status: 400 });
    }

    // 2. ADM-04: Enforce version immutability if historical submissions exist
    const { count: subCount } = await adminSupabase
      .from('assessment_submissions')
      .select('id', { count: 'exact', head: true });

    if ((subCount ?? 0) > 0 && !allowLockedEdit) {
      return NextResponse.json(
        {
          error: `Khung năng lực hiện tại đã có ${subCount} bài khảo thí lịch sử của học viên. Để bảo đảm toàn vẹn học thuật và tính pháp lý, không được sửa đổi trực tiếp. Vui lòng tạo phiên bản mới (v1.1, v2.0).`,
          isLocked: true,
          historicalSubmissionsCount: subCount,
        },
        { status: 400 }
      );
    }

    if (entityType === 'DOMAIN') {
      const updates: Record<string, any> = {};
      if (title) updates.title = title.trim();
      if (code) updates.code = code.trim();
      if (description !== undefined) updates.description = description.trim();

      const { data, error } = await adminSupabase
        .from('competency_domains')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await recordAdminAudit({
        actorId: auth.user!.id,
        action: 'UPDATE',
        targetType: 'FRAMEWORK_DOMAIN',
        targetId: id,
        newValues: updates,
      });

      return NextResponse.json({ success: true, domain: data });
    }

    if (entityType === 'COMPETENCY') {
      const updates: Record<string, any> = {};
      if (title) updates.title = title.trim();
      if (skill_code) updates.skill_code = skill_code.trim();
      if (description !== undefined) updates.description = description.trim();
      if (target_level !== undefined) updates.target_level = Number(target_level);

      const { data, error } = await adminSupabase
        .from('competencies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await recordAdminAudit({
        actorId: auth.user!.id,
        action: 'UPDATE',
        targetType: 'FRAMEWORK_COMPETENCY',
        targetId: id,
        newValues: updates,
      });

      return NextResponse.json({ success: true, competency: data });
    }

    return NextResponse.json({ error: 'entityType không hợp lệ' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Add new competency to a domain
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();

    const body = await request.json();
    const { domain_id, skill_code, title, description, target_level } = body;

    if (!domain_id || !skill_code || !title) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ Miền, Mã kỹ năng và Tên kỹ năng' }, { status: 400 });
    }

    // ADM-04: Enforce version immutability if historical submissions exist
    const { count: subCount } = await adminSupabase
      .from('assessment_submissions')
      .select('id', { count: 'exact', head: true });

    if ((subCount ?? 0) > 0 && !body.allowLockedEdit) {
      return NextResponse.json(
        {
          error: `Khung năng lực hiện tại đã có ${subCount} bài khảo thí lịch sử của học viên. Không được thêm kỹ năng trực tiếp. Vui lòng tạo phiên bản mới (v1.1, v2.0).`,
          isLocked: true,
        },
        { status: 400 }
      );
    }

    const { data, error } = await adminSupabase
      .from('competencies')
      .insert({
        domain_id,
        skill_code: skill_code.trim(),
        title: title.trim(),
        description: (description || '').trim(),
        target_level: Number(target_level) || 2,
        display_order: 99,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAdminAudit({
      actorId: auth.user!.id,
      action: 'CREATE',
      targetType: 'FRAMEWORK_COMPETENCY',
      targetId: data.id,
      newValues: {
        domain_id,
        skill_code,
        title,
        target_level,
      },
    });

    return NextResponse.json({ success: true, competency: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
