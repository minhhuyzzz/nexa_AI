'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckSquare,
  Award,
  BookOpen,
  Trophy,
  Flame,
  KeyRound,
  ChevronRight,
  TrendingUp,
  Compass,
} from 'lucide-react';
import { CompetencyRadarChart } from '@/components/dashboard/learner/CompetencyRadarChart';
import { QuickPinModal } from '@/components/dashboard/QuickPinModal';

const focusCards = [
  {
    id: 'mcq-general',
    title: 'Đánh giá năng lực tổng quát',
    desc: 'Khảo sát nhanh mức độ thành thạo các kỹ năng số cơ bản theo chuẩn khung học thuật.',
    time: '15 phút',
    questions: '10 câu hỏi',
    href: '/learner/assessments',
    actionText: 'Bắt đầu làm bài',
  },
  {
    id: 'ai-skills',
    title: 'Kỹ năng làm việc cùng AI',
    desc: 'Thực hành viết câu lệnh prompt, sử dụng trợ lý AI và tối ưu hóa xử lý nội dung số.',
    time: '20 phút',
    questions: 'Tình huống thực hành',
    href: '/learner/assessments',
    actionText: 'Thử thách ngay',
  },
  {
    id: 'security-skills',
    title: 'An toàn & Bảo mật số',
    desc: 'Nhận diện rủi ro lừa đảo mạng, quản lý mật khẩu an toàn và bảo vệ dữ liệu cá nhân.',
    time: '15 phút',
    questions: '8 câu hỏi',
    href: '/learner/assessments',
    actionText: 'Bắt đầu làm bài',
  },
];

