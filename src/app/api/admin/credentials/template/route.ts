import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  CertificateTemplateConfig,
  DEFAULT_CERTIFICATE_TEMPLATE,
} from '@/types/certificate-template';

export { DEFAULT_CERTIFICATE_TEMPLATE, type CertificateTemplateConfig };

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('platform_settings')
      .select('value, updated_at')
      .eq('key', 'certificate_template')
      .maybeSingle();

    if (error) {
      console.error('[GET_CERT_TEMPLATE_ERROR]', error);
      return NextResponse.json({ config: DEFAULT_CERTIFICATE_TEMPLATE });
    }

    const config = data?.value ? { ...DEFAULT_CERTIFICATE_TEMPLATE, ...data.value, updatedAt: data.updated_at } : DEFAULT_CERTIFICATE_TEMPLATE;

    return NextResponse.json({ config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const body = await request.json();
    const {
      signerName,
      signerTitle,
      signatureStyle,
      signatureSvgData,
      sealType,
      sealSvgData,
      sealText,
      validityType,
      validityYears,
    } = body;

    if (!signerName?.trim()) {
      return NextResponse.json({ error: 'Họ tên người ký không được để trống' }, { status: 400 });
    }

    if (!signerTitle?.trim()) {
      return NextResponse.json({ error: 'Chức danh người ký không được để trống' }, { status: 400 });
    }

    const payload: CertificateTemplateConfig = {
      signerName: signerName.trim(),
      signerTitle: signerTitle.trim(),
      signatureStyle: signatureStyle || 'Michael Henson',
      signatureSvgData: signatureSvgData || null,
      sealType: sealType === 'CUSTOM_SVG' ? 'CUSTOM_SVG' : 'SYSTEM_SVG',
      sealSvgData: sealSvgData || null,
      sealText: sealText?.trim() || 'HỘI ĐỒNG KHẢO THÍ NĂNG LỰC SỐ',
      validityType: validityType === 'CUSTOM_YEARS' ? 'CUSTOM_YEARS' : 'LIFETIME',
      validityYears: validityType === 'CUSTOM_YEARS' ? Number(validityYears) || 2 : null,
    };

    const adminSupabase = createAdminClient();
    const { error: upsertError } = await adminSupabase
      .from('platform_settings')
      .upsert({
        key: 'certificate_template',
        value: payload,
        description: 'Cấu hình phôi chứng chỉ số, người ký, mộc đỏ và thời hạn hiệu lực',
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error('[UPSERT_CERT_TEMPLATE_ERROR]', upsertError);
      return NextResponse.json({ error: 'Không thể lưu cấu hình phôi vào hệ thống' }, { status: 500 });
    }

    return NextResponse.json({ success: true, config: payload });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
