import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;

    if (!roomId) {
      return NextResponse.json({ error: 'Thiếu mã phòng thi (id)' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 1. Fetch Room
    const { data: room, error: roomError } = await supabase
      .from('exam_rooms')
      .select(`
        id,
        room_code,
        title,
        assessment_id,
        created_by,
        is_active,
        status,
        theme_id,
        results_published,
        results_publish_settings,
        started_at,
        ended_at,
        scheduled_start,
        scheduled_end,
        created_at,
        assessments (
          id,
          title,
          duration_minutes,
          passing_score
        )
      `)
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Không tìm thấy phòng thi' }, { status: 404 });
    }

    const isHost = room.created_by === user.id;

    // If not host and results not yet published, block viewing full roster
    if (!isHost && !room.results_published) {
      return NextResponse.json(
        {
          error: 'Kết quả phòng thi chưa được người tổ chức công bố',
          code: 'RESULTS_NOT_PUBLISHED',
          isPublished: false,
        },
        { status: 403 }
      );
    }

    // 2. Fetch Participants with profile & submissions
    const { data: participants, error: pError } = await supabase
      .from('room_participants')
      .select(`
        id,
        user_id,
        status,
        is_ready,
        score,
        submitted_at,
        joined_at,
        submission_id
      `)
      .eq('room_id', roomId)
      .order('score', { ascending: false, nullsFirst: false });

    if (pError) {
      console.error('Error fetching participants results:', pError);
      return NextResponse.json({ error: 'Không thể tải kết quả thí sinh' }, { status: 500 });
    }

    // 3. User profiles
    const userIds = (participants || []).map((p) => p.user_id);
    let profilesMap: Record<string, { full_name?: string; avatar_url?: string; student_code?: string }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profiles) {
        profilesMap = Object.fromEntries(profiles.map((pr) => [pr.id, pr]));
      }
    }

    const rawAssessment = Array.isArray(room.assessments) ? room.assessments[0] : room.assessments;
    const durationMinutes = rawAssessment?.duration_minutes || 45;
    const startTimeMs = room.started_at ? new Date(room.started_at).getTime() : new Date(room.created_at).getTime();

    // Map candidate results
    const candidateResults = (participants || []).map((p, idx) => {
      const pr = profilesMap[p.user_id];
      const fullName = pr?.full_name || 'Thí sinh';
      const initials = fullName
        .split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((w) => w[0].toUpperCase())
        .join('');

      let timeTakenSeconds = 0;
      let timeTakenDisplay = '--';
      let isOnTime = true;

      if (p.submitted_at) {
        const subTimeMs = new Date(p.submitted_at).getTime();
        timeTakenSeconds = Math.max(0, Math.floor((subTimeMs - startTimeMs) / 1000));
        const m = Math.floor(timeTakenSeconds / 60);
        const s = timeTakenSeconds % 60;
        timeTakenDisplay = `${m} phút ${s < 10 ? '0' : ''}${s} giây`;
        isOnTime = timeTakenSeconds <= durationMinutes * 60 + 120; // 2 min grace
      }

      // Candidate student code mockup or sequential
      const studentCode = `K48-${String(idx + 1).padStart(3, '0')}`;

      return {
        id: p.id,
        userId: p.user_id,
        rank: idx + 1,
        fullName,
        initials: initials || 'TS',
        avatarUrl: pr?.avatar_url || null,
        studentCode,
        score: p.score !== null && p.score !== undefined ? Number(p.score) : null,
        status: p.status,
        submittedAt: p.submitted_at,
        timeTakenDisplay,
        timeTakenSeconds,
        isOnTime,
      };
    });

    // 4. Calculate Aggregate KPIs
    const totalJoined = candidateResults.length;
    const submittedList = candidateResults.filter((c) => c.status === 'SUBMITTED' || c.submittedAt);
    const totalSubmitted = submittedList.length;
    const onTimeSubmitted = submittedList.filter((c) => c.isOnTime).length;
    const scores = submittedList.map((c) => c.score).filter((s): s is number => s !== null);

    const averageScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        roomCode: room.room_code,
        title: room.title,
        assessmentTitle: rawAssessment?.title || 'Bài thi khảo thí',
        durationMinutes,
        passingScore: rawAssessment?.passing_score || 70,
        status: room.status,
        themeId: room.theme_id || 'minimal_white',
        resultsPublished: room.results_published,
        resultsPublishSettings: room.results_publish_settings,
        startedAt: room.started_at,
        endedAt: room.ended_at,
        createdAt: room.created_at,
        isHost,
      },
      stats: {
        totalJoined,
        totalSubmitted,
        submitPercent: totalJoined > 0 ? Math.round((totalSubmitted / totalJoined) * 100) : 0,
        onTimeSubmitted,
        onTimePercent: totalSubmitted > 0 ? Math.round((onTimeSubmitted / totalSubmitted) * 100) : 0,
        averageScore,
        highestScore,
      },
      results: candidateResults,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
