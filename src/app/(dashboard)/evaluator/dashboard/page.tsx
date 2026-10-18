'use client';

import Link from 'next/link';
import {
  Users,
  FileCheck,
  Radio,
  CheckSquare,
  BarChart3,
  ArrowRight,
  Clock,
  Plus,
} from 'lucide-react';

export default function EvaluatorDashboardPage() {
  const quickStats = [
    { label: 'Học viên', value: '128', sub: 'Trong các lớp phụ trách' },
    { label: 'Đề thi đã tạo', value: '6', sub: 'Sẵn sàng khảo thí' },
    { label: 'Bài chờ chấm', value: '5', sub: 'Cần phản hồi', highlight: true },
    { label: 'Chứng chỉ đã cấp', value: '42', sub: 'Đạt chuẩn đầu ra' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Tổng quan Khảo thí
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý đề thi, phòng thi trực tiếp và chấm điểm bài làm của học viên.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/evaluator/live-room"
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
            <span>Phòng thi</span>
          </Link>
          <Link
            href="/evaluator/grading"
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Chấm bài ngay</span>
          </Link>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
        {quickStats.map((stat, idx) => (
          <div key={idx} className={`p-2 ${idx > 0 ? 'border-l border-slate-200/60' : ''}`}>
            <div className="text-[11px] text-slate-500 mb-0.5">{stat.label}</div>
            <div
              className={`text-2xl font-bold ${
                stat.highlight ? 'text-amber-600' : 'text-slate-900'
              }`}
            >
              {stat.value}
            </div>
            <div className="text-[10px] text-slate-400">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-3.5">
              <CheckSquare className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Bàn chấm bài</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Soi bài làm và minh chứng của học viên song song bên cạnh thang điểm. Bạn có thể tự chấm hoặc nhấn nút nhận gợi ý từ AI.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/evaluator/grading"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
            >
              <span>Vào chấm bài</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3.5">
              <Radio className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Phòng thi trực tiếp</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cấp mã PIN 6 số hoặc liên kết để học viên vào thi tập trung. Theo dõi danh sách nộp bài và trạng thái hoàn thành theo thời gian thực.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/evaluator/live-room"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
            >
              <span>Mở phòng thi</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3.5">
              <BarChart3 className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Báo cáo & Thống kê</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Xem tỷ lệ đạt theo từng nhóm kỹ năng của lớp học. Xuất bảng điểm chi tiết định dạng Excel/CSV phục vụ tổng kết và nghiên cứu.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/evaluator/analytics"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
            >
              <span>Xem thống kê</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


