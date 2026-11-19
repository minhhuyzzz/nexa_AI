'use client';

import { useState } from 'react';
import { X, MessageSquare, Star, CheckCircle2, Send, Loader2 } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'ui', label: 'Giao diện & Trải nghiệm', tag: 'UI/UX' },
  { id: 'assessment', label: 'Nội dung & Đề thi', tag: 'KHẢO THÍ' },
  { id: 'speed', label: 'Tốc độ & Hiệu năng', tag: 'HIỆU NĂNG' },
  { id: 'feature', label: 'Ý tưởng & Đề xuất mới', tag: 'TÍNH NĂNG' },
];

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('ui');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const activeCat = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
    const categoryEnum = category === 'assessment' ? 'CONTENT' : category === 'speed' ? 'BUG' : category === 'feature' ? 'FEATURE_REQUEST' : 'GENERAL';
    const cleanContent = content.trim();

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryEnum,
          subject: `[${rating}★] [${activeCat.tag}] ${cleanContent.slice(0, 45)}...`,
          content: `Đánh giá: ${rating}/5 sao\nDanh mục: ${activeCat.label}\n\nNội dung chi tiết:\n${cleanContent}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể gửi phản hồi lúc này');
      }

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setContent('');
        onClose();
      }, 1800);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi góp ý');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111114] rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-2xl max-w-md w-full p-6 sm:p-7 text-neutral-900 dark:text-neutral-100">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900 shadow-xs shrink-0">
              <MessageSquare className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Đóng góp ý kiến
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Cùng xây dựng nền tảng khảo thí số ngày một tốt hơn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-800 dark:text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {isSubmitted ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-8 h-8" strokeWidth={2} />
            </div>
            <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Cảm ơn ý kiến quý giá của bạn!
            </h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
              Ban quản trị nền tảng đã tiếp nhận và sẽ xem xét cải tiến trong các phiên bản cập nhật tới.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* 1. Mức độ hài lòng (1 - 5 sao) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                Mức độ hài lòng của bạn
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 transition-all ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400 scale-105'
                          : 'text-slate-200 dark:text-zinc-700'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-semibold font-mono text-slate-600 dark:text-neutral-400 ml-2">
                  {rating === 5
                    ? 'Rất hài lòng (5/5)'
                    : rating === 4
                    ? 'Hài lòng (4/5)'
                    : rating === 3
                    ? 'Bình thường (3/5)'
                    : rating === 2
                    ? 'Cần cải thiện (2/5)'
                    : 'Chưa hài lòng (1/5)'}
                </span>
              </div>
            </div>

            {/* 2. Chủ đề góp ý */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                Chủ đề góp ý
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-2.5 rounded-2xl text-left text-xs transition-all border cursor-pointer ${
                      category === cat.id
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                        : 'bg-slate-50 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-850'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Chi tiết nội dung */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                Nội dung ý kiến chi tiết
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chia sẻ trải nghiệm, lỗi gặp phải hoặc tính năng bạn muốn NEXA bổ sung..."
                rows={4}
                required
                className="w-full text-xs text-neutral-900 dark:text-neutral-100 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-3.5 focus:bg-white dark:focus:bg-[#111114] focus:border-blue-600 focus:outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-zinc-500 leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi góp ý</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default FeedbackModal;
