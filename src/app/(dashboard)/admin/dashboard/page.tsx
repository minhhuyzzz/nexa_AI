import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Users,
  Building2,
  Cpu,
  Layers,
  ShieldCheck,
  ArrowRight,
  BookOpenCheck,
  Award,
  KeyRound,
  FileCheck2,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 1. Fetch real platform stats from Supabase
  const [
    { count: totalLearners },
    { count: totalEvaluators },
    { count: totalOrganizations },
    { count: totalCredentials },
    { count: totalAiEvaluations },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'LEARNER'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'EVALUATOR'),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('credentials').select('*', { count: 'exact', head: true }),
    supabase.from('ai_evaluations').select('*', { count: 'exact', head: true }),
    supabase.from('consent_logs').select('*').order('created_at', { ascending: false }).limit(5),
  ]);

  const totalUsers = (totalLearners || 0) + (totalEvaluators || 0);

  const adminStats = [
    {
      label: 'Người dùng nền tảng',
      value: totalUsers.toLocaleString('vi-VN'),
      sub: `${totalLearners || 0} Người học • ${totalEvaluators || 0} Người đánh giá`,
      highlight: false,
    },
    {
      label: 'Tổ chức & Doanh nghiệp',
      value: (totalOrganizations || 0).toLocaleString('vi-VN'),
      sub: 'Không gian khảo thí đang vận hành',
      highlight: false,
    },
    {
      label: 'Chứng chỉ số đã cấp',
      value: (totalCredentials || 0).toLocaleString('vi-VN'),
      sub: 'Định danh SHA-256 & QR Kiosk',
      highlight: false,
    },
    {
      label: 'Lượt kích hoạt AI On-Demand',
      value: (totalAiEvaluations || 0).toLocaleString('vi-VN'),
      sub: 'Chấm Rubric & Phân tích năng lực',
      highlight: true,
    },
  ];

  const logs = recentLogs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              BÀN ĐIỀU PHỐI CHỦ NỀN TẢNG
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Quản trị Hệ thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Điều phối khung năng lực số động, kiểm soát cổng AI Gateway và quản lý người dùng nền tảng.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/admin/frameworks"
            className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
            <span>Khung năng lực số</span>
          </Link>
          <Link
            href="/admin/ai-gateway"
            className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Cấu hình AI Gateway</span>
          </Link>
        </div>
      </div>

      {/* Accurate Platform Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-md bg-slate-50 border border-slate-200/80">
        {adminStats.map((stat, idx) => (
          <div key={idx} className={`p-2 ${idx > 0 ? 'border-l border-slate-200/60' : ''}`}>
            <div className="text-[11px] text-slate-500 mb-0.5">{stat.label}</div>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
                stat.highlight ? 'text-sky-700' : 'text-slate-900'
              }`}
            >
              {stat.value}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* 4 Core Administrative Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1: Dynamic Framework */}
        <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-9 h-9 rounded-md bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-3">
              <Layers className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Khung năng lực số động</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cấu hình các miền năng lực và kỹ năng thành phần trong CSDL. Thiết lập trọng số và cấp độ thành thạo linh hoạt theo chuẩn DigComp.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/admin/frameworks"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
            >
              <span>Quản lý khung năng lực</span>
              <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        {/* Module 2: Content & Question Bank */}
        <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3">
              <BookOpenCheck className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Đề thi &amp; Học liệu</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Quản trị ngân hàng câu hỏi trắc nghiệm, kịch bản tình huống và bài thực hành nộp tệp. Gán nhãn mã kỹ năng và duyệt đề cộng đồng.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/admin/content"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
            >
              <span>Quản lý nội dung</span>
              <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        {/* Module 3: AI Gateway Orchestration */}
        <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3">
              <Cpu className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Cấu hình AI Gateway</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Quản lý API Key, điều phối mô hình (Gemini / Claude / OpenAI), hạn mức token và đảm bảo cơ chế kích hoạt theo yêu cầu (On-Demand).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/admin/ai-gateway"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
            >
              <span>Cấu hình AI Gateway</span>
              <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        {/* Module 4: Organizations & Enterprises */}
        <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3">
              <Building2 className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Tổ chức &amp; Doanh nghiệp</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Quản lý các tổ chức, doanh nghiệp và đơn vị đối tác liên kết. Phân bổ hạn ngạch khảo thí và phân quyền người đánh giá.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/admin/organizations"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
            >
              <span>Xem danh sách đối tác</span>
              <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent System Audit Logs Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Nhật ký kiểm toán &amp; Hoạt động hệ thống
            </h2>
          </div>
          <Link
            href="/admin/compliance"
            className="text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1"
          >
            <span>Nhật ký bảo mật đầy đủ</span>
            <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
          </Link>
        </div>

        <div className="border border-slate-200 rounded-md overflow-hidden bg-white text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-[11px] font-semibold">
                <th className="py-2.5 px-3.5">HÀNH ĐỘNG HỆ THỐNG</th>
                <th className="py-2.5 px-3.5">ĐỐI TƯỢNG TÁC ĐỘNG</th>
                <th className="py-2.5 px-3.5">NGƯỜI THỰC HIỆN</th>
                <th className="py-2.5 px-3.5">THỜI GIAN</th>
                <th className="py-2.5 px-3.5 text-right">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-slate-400">
                    Chưa ghi nhận hoạt động kiểm toán hệ thống nào gần đây.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3.5 font-semibold text-slate-900 font-mono text-[11px]">
                      {log.is_granted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED'}
                    </td>
                    <td className="py-3 px-3.5 text-slate-700">
                      Chấp thuận điều khoản dữ liệu v{log.consent_version}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 font-mono text-[11px]">
                      User: {log.user_id ? log.user_id.slice(0, 8) + '...' : 'Ẩn danh'}
                    </td>
                    <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                        VERIFIED
                      </span>
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