export default function LearnerDashboardPage() {
  const [showPinModal, setShowPinModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);

  const weekDays = [
    { day: 'T2', active: true },
    { day: 'T3', active: true },
    { day: 'T4', active: true },
    { day: 'T5', active: false },
    { day: 'T6', active: false },
    { day: 'T7', active: false },
    { day: 'CN', active: false },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header & Quick Widgets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Xin chào, Minh Huy!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Chào mừng bạn trở lại. Hãy cùng theo dõi tiến độ và tiếp tục hoàn thiện năng lực số.
          </p>
        </div>

        {/* Quick Indicators */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
          {/* Level Progress - Calculated Tier System */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-600"
                  strokeDasharray="40, 100"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-bold text-xs text-emerald-900">240</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-900">
                  Cấp 3: Thành thạo
                </span>
                <button
                  type="button"
                  onClick={() => setShowLevelModal(true)}
                  className="text-[10px] text-slate-400 hover:text-slate-700 underline"
                  title="Xem chi tiết các mốc cấp bậc"
                >
                  (Quy định cấp)
                </button>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                <strong className="font-semibold text-slate-900">240</strong> / 300 điểm
              </div>
            </div>
          </div>

          {/* Activity Days - Energetic Amber Streak */}
          <div>
            <div className="flex items-center gap-1 text-[11px] text-slate-700 font-semibold mb-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Chuỗi 3 ngày hoạt động</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { day: 'T2', status: 'done' },
                { day: 'T3', status: 'done' },
                { day: 'T4', status: 'done' },
                { day: 'T5', status: 'today' },
                { day: 'T6', status: 'upcoming' },
                { day: 'T7', status: 'upcoming' },
                { day: 'CN', status: 'upcoming' },
              ].map((d) => (
                <div key={d.day} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] text-slate-400 font-medium">{d.day}</span>
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold transition-colors ${
                      d.status === 'done'
                        ? 'bg-amber-500 text-white shadow-2xs font-bold'
                        : d.status === 'today'
                        ? 'bg-amber-50 text-amber-800 border-2 border-amber-500 font-bold'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Clean Metric Strip - No top/bottom border lines, icons for each metric, pure titles and numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-1">
        <div className="py-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <CheckSquare className="w-4 h-4 text-slate-400" />
            <span>Bài đã làm</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">4</div>
        </div>

        <div className="py-1 sm:pl-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Compass className="w-4 h-4 text-slate-400" />
            <span>Miền đạt chuẩn</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">4/5</div>
        </div>

        <div className="py-1 sm:pl-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Trophy className="w-4 h-4 text-sky-600" />
            <span>Điểm tích luỹ</span>
          </div>
          <div className="text-2xl font-bold text-sky-600">240</div>
        </div>

        <div className="py-1 sm:pl-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Award className="w-4 h-4 text-slate-400" />
            <span>Chứng chỉ đã cấp</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">1</div>
        </div>
      </div>

      {/* 3. Spider / Radar Chart Section with Clean AI Diagnostic Insights */}
      <div className="p-6 rounded-md border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-6 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Sơ đồ năng lực 5 miền chính
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân tích trực quan mức độ phát triển năng lực số theo 5 miền cốt lõi của Khung chuẩn DigComp.
            </p>
          </div>
          <Link
            href="/learner/competency/analysis"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>Chi tiết phân tích & đề xuất AI</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Radar Chart (6 cols) */}
          <div className="lg:col-span-6 flex justify-center py-2">
            <CompetencyRadarChart size={320} />
          </div>

          {/* AI Diagnostic Summary (6 cols) - Replaces the 5 redundant progress cards */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Đánh giá chẩn đoán AI
                </span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Điểm bình quân: 77/100
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900">Miền thế mạnh vượt trội: </span>
                    <span className="text-slate-600">
                      <strong>D4: An toàn &amp; Bảo mật (90%)</strong> &bull; Kỹ năng quản trị danh tính số và phòng vệ mã độc đạt cấp độ Chuyên gia.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900">Khoảng trống cần bồi dưỡng: </span>
                    <span className="text-slate-600">
                      <strong>D3: Sáng tạo Nội dung số (62%)</strong> &bull; Dưới ngưỡng chuẩn 70%, cần rèn luyện thêm kỹ năng Prompt Engineering và bản quyền số.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                <Link
                  href="/learner/learning-path"
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
                >
                  <span>Xem lộ trình 4 bước bù đắp khoảng trống</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/learner/assessments"
                  className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
                >
                  Luyện tập Miền D3
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Choose a focus today */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Bài đánh giá đề xuất cho bạn
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lựa chọn bài kiểm tra phù hợp với mục tiêu phát triển của bạn.
            </p>
          </div>
          <Link
            href="/learner/assessments"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {focusCards.map((card) => (
            <div
              key={card.id}
              className="p-5 rounded-md border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span>{card.time}</span>
                  <span>{card.questions}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{card.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={card.href}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
                >
                  <span>{card.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Two-Column Content: Learning Pathway & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learning Pathway Card */}
        <div className="lg:col-span-2 p-6 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Lộ trình học tập tiếp theo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các bài học ngắn giúp củng cố những kỹ năng bạn cần cải thiện.
              </p>
            </div>
            <Link
              href="/learner/learning-path"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              Xem lộ trình →
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  01
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Bảo mật thông tin cá nhân & Thiết lập xác thực 2 lớp (2FA)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Thời lượng: 10 phút • Nhận +30 điểm khi hoàn thành
                  </p>
                </div>
              </div>
              <Link
                href="/learner/learning-path"
                className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shrink-0 text-center"
              >
                Tiếp tục học
              </Link>
            </div>

            <div className="p-4 rounded-md bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-75">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  02
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">
                    Kỹ thuật đặt câu lệnh (Prompting) hiệu quả khi làm việc với AI
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Thời lượng: 15 phút • Mở khóa sau bài 01
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">Chưa mở khóa</span>
            </div>
          </div>
        </div>

        {/* Leaderboard Preview & Quick PIN trigger */}
        <div className="p-6 rounded-md border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
                <h3 className="text-sm font-bold text-slate-900">Bảng xếp hạng tuần</h3>
              </div>
              <Link
                href="/learner/leaderboard"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                Xem tất cả →
              </Link>
            </div>

            <div className="space-y-3">
              {[
                { rank: 1, name: 'Nguyễn Văn An', points: '1,420 pts', avatar: 'AN' },
                { rank: 2, name: 'Lê Thị Thu', points: '1,280 pts', avatar: 'TH' },
                { rank: 3, name: 'Trần Minh Huy (Bạn)', points: '240 pts', avatar: 'MH', isMe: true },
              ].map((user) => (
                <div
                  key={user.rank}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${
                    user.isMe ? 'bg-sky-50 border border-sky-200/80 font-semibold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold w-4 text-slate-500">{user.rank}</span>
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                      {user.avatar}
                    </div>
                    <span className="text-slate-800 truncate max-w-[120px]">{user.name}</span>
                  </div>
                  <span className="text-slate-900">{user.points}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 text-center">
            <button
              onClick={() => setShowPinModal(true)}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
              <span>Có mã phòng thi từ giáo viên?</span>
              <span className="text-sky-600 font-semibold">Nhập PIN →</span>
            </button>
          </div>
        </div>
      </div>

      <QuickPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
      />

      {/* Level Tier Explanation Modal */}
      {showLevelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-lg w-full shadow-xl space-y-4 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Hệ Thống 5 Cấp Bậc Năng Lực Số NEXA
                </h3>
              </div>
              <button
                onClick={() => setShowLevelModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-500 leading-relaxed text-[11px]">
              Cấp bậc phản ánh mức độ thành thạo thực tế của người học qua các bài khảo thí chuẩn hóa, thực hành nộp minh chứng và đóng góp cho cộng đồng.
            </p>

            {/* 5 Levels table */}
            <div className="space-y-2">
              {[
                { level: 1, name: 'Khởi đầu', range: '0 - 99đ', desc: 'Bắt đầu làm quen và nhận thức các thao tác số căn bản.' },
                { level: 2, name: 'Cơ bản', range: '100 - 199đ', desc: 'Sử dụng công cụ số thành thạo trong các tác vụ thông thường.' },
                { level: 3, name: 'Thành thạo', range: '200 - 299đ', desc: 'Độc lập giải quyết vấn đề, xử lý dữ liệu và an toàn thông tin.', isCurrent: true },
                { level: 4, name: 'Chuyên gia', range: '300 - 399đ', desc: 'Làm việc cùng AI, tự động hóa quy trình và bảo mật nâng cao.' },
                { level: 5, name: 'Bậc thầy', range: '400+ đ', desc: 'Cố vấn, xây dựng giải pháp số và đóng góp học liệu chuẩn hóa.' },
              ].map((tier) => (
                <div
                  key={tier.level}
                  className={`p-2.5 rounded-md border flex items-start justify-between gap-3 text-xs ${
                    tier.isCurrent
                      ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        Cấp {tier.level}: {tier.name}
                      </span>
                      {tier.isCurrent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                          Vị trí của bạn
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{tier.desc}</div>
                  </div>
                  <span className="font-bold text-slate-700 text-[11px] shrink-0">
                    {tier.range}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
              Bạn đang có <strong className="font-bold text-emerald-950">240 điểm</strong> (Cấp 3: Thành thạo). Còn thiếu <strong className="font-bold text-emerald-950">60 điểm</strong> nữa để thăng cấp lên <strong className="font-bold">Cấp 4: Chuyên gia</strong>.
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowLevelModal(false)}
                className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
