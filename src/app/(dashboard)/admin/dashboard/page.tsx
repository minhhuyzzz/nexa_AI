'use client';

import Link from 'next/link';
import {
  Users,
  Building2,
  Cpu,
  Layers,
  ShieldCheck,
  ArrowRight,
  BookOpenCheck,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const quickStats = [
    { label: 'Người dùng', value: '1,240', sub: 'Thí sinh & Giảng viên' },
    { label: 'Trường & Tổ chức', value: '12', sub: 'Đang hoạt động' },
    { label: 'Khung năng lực', value: '1 chuẩn', sub: '5 miền • 21 kỹ năng' },
    { label: 'Cổng AI', value: '99.8%', sub: 'Tỷ lệ phản hồi ổn định' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Quản trị Hệ thống
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Điều phối khung năng lực, ngân hàng đề thi và cấu hình kết nối AI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/frameworks"
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
            <span>Khung năng lực</span>
          </Link>
          <Link
            href="/admin/ai-gateway"
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Cấu hình AI</span>
          </Link>
        </div>
      </div>

      {/* Pending Community Submissions Action Alert */}
      <div className="p-3.5 rounded-md bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <div>
            <span className="font-bold text-slate-900">
              Có 1 đề bài đóng góp từ người học đang chờ thẩm định học thuật
            </span>
            <div className="text-[11px] text-slate-600">
              Sáng kiến: &ldquo;Thực hành phân tích dòng tiền và tự động hóa báo cáo doanh số...&rdquo; (Trần Minh Huy)
            </div>
          </div>
        </div>
        <Link
          href="/admin/contributions"
          className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shrink-0 self-start sm:self-auto shadow-xs"
        >
          <span>Thẩm định ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-md bg-slate-50 border border-slate-200/80">
        {quickStats.map((stat, idx) => (
          <div key={idx} className={`p-2 ${idx > 0 ? 'border-l border-slate-200/60' : ''}`}>
            <div className="text-[11px] text-slate-500 mb-0.5">{stat.label}</div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-[10px] text-slate-400">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-9 h-9 rounded-md bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-3.5">
              <Layers className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Khung năng lực số</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tùy biến các miền năng lực và kỹ năng thành phần trong CSDL. Thiết lập các chỉ số trọng số và cấp độ thành thạo cho từng ngành đào tạo.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/admin/frameworks"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
            >
              <span>Quản lý khung năng lực</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3.5">
              <BookOpenCheck className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Đề thi & Học liệu</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Quản trị ngân hàng câu hỏi trắc nghiệm, tình huống và kho bài học bồi dưỡng. Gán nhãn kỹ năng và kiểm duyệt nội dung học thuật.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/admin/content"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
            >
              <span>Quản lý nội dung</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        <div className="p-5 rounded-md bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3.5">
              <Cpu className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Cấu hình AI</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Quản lý khóa API, điều phối mô hình (Gemini, Claude, GPT) và kiểm tra hạn mức sử dụng (Quota) để bảo đảm chi phí tối ưu.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/admin/ai-gateway"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
            >
              <span>Cấu hình AI</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


