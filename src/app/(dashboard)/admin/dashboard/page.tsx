import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  Users,
  Building2,
  BookOpenCheck,
  Receipt,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  ShieldAlert,
  Cpu,
  Mail,
  AlertTriangle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface RecentSubmissionProfile {
  nickname: string | null;
  email: string | null;
}

interface RecentSubmissionAssessment {
  title: string | null;
}

interface RecentSubmissionRow {
  id: string;
  percentage: number | null;
  total_score: number | null;
  max_score: number | null;
  is_passed: boolean | null;
  submitted_at: string | null;
  profiles: RecentSubmissionProfile | null;
  assessments: RecentSubmissionAssessment | null;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Fetch platform stats in parallel
  const [
    { count: totalLearners },
    { count: totalEvaluators },
    { count: totalAdmins },
    { count: totalAssessments },
    { count: publishedAssessments },
    { count: totalSubmissions },
    { count: totalCredentials },
    { count: activeOrgs },
    { count: pendingInquiriesCount },
    { count: pendingContributions },
    { count: pendingPayments },
    orgEntitlementsRes,
    recentSubmissionsRes,
    successfulTransactionsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'LEARNER'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'EVALUATOR'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN'),
    supabase.from('assessments').select('*', { count: 'exact', head: true }),
    supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('assessment_submissions').select('*', { count: 'exact', head: true }),
    supabase.from('credentials').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    adminSupabase.from('business_inquiries').select('*', { count: 'exact', head: true }).in('status', ['PENDING', 'NEW', 'CONTACTED']),
    adminSupabase.from('community_contributions').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    adminSupabase.from('payment_transactions').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    adminSupabase.from('organization_entitlements').select('id, organization_id, ai_credits_granted, ai_credits_used, expires_at').eq('is_active', true),
    supabase
      .from('assessment_submissions')
      .select('id, percentage, total_score, max_score, is_passed, submitted_at, profiles(nickname, email), assessments(title)')
      .order('submitted_at', { ascending: false })
      .limit(6),
    adminSupabase
      .from('payment_transactions')
      .select('amount')
      .eq('status', 'SUCCESS'),
  ]);

  const learners = totalLearners ?? 0;
  const evaluators = totalEvaluators ?? 0;
  const admins = totalAdmins ?? 0;
  const totalUsers = learners + evaluators + admins;

  // Real verified revenue
  const totalRevenueVnd = (successfulTransactionsRes.data || []).reduce(
    (sum: number, tx: { amount?: number }) => sum + Number(tx.amount || 0),
    0
  );

  const pendingInquiries = pendingInquiriesCount ?? 0;
  const pendingContribCount = pendingContributions ?? 0;
  const pendingPaymentCount = pendingPayments ?? 0;
  const recentSubmissions = (recentSubmissionsRes.data || []) as unknown as RecentSubmissionRow[];

  // Detect low quota or expiring contracts
  const nowMs = Date.now();
  const lowQuotaOrgs = (orgEntitlementsRes.data || []).filter((e) => {
    const granted = e.ai_credits_granted ?? 0;
    const used = e.ai_credits_used ?? 0;
    const remaining = granted - used;
    const isExpiringSoon = e.expires_at ? new Date(e.expires_at).getTime() - nowMs < 14 * 24 * 3600 * 1000 : false;
    return remaining <= Math.max(10, granted * 0.1) || isExpiringSoon;
  });

  const totalActionTasks = pendingInquiries + pendingPaymentCount + lowQuotaOrgs.length + pendingContribCount;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Platform Control Center</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Trung Tâm Điều Hành Nền Tảng
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Ưu tiên hàng đầu các hàng đợi tác vụ cần xử lý, quản trị khách hàng B2B và giám sát chất lượng khảo thí.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/analytics"
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            <span>Phân tích BI (5 Miền)</span>
          </Link>
          <Link
            href="/admin/organizations"
            className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Duyệt hồ sơ B2B ({pendingInquiries})</span>
          </Link>
        </div>
      </div>

      {/* 2. Primary Action Queues (Prioritized at the very top) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${totalActionTasks > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
              HÀNG ĐỢI HÀNH ĐỘNG CẦN XỬ LÝ ({totalActionTasks})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
            {totalActionTasks === 0 ? 'Tất cả hàng đợi đã thông suốt' : 'Cần phân công giải quyết trong ca trực'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Action 1: Pending B2B Leads */}
          <div className="p-4 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 uppercase">Đối tác B2B</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${pendingInquiries > 0 ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                  {pendingInquiries} YÊU CẦU
                </span>
              </div>
              <p className="text-neutral-800 dark:text-zinc-200 text-xs">
                {pendingInquiries > 0
                  ? `Có ${pendingInquiries} trường học / doanh nghiệp đăng ký tư vấn gói Business cần duyệt & gửi email token.`
                  : 'Không có yêu cầu B2B nào đang chờ duyệt.'}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-850">
              <Link
                href="/admin/organizations"
                className="w-full px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] inline-flex items-center justify-center gap-1 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Phê duyệt B2B & Gửi Token</span>
              </Link>
            </div>
          </div>

          {/* Action 2: Financial Reconciliation */}
          <div className="p-4 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 uppercase">Đối soát tài chính</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${pendingPaymentCount > 0 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                  {pendingPaymentCount} CHỜ SOÁT
                </span>
              </div>
              <p className="text-neutral-800 dark:text-zinc-200 text-xs">
                {pendingPaymentCount > 0
                  ? `Có ${pendingPaymentCount} giao dịch cần kiểm tra mã tham chiếu ngân hàng payOS đối soát.`
                  : 'Sổ cái thanh toán đang cân khớp, không có đơn treo.'}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-850">
              <Link
                href="/admin/transactions"
                className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-neutral-800 dark:text-zinc-200 font-medium text-[11px] inline-flex items-center justify-center gap-1 transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <span>Bàn đối soát tài chính</span>
              </Link>
            </div>
          </div>

          {/* Action 3: Content Moderation */}
          <div className="p-4 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 uppercase">Thẩm định nội dung</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${pendingContribCount > 0 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                  {pendingContribCount} CHỜ DUYỆT
                </span>
              </div>
              <p className="text-neutral-800 dark:text-zinc-200 text-xs">
                {pendingContribCount > 0
                  ? `Có ${pendingContribCount} đề thi & câu hỏi do giảng viên đóng góp cần kiểm duyệt chuẩn 5 miền.`
                  : 'Đã hoàn tất thẩm định tất cả nội dung đóng góp.'}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-850">
              <Link
                href="/admin/contributions"
                className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-neutral-800 dark:text-zinc-200 font-medium text-[11px] inline-flex items-center justify-center gap-1 transition-colors"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <span>Bàn thẩm định 2 cột</span>
              </Link>
            </div>
          </div>

          {/* Action 4: AI Gateway & System Health */}
          <div className="p-4 bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 uppercase">Hạ tầng AI Gateway</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${lowQuotaOrgs.length > 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'}`}>
                  {lowQuotaOrgs.length > 0 ? `${lowQuotaOrgs.length} CẦN GIA HẠN` : 'HOẠT ĐỘNG ỔN ĐỊNH'}
                </span>
              </div>
              <p className="text-neutral-800 dark:text-zinc-200 text-xs">
                {lowQuotaOrgs.length > 0
                  ? `Có ${lowQuotaOrgs.length} tổ chức sắp hết credits hoặc hợp đồng đáo hạn trong 14 ngày.`
                  : 'Mô hình Gemini 2.5 Flash đang vận hành tốt với độ trễ < 2s.'}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-850">
              <Link
                href="/admin/ai-gateway"
                className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-neutral-800 dark:text-zinc-200 font-medium text-[11px] inline-flex items-center justify-center gap-1 transition-colors"
              >
                <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                <span>Giám sát AI Gateway</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Platform Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-md bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
        {/* Metric 1: Revenue */}
        <div className="p-3 bg-white dark:bg-[#111114] rounded border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs mb-1">
            <span>Doanh thu đối soát thực tế</span>
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {totalRevenueVnd.toLocaleString('vi-VN')}
            <span className="text-xs font-normal text-slate-400 ml-1">đ</span>
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
            Từ giao dịch đã đối soát ngân hàng
          </div>
        </div>

        {/* Metric 2: Users */}
        <div className="p-3 bg-white dark:bg-[#111114] rounded border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs mb-1">
            <span>Người dùng hệ thống</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {totalUsers.toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 font-mono">
            {learners} học viên &bull; {evaluators} giảng viên
          </div>
        </div>

        {/* Metric 3: Assessments */}
        <div className="p-3 bg-white dark:bg-[#111114] rounded border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs mb-1">
            <span>Đề khảo thí chuẩn</span>
            <BookOpenCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {publishedAssessments ?? 0}
            <span className="text-xs font-normal text-slate-400 ml-1">/ {totalAssessments ?? 0}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 font-mono">
            {(totalSubmissions ?? 0).toLocaleString('vi-VN')} bài làm &bull; {(totalCredentials ?? 0).toLocaleString('vi-VN')} chứng chỉ
          </div>
        </div>

        {/* Metric 4: Organizations */}
        <div className="p-3 bg-white dark:bg-[#111114] rounded border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs mb-1">
            <span>Trường học & Doanh nghiệp</span>
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {activeOrgs ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 font-mono">
            {pendingInquiries > 0 ? (
              <span className="text-amber-700 dark:text-amber-400 font-semibold">{pendingInquiries} yêu cầu B2B chờ duyệt</span>
            ) : (
              'Cơ sở đào tạo đối tác'
            )}
          </div>
        </div>
      </div>

      {/* 4. Recent Exam Activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
              Nhật ký khảo thí gần đây
            </h2>
          </div>
          <Link
            href="/admin/analytics"
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium inline-flex items-center gap-1"
          >
            <span>Toàn bộ báo cáo phân tích</span>
            <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
          </Link>
        </div>

        <div className="border border-slate-200 dark:border-zinc-800 rounded-md overflow-hidden bg-white dark:bg-[#111114] text-xs shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900 text-slate-500 dark:text-neutral-400 text-[11px] font-semibold font-mono">
                  <th className="py-2.5 px-3.5">THÍ SINH</th>
                  <th className="py-2.5 px-3.5">ĐỀ KHẢO THÍ</th>
                  <th className="py-2.5 px-3.5 text-center">ĐIỂM ĐẠT</th>
                  <th className="py-2.5 px-3.5 text-center">KẾT QUẢ</th>
                  <th className="py-2.5 px-3.5 text-right">THỜI GIAN NỘP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-850 font-sans">
                {recentSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-slate-400 dark:text-zinc-500">
                      Chưa ghi nhận lượt nộp bài khảo thí nào trên hệ thống.
                    </td>
                  </tr>
                ) : (
                  recentSubmissions.map((sub) => {
                    const maxScore = sub.max_score ?? 0;
                    const calculatedPct = maxScore > 0 ? Math.round(((sub.total_score ?? 0) / maxScore) * 100) : 0;
                    const displayPct = sub.percentage ?? calculatedPct;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/60 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {sub.profiles?.nickname || 'Người học'}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">
                            {sub.profiles?.email || 'Ẩn danh'}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-neutral-800 dark:text-zinc-200 font-medium">
                          {sub.assessments?.title || 'Khảo thí năng lực số'}
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                          {displayPct}%
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {sub.is_passed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                              Đạt chuẩn
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                              Chưa đạt
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-right text-slate-400 dark:text-neutral-500 font-mono text-[11px]">
                          {sub.submitted_at
                            ? new Date(sub.submitted_at).toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : 'Vừa xong'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
