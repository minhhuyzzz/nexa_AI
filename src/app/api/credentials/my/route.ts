import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { CertificateGeneratorService } from '@/features/credentials/services/certificate-generator.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Authenticate user strictly (no unauthenticated fallback)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, points, role')
      .eq('id', user.id)
      .single();

    if (!profileData) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ người dùng' }, { status: 404 });
    }

    const currentPoints = profileData.points ?? 0;
    const candidateName = profileData.full_name || 'Học Viên Nexa';
    const requiredPoints = 500;
    const pointsNeeded = Math.max(0, requiredPoints - currentPoints);

    // 2. Check roadmap completion status (Must complete 100% steps in personalized pathway)
    const { data: latestAnalysis } = await supabase
      .from('competency_analyses')
      .select('id, learning_pathway')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const pathway = (latestAnalysis?.learning_pathway as Array<{ is_completed?: boolean }>) || [];
    const totalSteps = pathway.length;
    const completedSteps = pathway.filter((s) => Boolean(s.is_completed)).length;
    const isRoadmapCompleted = totalSteps > 0 && completedSteps === totalSteps;

    // Dual qualification rule: >= 500 PTS AND 100% roadmap completed
    const isUnlocked = currentPoints >= requiredPoints && isRoadmapCompleted;

    // 3. Fetch Master Certificate if exists
    const { data: credentials } = await supabase
      .from('credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_revoked', false)
      .order('issued_at', { ascending: false });

    let masterCredential = credentials && credentials.length > 0 ? credentials[0] : null;

    // 4. Auto-issue Master Certificate if eligible and not yet issued
    if (isUnlocked && !masterCredential) {
      const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
      const credentialCode = `NX-2026-MASTER-${randomHex}`;
      const credentialId = crypto.randomUUID();
      const issuedAt = new Date();

      const assessmentTitle = 'Chứng Nhận Năng Lực Số Toàn Diện (NEXA Master Certificate)';
      const competencyLevel = 'Level 4: Highly Advanced';

      try {
        const generated = await CertificateGeneratorService.generate({
          credentialId,
          credentialCode,
          candidateName,
          assessmentTitle,
          scorePercentage: 100,
          totalScore: currentPoints,
          maxScore: requiredPoints,
          competencyLevel,
          issuedAt,
        });

        const { data: newCred, error: insertError } = await supabase
          .from('credentials')
          .insert({
            id: credentialId,
            credential_code: credentialCode,
            user_id: user.id,
            submission_id: null,
            assessment_id: null,
            candidate_name: candidateName,
            assessment_title: assessmentTitle,
            score_percentage: 100,
            total_score: currentPoints,
            max_score: requiredPoints,
            competency_level: competencyLevel,
            content_sha256: generated.contentHash,
            pdf_sha256: generated.pdfHash,
            qr_data: generated.qrDataUrl,
            issued_at: issuedAt.toISOString(),
          })
          .select('*')
          .single();

        if (!insertError && newCred) {
          masterCredential = newCred;
        }
      } catch (genErr) {
        console.error('Error auto-generating master credential:', genErr);
      }
    }

    return NextResponse.json({
      success: true,
      candidateName,
      points: currentPoints,
      requiredPoints,
      pointsNeeded,
      isRoadmapCompleted,
      completedSteps,
      totalSteps,
      isUnlocked,
      masterCredential,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
