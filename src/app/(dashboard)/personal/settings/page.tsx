'use client';

import { useState } from 'react';
import {
  Bell,
  Eye,
  CheckCircle2,
  Save,
} from 'lucide-react';

export default function LearnerSettingsPage() {
  const [isSaved, setIsSaved] = useState(false);

  // Privacy options
  const [publicCredentials, setPublicCredentials] = useState(true);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [shareSkillBadges, setShareSkillBadges] = useState(true);

  // Notification options
  const [notifyNewAssessment, setNotifyNewAssessment] = useState(true);
  const [notifyDeadline24h, setNotifyDeadline24h] = useState(true);
  const [notifyAiAnalysisReady, setNotifyAiAnalysisReady] = useState(true);


  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              TÙY CHỈNH TÀI KHOẢN
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cài Đặt Cá Nhân
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị quyền riêng tư chứng chỉ số, hiển thị trên bảng xếp hạng và tùy chọn nhận thông báo khảo thí.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Save className="w-4 h-4" strokeWidth={2} />
          <span>Lưu cài đặt</span>
        </button>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Cài đặt cá nhân đã được lưu thành công.</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: Privacy & Credential Public Visibility */}
        <div className="p-5 rounded-md border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Eye className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900">
              1. Quyền Riêng Tư &amp; Hiển Thị Chứng Chỉ
            </h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">
                  Cho phép tra cứu chứng chỉ qua mã QR công khai (/verify/[id])
                </div>
                <div className="text-[11px] text-slate-500">
                  Nhà tuyển dụng hoặc đơn vị thẩm định có thể quét mã QR trên chứng chỉ PDF để kiểm chứng tính xác thực
                </div>
              </div>
              <input
                type="checkbox"
                checked={publicCredentials}
                onChange={(e) => setPublicCredentials(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">
                  Hiển thị điểm số &amp; danh hiệu trên Bảng Xếp Hạng cộng đồng
                </div>
                <div className="text-[11px] text-slate-500">
                  Nếu tắt, tên của bạn sẽ được ẩn danh dạng &ldquo;Người học #NX-8821&rdquo; trên bảng xếp hạng
                </div>
              </div>
              <input
                type="checkbox"
                checked={showOnLeaderboard}
                onChange={(e) => setShowOnLeaderboard(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">
                  Chia sẻ huy hiệu năng lực số chuẩn hóa
                </div>
                <div className="text-[11px] text-slate-500">
                  Cho phép xuất liên kết công khai các huy hiệu miền năng lực bạn đã hoàn thành chuẩn đạt
                </div>
              </div>
              <input
                type="checkbox"
                checked={shareSkillBadges}
                onChange={(e) => setShareSkillBadges(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </label>
          </div>
        </div>

        {/* Section 2: Notifications */}
        <div className="p-5 rounded-md border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Bell className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900">
              2. Tùy Chọn Nhận Thông Báo
            </h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">
                  Thông báo khi có bài khảo thí mới trong nhóm
                </div>
                <div className="text-[11px] text-slate-500">
                  Nhận email và chuông thông báo khi người đánh giá giao đợt kiểm tra mới
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyNewAssessment}
                onChange={(e) => setNotifyNewAssessment(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">
                  Nhắc nhở hạn chót nộp bài trước 24 giờ
                </div>
                <div className="text-[11px] text-slate-500">
                  Tránh trễ hạn đối với các bài tập thực hành yêu cầu nộp tệp hoặc minh chứng
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyDeadline24h}
                onChange={(e) => setNotifyDeadline24h(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">
                  Thông báo kết quả chấm điểm &amp; phân tích lộ trình từ AI
                </div>
                <div className="text-[11px] text-slate-500">
                  Nhận kết quả phân tích khoảng trống năng lực (&lt; 60%) ngay khi quá trình hoàn tất
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyAiAnalysisReady}
                onChange={(e) => setNotifyAiAnalysisReady(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors shadow-xs"
          >
            Lưu cài đặt tài khoản
          </button>
        </div>
      </form>
    </div>
  );
}
