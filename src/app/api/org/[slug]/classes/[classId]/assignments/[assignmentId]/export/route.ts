import { NextResponse, type NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrgAuthContext } from '@/lib/auth/org-guard';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; classId: string; assignmentId: string }> }
) {
  try {
    const { slug, classId, assignmentId } = await params;

    // 1. Kiểm tra xác thực người dùng và quyền truy cập tổ chức
    const authContext = await getOrgAuthContext(slug);
    if (!authContext || !authContext.isAuthorized) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập hoặc bạn không thuộc tổ chức này' }, { status: 401 });
    }

    const org = authContext.organization;
    const adminSupabase = createAdminClient();

    // 4. Lấy thông tin lớp học
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classId);
    let classQuery = adminSupabase
      .from('evaluator_classes')
      .select('*')
      .eq('organization_id', org.id);

    if (isUuid) {
      classQuery = classQuery.eq('id', classId);
    } else {
      classQuery = classQuery.eq('class_code', classId);
    }

    const { data: classRecord } = await classQuery.maybeSingle();
    if (!classRecord) {
      return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });
    }

    const realClassId = classRecord.id;

    // 5. Lấy thông tin đợt thi (assignment)
    const { data: assignment, error: asgError } = await adminSupabase
      .from('class_assignments')
      .select(`
        id,
        assessment_id,
        deadline,
        start_time,
        timezone,
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
      .eq('class_id', realClassId)
      .maybeSingle();

    if (asgError || !assignment) {
      return NextResponse.json({ error: 'Không tìm thấy bài khảo thí của lớp' }, { status: 404 });
    }

    const asm = (assignment as any).assessments;
    const assessmentTitle = asm?.title || 'Bài khảo thí';
    const durationMinutes = asm?.duration_minutes || 45;
    const passingScore = asm?.passing_score || 70;

    // 6. Lấy danh sách thành viên lớp kèm profile
    const { data: membersRaw } = await adminSupabase
      .from('class_members')
      .select(`
        id,
        joined_at,
        user_id,
        role_in_class,
        profiles ( id, email, full_name, nickname )
      `)
      .eq('class_id', realClassId)
      .order('joined_at', { ascending: true });

    const memberList = (membersRaw || []).map((m: any) => {
      const prof = m.profiles;
      const fullName = prof?.full_name || prof?.nickname || prof?.email?.split('@')[0] || 'Thành viên';
      return {
        userId: m.user_id,
        fullName,
        email: prof?.email || '',
        role: m.role_in_class || 'STUDENT',
        joinedAt: m.joined_at,
      };
    });

    const memberUserIds = memberList.map((m) => m.userId);

    // 7. Lấy danh sách bài nộp của học viên cho đợt thi này
    let submissions: any[] = [];
    if (memberUserIds.length > 0) {
      const { data: subsData } = await adminSupabase
        .from('assessment_submissions')
        .select('id, user_id, status, total_score, max_score, percentage, is_passed, submitted_at')
        .in('user_id', memberUserIds)
        .eq('class_assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      submissions = subsData || [];
    }

    // Map submission mới nhất theo userId
    const subByUserId = new Map<string, any>();
    submissions.forEach((s) => {
      if (!subByUserId.has(s.user_id)) {
        subByUserId.set(s.user_id, s);
      }
    });

    // 8. Tính toán các chỉ số thống kê thực tế
    const totalMembers = memberList.length;
    let submittedCount = 0;
    let passedCount = 0;
    let sumPercentage = 0;

    memberList.forEach((m) => {
      const sub = subByUserId.get(m.userId);
      if (sub && (sub.status === 'SUBMITTED' || sub.status === 'EVALUATED')) {
        submittedCount++;
        const pct = Number(sub.percentage) || 0;
        sumPercentage += pct;
        if (sub.is_passed || pct >= passingScore) {
          passedCount++;
        }
      }
    });

    const submissionRate = totalMembers > 0 ? Math.round((submittedCount / totalMembers) * 100) : 0;
    const avgScore = submittedCount > 0 ? Math.round(sumPercentage / submittedCount) : 0;
    const passedRate = submittedCount > 0 ? Math.round((passedCount / submittedCount) * 100) : 0;

    // 9. Khởi tạo Workbook ExcelJS chuẩn mực
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXA Education Platform';
    workbook.created = new Date();

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }, // Xanh Cobalt thương hiệu NEXA
    };

    const headerFont: Partial<ExcelJS.Font> = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };

    const zebraFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' },
    };

    // ==========================================
    // SHEET 1: Tổng quan đợt thi
    // ==========================================
    const sheetSummary = workbook.addWorksheet('Tổng quan đợt thi', {
      views: [{ showGridLines: true }],
    });

    sheetSummary.columns = [
      { header: 'Hạng mục', key: 'item', width: 30 },
      { header: 'Thông tin chi tiết', key: 'value', width: 45 },
    ];

    const summaryHeaderRow = sheetSummary.getRow(1);
    summaryHeaderRow.height = 26;
    summaryHeaderRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = borderStyle;
    });

    const summaryData = [
      { item: 'Tổ chức', value: org.name },
      { item: 'Lớp học', value: `${classRecord.name} (Mã: ${classRecord.class_code})` },
      { item: 'Tên bài khảo thí', value: assessmentTitle },
      { item: 'Thời lượng làm bài', value: `${durationMinutes} phút` },
      { item: 'Ngưỡng đạt chuẩn', value: `≥ ${passingScore}%` },
      { item: 'Thời gian mở đề', value: assignment.start_time ? new Date(assignment.start_time).toLocaleString('vi-VN') : 'Không giới hạn' },
      { item: 'Hạn chót nộp bài', value: assignment.deadline ? new Date(assignment.deadline).toLocaleString('vi-VN') : 'Không giới hạn' },
      { item: 'Tổng sĩ số lớp', value: `${totalMembers} học viên` },
      { item: 'Số bài đã nộp', value: `${submittedCount} / ${totalMembers} (${submissionRate}%)` },
      { item: 'Điểm trung bình lớp', value: `${avgScore}%` },
      { item: 'Số học viên Đạt chuẩn', value: `${passedCount} / ${submittedCount > 0 ? submittedCount : 1} (${passedRate}%)` },
      { item: 'Ngày xuất báo cáo', value: new Date().toLocaleString('vi-VN') },
    ];

    summaryData.forEach((row, idx) => {
      const addedRow = sheetSummary.addRow(row);
      addedRow.height = 22;
      const isEven = idx % 2 === 1;
      addedRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF171717' } };
        cell.border = borderStyle;
        if (colNumber === 1) cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF262626' } };
        if (isEven) cell.fill = zebraFill;
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
    });

    // ==========================================
    // SHEET 2: Bảng điểm chi tiết học viên
    // ==========================================
    const sheetDetail = workbook.addWorksheet('Bảng điểm chi tiết', {
      views: [{ showGridLines: true }],
    });

    sheetDetail.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Họ và tên', key: 'fullName', width: 28 },
      { header: 'Email', key: 'email', width: 34 },
      { header: 'Thời gian nộp', key: 'submittedAt', width: 22 },
      { header: 'Tình trạng', key: 'statusText', width: 18 },
      { header: 'Điểm trắc nghiệm', key: 'score', width: 18 },
      { header: 'Điểm tối đa', key: 'maxScore', width: 16 },
      { header: 'Tỷ lệ (%)', key: 'percentage', width: 16 },
      { header: 'Xếp loại', key: 'result', width: 20 },
    ];

    const detailHeaderRow = sheetDetail.getRow(1);
    detailHeaderRow.height = 28;
    detailHeaderRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = borderStyle;
    });

    memberList.forEach((m, idx) => {
      const sub = subByUserId.get(m.userId);
      const isSubmitted = sub && (sub.status === 'SUBMITTED' || sub.status === 'EVALUATED');

      let statusText = 'Chưa nộp bài';
      let submittedDateStr = '—';
      let scoreVal: number | string = '—';
      let maxScoreVal: number | string = '—';
      let pctVal: number | string = '—';
      let resultText = 'Chưa hoàn thành';

      if (isSubmitted) {
        statusText = sub.status === 'EVALUATED' ? 'Đã chấm điểm' : 'Đã nộp bài';
        if (sub.submitted_at) {
          const subDate = new Date(sub.submitted_at);
          submittedDateStr = subDate.toLocaleString('vi-VN');
          if (assignment.deadline && subDate > new Date(assignment.deadline)) {
            statusText = 'Nộp muộn';
          }
        }

        const earned = sub.total_score !== null && sub.total_score !== undefined ? Number(sub.total_score) : 0;
        const max = sub.max_score !== null && sub.max_score !== undefined ? Number(sub.max_score) : 10;
        const pct = sub.percentage !== null && sub.percentage !== undefined ? Number(sub.percentage) : (max > 0 ? Math.round((earned / max) * 100) : 0);

        scoreVal = earned;
        maxScoreVal = max;
        pctVal = `${pct}%`;
        resultText = (sub.is_passed || pct >= passingScore) ? 'Đạt chuẩn' : 'Cần bồi dưỡng';
      }

      const row = sheetDetail.addRow({
        stt: idx + 1,
        fullName: m.fullName,
        email: m.email,
        submittedAt: submittedDateStr,
        statusText,
        score: scoreVal,
        maxScore: maxScoreVal,
        percentage: pctVal,
        result: resultText,
      });

      row.height = 22;
      const isEven = idx % 2 === 1;

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF171717' } };
        cell.border = borderStyle;
        if (isEven) cell.fill = zebraFill;

        if (colNumber === 1 || colNumber === 4 || colNumber === 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 6 || colNumber === 7 || colNumber === 8) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (colNumber === 9) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (resultText === 'Đạt chuẩn') {
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF059669' } }; // Xanh lá
          } else if (resultText === 'Cần bồi dưỡng') {
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFD97706' } }; // Vàng cam
          }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    });

    // 10. Xuất Buffer và trả về Client
    const buffer = await workbook.xlsx.writeBuffer();
    const safeTitle = assessmentTitle
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Bao_cao_dot_thi_${safeTitle}_${dateStr}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi máy chủ khi xuất Excel';
    console.error('Export Assignment Excel Error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
