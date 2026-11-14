import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  Users,
  Building2,
  Layers,
  Cpu,
  BarChart3,
  Receipt,
  FileCheck2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  AdminKpiCard,
  AdminFunnelChart,
  AdminFiveDomainScores,
} from '@/components/dashboard/admin/AdminUIComponents';

export const dynamic = 'force-dynamic';

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
      .select('id, action, target_type, target_id, created_at, admin_email')
      .order('created_at', { ascending: false })
      .limit(5),
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

  // Real or canonical competency domain average scores
  // If no submissions exist, domains array is empty to trigger clean empty state
  const domainScores: { name: string; score: number }[] = [];

  // Competency progression funnel steps from real counts
  const funnelSteps = [
    { label: 'Người dùng đăng ký', value: rawUsers },
    { label: 'Lượt nộp đánh giá', value: completedAssessments },
    { label: 'Chứng nhận đã cấp', value: issuedCredentials },
    { label: 'Tổ chức kích hoạt', value: activeOrgsCount ?? 0 },
  ];

  type ActivityItem = {
    time: string;
    action: string;
    target: string;
    actor: string;
    icon: typeof Building2;
  };

  const rawAuditLogs = auditLogsRes.data || [];
  const rawSubmissions = (recentSubmissionsRes.data as any[]) || [];

  let recentActivities: ActivityItem[] = [];

  if (rawAuditLogs.length > 0) {
    recentActivities = rawAuditLogs.map((log) => ({
      time: new Date(log.created_at).toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      }),
      action: log.action || 'Thao tác quản trị',
      target: log.target_type ? `${log.target_type}${log.target_id ? ` #${String(log.target_id).slice(0, 8)}` : ''}` : 'Hệ thống',
      actor: log.admin_email || 'Quản trị viên',
      icon: ShieldCheck,
    }));
  } else if (rawSubmissions.length > 0) {
    recentActivities = rawSubmissions.map((sub: any) => ({
      time: sub.submitted_at
        ? new Date(sub.submitted_at).toLocaleDateString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
          })
        : 'Gần đây',
      action: 'Nộp bài đánh giá',
      target: sub.assessments?.title || 'Bài đánh giá năng lực số',
      actor: sub.profiles?.nickname || sub.profiles?.email || 'Học viên',
      icon: FileCheck2,
    }));
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Trung tâm điều hành nền tảng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Tổng quan trạng thái vận hành, tăng trưởng và chất lượng dữ liệu của toàn bộ hệ thống NEXA.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <Link
            href="/admin/organizations"
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Duyệt hồ sơ B2B</span>
          </Link>
          <Link
            href="/admin/analytics"
            className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            <span>Phân tích năng lực số</span>
          </Link>
        </div>
      </div>

      {/* 2. Top 6 Executive Command KPI Hero Cards (Mục 4.1 Đặc tả 2026) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <AdminKpiCard
          label="Doanh thu đối soát"
          value={revenueDisplay}
          change="Chính thức"
          changeType="positive"
          timeframe="Tổng giao dịch hoàn tất"
          icon={Receipt}
        />
        <AdminKpiCard
          label="Tổ chức trả phí hiệu lực"
          value={activeOrgsDisplay}
          change="B2B Active"
          changeType="positive"
          timeframe="Tổ chức đang hoạt động"
          icon={Building2}
        />
        <AdminKpiCard
          label="Người dùng hoạt động thật"
          value={totalUsersDisplay}
          change="Xác thực"
          changeType="positive"
          timeframe="Hồ sơ tài khoản thật"
          icon={Users}
        />
        <AdminKpiCard
          label="Lượt đánh giá hoàn tất"
          value={completedAssessments.toLocaleString('vi-VN')}
          change="Chuẩn hóa"
          changeType="positive"
          timeframe="Bài nộp đã chấm điểm"
          icon={CheckCircle2}
        />
        <AdminKpiCard
          label="Chứng nhận đã cấp"
          value={issuedCredentials.toLocaleString('vi-VN')}
          change="Hiệu lực"
          changeType="positive"
          timeframe="Chứng chỉ số chưa thu hồi"
          icon={ShieldCheck}
        />
        <AdminKpiCard
          label="Chi phí AI trong kỳ"
          value={aiCostDisplay}
          change="Ước tính"
          changeType="neutral"
          timeframe="Telemetry từ các luồng gọi"
          icon={Cpu}
        />
      </div>

      {/* 3. Middle Grid: Phễu phát triển năng lực số và Hồ sơ năng lực số toàn nền tảng */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <AdminFunnelChart steps={funnelSteps} />
        </div>
        <div className="lg:col-span-5">
          <AdminFiveDomainScores domains={domainScores} />
        </div>
      </div>

      {/* 4. Bottom Grid: Nhật ký hoạt động gần đây và Quy tắc dữ liệu quản trị */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Nhật ký hoạt động gần đây */}
        <div className="lg:col-span-8 bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Nhật ký hoạt động hệ thống gần đây
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Các sự kiện quản trị quan trọng trên nền tảng.
                </p>
              </div>
              <Link
                href="/admin/compliance"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1"
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
                      <div
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
                          <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 whitespace-nowrap shrink-0">
                            {act.time}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-300 gap-2">
                          <span className="truncate">{act.target}</span>
                          <span className="text-slate-500 dark:text-zinc-400 shrink-0">{act.actor}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table (>= 768px) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-slate-500 dark:text-zinc-400 font-medium">
                        <th className="py-2.5 pr-4">Thời gian</th>
                        <th className="py-2.5 px-4">Hoạt động</th>
                        <th className="py-2.5 px-4">Đối tượng</th>
                        <th className="py-2.5 pl-4">Người thực hiện</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivities.map((act, idx) => {
                        const ActIcon = act.icon;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                            <td className="py-3 pr-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                              {act.time}
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

        {/* Right: Quy tắc dữ liệu quản trị (Canonical Notice Card) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                <Layers className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Quy tắc dữ liệu quản trị
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/25 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="font-semibold leading-relaxed">
                  Chỉ hiển thị đề chuẩn hệ thống; không hiển thị đề do dashboard Personal/Org tạo.
                </p>
              </div>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed pl-6">
                Dashboard quản trị hệ thống chỉ hiển thị và quản lý các tài sản chính thức (canonical) của nền tảng, bao gồm:
              </p>
              <ul className="text-[11px] text-blue-800/90 dark:text-blue-300/90 space-y-1 list-disc pl-10">
                <li>Đề chuẩn hệ thống (đã được phê duyệt và phát hành).</li>
                <li>Khung năng lực số và cấu hình liên quan.</li>
                <li>Các nội dung, lộ trình học và tài sản dùng chung toàn nền tảng.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
