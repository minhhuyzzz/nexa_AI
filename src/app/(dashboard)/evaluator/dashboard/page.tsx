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
  BookOpen,
  Layers,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

interface PendingSubmission {
  id: string;
  candidateName: string;
  candidateId: string;
  assessmentTitle: string;
  groupCode: string;
  submittedAt: string;
  format: string;
}

export default function EvaluatorDashboardPage() {
  const pendingSubmissions: PendingSubmission[] = [
    {
      id: 'sub-01',
      candidateName: 'Trần Minh Huy',
      candidateId: 'NX-8821',
      assessmentTitle: 'Khảo thí thực hành: Phân tích & Trực quan dữ liệu bảng tính',
      groupCode: 'NX-DIG24',
      submittedAt: 'Hôm nay lúc 09:15',
      format: 'Tệp .xlsx kèm minh chứng',
    },
    {
      id: 'sub-02',
      candidateName: 'Lê Thị Thu',
      candidateId: 'NX-9042',
      assessmentTitle: 'Tình huống phân nhánh: Nhận diện rủi ro lừa đảo & An toàn danh tính số',
      groupCode: 'NX-DIG24',
      submittedAt: 'Hôm nay lúc 08:40',
      format: 'Kịch bản tình huống',
    },
    {
      id: 'sub-03',
      candidateName: 'Hoàng Quốc Bảo',
      candidateId: 'NX-7731',
      assessmentTitle: 'Thực hành tạo lập câu lệnh Prompt chuẩn RTCO cho xử lý thông tin',
      groupCode: 'AI-PRO8',
      submittedAt: 'Hôm qua lúc 16:20',
      format: 'Văn bản phản hồi',
    },
  ];

  const activeRooms = [
    {
      id: 'room-01',
      pin: '849 201',
      title: 'Đợt khảo thí Năng lực Số cơ bản - Nhóm NX-DIG24',
      activeCandidates: 14,
      status: 'Đang mở phòng',
    },
    {
      id: 'room-02',
      pin: '512 884',
      title: 'Khảo thí Kỹ năng Làm việc cùng AI - Khóa AI-PRO8',
      activeCandidates: 8,
      status: 'Đang mở phòng',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              KHÔNG GIAN LÀM VIỆC CỦA NGƯỜI ĐÁNH GIÁ
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Tổng quan Khảo thí
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Điều phối phòng thi, chấm điểm bài làm thực hành theo thang Rubric và quản lý ngân hàng khảo thí.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/evaluator/live-room"
            className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
            <span>Phòng thi PIN/QR</span>
          </Link>
          <Link
            href="/evaluator/grading"
            className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Chấm bài ngay</span>
          </Link>
        </div>
      </div>

      {/* 4 Core Workspace Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1: Grading Station */}
        <Link
          href="/evaluator/grading"
          className="p-4 rounded-md border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="w-9 h-9 rounded-md bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-3 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <CheckSquare className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-sky-600 transition-colors">
              Bàn chấm bài Rubric
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Soi bài làm và minh chứng của thí sinh song song với tiêu chí đánh giá. Hỗ trợ kích hoạt AI chấm gợi ý theo yêu cầu.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-sky-600">
            <span>Vào chấm bài</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

        {/* Module 2: Live Room */}
        <Link
          href="/evaluator/live-room"
          className="p-4 rounded-md border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Radio className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-sky-600 transition-colors">
              Phòng thi trực tiếp PIN/QR
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cấp mã PIN 6 số hoặc liên kết để thí sinh vào thi tập trung. Giám sát trạng thái làm bài và danh sách nộp bài trực tiếp.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-sky-600">
            <span>Mở phòng thi</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

        {/* Module 3: Assessment & Item Bank */}
        <Link
          href="/evaluator/item-bank"
          className="p-4 rounded-md border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <BookOpen className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-sky-600 transition-colors">
              Ngân hàng câu hỏi &amp; Đề thi
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Thiết lập bài khảo thí, câu hỏi trắc nghiệm, kịch bản tình huống và đề thực hành bám sát khung năng lực số chuẩn hóa.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-sky-600">
            <span>Quản lý đề thi</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

        {/* Module 4: Groups & Candidates */}
        <Link
          href="/evaluator/groups"
          className="p-4 rounded-md border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-sky-600 transition-colors">
              Nhóm &amp; Ứng viên khảo thí
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tổ chức người học thành các nhóm không gian khảo thí, theo dõi danh sách thành viên và chia sẻ học liệu chuẩn hóa.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-sky-600">
            <span>Danh sách nhóm</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>

      {/* 2 Main Action Queues (Pending Submissions + Active Live Rooms) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Submissions Queue (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Bài nộp đang chờ chấm điểm
              </h2>
            </div>
            <Link
              href="/evaluator/grading"
              className="text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1"
            >
              <span>Xem toàn bộ</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="border border-slate-200 rounded-md overflow-hidden bg-white text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-[11px] font-semibold">
                  <th className="py-2.5 px-3.5">ỨNG VIÊN / THÍ SINH</th>
                  <th className="py-2.5 px-3.5">BÀI KHẢO THÍ</th>
                  <th className="py-2.5 px-3.5">THỜI GIAN NỘP</th>
                  <th className="py-2.5 px-3.5 text-right">TÁC VỤ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-900">{sub.candidateName}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {sub.candidateId} &bull; {sub.groupCode}
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-slate-800 leading-snug">{sub.assessmentTitle}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{sub.format}</div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap">
                      {sub.submittedAt}
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/evaluator/grading`}
                        className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <span>Chấm bài</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Live Rooms & Ongoing Sessions (1 col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Phòng thi đang hoạt động
              </h2>
            </div>
            <Link
              href="/evaluator/live-room"
              className="text-xs text-sky-600 hover:text-sky-700 font-medium"
            >
              Mở thêm
            </Link>
          </div>

          <div className="space-y-3">
            {activeRooms.map((room) => (
              <div
                key={room.id}
                className="p-3.5 rounded-md border border-slate-200 bg-white space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200/80">
                    PIN: {room.pin}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    {room.status}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 leading-snug">
                  {room.title}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>{room.activeCandidates} thí sinh trực tuyến</span>
                  <Link
                    href="/evaluator/live-room"
                    className="text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1"
                  >
                    <span>Vào phòng</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}

            {/* Quick Access to Reports */}
            <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50 text-xs flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Báo cáo &amp; Xuất bảng điểm</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Xuất file CSV/Excel điểm chi tiết theo 5 miền năng lực</div>
              </div>
              <Link
                href="/evaluator/analytics"
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs shrink-0 transition-colors shadow-xs"
              >
                Xem báo cáo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
