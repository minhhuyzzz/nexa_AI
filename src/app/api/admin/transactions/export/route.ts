import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

/**
 * Neutralizes CSV Injection (Formula Injection) by prepending a single quote
 * if a string cell begins with =, +, -, @, or tab/return.
 */
function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value).trim();

  // Neutralize formula characters
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin('VIEW_FINANCE');
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();
    const statusParam = request.nextUrl.searchParams.get('status');

    let query = adminSupabase
      .from('payment_transactions')
      .select(`
        id,
        user_id,
        organization_id,
        plan_code,
        amount,
        currency,
        provider,
        transaction_reference,
        status,
        verified_at,
        created_at,
        profiles ( email, nickname )
      `)
      .order('created_at', { ascending: false });

    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam.toUpperCase());
    }

    const { data: transactions, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const headers = [
      'Mã Giao Dịch',
      'Email Khách Hàng',
      'Họ Và Tên',
      'Gói Dịch Vụ',
      'Số Tiền',
      'Đơn Vị Tiền Tệ',
      'Cổng Thanh Toán',
      'Trạng Thái',
      'Thời Điểm Tạo',
      'Thời Điểm Đối Soát',
    ];

    const rows = (transactions || []).map((tx: any) => {
      const email = tx.profiles?.email || 'N/A';
      const nickname = tx.profiles?.nickname || 'N/A';
      const verifiedAt = tx.verified_at ? new Date(tx.verified_at).toLocaleString('vi-VN') : 'Chưa đối soát';
      const createdAt = tx.created_at ? new Date(tx.created_at).toLocaleString('vi-VN') : '';

      return [
        sanitizeCsvCell(tx.transaction_reference),
        sanitizeCsvCell(email),
        sanitizeCsvCell(nickname),
        sanitizeCsvCell(tx.plan_code),
        sanitizeCsvCell(tx.amount),
        sanitizeCsvCell(tx.currency),
        sanitizeCsvCell(tx.provider),
        sanitizeCsvCell(tx.status),
        sanitizeCsvCell(createdAt),
        sanitizeCsvCell(verifiedAt),
      ].join(',');
    });

    // UTF-8 BOM prefix (\uFEFF) ensures Excel renders Vietnamese accents properly
    const csvContent = '\uFEFF' + [headers.map(sanitizeCsvCell).join(','), ...rows].join('\r\n');

    const fileName = `nexa_financial_reconciliation_${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
