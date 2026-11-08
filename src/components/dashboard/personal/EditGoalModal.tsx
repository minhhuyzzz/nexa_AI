'use client';

import { useState } from 'react';
import { X, Target, Check, Sparkles, Clock, Compass } from 'lucide-react';

export interface UserLearningGoal {
  title: string;
  track: string;
  pace: string;
}

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: UserLearningGoal;
  onSave: (updatedGoal: UserLearningGoal) => Promise<void>;
}

const PRESET_GOALS = [
  'Nâng cao kỹ năng sử dụng công nghệ trong học tập và công việc',
  'Chuẩn bị thi sát hạch Chứng chỉ Năng lực số Quốc gia',
  'Bồi dưỡng kỹ năng An toàn thông tin & Bảo mật dữ liệu',
  'Phát triển năng lực xử lý dữ liệu số và ứng dụng AI',
  'Thành thạo giao tiếp số và cộng tác trực tuyến chuyên nghiệp',
];

const TRACK_OPTIONS = [
  { id: 'Lộ trình cơ bản', label: 'Lộ trình cơ bản', desc: 'Xây dựng nền tảng vững chắc theo 5 miền' },
  { id: 'Lộ trình chuyên sâu', label: 'Lộ trình chuyên sâu', desc: 'Tập trung bồi dưỡng nâng cao và giải quyết vấn đề' },
  { id: 'Lộ trình ôn thi', label: 'Lộ trình ôn thi', desc: 'Rèn luyện tình huống hướng đến kỳ thi sát hạch' },
];

const PACE_OPTIONS = [
  { id: 'Học theo tốc độ riêng', label: 'Linh hoạt', desc: 'Học tự do không gò bó thời gian' },
  { id: '15 phút mỗi ngày', label: '15 phút / ngày', desc: 'Mục tiêu nhẹ nhàng, duy trì chuỗi học tập' },
  { id: '30 phút mỗi ngày', label: '30 phút / ngày', desc: 'Tăng tốc phát triển kỹ năng nhanh chóng' },
];

export function EditGoalModal({
  isOpen,
  onClose,
  currentGoal,
  onSave,
}: EditGoalModalProps) {
  const [title, setTitle] = useState(currentGoal.title);
  const [track, setTrack] = useState(currentGoal.track);
  const [pace, setPace] = useState(currentGoal.pace);
  const [isSaving, setIsSaving] = useState(false);
  const [customInputActive, setCustomInputActive] = useState(
    !PRESET_GOALS.includes(currentGoal.title)
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        track,
        pace,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save learning goal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 max-w-lg w-full shadow-xl space-y-5 text-xs text-neutral-800 dark:text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Target className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Thiết Lập Mục Tiêu Học Tập
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Tùy chỉnh định hướng và nhịp học phù hợp với kế hoạch cá nhân
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Chọn hoặc nhập định hướng mục tiêu */}
          <div className="space-y-2">
            <label className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>1. Định hướng mục tiêu chính</span>
            </label>

            {!customInputActive ? (
              <div className="space-y-1.5">
                {PRESET_GOALS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTitle(preset)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      title === preset
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold'
                        : 'border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 hover:bg-slate-100/60 text-neutral-800 dark:text-zinc-200'
                    }`}
                  >
                    <span className="truncate">{preset}</span>
                    {title === preset && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomInputActive(true)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline pt-1 cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Hoặc tự nhập mục tiêu theo ý bạn &rarr;</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <textarea
                  rows={2}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập mục tiêu học tập của bạn..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs focus:border-blue-600 dark:focus:border-blue-400 focus:outline-none leading-relaxed"
                />
                <button
                  type="button"
                  onClick={() => setCustomInputActive(false)}
                  className="text-[11px] text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-200 cursor-pointer underline"
                >
                  Chọn từ danh sách gợi ý sẵn
                </button>
              </div>
            )}
          </div>

          {/* 2. Chọn hình thức lộ trình */}
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-900 dark:text-neutral-100">
              2. Loại hình lộ trình
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TRACK_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTrack(opt.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    track === opt.id
                      ? 'border-blue-600 dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold'
                      : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="text-[11px] font-semibold">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Chọn nhịp độ học tập */}
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>3. Nhịp độ học tập</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PACE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPace(opt.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    pace === opt.id
                      ? 'border-blue-600 dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold'
                      : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="text-[11px] font-semibold">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-medium transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu mục tiêu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
