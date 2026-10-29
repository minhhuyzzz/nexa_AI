import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { Cpu, Zap, Activity, Clock } from 'lucide-react';

export default async function OrgAIQuotaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const adminSupabase = createAdminClient();

  const { data: org } = await adminSupabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (!org) {
    notFound();
  }

  // Fetch AI usage events for this organization
  const { data: events } = await adminSupabase
    .from('ai_usage_events')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const totalCreditsUsed = (events || []).reduce(
    (sum, e) => sum + (e.credits_deducted || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-md border border-slate-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Ngân sách & Quota AI</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Gói Enterprise
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi lưu lượng chấm bài tự động và phân tích năng lực bằng AI trong tổ chức {org.name}.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Hạn mức AI tháng</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">10,000</div>
          <div className="text-[11px] text-slate-500 mt-2">Credits cấp tổ chức</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Đã sử dụng gần đây</div>
          <div className="text-2xl font-bold font-mono text-sky-600 mt-1">{totalCreditsUsed}</div>
          <div className="text-[11px] text-slate-500 mt-2">Credits từ các bài chấm</div>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Trạng thái Cổng AI</div>
          <div className="text-sm font-bold text-emerald-700 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Gemini Flash & Pro Hoạt động</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Độ trễ trung bình: &sim;1.2s</div>
        </div>
      </div>

      {/* Event Logs Table */}
      <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900">Nhật ký kích hoạt AI gần nhất</h2>
          <span className="text-[11px] text-slate-400 font-mono">Tối đa 20 sự kiện</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Tác vụ</th>
                <th className="py-2.5 px-4">Model</th>
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
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {e.model_used || 'gemini-1.5-flash'}
                    </td>
                    <td className="py-3 px-4 font-mono text-sky-600 font-semibold text-[11px]">
                      +{e.credits_deducted || 1}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
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
