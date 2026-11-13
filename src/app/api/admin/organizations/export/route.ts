import { NextResponse, type NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Kiểm tra quyền Platform Admin
    const authCheck = await requirePlatformAdmin();
    if (!authCheck.isAuthorized || authCheck.errorResponse) {
      return authCheck.errorResponse!;
    }

    const supabase = createAdminClient();

    // 2. Truy vấn dữ liệu Tổ chức B2B
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (orgsError) {
      console.error('Export Excel orgs error:', orgsError.message);
      return NextResponse.json({ error: 'Không thể truy vấn danh sách tổ chức' }, { status: 500 });
    }

    // Đếm số thành viên thực tế theo tổ chức
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('status', 'ACTIVE');

    const memberCountMap: Record<string, number> = {};
    (userOrgs || []).forEach((uo) => {
      if (uo.organization_id) {
        memberCountMap[uo.organization_id] = (memberCountMap[uo.organization_id] || 0) + 1;
      }
    });

    // Lấy thông tin hạn mức entitlements mới nhất
    const { data: entitlements } = await supabase
      .from('organization_entitlements')
      .select('organization_id, max_seats, ai_credits_granted, ai_credits_used, expires_at, is_active')
      .order('created_at', { ascending: false });

    const entitlementMap: Record<string, any> = {};
    (entitlements || []).forEach((ent) => {
      if (ent.organization_id && !entitlementMap[ent.organization_id]) {
        entitlementMap[ent.organization_id] = ent;
      }
    });

    // 3. Truy vấn dữ liệu Yêu cầu tư vấn Business
    const { data: inquiries, error: inqError } = await supabase
      .from('business_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (inqError) {
      console.warn('Export Excel inquiries warning:', inqError.message);
    }

    // 4. Khởi tạo Workbook ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXA AI Platform';
    workbook.created = new Date();

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }, // Xanh Cobalt thương hiệu NEXA
    };

    const headerFont: Partial<ExcelJS.Font> = {
      name: 'Segoe UI',
      size: 10,
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
    // SHEET 1: Danh sách Tổ chức B2B
    // ==========================================
    const sheetOrgs = workbook.addWorksheet('Tổ chức B2B', {
      views: [{ showGridLines: true }],
    });

    sheetOrgs.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Tên tổ chức', key: 'name', width: 32 },
      { header: 'Mã tổ chức', key: 'code', width: 16 },
      { header: 'Người đại diện', key: 'contactName', width: 24 },
      { header: 'Email Owner', key: 'contactEmail', width: 30 },
      { header: 'Số điện thoại', key: 'contactPhone', width: 18 },
      { header: 'Số chỗ ngồi (Seats)', key: 'maxSeats', width: 22 },
      { header: 'Thành viên thực', key: 'activeMembers', width: 18 },
      { header: 'Hạn mức AI Credits', key: 'aiCredits', width: 22 },
      { header: 'Ngày tạo', key: 'createdAt', width: 16 },
      { header: 'Trạng thái', key: 'status', width: 18 },
    ];

    // Định dạng tiêu đề Sheet 1
    const orgHeaderRow = sheetOrgs.getRow(1);
    orgHeaderRow.height = 28;
    orgHeaderRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1D4ED8' } },
        bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } },
        left: { style: 'thin', color: { argb: 'FF3B82F6' } },
        right: { style: 'thin', color: { argb: 'FF3B82F6' } },
      };
    });

    // Thêm dữ liệu Sheet 1
    (orgs || []).forEach((org, idx) => {
      const ent = entitlementMap[org.id];
      const maxSeats = org.max_members || ent?.max_seats || org.expected_learners || 500;
      const aiCredits = ent?.ai_credits_granted ?? 10000;
      const memberCount = memberCountMap[org.id] || 0;

      let statusText = 'Đang hoạt động';
      if (org.status === 'SUSPENDED' || !org.is_active) {
        statusText = 'Đang tạm ngưng';
      } else if (org.status === 'PENDING_OWNER') {
        statusText = 'Chờ kích hoạt';
      }

      const row = sheetOrgs.addRow({
        stt: idx + 1,
        name: org.name,
        code: org.code || (org.slug || '').toUpperCase(),
        contactName: org.contact_name || '—',
        contactEmail: org.contact_email || '—',
        contactPhone: org.contact_phone || '—',
        maxSeats: Number(maxSeats),
        activeMembers: Number(memberCount),
        aiCredits: Number(aiCredits),
        createdAt: org.created_at ? new Date(org.created_at).toLocaleDateString('vi-VN') : '—',
        status: statusText,
      });

      row.height = 22;
      const isEven = idx % 2 === 1;

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF171717' } };
        cell.border = borderStyle;
        if (isEven) cell.fill = zebraFill;

        // Căn lề từng cột
        if (colNumber === 1 || colNumber === 3 || colNumber === 6 || colNumber === 10 || colNumber === 11) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 7 || colNumber === 8 || colNumber === 9) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0';
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    });

    // ==========================================
    // SHEET 2: Yêu cầu tư vấn B2B
    // ==========================================
    const sheetInq = workbook.addWorksheet('Yêu cầu tư vấn B2B', {
      views: [{ showGridLines: true }],
    });

    sheetInq.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Tên đơn vị', key: 'orgName', width: 32 },
      { header: 'Người liên hệ', key: 'contactName', width: 24 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Số điện thoại', key: 'phone', width: 18 },
      { header: 'Quy mô dự kiến (Người học)', key: 'expectedLearners', width: 28 },
      { header: 'Ngày gửi', key: 'createdAt', width: 16 },
      { header: 'Trạng thái tiếp nhận', key: 'status', width: 22 },
    ];

    // Định dạng tiêu đề Sheet 2
    const inqHeaderRow = sheetInq.getRow(1);
    inqHeaderRow.height = 28;
    inqHeaderRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1D4ED8' } },
        bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } },
        left: { style: 'thin', color: { argb: 'FF3B82F6' } },
        right: { style: 'thin', color: { argb: 'FF3B82F6' } },
      };
    });

    // Thêm dữ liệu Sheet 2
    (inquiries || []).forEach((inq, idx) => {
      let statusText = 'Mới tiếp nhận';
      if (inq.status === 'CONTACTED' || inq.status === 'IN_PROGRESS') {
        statusText = 'Đang xử lý';
      } else if (inq.status === 'PROPOSAL_SENT') {
        statusText = 'Đã gửi đề xuất';
      } else if (inq.status === 'ACTIVATED' || inq.status === 'APPROVED') {
        statusText = 'Đã kích hoạt';
      } else if (inq.status === 'REJECTED') {
        statusText = 'Đã từ chối';
      }

      const row = sheetInq.addRow({
        stt: idx + 1,
        orgName: inq.org_name || inq.name || '—',
        contactName: inq.contact_name || inq.full_name || '—',
        email: inq.contact_email || inq.email || '—',
        phone: inq.contact_phone || inq.phone || '—',
        expectedLearners: Number(inq.expected_learners || inq.learners_count || 0),
        createdAt: inq.created_at ? new Date(inq.created_at).toLocaleDateString('vi-VN') : '—',
        status: statusText,
      });

      row.height = 22;
      const isEven = idx % 2 === 1;

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF171717' } };
        cell.border = borderStyle;
        if (isEven) cell.fill = zebraFill;

        if (colNumber === 1 || colNumber === 5 || colNumber === 7 || colNumber === 8) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0';
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    });

    // 5. Xuất Buffer và trả về Client
    const buffer = await workbook.xlsx.writeBuffer();
    const currentDate = new Date().toISOString().slice(0, 10);
    const fileName = `nexa_b2b_organizations_${currentDate}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error';
    console.error('Export Excel error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
