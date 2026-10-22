'use client';

import { useState } from 'react';
import { X, MessageSquare, Star, CheckCircle2, Send } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('ui');
  const [content, setContent] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setContent('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xl max-w-md w-full p-6 text-slate-900 dark:text-zinc-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-850">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-850">
              <MessageSquare className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Đóng góp ý kiến</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Giúp chúng tôi hoàn thiện nền tảng NEXA tốt hơn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-10 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Cảm ơn bạn đã đóng góp!</h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Ý kiến của bạn đã được ghi nhận và gửi đến ban phát triển.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Star Rating */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                Mức độ hài lòng của bạn
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 rounded hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200 dark:text-zinc-700'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-slate-500 dark:text-zinc-400 ml-2">
                  {rating === 5
                    ? 'Rất hài lòng'
                    : rating === 4
                    ? 'Hài lòng'
                    : rating === 3
                    ? 'Bình thường'
                    : 'Cần cải thiện'}
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                Chủ đề góp ý
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'ui', label: 'Giao diện & Trải nghiệm' },
                  { id: 'assessment', label: 'Nội dung bài thi' },
                  { id: 'speed', label: 'Tốc độ phản hồi' },
                  { id: 'other', label: 'Ý tưởng / Đề xuất mới' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-2 rounded-lg text-left text-xs transition-colors border ${
                      category === cat.id
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300 font-medium'
                        : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100/60 dark:hover:bg-zinc-850'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Textarea */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                Chi tiết ý kiến của bạn
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chia sẻ cảm nhận, lỗi bạn gặp phải hoặc điều bạn muốn cải thiện..."
                rows={4}
                required
                className="w-full text-xs text-slate-900 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 p-3 focus:bg-white dark:focus:bg-zinc-900 focus:border-sky-500 focus:outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={!content.trim()}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi góp ý</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default FeedbackModal;
