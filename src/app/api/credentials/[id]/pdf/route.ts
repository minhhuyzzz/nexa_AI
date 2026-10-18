import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CertificateGeneratorService } from '@/features/credentials/services/certificate-generator.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: credentialId } = await params;
    const supabase = await createClient();

    // Fetch credential record
    const { data: cred, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('id', credentialId)
      .single();

    if (error || !cred) {
      return NextResponse.json({ error: 'Không tìm thấy chứng chỉ số' }, { status: 404 });
    }

    if (cred.is_revoked) {
      return NextResponse.json(
        { error: 'Chứng chỉ này đã bị thu hồi: ' + (cred.revoked_reason || 'Không rõ lý do') },
        { status: 410 }
      );
    }

    // Generate fresh vector PDF bytes
    const generated = await CertificateGeneratorService.generate({
      credentialId: cred.id,
      credentialCode: cred.credential_code,
      candidateName: cred.candidate_name,
      assessmentTitle: cred.assessment_title,
      scorePercentage: Number(cred.score_percentage),
      totalScore: Number(cred.total_score),
      maxScore: Number(cred.max_score),
      competencyLevel: cred.competency_level,
      issuedAt: new Date(cred.issued_at),
    });

    const filename = `NEXA-Certificate-${cred.credential_code}.pdf`;

    return new Response(Buffer.from(generated.pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'X-Content-SHA256': generated.contentHash,
        'X-PDF-SHA256': generated.pdfHash,
      },
    });
  } catch (err) {
    console.error('Error streaming certificate PDF:', err);
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
