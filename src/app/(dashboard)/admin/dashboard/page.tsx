import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  Users,
  Building2,
  Cpu,
  BarChart3,
  Receipt,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  AdminKpiCard,
  AdminActivityTrendChart,
  AdminAssessmentQualityCard,
  AdminPlatformHealthCard,
} from '@/components/dashboard/admin/AdminUIComponents';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Trung tâm điều hành nền tảng',
  description:
    'Bảng điều khiển quản trị trung tâm NEXA: giám sát chỉ số vận hành, tăng trưởng người dùng, chất lượng khảo thí năng lực số và hạ tầng kỹ thuật nền tảng.',
  openGraph: {
    title: 'Trung tâm điều hành nền tảng | NEXA Admin',
    description:
      'Giám sát chỉ số vận hành, tăng trưởng tài khoản và chất lượng khảo thí năng lực số toàn hệ thống NEXA.',
  },
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Fetch real platform metrics in parallel
  const [
    { count: totalLearners },
    { count: totalEvaluators },
    { count: totalAdmins },
    { count: totalAssessments },
    { count: activeOrgsCount },
    completedSubmissionsRes,
    issuedCredentialsRes,
    completedPaymentsRes,
    aiUsageRes,
    recentSubmissionsRes,
    auditLogsRes,
    allCompletedSubmissionsRes,
    allProfilesRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'LEARNER'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'EVALUATOR'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN'),
    supabase.from('assessments').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase
      .from('assessment_submissions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['SUBMITTED', 'EVALUATED']),
    supabase
      .from('credentials')
      .select('*', { count: 'exact', head: true })
      .eq('is_revoked', false),
    adminSupabase
      .from('payment_transactions')
      .select('amount')
      .in('status', ['PAID', 'COMPLETED', 'SUCCESS', 'RECONCILED']),
    adminSupabase
      .from('ai_usage_events')
      .select('cost_estimated'),
    supabase
      .from('assessment_submissions')
      .select('id, percentage, total_score, submitted_at, profiles(nickname, email), assessments(title)')
      .order('submitted_at', { ascending: false })
      .limit(5),
    adminSupabase
      .from('admin_audit_logs')
      .select('id, action, target_type, target_id, created_at, admin_email, admin_id')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('assessment_submissions')
      .select('id, percentage, is_passed, submitted_at')
      .in('status', ['SUBMITTED', 'EVALUATED'])
      .order('submitted_at', { ascending: false })
      .limit(200),
    supabase
      .from('profiles')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const rawUsers = (totalLearners ?? 0) + (totalEvaluators ?? 0) + (totalAdmins ?? 0);
  const totalUsersDisplay = rawUsers.toLocaleString('vi-VN');
  const activeOrgsDisplay = (activeOrgsCount ?? 0).toLocaleString('vi-VN');
  const totalAssessmentsDisplay = (totalAssessments ?? 0).toLocaleString('vi-VN');
  const completedAssessments = completedSubmissionsRes.count ?? 0;
  const issuedCredentials = issuedCredentialsRes.count ?? 0;

  // Real reconciled revenue from completed transactions
  const rawRevenue = (completedPaymentsRes.data || []).reduce(
    (acc: number, t: any) => acc + (Number(t.amount) || 0),
    0
  );
  const revenueDisplay = rawRevenue > 0 ? `${rawRevenue.toLocaleString('vi-VN')} đ` : '0 đ';

  // Real AI estimated cost from telemetry events (VND)
  const rawAiCostUsd = (aiUsageRes.data || []).reduce(
    (acc: number, l: any) => acc + (Number(l.cost_estimated) || 0),
    0
  );
  const rawAiCostVnd = Math.round(rawAiCostUsd * 25400);
  const aiCostDisplay = rawAiCostVnd > 0 ? `${rawAiCostVnd.toLocaleString('vi-VN')} đ` : '0 đ';

  // Real assessment quality metrics from actual submissions
  const allCompletedSubmissions = allCompletedSubmissionsRes.data || [];
  const passedCount = allCompletedSubmissions.filter(
    (s) => (s.percentage ?? 0) >= 70 || s.is_passed === true
  ).length;
  const needImprovementCount = Math.max(0, allCompletedSubmissions.length - passedCount);
  const averageScore =
    allCompletedSubmissions.length > 0
      ? Math.round(
          allCompletedSubmissions.reduce((acc, s) => acc + (Number(s.percentage) || 0), 0) /
            allCompletedSubmissions.length
        )
      : 0;

  // Real activity trend: frequency of submissions and new user registrations
  const subDateList = allCompletedSubmissions.filter((s) => s.submitted_at);
  const profDateList = (allProfilesRes.data || []).filter((p) => p.created_at);

  const now = new Date();
  const dayBuckets: Record<string, { date: string; submissions: number; users: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    dayBuckets[key] = { date: key, submissions: 0, users: 0 };
  }

  subDateList.forEach((sub) => {
    const d = new Date(sub.submitted_at!);
    const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (dayBuckets[key]) {
      dayBuckets[key].submissions += 1;
    }
  });

  profDateList.forEach((prof) => {
    const d = new Date(prof.created_at!);
    const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (dayBuckets[key]) {
      dayBuckets[key].users += 1;
    }
  });

  let activityTrend = Object.values(dayBuckets);

  // If calendar last 7 days has zero data, but we have submissions/profiles, group by actual dates from data
  const hasRecentData = activityTrend.some((d) => d.submissions > 0 || d.users > 0);
  if (!hasRecentData && (subDateList.length > 0 || profDateList.length > 0)) {
    const dynamicBuckets: Record<string, { date: string; submissions: number; users: number; timestamp: number }> = {};

    subDateList.forEach((sub) => {
      const d = new Date(sub.submitted_at!);
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!dynamicBuckets[key]) {
        dynamicBuckets[key] = { date: key, submissions: 0, users: 0, timestamp: d.getTime() };
      }
      dynamicBuckets[key].submissions += 1;
    });

    profDateList.forEach((prof) => {
      const d = new Date(prof.created_at!);
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!dynamicBuckets[key]) {
        dynamicBuckets[key] = { date: key, submissions: 0, users: 0, timestamp: d.getTime() };
      }
      dynamicBuckets[key].users += 1;
    });

    activityTrend = Object.values(dynamicBuckets)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-7)
      .map(({ date, submissions, users }) => ({ date, submissions, users }));
  }

  type ActivityItem = {
    time: string;
    isoTime: string;
    timestamp: number;
    action: string;
    target: string;
    actor: string;
    icon: typeof Building2;
  };

  const rawAuditLogs = (auditLogsRes.data as any[]) || [];
  const rawSubmissions = (recentSubmissionsRes.data as any[]) || [];

  // Tra cứu đối soát email người thực hiện từ profiles nếu log cũ bị null admin_email
  const missingAuditAdminIds = Array.from(
    new Set(rawAuditLogs.filter((l) => !l.admin_email && l.admin_id).map((l) => l.admin_id as string))
  );
  const auditEmailMap: Record<string, string> = {};
  if (missingAuditAdminIds.length > 0) {
    try {
      const { data: auditProfiles } = await supabase
        .from('profiles')
        .select('id, email, nickname')
        .in('id', missingAuditAdminIds);
      if (auditProfiles) {
        auditProfiles.forEach((p: any) => {
          if (p.id) auditEmailMap[p.id] = p.email || p.nickname;
        });
      }
    } catch {}
  }

  const auditItems: ActivityItem[] = rawAuditLogs.map((log) => {
    const d = new Date(log.created_at);
    const actionLabel =
      log.action === 'UPDATE' && log.target_type === 'ASSESSMENT'
        ? 'Cập nhật đề chuẩn'
        : log.action === 'AI_CONFIG_UPDATED'
        ? 'Cấu hình AI Gateway'
        : log.action || 'Thao tác quản trị';

    const targetLabel =
      log.target_type === 'ASSESSMENT'
        ? `Khảo thí #${String(log.target_id || '').slice(0, 8)}`
        : log.target_type === 'AI_GATEWAY'
        ? 'Cổng AI Telemetry'
        : log.target_type || 'Hệ thống';

    const resolvedActor =
      log.admin_email || (log.admin_id ? auditEmailMap[log.admin_id] : null) || 'Quản trị viên';

    return {
      time: d.toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      }),
      isoTime: d.toISOString(),
      timestamp: d.getTime(),
      action: actionLabel,
      target: targetLabel,
      actor: resolvedActor,
      icon: ShieldCheck,
    };
  });

  const submissionItems: ActivityItem[] = rawSubmissions.map((sub: any) => {
    const d = sub.submitted_at ? new Date(sub.submitted_at) : new Date();
    return {
      time: d.toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      }),
      isoTime: d.toISOString(),
      timestamp: d.getTime(),
      action: 'Nộp bài khảo thí',
      target: sub.assessments?.title || 'Đánh giá năng lực số',
      actor: sub.profiles?.nickname || sub.profiles?.email || 'Học viên',
      icon: FileCheck2,
    };
  });

  // Combine and display the top 5 most recent activities across logs and submissions
  const recentActivities: ActivityItem[] = [...auditItems, ...submissionItems]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <main className="space-y-6 max-w-7xl mx-auto pb-12" aria-label="Trung tâm điều hành nền tảng NEXA">
      {/* 1. Header & Quick Actions */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Tổng quan nền tảng
          </h1>
        </div>

        <nav aria-label="Lối tắt điều hành quản trị" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <Link
            href="/admin/organizations"
            aria-label="Chuyển đến trang duyệt hồ sơ tổ chức B2B"
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Duyệt hồ sơ B2B</span>
          </Link>
          <Link
            href="/admin/analytics"
            aria-label="Chuyển đến trang phân tích năng lực số toàn hệ thống"
            className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            <span>Phân tích năng lực số</span>
          </Link>
        </nav>
      </header>

      {/* 2. Top 6 Executive Command KPI Hero Cards */}
      <section aria-labelledby="kpi-command-heading">
        <h2 id="kpi-command-heading" className="sr-only">
          Chỉ số vận hành cốt lõi toàn nền tảng
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <AdminKpiCard
            label="Doanh thu đối soát"
            value={revenueDisplay}
            change="Chính thức"
            changeType="positive"
            icon={Receipt}
          />
          <AdminKpiCard
            label="Tổ chức B2B hiệu lực"
            value={activeOrgsDisplay}
            change="B2B Active"
            changeType="positive"
            icon={Building2}
          />
          <AdminKpiCard
            label="Tài khoản xác thực"
            value={totalUsersDisplay}
            change="Xác thực"
            changeType="positive"
            icon={Users}
          />
          <AdminKpiCard
            label="Khảo thí hoàn tất"
            value={completedAssessments.toLocaleString('vi-VN')}
            change="Chuẩn hóa"
            changeType="positive"
            icon={CheckCircle2}
          />
          <AdminKpiCard
            label="Chứng chỉ đã cấp"
            value={issuedCredentials.toLocaleString('vi-VN')}
            change="Hiệu lực"
            changeType="positive"
            icon={ShieldCheck}
          />
          <AdminKpiCard
            label="Chi phí AI ước tính"
            value={aiCostDisplay}
            change="Ước tính"
            changeType="neutral"
            icon={Cpu}
          />
        </div>
      </section>

      {/* 3. Middle Grid: Xu hướng hoạt động nền tảng & Phân bố chất lượng khảo thí */}
      <section aria-labelledby="analytics-trend-heading">
        <h2 id="analytics-trend-heading" className="sr-only">
          Xu hướng hoạt động và phân bố chất lượng khảo thí
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-7 flex flex-col">
            <AdminActivityTrendChart
              data={activityTrend}
              totalSubmissions={completedAssessments}
              totalUsers={rawUsers}
            />
          </div>
          <div className="lg:col-span-5 flex flex-col">
            <AdminAssessmentQualityCard
              passedCount={passedCount}
              needImprovementCount={needImprovementCount}
              totalSubmissions={completedAssessments}
              averageScore={averageScore}
            />
          </div>
        </div>
      </section>

      {/* 4. Bottom Grid: Nhật ký hoạt động gần đây và Trạng thái vận hành nền tảng */}
      <section aria-labelledby="operations-status-heading">
        <h2 id="operations-status-heading" className="sr-only">
          Nhật ký hoạt động hệ thống và trạng thái dịch vụ nền tảng
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: Nhật ký hoạt động gần đây */}
          <div className="lg:col-span-8 bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Nhật ký hoạt động hệ thống gần đây
                </h3>
                <Link
                  href="/admin/compliance"
                  aria-label="Xem toàn bộ nhật ký kiểm toán hệ thống"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1 focus-visible:underline focus-visible:outline-none"
                >
                  <span>Xem tất cả</span>
                  <span>→</span>
                </Link>
              </div>

              {recentActivities.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-neutral-400">
                  Chưa có hoạt động quản trị ghi nhận gần đây.
                </div>
              ) : (
                <>
                  {/* Mobile stacked cards (< 768px) */}
                  <div className="md:hidden space-y-2.5">
                    {recentActivities.map((act, idx) => {
                      const ActIcon = act.icon;
                      return (
                        <article
                          key={idx}
                          className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="p-1 rounded-md bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border border-slate-200/80 dark:border-zinc-700 shrink-0">
                                <ActIcon className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                                {act.action}
                              </span>
                            </div>
                            <time
                              dateTime={act.isoTime}
                              className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 whitespace-nowrap shrink-0"
                            >
                              {act.time}
                            </time>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-300 gap-2">
                            <span className="truncate">{act.target}</span>
                            <span className="text-slate-500 dark:text-zinc-400 shrink-0">{act.actor}</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Desktop table (>= 768px) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-xs text-left" aria-label="Bảng nhật ký hoạt động hệ thống gần đây">
                      <thead>
                        <tr className="text-slate-500 dark:text-zinc-400 font-medium">
                          <th scope="col" className="py-2.5 pr-4">Thời gian</th>
                          <th scope="col" className="py-2.5 px-4">Hoạt động</th>
                          <th scope="col" className="py-2.5 px-4">Đối tượng</th>
                          <th scope="col" className="py-2.5 pl-4">Người thực hiện</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentActivities.map((act, idx) => {
                          const ActIcon = act.icon;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                              <td className="py-3 pr-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                                <time dateTime={act.isoTime}>{act.time}</time>
                              </td>
                              <td className="py-3 px-4 font-medium text-neutral-900 dark:text-neutral-100">
                                <div className="flex items-center gap-2">
                                  <ActIcon className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 shrink-0" />
                                  <span>{act.action}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-zinc-300">
                                {act.target}
                              </td>
                              <td className="py-3 pl-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                                {act.actor}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Trạng thái vận hành & Dịch vụ nền tảng */}
          <div className="lg:col-span-4 flex flex-col">
            <AdminPlatformHealthCard
              activeOrgsCount={activeOrgsCount ?? 0}
              assessmentCount={totalAssessments ?? 0}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
