'use client';

import { useState } from 'react';
import {
  Settings,
  CheckCircle2,
  Sliders,
  Bell,
  EyeOff,
  Zap,
  Save,
  MessageSquare,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';

export default function EvaluatorSettingsPage() {
  const [isSaved, setIsSaved] = useState(false);

  // Grading desk preferences
  const [autoShowAiSuggestions, setAutoShowAiSuggestions] = useState(true);
  const [highlightEvidenceQuotes, setHighlightEvidenceQuotes] = useState(true);
  const [anonymousGrading, setAnonymousGrading] = useState(false);
  const [divergenceAlert, setDivergenceAlert] = useState(true);

  // Notification preferences
  const [notifyOnSubmission, setNotifyOnSubmission] = useState(true);
  const [notifyOverdue48h, setNotifyOverdue48h] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);

  // Quick feedback snippets
  const [presets, setPresets] = useState([
    'Bài làm có cấu trúc dữ liệu rất rõ ràng, đáp ứng tốt tiêu chí thực hành.',
    'Cần bổ sung phần giải trình nguyên nhân và kiểm chứng chéo số liệu trước khi đưa ra kết luận.',
    'Lệnh Prompt đã có đầy đủ Role và Task, tuy nhiên cần làm rõ hơn Context để AI sinh kết quả tối ưu.',
  ]);
  const [newPreset, setNewPreset] = useState('');

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPreset.trim()) return;
    setPresets((prev) => [...prev, newPreset.trim()]);
    setNewPreset('');
  };

  const handleRemovePreset = (index: number) => {
    setPresets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              TÙY BIẾN KHẢO THÍ
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cài Đặt Người Đánh Giá
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập tùy chọn bàn làm việc chấm bài Rubric, chế độ chấm ẩn danh và thông báo nộp bài.
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
            <span>Cài đặt chuyên gia đã được lưu thành công.</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: Grading Desk Preferences */}
        <div className="p-5 rounded-md border border-slate-200 bg-white space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900">
              1. Tùy Chọn Bàn Chấm Bài Rubric (/evaluator/grading)
            </h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">
                  Tự động hiển thị gợi ý điểm Rubric từ AI khi người dùng yêu cầu
                </div>
                <div className="text-[11px] text-slate-500">
                  Khi bấm &ldquo;Chấm bài thực hành bằng AI&rdquo;, hiển thị thang điểm gợi ý kèm trích dẫn chứng cứ
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoShowAiSuggestions}
                onChange={(e) => setAutoShowAiSuggestions(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">
                  Tô nổi trích dẫn minh chứng (Evidence Quote) trong bài làm
                </div>
                <div className="text-[11px] text-slate-500">
                  Làm nổi bật đoạn văn bản hoặc ô tính mà AI đối chiếu với tiêu chí Rubric
                </div>
              </div>
              <input
                type="checkbox"
                checked={highlightEvidenceQuotes}
                onChange={(e) => setHighlightEvidenceQuotes(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">
                  Chế độ chấm ẩn danh (Blind Evaluation)
                </div>
                <div className="text-[11px] text-slate-500">
                  Ẩn tên và thông tin liên hệ của thí sinh khi chấm, chỉ hiển thị mã bài nộp ngẫu nhiên
                </div>
              </div>
              <input
                type="checkbox"
                checked={anonymousGrading}
                onChange={(e) => setAnonymousGrading(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">
                  Cảnh báo độ lệch điểm (Divergence Flag)
                </div>
                <div className="text-[11px] text-slate-500">
                  Hiện thông báo đối chiếu khi điểm tự chấm của bạn chênh lệch &gt; 15% so với điểm AI đề xuất
                </div>
              </div>
              <input
                type="checkbox"
                checked={divergenceAlert}
                onChange={(e) => setDivergenceAlert(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </label>
          </div>
        </div>

        {/* Section 2: Notifications */}
        <div className="p-5 rounded-md border border-slate-200 bg-white space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Bell className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900">2. Tùy Chọn Thông Báo</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">Thông báo khi có bài nộp mới</div>
                <div className="text-[11px] text-slate-500">Gửi thông báo trên hệ thống khi có thí sinh trong nhóm nộp bài thực hành</div>
              </div>
              <input
                type="checkbox"
                checked={notifyOnSubmission}
                onChange={(e) => setNotifyOnSubmission(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-slate-900">Nhắc nhở bài nộp chờ chấm quá 48 giờ</div>
                <div className="text-[11px] text-slate-500">Cảnh báo tồn đọng để đảm bảo phản hồi kịp thời cho người học</div>
              </div>
              <input
                type="checkbox"
                checked={notifyOverdue48h}
                onChange={(e) => setNotifyOverdue48h(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              />
            </label>
          </div>
        </div>

        {/* Section 3: Quick Feedback Presets */}
        <div className="p-5 rounded-md border border-slate-200 bg-white space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MessageSquare className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900">3. Mẫu Nhận Xét Chấm Bài Nhanh</h2>
          </div>

          <div className="space-y-2">
            {presets.map((preset, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 border border-slate-200/80 text-slate-700"
              >
                <span className="text-xs leading-relaxed">{preset}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePreset(idx)}
                  className="text-slate-400 hover:text-rose-600 text-xs px-2 shrink-0 font-medium"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Thêm nhận xét mẫu mới (Ví dụ: Định dạng tệp nộp chuẩn xác, xử lý logic tốt...)"
              value={newPreset}
              onChange={(e) => setNewPreset(e.target.value)}
              className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
            />
            <button
              type="button"
              onClick={handleAddPreset}
              className="px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shrink-0"
            >
              Thêm mẫu
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors shadow-xs"
          >
            Lưu cài đặt chuyên gia
          </button>
        </div>
      </form>
    </div>
  );
}
