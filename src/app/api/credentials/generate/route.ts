import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { CertificateGeneratorService } from '@/features/credentials/services/certificate-generator.service';

const generateSchema = z.object({
  submissionId: z.string().uuid('Mã bài thi (submissionId) không hợp lệ'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = generateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { submissionId } = validated.data;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Check if credential already exists
    const { data: existingCred } = await supabase
      .from('credentials')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    if (existingCred) {
      return NextResponse.json({
        success: true,
        alreadyIssued: true,
        credential: existingCred,
      });
    }

    // 3. Fetch submission details
    const { data: submission, error: subError } = await supabase
      .from('assessment_submissions')
      .select(`
        id,
        user_id,
        assessment_id,
        total_score,
        max_score,
        percentage,
        is_passed,
        submitted_at,
        created_at,
        assessments (
          id,
          title,
          passing_score
        )
      `)
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: 'Không tìm thấy bài thi' }, { status: 404 });
    }

    // Verify caller ownership or institutional authority
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (callerProfile?.role === 'LEARNER' && submission.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Bạn không có quyền yêu cầu cấp chứng chỉ cho bài thi của học viên khác' },
        { status: 403 }
      );
    }

    // Check pass requirement strictly (Must be passed AND percentage >= passingScore)
    const percentage = Number(submission.percentage) || 0;
    const rawAssessment = Array.isArray(submission.assessments) ? submission.assessments[0] : submission.assessments;
    const passingScore = Number(rawAssessment?.passing_score) || 70.0;

    if (!submission.is_passed || percentage < passingScore) {
      return NextResponse.json(
        {
          error: `Bài thi chưa đạt điều kiện cấp chứng chỉ số (Điểm đạt: ${percentage}% < Chuẩn: ${passingScore}%).`,
        },
        { status: 400 }
      );
    }

    // 4. Fetch candidate profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', submission.user_id)
      .single();

    const candidateName = profile?.full_name || 'Học viên NEXA';
    const assessmentTitle = rawAssessment?.title || 'Bài Đánh Giá Năng Lực Số Chuẩn Hóa';

    // 5. Generate unique Credential Code (e.g. NX-2024-8F3A2B)
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const credentialCode = `NX-2024-${randomHex}`;
    const credentialId = crypto.randomUUID();

    // 6. Determine competency level
    let competencyLevel = 'INTERMEDIATE';
    if (percentage >= 90) competencyLevel = 'HIGHLY_SPECIALIZED';
    else if (percentage >= 75) competencyLevel = 'ADVANCED';

    const issuedAt = new Date();

    // 7. Generate PDF, dual SHA-256 hashes & QR
    const generated = await CertificateGeneratorService.generate({
      credentialId,
      credentialCode,
      candidateName,
      assessmentTitle,
      scorePercentage: percentage,
      totalScore: Number(submission.total_score) || 0,
      maxScore: Number(submission.max_score) || 100,
      competencyLevel,
      issuedAt,
    });

    // 8. Insert record into public.credentials
    const { data: insertedCred, error: insertError } = await supabase
      .from('credentials')
      .insert({
        id: credentialId,
        credential_code: credentialCode,
        submission_id: submissionId,
        user_id: submission.user_id,
        assessment_id: submission.assessment_id,
        candidate_name: candidateName,
        assessment_title: assessmentTitle,
        score_percentage: percentage,
        total_score: Number(submission.total_score) || 0,
        max_score: Number(submission.max_score) || 100,
        competency_level: competencyLevel,
        content_sha256: generated.contentHash,
        pdf_sha256: generated.pdfHash,
        qr_data: generated.qrDataUrl,
        issued_at: issuedAt.toISOString(),
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error inserting credential:', insertError);
      return NextResponse.json({ error: 'Không thể cấp chứng chỉ số' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      credential: insertedCred,
      downloadUrl: `/api/credentials/${credentialId}/pdf`,
      verificationUrl: generated.verificationUrl,
    });
  } catch (err) {
    console.error('Error generating credential:', err);
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
