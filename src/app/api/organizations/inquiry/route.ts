import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, contactName, email, phone, expectedLearners, notes, type } = body;

    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Tên trường học hoặc đơn vị không được để trống' },
        { status: 400 }
      );
    }

    if (!contactName || typeof contactName !== 'string' || contactName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Họ tên người liên hệ không được để trống' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      return NextResponse.json(
        { error: 'Số điện thoại hoặc Zalo liên hệ không hợp lệ' },
        { status: 400 }
      );
    }

    // 2. Generate slug and normalize
    const cleanName = name.trim();
    const slugBase = cleanName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30);
    const uniqueSlug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    const learnersCount = Math.max(50, Math.min(50000, Number(expectedLearners) || 500));
    const orgType = type === 'ENTERPRISE' ? 'ENTERPRISE' : 'EDUCATIONAL';

    // 3. Insert into Supabase organizations table
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: cleanName,
        slug: uniqueSlug,
        type: orgType,
        contact_name: contactName.trim(),
        contact_email: (email || '').trim().toLowerCase(),
        contact_phone: phone.trim(),
        expected_learners: learnersCount,
        max_members: learnersCount,
        quota_assessments: learnersCount * 10,
        status: 'PENDING_CONTACT',
        is_active: false,
        notes: (notes || '').trim(),
      })
      .select('id, name, status, created_at')
      .single();

    if (error) {
      console.error('B2B Inquiry insert error:', error);
      return NextResponse.json(
        { error: 'Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Yêu cầu tư vấn đã được gửi thành công. Ban điều phối NEXA sẽ liên hệ qua SĐT/Zalo trong vòng 24 giờ.',
      inquiry: data,
    });
  } catch (err) {
    console.error('POST /api/organizations/inquiry server error:', err);
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi xử lý yêu cầu' },
      { status: 500 }
    );
  }
}
