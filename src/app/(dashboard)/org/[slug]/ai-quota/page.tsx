import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgPagePermission } from '@/lib/auth/org-guard';
import { QuotaEnforcementService } from '@/features/billing/services/quota-enforcement.service';
import { Users, FileText, Zap, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

export default async function OrgAIQuotaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization: org } = await requireOrgPagePermission(slug, 'VIEW_AI_QUOTA');
  const adminSupabase = createAdminClient();

  // 1. Get real contractual entitlements
  const entitlements = await QuotaEnforcementService.getOrgEntitlements(adminSupabase, org.id);

  // 2. Count current active seats
  const { count: currentSeatsCount } = await adminSupabase
    .from('user_organizations')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id);

  const currentSeats = currentSeatsCount ?? 0;

  // 3. Count assessments created
  const { count: assessmentsCount } = await adminSupabase
    .from('assessments')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id);

  const currentAssessments = assessmentsCount ?? 0;

  // 4. Fetch AI usage events for this organization
  const { data: events } = await adminSupabase
    .from('ai_usage_events')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-md border border-slate-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Gói Dịch Vụ &amp; Hạn Mức</h1>
            <span
              className={`px-2 py-0.5 text-[10px] font-semibold font-mono rounded border ${
                entitlements.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              Hợp đồng: {entitlements.contractNumber}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý quyền lợi hợp đồng, hạn mức số ghế, số đề thi và lưu lượng AI Credits của tổ chức {org.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-mono border ${
              entitlements.isActive
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <CheckCircle
              className={`w-4 h-4 ${entitlements.isActive ? 'text-emerald-600' : 'text-amber-500'}`}
              strokeWidth={1.75}
            />
            <span>{entitlements.isActive ? 'Hợp đồng Hiệu lực' : 'Chưa kích hoạt hợp đồng'}</span>
          </span>
        </div>
      </div>

      {/* Contract Alert when Inactive */}
      {!entitlements.isActive && (
        <div className="p-4 rounded-md border border-amber-200 bg-amber-50/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <h3 className="text-xs font-bold text-amber-900">Tổ chức chưa kích hoạt gói hợp đồng</h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Đơn vị hiện chưa có bản ghi quyền lợi hợp đồng (Entitlement) hoặc hợp đồng đã kết thúc thời hạn.
              Vui lòng liên hệ ban quản trị NEXA qua email <span className="font-mono font-medium">sales@nexa.edu.vn</span> để ký kết hoặc gia hạn hợp đồng B2B.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Seats */}
        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Hạn mức Thành viên</span>
            <Users className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {currentSeats} <span className="text-sm font-normal text-slate-400">/ {entitlements.maxSeats}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Còn lại <span className="font-mono font-medium text-slate-700">{Math.max(0, entitlements.maxSeats - currentSeats)}</span> ghế khả dụng
          </div>
        </div>

        {/* Assessments */}
        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Hạn mức Đề thi</span>
            <FileText className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {currentAssessments} <span className="text-sm font-normal text-slate-400">/ {entitlements.maxAssessments}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Đã phát hành trong không gian tổ chức
          </div>
        </div>

        {/* AI Credits */}
        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">AI Credits Hợp đồng</span>
            <Zap className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-600 mt-2 tabular-nums">
            {entitlements.remainingCredits} <span className="text-sm font-normal text-slate-400">/ {entitlements.aiCreditsGranted}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Đã sử dụng <span className="font-mono font-medium text-slate-700">{entitlements.aiCreditsUsed}</span> credits
          </div>
        </div>

        {/* Contract Validity */}
        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Thời hạn Hợp đồng</span>
            <Calendar className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="text-sm font-bold font-mono text-slate-900 mt-3 tabular-nums">
            {formatDate(entitlements.expiresAt)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Kích hoạt từ {formatDate(entitlements.startsAt)}
          </div>
        </div>
      </div>

      {/* Event Logs Table */}
      <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900">Nhật ký tiêu thụ AI Credits</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Lưu vết minh bạch các tác vụ chấm bài thực hành và phân tích năng lực theo yêu cầu</p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">20 giao dịch gần nhất</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                <th className="py-2.5 px-4">Tác vụ</th>
                <th className="py-2.5 px-4">Trạng thái</th>
                <th className="py-2.5 px-4">Credits</th>
                <th className="py-2.5 px-4">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {!events || events.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                    Chưa có sự kiện kích hoạt AI nào được ghi nhận cho tổ chức này.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {e.event_type === 'AI_GRADING' ? 'Chấm Rubric Thực Hành' : 'Phân Tích Năng Lực'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>Hoàn thành</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-sky-600 font-semibold text-[11px] tabular-nums">
                      +{e.credits_deducted ?? 0}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] tabular-nums">
                      {new Date(e.created_at).toLocaleTimeString('vi-VN')} {new Date(e.created_at).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
