import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const businessInquirySchema = z.object({
  name: z.string().trim().min(2, 'Tên trường học hoặc đơn vị tối thiểu 2 ký tự').max(150),
  contactName: z.string().trim().min(2, 'Họ tên người đại diện tối thiểu 2 ký tự').max(100),
  email: z.string().trim().email('Địa chỉ email không hợp lệ').toLowerCase(),
  phone: z.string().trim().min(8, 'Số điện thoại liên hệ không hợp lệ').max(20),
  type: z.enum(['EDUCATIONAL', 'ENTERPRISE', 'COMMUNITY']).default('EDUCATIONAL'),
  expectedLearners: z.number().int().min(1).max(100000).default(100),
  notes: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = businessInquirySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { name, contactName, email, phone, type, expectedLearners, notes } = validation.data;

    // DEC-03: Business Inquiries are saved as leads; organizations are NOT activated automatically
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('business_inquiries')
      .insert({
        org_name: name,
        contact_name: contactName,
        contact_email: email,
        contact_phone: phone,
        org_type: type,
        expected_learners: expectedLearners,
        notes: notes || '',
        status: 'NEW',
      })
      .select('id, org_name, status, created_at')
      .single();

    if (error) {
      console.error('B2B Inquiry insert error:', error.message);
      return NextResponse.json(
        { error: 'Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Yêu cầu tư vấn đã được gửi thành công. Ban điều phối NEXA sẽ liên hệ qua SĐT/Email trong vòng 24 giờ.',
      inquiry: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi xử lý yêu cầu';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
