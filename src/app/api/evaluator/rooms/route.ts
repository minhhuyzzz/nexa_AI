import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { QuotaEnforcementService } from '@/features/billing/services/quota-enforcement.service';

const createRoomSchema = z.object({
  title: z.string().min(3, 'Tên phòng thi tối thiểu 3 ký tự'),
  assessmentId: z.string().uuid('Mã đề thi không hợp lệ'),
  roomMode: z.enum(['OPEN', 'GROUP_ONLY']).default('OPEN'),
  classId: z.string().uuid().nullable().optional(),
  organizationId: z.string().uuid().nullable().optional(),
  themeId: z.enum(['minimal_white', 'space_blue', 'aurora', 'dark_professional']).default('minimal_white'),
  scheduledStart: z.string().nullable().optional(),
  durationMinutes: z.number().int().positive().optional(),
  allowLateJoin: z.boolean().default(false),
  autoSubmitOnTimeout: z.boolean().default(true),
  showPin: z.boolean().default(true),
  systemNotificationsEnabled: z.boolean().default(true),
  roomDescription: z.string().max(500).nullable().optional(),
  maxParticipants: z.number().int().min(1).max(200).default(40),
  resultsPublishSettings: z
    .object({
      show_score: z.boolean().default(true),
      show_ranking: z.boolean().default(true),
      show_answers: z.boolean().default(false),
      scope: z.enum(['ALL', 'PASSED_ONLY']).default('ALL'),
    })
    .optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const classIdFilter = searchParams.get('classId');
    const orgIdFilter = searchParams.get('organizationId');

    // 2. Fetch rooms created by this evaluator or belonging to org
    let query = supabase
      .from('exam_rooms')
      .select(`
        id,
        room_code,
        title,
        assessment_id,
        room_mode,
        is_active,
        is_locked,
        theme_id,
        status,
        allow_late_join,
        auto_submit_on_timeout,
        show_pin,
        system_notifications_enabled,
        results_published,
        results_publish_settings,
        max_participants,
        room_description,
        scheduled_start,
        scheduled_end,
        started_at,
        ended_at,
        created_at,
        class_id,
        organization_id,
        assessments (
          id,
          title,
          duration_minutes,
          passing_score
        ),
        room_participants (
          id,
          user_id,
          status,
          is_ready,
          connection_status,
          score,
          submitted_at,
          joined_at
        )
      `)
      .order('created_at', { ascending: false });

    if (orgIdFilter) {
      query = query.eq('organization_id', orgIdFilter);
    } else {
      query = query.eq('created_by', user.id);
    }

    if (classIdFilter) {
      query = query.eq('class_id', classIdFilter);
    }

    if (statusFilter && statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter);
    }

    const { data: rooms, error } = await query;

    if (error) {
      console.error('Error fetching exam rooms:', error);
      return NextResponse.json({ error: 'Không thể tải danh sách phòng thi' }, { status: 500 });
    }

    const formattedRooms = (rooms || []).map((r) => {
      const participants = r.room_participants || [];
      const readyCount = participants.filter((p: any) => p.is_ready).length;
      const submittedCount = participants.filter((p: any) => p.status === 'SUBMITTED').length;

      // Normalize status if not set
      let effectiveStatus = r.status || 'WAITING';
      if (!r.status) {
        if (!r.is_active) effectiveStatus = 'ENDED';
        else if (r.scheduled_start) effectiveStatus = 'IN_PROGRESS';
        else effectiveStatus = 'WAITING';
      }

      return {
        id: r.id,
        roomCode: r.room_code,
        title: r.title,
        assessmentId: r.assessment_id,
        // @ts-expect-error join
        assessmentTitle: r.assessments?.title || 'Đề khảo thí',
        // @ts-expect-error join
        durationMinutes: r.assessments?.duration_minutes || 45,
        // @ts-expect-error join
        passingScore: r.assessments?.passing_score || 70,
        roomMode: r.room_mode,
        isActive: r.is_active,
        isLocked: r.is_locked || false,
        themeId: r.theme_id || 'minimal_white',
        status: effectiveStatus,
        allowLateJoin: r.allow_late_join ?? false,
        autoSubmitOnTimeout: r.auto_submit_on_timeout ?? true,
        showPin: r.show_pin ?? true,
        systemNotificationsEnabled: r.system_notifications_enabled ?? true,
        resultsPublished: r.results_published ?? false,
        resultsPublishSettings: r.results_publish_settings || {
          show_score: true,
          show_ranking: true,
          show_answers: false,
          scope: 'ALL',
        },
        maxParticipants: r.max_participants || 40,
        roomDescription: r.room_description || '',
        scheduledStart: r.scheduled_start,
        scheduledEnd: r.scheduled_end,
        startedAt: r.started_at || r.scheduled_start,
        endedAt: r.ended_at || r.scheduled_end,
        createdAt: r.created_at,
        participantCount: participants.length,
        readyCount,
        submittedCount,
      };
    });

    return NextResponse.json({ rooms: formattedRooms });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createRoomSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const {
      title,
      assessmentId,
      roomMode,
      classId,
      organizationId,
      themeId,
      scheduledStart,
      allowLateJoin,
      autoSubmitOnTimeout,
      showPin,
      systemNotificationsEnabled,
      roomDescription,
      maxParticipants,
      resultsPublishSettings,
    } = validated.data;

    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // Server-side Quota Gate Enforcement
    const quotaCheck = await QuotaEnforcementService.checkLiveRoomQuota(supabase, user.id);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { error: quotaCheck.reason || 'Đã đạt giới hạn số lượng phòng thi Live đang mở', quota: quotaCheck },
        { status: 403 }
      );
    }

    // 2. Generate unique 6-digit numeric PIN
    let roomCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      attempts++;
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const { data: existing } = await supabase
        .from('exam_rooms')
        .select('id')
        .eq('room_code', pin)
        .single();

      if (!existing) {
        roomCode = pin;
        isUnique = true;
      }
    }

    if (!roomCode) {
      roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    }

    // 3. Insert into exam_rooms
    const initialStatus = 'WAITING';

    const { data: newRoom, error: insertError } = await supabase
      .from('exam_rooms')
      .insert({
        room_code: roomCode,
        assessment_id: assessmentId,
        created_by: user.id,
        owner_user_id: user.id,
        class_id: classId || null,
        organization_id: organizationId || null,
        visibility: organizationId ? 'ORGANIZATION' : 'PERSONAL',
        title,
        room_mode: roomMode,
        theme_id: themeId,
        status: initialStatus,
        scheduled_start: scheduledStart || null,
        allow_late_join: allowLateJoin,
        auto_submit_on_timeout: autoSubmitOnTimeout,
        show_pin: showPin,
        system_notifications_enabled: systemNotificationsEnabled,
        room_description: roomDescription || null,
        max_participants: maxParticipants,
        results_publish_settings: resultsPublishSettings || {
          show_score: true,
          show_ranking: true,
          show_answers: false,
          scope: 'ALL',
        },
        is_active: true,
        is_locked: false,
      })
      .select(`
        id,
        room_code,
        title,
        assessment_id,
        room_mode,
        theme_id,
        status,
        is_active,
        created_at
      `)
      .single();

    if (insertError) {
      console.error('Error creating exam room:', insertError);
      return NextResponse.json({ error: 'Không thể tạo phòng thi trực tiếp' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      room: {
        id: newRoom.id,
        roomCode: newRoom.room_code,
        title: newRoom.title,
        assessmentId: newRoom.assessment_id,
        roomMode: newRoom.room_mode,
        themeId: newRoom.theme_id,
        status: newRoom.status,
        isActive: newRoom.is_active,
        createdAt: newRoom.created_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const updateRoomSchema = z.object({
  roomId: z.string().uuid('ID phòng thi không hợp lệ'),
  action: z.enum([
    'START',
    'PAUSE',
    'RESUME',
    'END',
    'LOCK',
    'UNLOCK',
    'PUBLISH_RESULTS',
    'UPDATE_SETTINGS',
  ]),
  payload: z.record(z.any()).optional(),
});

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const validated = updateRoomSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu cập nhật không hợp lệ' },
        { status: 400 }
      );
    }

    const { roomId, action, payload } = validated.data;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const now = new Date().toISOString();

    if (action === 'START') {
      const { data: updatedRoom, error: updateError } = await supabase
        .from('exam_rooms')
        .update({
          status: 'IN_PROGRESS',
          scheduled_start: now,
          started_at: now,
          is_active: true,
        })
        .eq('id', roomId)
        .eq('created_by', user.id)
        .select()
        .single();

      if (updateError || !updatedRoom) {
        return NextResponse.json(
          { error: 'Không thể bắt đầu phòng thi hoặc bạn không có quyền' },
          { status: 500 }
        );
      }

      // Update participants status to TAKING
      await supabase
        .from('room_participants')
        .update({ status: 'TAKING' })
        .eq('room_id', roomId)
        .eq('status', 'JOINED');

      return NextResponse.json({
        success: true,
        action: 'START',
        room: updatedRoom,
      });
    }

    if (action === 'PAUSE') {
      const { data: updatedRoom, error: updateError } = await supabase
        .from('exam_rooms')
        .update({ status: 'PAUSED' })
        .eq('id', roomId)
        .eq('created_by', user.id)
        .select()
        .single();

      if (updateError || !updatedRoom) {
        return NextResponse.json({ error: 'Không thể tạm dừng phòng thi' }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: 'PAUSE', room: updatedRoom });
    }

    if (action === 'RESUME') {
      const { data: updatedRoom, error: updateError } = await supabase
        .from('exam_rooms')
        .update({ status: 'IN_PROGRESS' })
        .eq('id', roomId)
        .eq('created_by', user.id)
        .select()
        .single();

      if (updateError || !updatedRoom) {
        return NextResponse.json({ error: 'Không thể tiếp tục phòng thi' }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: 'RESUME', room: updatedRoom });
    }

    if (action === 'END') {
      const { data: updatedRoom, error: updateError } = await supabase
        .from('exam_rooms')
        .update({
          status: 'ENDED',
          is_active: false,
          scheduled_end: now,
          ended_at: now,
        })
        .eq('id', roomId)
        .eq('created_by', user.id)
        .select()
        .single();

      if (updateError || !updatedRoom) {
        return NextResponse.json({ error: 'Không thể kết thúc phòng thi' }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: 'END', room: updatedRoom });
    }

    if (action === 'LOCK' || action === 'UNLOCK') {
      const isLocked = action === 'LOCK';
      const { data: updatedRoom, error: updateError } = await supabase
        .from('exam_rooms')
        .update({ is_locked: isLocked })
        .eq('id', roomId)
        .eq('created_by', user.id)
        .select()
        .single();

      if (updateError || !updatedRoom) {
        return NextResponse.json({ error: 'Không thể thay đổi trạng thái khóa phòng' }, { status: 500 });
      }

      return NextResponse.json({ success: true, action, isLocked, room: updatedRoom });
    }

    if (action === 'PUBLISH_RESULTS') {
      const publishSettings = payload?.publishSettings || {
        show_score: true,
        show_ranking: true,
        show_answers: false,
        scope: 'ALL',
      };

      const { data: updatedRoom, error: updateError } = await supabase
        .from('exam_rooms')
        .update({
          results_published: true,
          status: 'RESULTS_PUBLISHED',
          results_publish_settings: publishSettings,
        })
        .eq('id', roomId)
        .eq('created_by', user.id)
        .select()
        .single();

      if (updateError || !updatedRoom) {
        return NextResponse.json({ error: 'Không thể công bố kết quả phòng thi' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'PUBLISH_RESULTS',
        room: updatedRoom,
      });
    }

    if (action === 'UPDATE_SETTINGS') {
      const updateData: Record<string, any> = {};
      if (payload?.themeId) updateData.theme_id = payload.themeId;
      if (payload?.title) updateData.title = payload.title;

      const { data: updatedRoom, error: updateError } = await supabase
        .from('exam_rooms')
        .update(updateData)
        .eq('id', roomId)
        .eq('created_by', user.id)
        .select()
        .single();

      if (updateError || !updatedRoom) {
        return NextResponse.json({ error: 'Không thể cập nhật cấu hình' }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: 'UPDATE_SETTINGS', room: updatedRoom });
    }

    return NextResponse.json({ error: 'Hành động không hỗ trợ' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'Thiếu mã định danh phòng thi (roomId)' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from('exam_rooms')
      .delete()
      .eq('id', roomId)
      .eq('created_by', user.id);

    if (deleteError) {
      console.error('Error deleting exam room:', deleteError);
      return NextResponse.json({ error: 'Không thể xóa phòng thi' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã xóa phòng thi thành công' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
