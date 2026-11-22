import { NextResponse, type NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const { id: classId, assignmentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;

    // 1. Kiểm tra lớp học cá nhân và quyền hạn
    const { data: classRecord } = await adminSupabase
      .from('evaluator_classes')
      .select('*')
      .eq('id', classId)
      .maybeSingle();

    if (!classRecord) {
      return NextResponse.json({ error: 'Không tìm thấy nhóm' }, { status: 404 });
    }

    const isManager = classRecord.evaluator_id === user.id || classRecord.owner_user_id === user.id;

    // 2. Lấy thông tin đợt thi
    const { data: assignment, error: asgError } = await adminSupabase
      .from('class_assignments')
      .select(`
        id,
        assessment_id,
        deadline,
        start_time,
        allow_late_submission,
        status,
        created_at,
        assessments (
          id,
          title,
          description,
          duration_minutes,
          passing_score
        )
      `)
      .eq('id', assignmentId)
      .eq('class_id', classId)
      .maybeSingle();

    if (asgError || !assignment) {
      return NextResponse.json({ error: 'Không tìm thấy bài khảo thí của nhóm' }, { status: 404 });
    }

    const asm = (assignment as any).assessments;
    const assessmentTitle = asm?.title || 'Bài khảo thí';
    const durationMinutes = asm?.duration_minutes || 45;
    const passingScore = asm?.passing_score || 70;

    // 3. Lấy thành viên nhóm
    const { data: membersRaw } = await adminSupabase
      .from('class_members')
      .select(`
        id,
        joined_at,
        user_id,
        profiles ( id, email, full_name, nickname )
      `)
      .eq('class_id', classId)
      .order('joined_at', { ascending: true });

    const memberList = (membersRaw || []).map((m: any) => {
      const prof = m.profiles;
      const fullName = prof?.full_name || prof?.nickname || prof?.email?.split('@')[0] || 'Thành viên';
      return {
        userId: m.user_id,
        fullName,
        email: prof?.email || '',
        joinedAt: m.joined_at,
      };
    });

    const memberUserIds = memberList.map((m: any) => m.userId);

    // 4. Lấy kết quả bài nộp
    let submissions: any[] = [];
    if (memberUserIds.length > 0) {
      const { data: subsData } = await adminSupabase
        .from('assessment_submissions')
        .select('id, user_id, status, total_score, max_score, percentage, is_passed, submitted_at')
        .in('user_id', memberUserIds)
        .or(`class_assignment_id.eq.${assignmentId},assessment_id.eq.${assignment.assessment_id}`)
        .order('submitted_at', { ascending: false });

      submissions = subsData || [];
    }

    const subByUserId = new Map<string, any>();
    submissions.forEach((s) => {
      if (!subByUserId.has(s.user_id)) {
        subByUserId.set(s.user_id, s);
      }
    });

    // 5. Tạo Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXA Platform';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('KetQuaKhaoThi');
    sheet.views = [{ showGridLines: true }];

    // Header thông tin
    sheet.addRow(['BÁO CÁO KẾT QUẢ ĐỢT KHẢO THÍ - NEXA']);
    sheet.addRow(['Tên nhóm:', classRecord.name]);
    sheet.addRow(['Mã nhóm:', classRecord.class_code]);
    sheet.addRow(['Bài khảo thí:', assessmentTitle]);
    sheet.addRow(['Thời lượng:', `${durationMinutes} phút`]);
    sheet.addRow(['Ngưỡng đạt:', `${passingScore}%`]);
    sheet.addRow(['Ngày xuất:', new Date().toLocaleString('vi-VN')]);
    sheet.addRow([]);

    // Bảng dữ liệu
    const headerRow = sheet.addRow([
      'STT',
      'Họ và tên',
      'Email',
      'Trạng thái',
      'Thời gian nộp',
      'Điểm đạt',
      'Điểm tối đa',
      'Tỷ lệ (%)',
      'Kết quả',
    ]);

    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }, // Cobalt Blue
    };

    memberList.forEach((m: any, idx: number) => {
      const sub = subByUserId.get(m.userId);
      const isSub = sub && (sub.status === 'SUBMITTED' || sub.status === 'EVALUATED');
      let statusStr = 'Chưa nộp';
      let submittedDate = '—';
      let scoreVal: number | string = '—';
      let maxVal: number | string = '—';
      let pctVal: number | string = '—';
      let resStr = 'Chưa đánh giá';

      if (isSub) {
        statusStr = sub.status === 'EVALUATED' ? 'Đã chấm' : 'Đã nộp';
        if (sub.submitted_at) {
          submittedDate = new Date(sub.submitted_at).toLocaleString('vi-VN');
          if (assignment.deadline && new Date(sub.submitted_at) > new Date(assignment.deadline)) {
            statusStr = 'Nộp muộn';
          }
        }
        const earned = Number(sub.total_score) || 0;
        const max = Number(sub.max_score) || 10;
        const pct = sub.percentage !== null && sub.percentage !== undefined ? Number(sub.percentage) : (max > 0 ? Math.round((earned / max) * 100) : 0);

        scoreVal = earned;
        maxVal = max;
        pctVal = `${pct}%`;
        resStr = sub.is_passed || pct >= passingScore ? 'Đạt chuẩn' : 'Cần bồi dưỡng';
      }

      sheet.addRow([
        idx + 1,
        m.fullName,
        m.email,
        statusStr,
        submittedDate,
        scoreVal,
        maxVal,
        pctVal,
        resStr,
      ]);
    });

    sheet.columns.forEach((col) => {
      col.width = 20;
    });
    sheet.getColumn(1).width = 8;
    sheet.getColumn(2).width = 25;
    sheet.getColumn(3).width = 30;

    const buffer = await workbook.xlsx.writeBuffer();
    const safeTitle = assessmentTitle.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
    const filename = `NEXA_${safeTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('Error exporting assignment results:', err);
    return NextResponse.json({ error: err.message || 'Lỗi xuất báo cáo' }, { status: 500 });
  }
}
