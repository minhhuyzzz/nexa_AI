import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { OrgClassAnalyticsView } from '@/components/dashboard/org/classes/OrgClassAnalyticsView';
import { OrgEmptyState } from '@/components/dashboard/org/org-ui/OrgEmptyState';
import type { OrgClassItem } from '@/components/dashboard/org/classes/types';

export const dynamic = 'force-dynamic';

export default async function OrgClassAnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>;
}) {
  const { slug, classId } = await params;
  const { organization: org, role, user, isSuperadmin } = await requireOrgPagePermission(slug, 'MANAGE_CLASSES');
  const isManager = ['ORG_OWNER', 'ORG_ADMIN'].includes(role) || Boolean(isSuperadmin);
  const adminSupabase = createAdminClient();

  // Fetch class record
  let classQuery = adminSupabase
    .from('evaluator_classes')
    .select(`
      id,
      name,
      class_code,
      description,
      group_type,
      status,
      term,
      instructor_id,
      instructor_name,
      max_capacity,
      created_at
    `)
    .eq('id', classId)
    .eq('organization_id', org.id);

  if (!isManager) {
    classQuery = classQuery.or(`instructor_id.eq.${user.id},evaluator_id.eq.${user.id}`);
  }

  const { data: classRecord } = await classQuery.maybeSingle();

  if (!classRecord) notFound();

  // Truy vấn số liệu thực tế từ cơ sở dữ liệu (Không dùng số liệu mẫu)
  const [
    { count: membersCount },
    { count: assignmentsCount },
    { count: pendingGradingCount },
    { data: classMembers },
    { data: classAssignments },
    { data: classSubmissions },
  ] = await Promise.all([
    adminSupabase
      .from('class_members')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classRecord.id),
    adminSupabase
      .from('class_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classRecord.id),
    adminSupabase
      .from('assessment_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classRecord.id)
      .eq('status', 'SUBMITTED'),
    adminSupabase
      .from('class_members')
      .select(`
        id,
        user_id,
        student_code,
        role_in_class,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('class_id', classRecord.id),
    adminSupabase
      .from('class_assignments')
      .select('id, assessment_id, title')
      .eq('class_id', classRecord.id),
    adminSupabase
      .from('assessment_submissions')
      .select('id, user_id, status, percentage, is_passed, total_score, domain_scores, created_at, evaluated_at')
      .eq('class_id', classRecord.id),
  ]);

  const realMembers = membersCount || 0;
  const realAssignments = assignmentsCount || 0;
  const realPending = pendingGradingCount || 0;

  // Nếu lớp chưa có học viên hoặc chưa được giao đề khảo thí, hiển thị Empty State chuẩn
  if (realMembers === 0 || realAssignments === 0) {
    return (
      <div className="space-y-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
          <Link href={`/org/${slug}`} className="hover:text-blue-600">
            Điều hành
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href={`/org/${slug}/classes`} className="hover:text-blue-600">
            Lớp &amp; nhóm
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href={`/org/${slug}/classes/${classRecord.id}`} className="hover:text-blue-600">
            {classRecord.name}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
            Báo cáo lớp
          </span>
        </nav>

        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {classRecord.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Báo cáo tiến độ và mức độ tham gia học tập của lớp.
          </p>
        </div>

        <OrgEmptyState
          iconName="target"
          title="Chưa có dữ liệu phân tích"
          description="Lớp học này chưa có thành viên hoặc chưa được giao bài khảo thí nào để thống kê phân tích."
          actionText="Về chi tiết lớp học"
          actionHref={`/org/${slug}/classes/${classRecord.id}`}
        />
      </div>
    );
  }

  // Tính toán số liệu phân tích thật 100% từ bảng DB
  const allSubs = classSubmissions || [];
  const evaluatedSubs = allSubs.filter((s) => s.status === 'EVALUATED');
  const activeUserIds = new Set(allSubs.map((s) => s.user_id).filter(Boolean));
  const participationRate = realMembers > 0 ? Math.round((activeUserIds.size / realMembers) * 100) : null;
  const averageScore = evaluatedSubs.length > 0
    ? Math.round(evaluatedSubs.reduce((acc, s) => acc + (s.percentage || 0), 0) / evaluatedSubs.length)
    : null;

  // Lọc thành viên thực sự cần chú ý từ danh sách học viên
  const totalAssignedPerStudent = (classAssignments || []).length;
  const atRiskMembers: Array<{
    userId: string;
    name: string;
    code: string;
    issue: string;
    issueType: 'missing' | 'low_score' | 'not_started';
    progress: number;
  }> = [];

  (classMembers || []).forEach((m: any) => {
    const prof = m.profiles;
    const name = prof?.full_name || prof?.email || 'Học viên';
    const code = m.student_code || prof?.email?.split('@')[0] || 'HV';
    const userSubs = allSubs.filter((s) => s.user_id === m.user_id);
    const userEvaluated = userSubs.filter((s) => s.status === 'EVALUATED');

    if (userSubs.length === 0) {
      atRiskMembers.push({
        userId: m.user_id,
        name,
        code,
        issue: 'Chưa làm bài nào',
        issueType: 'not_started',
        progress: 0,
      });
    } else if (totalAssignedPerStudent > 0 && userEvaluated.length < totalAssignedPerStudent) {
      const missingCount = totalAssignedPerStudent - userEvaluated.length;
      atRiskMembers.push({
        userId: m.user_id,
        name,
        code,
        issue: `Thiếu ${missingCount} bài nộp`,
        issueType: 'missing',
        progress: Math.round((userEvaluated.length / totalAssignedPerStudent) * 100),
      });
    } else if (userEvaluated.length > 0) {
      const userAvg = Math.round(
        userEvaluated.reduce((a, b) => a + (b.percentage || 0), 0) / userEvaluated.length
      );
      if (userAvg < 50) {
        atRiskMembers.push({
          userId: m.user_id,
          name,
          code,
          issue: `Điểm đánh giá thấp (${userAvg}%)`,
          issueType: 'low_score',
          progress: userAvg,
        });
      }
    }
  });

  // Tổng hợp kết quả 5 miền năng lực số từ các bài thi đã được chấm (F14)
  const CANONICAL_DOMAINS: Array<{
    domainCode: 'D1' | 'D2' | 'D3' | 'D4' | 'D5';
    name: string;
  }> = [
    { domainCode: 'D1', name: 'Thông tin & Dữ liệu' },
    { domainCode: 'D2', name: 'Giao tiếp & Hợp tác' },
    { domainCode: 'D3', name: 'Sáng tạo nội dung số' },
    { domainCode: 'D4', name: 'An toàn & Bảo mật' },
    { domainCode: 'D5', name: 'Giải quyết Vấn đề' },
  ];

  const classDomainSums: Record<'D1' | 'D2' | 'D3' | 'D4' | 'D5', { sum: number; count: number }> = {
    D1: { sum: 0, count: 0 },
    D2: { sum: 0, count: 0 },
    D3: { sum: 0, count: 0 },
    D4: { sum: 0, count: 0 },
    D5: { sum: 0, count: 0 },
  };

  evaluatedSubs.forEach((sub: any) => {
    if (sub.domain_scores && typeof sub.domain_scores === 'object') {
      Object.entries(sub.domain_scores).forEach(([rawKey, val]) => {
        if (typeof val === 'number') {
          let code: 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | null = null;
          const upper = rawKey.toUpperCase();
          if (upper === 'D1' || upper === 'DOMAIN_1' || upper === 'DOMAIN1' || upper === '1' || upper === '01') code = 'D1';
          else if (upper === 'D2' || upper === 'DOMAIN_2' || upper === 'DOMAIN2' || upper === '2' || upper === '02') code = 'D2';
          else if (upper === 'D3' || upper === 'DOMAIN_3' || upper === 'DOMAIN3' || upper === '3' || upper === '03') code = 'D3';
          else if (upper === 'D4' || upper === 'DOMAIN_4' || upper === 'DOMAIN4' || upper === '4' || upper === '04') code = 'D4';
          else if (upper === 'D5' || upper === 'DOMAIN_5' || upper === 'DOMAIN5' || upper === '5' || upper === '05') code = 'D5';

          if (code && classDomainSums[code]) {
            classDomainSums[code].sum += val;
            classDomainSums[code].count += 1;
          }
        }
      });
    }
  });

  const classDomainScores = CANONICAL_DOMAINS.map((d) => {
    const data = classDomainSums[d.domainCode];
    return {
      domainCode: d.domainCode,
      name: d.name,
      score: data.count > 0 ? Math.round((data.sum / data.count) * 10) / 10 : null,
      testedCount: data.count,
    };
  });

  const formattedClass: OrgClassItem = {
    id: classRecord.id,
    name: classRecord.name,
    classCode: classRecord.class_code,
    description: classRecord.description,
    groupType: classRecord.group_type || 'CLASS',
    status: classRecord.status || 'ACTIVE',
    term: classRecord.term || null,
    instructorName: classRecord.instructor_name || null,
    maxCapacity: classRecord.max_capacity || 1000,
    createdAt: classRecord.created_at,
    membersCount: realMembers,
    assignmentsCount: realAssignments,
    participationRate,
    pendingGradingCount: realPending,
  };

  const realAnalytics = {
    participationRate,
    pendingGradingCount: realPending,
    atRiskCount: atRiskMembers.length,
    averageScore,
    completedSubmissionsCount: evaluatedSubs.length,
    totalSubmissionsNeeded: realMembers * realAssignments,
    atRiskMembers: atRiskMembers.slice(0, 10), // Giới hạn hiển thị 10 bạn cần quan tâm nhất
    classDomainScores,
  };

  return (
    <OrgClassAnalyticsView
      slug={slug}
      classData={formattedClass}
      analyticsData={realAnalytics}
      classDomainScores={classDomainScores}
    />
  );
}
