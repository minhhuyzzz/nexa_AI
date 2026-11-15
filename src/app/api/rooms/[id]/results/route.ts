import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const admin = createAdminClient();

    // 1. Fetch Room via Admin Client (tránh bị RLS exam_rooms chặn khi is_active = FALSE)
    const { data: room, error: roomError } = await admin
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

    // Check user membership: phải là Host hoặc thí sinh đã tham gia phòng
    let isParticipant = false;
    let myParticipantRecord: any = null;
    if (!isHost) {
      const { data: part } = await admin
        .from('room_participants')
        .select('id, user_id, status, is_ready, score, submitted_at, joined_at, submission_id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (part) {
        isParticipant = true;
        myParticipantRecord = part;
      } else {
        const { data: profile } = await admin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role === 'ADMIN' || profile?.role === 'EVALUATOR') {
          isParticipant = true;
        }
      }

      if (!isParticipant) {
        return NextResponse.json({ error: 'Bạn không có quyền xem kết quả phòng thi này' }, { status: 403 });
      }
    }

    const isResultsPublished = Boolean(
      room.results_published || room.status === 'RESULTS_PUBLISHED' || room.status === 'ENDED'
    );

    // If not host and results not yet published, block viewing full roster
    if (!isHost && !isResultsPublished) {
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
    const { data: participants, error: pError } = await admin
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

    // 3. User profiles & Submissions for Proctoring / Trust Flags
    const userIds = (participants || []).map((p) => p.user_id);
    let profilesMap: Record<string, { full_name?: string; avatar_url?: string; student_code?: string }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profiles) {
        profilesMap = Object.fromEntries(profiles.map((pr) => [pr.id, pr]));
      }
    }

    const submissionIds = (participants || []).map((p) => p.submission_id).filter(Boolean);
    let submissionsMap: Record<string, any> = {};
    if (submissionIds.length > 0) {
      const { data: subs } = await admin
        .from('assessment_submissions')
        .select('id, proctoring_summary')
        .in('id', submissionIds);

      if (subs) {
        submissionsMap = Object.fromEntries(subs.map((s) => [s.id, s]));
      }
    }

    const rawAssessment = Array.isArray(room.assessments) ? room.assessments[0] : room.assessments;
    const roomPublishSettings = (room.results_publish_settings as any) || {};
    const durationMinutes = roomPublishSettings.duration_minutes || rawAssessment?.duration_minutes || 45;
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

      const sub = p.submission_id ? submissionsMap[p.submission_id] : null;
      const proctoringSummary = sub?.proctoring_summary || null;

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
        proctoringSummary,
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

    const publishSettings = (room.results_publish_settings as any) || {
      show_score: true,
      show_ranking: true,
      show_answers: false,
      scope: 'ALL',
    };
    const showAnswers = Boolean(publishSettings.show_answers);

    // 5. Fetch Question Review items for the current user (if allowed and available)
    let userReviewItems: any[] | null = null;
    const activeSubId = myParticipantRecord?.submission_id;

    if ((showAnswers || isHost) && room.assessment_id && activeSubId) {
      try {
        const { data: items } = await admin
          .from('assessment_items')
          .select('id, prompt, type, points, order_index, competency_id')
          .eq('assessment_id', room.assessment_id)
          .order('order_index', { ascending: true });

        if (items && items.length > 0) {
          const itemIds = items.map((it) => it.id);
          const [optionsRes, answersRes] = await Promise.all([
            admin
              .from('item_options')
              .select('id, item_id, content, order_index, explanation, is_correct')
              .in('item_id', itemIds)
              .order('order_index', { ascending: true }),
            admin
              .from('submission_answers')
              .select('item_id, selected_option_id, text_response, score_awarded')
              .eq('submission_id', activeSubId),
          ]);

          const optionsByItem: Record<string, any[]> = {};
          (optionsRes.data || []).forEach((opt) => {
            if (!optionsByItem[opt.item_id]) optionsByItem[opt.item_id] = [];
            optionsByItem[opt.item_id].push(opt);
          });

          const answersByItem: Record<string, any> = {};
          (answersRes.data || []).forEach((ans) => {
            answersByItem[ans.item_id] = ans;
          });

          userReviewItems = items.map((it, idx) => {
            const opts = optionsByItem[it.id] || [];
            const ans = answersByItem[it.id];
            const correctOpt = opts.find((o) => o.is_correct);
            const isCorrect = ans ? ans.selected_option_id === correctOpt?.id : false;

            return {
              index: idx + 1,
              id: it.id,
              prompt: it.prompt,
              type: it.type || 'MCQ',
              points: Number(it.points || 1),
              options: opts.map((o) => ({
                id: o.id,
                content: o.content,
                order_index: o.order_index,
                explanation: o.explanation,
                is_correct: o.is_correct,
              })),
              selectedOptionId: ans?.selected_option_id || null,
              correctOptionId: correctOpt?.id || null,
              isCorrect,
              scoreAwarded: ans?.score_awarded !== undefined ? Number(ans.score_awarded) : isCorrect ? Number(it.points || 1) : 0,
              explanation: correctOpt?.explanation || null,
              textResponse: ans?.text_response || null,
            };
          });
        }
      } catch (err) {
        console.warn('[RESULTS_REVIEW_ITEMS_ERR]:', err);
      }
    }

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
        isActive: room.is_active,
        themeId: room.theme_id || 'minimal_white',
        resultsPublished: room.results_published,
        resultsPublishSettings: room.results_publish_settings,
        startedAt: room.started_at,
        endedAt: room.ended_at,
        createdAt: room.created_at,
        isHost,
      },
      publishSettings,
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
      userReviewItems,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
