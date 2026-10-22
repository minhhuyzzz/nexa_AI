import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { CertificateGeneratorService } from '@/features/credentials/services/certificate-generator.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    let activeUser = user;
    let profileData = null;

    if (activeUser) {
      const { data: p } = await supabase
        .from('profiles')
        .select('id, full_name, points, role')
        .eq('id', activeUser.id)
        .single();
      profileData = p;
    }

    if (!profileData) {
      // Fallback to standard learner profile
      const { data: fallbackProfile } = await supabase
        .from('profiles')
        .select('id, full_name, points, role')
        .eq('email', 'learner@nexa.edu.vn')
        .single();
      profileData = fallbackProfile;
      if (fallbackProfile) {
        activeUser = { id: fallbackProfile.id } as typeof user;
      }
    }

    if (!activeUser || !profileData) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const currentPoints = profileData.points ?? 0;
    const candidateName = profileData.full_name || 'Học Viên Nexa';
    const isUnlocked = currentPoints >= 450;
    const requiredPoints = 450;
    const pointsNeeded = Math.max(0, requiredPoints - currentPoints);

    // 3. Fetch Master Certificate if exists
    const { data: credentials } = await supabase
      .from('credentials')
      .select('*')
      .eq('user_id', activeUser.id)
      .eq('is_revoked', false)
      .order('issued_at', { ascending: false });

    let masterCredential = credentials && credentials.length > 0 ? credentials[0] : null;

    // 4. Auto-issue Master Certificate if eligible (Level 4 >= 450 pts) and not yet issued
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
            user_id: activeUser.id,
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
      isUnlocked,
      masterCredential,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
