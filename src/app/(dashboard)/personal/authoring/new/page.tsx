'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ArrowRight,
  Layers,
  AlertCircle,
  Loader2,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const DOMAIN_OPTIONS = [
  { id: 1, code: 'D1', title: 'Thông tin & Dữ liệu' },
  { id: 2, code: 'D2', title: 'Giao tiếp & Hợp tác' },
  { id: 3, code: 'D3', title: 'Sáng tạo Nội dung & AI' },
  { id: 4, code: 'D4', title: 'An toàn & Bảo mật' },
  { id: 5, code: 'D5', title: 'Giải quyết Vấn đề' },
];

export default function PersonalNewAssessmentPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<number[]>([1]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleDomain = (id: number) => {
    setSelectedDomains((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((d) => d !== id)
          : prev
        : [...prev, id]
    );
  };

  const trimmedTitle = title.trim();
  const previewTitle = trimmedTitle || 'Đề Đánh Giá Kỹ Năng Số';
  const previewMonogram = (trimmedTitle ? trimmedTitle[0] : 'D').toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedTitle || trimmedTitle.length < 2) {
      setErrorMessage('Vui lòng nhập tên đề đánh giá tối thiểu 2 ký tự');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/personal/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim(),
          domain_codes: selectedDomains.map((d) => `0${d}`),
          duration_minutes: 45,
          passing_score: 70,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Khởi tạo đề đánh giá thất bại');
      }

      // Navigate to Step 2: Edit questions (Two-pane editor)
      router.push(`/personal/authoring/${data.assessment.id}/edit`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi hệ thống khi khởi tạo đề');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Breadcrumb navigation */}
      <div>
        <Link
          href="/personal/authoring"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quay lại Đề đánh giá của tôi</span>
        </Link>
      </div>

      {/* 2. Header */}
      <div className="pb-4 border-b border-slate-100 dark:border-zinc-850">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
            BƯỚC 1: KHỞI TẠO NỘI DUNG ĐỀ
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Khởi tạo đề đánh giá mới
        </h1>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
          Đặt tên đề, mục tiêu và phạm vi năng lực số trước khi bước vào soạn chi tiết câu hỏi.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Main 2-column layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Form (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
          {/* Tên đề */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1.5">
              Tên đề đánh giá <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đánh giá Kỹ năng số K48 - Chuyên đề D1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <span className="block text-[10px] text-slate-400 dark:text-neutral-500 mt-1">
              Tên ngắn gọn, rõ ràng giúp người học và học viên dễ nhận diện khi làm bài.
            </span>
          </div>

          {/* Mô tả & mục tiêu */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1.5">
              Mục tiêu &amp; Mô tả ngắn
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="VD: Bài khảo thí đo lường kỹ năng thông tin, dữ liệu và văn phòng số theo chuẩn DigComp."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Phạm vi miền năng lực số */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-2">
              Phạm vi miền năng lực số
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DOMAIN_OPTIONS.map((dom) => {
                const isChecked = selectedDomains.includes(dom.id);
                return (
                  <button
                    key={dom.id}
                    type="button"
                    onClick={() => toggleDomain(dom.id)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isChecked
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-neutral-900 dark:text-neutral-100'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-neutral-400 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 mr-2">
                        {dom.code}
                      </span>
                      <span className="text-xs font-medium">{dom.title}</span>
                    </div>
                    {isChecked && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
            <span className="block text-[10px] text-slate-400 dark:text-neutral-500 mt-2">
              Có thể chọn từ 1 đến 5 miền tùy mục tiêu bài thi; không ép buộc đề phải bao phủ đủ cả 5 miền.
            </span>
          </div>

          {/* Submit action */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between">
            <Link
              href="/personal/authoring"
              className="text-xs text-slate-500 hover:text-neutral-900 dark:hover:text-white"
            >
              Hủy bỏ
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <>
                  <span>Tiếp tục: Biên soạn câu hỏi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Live Preview Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
              XEM TRƯỚC THÔNG TIN ĐỀ
            </h3>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white font-extrabold text-base flex items-center justify-center shrink-0">
                {previewMonogram}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {previewTitle}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  MÃ ĐỀ: ASM-DRAFT
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs divide-y divide-slate-100 dark:divide-zinc-850">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 dark:text-neutral-400">Trạng thái</span>
                <span className="font-semibold text-slate-600 dark:text-neutral-300">Bản nháp</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 dark:text-neutral-400 block mb-1">Miền được chọn:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedDomains.map((id) => (
                    <span
                      key={id}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    >
                      D{id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 text-xs text-blue-800 dark:text-blue-300 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong>Thời gian thi và thời lượng:</strong> Bạn không cần bận tâm về thời gian ở bước này. Thời lượng làm bài và thời gian thi sẽ được thiết lập linh hoạt theo từng đợt thi (khi giao cho lớp hoặc khi mở phòng thi PIN) sau khi bạn đã soạn xong số lượng câu hỏi phù hợp.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
