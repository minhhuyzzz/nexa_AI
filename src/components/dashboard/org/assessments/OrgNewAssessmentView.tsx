'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
  Clock,
  Award,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const DOMAIN_OPTIONS = [
  { id: 1, code: 'D1', title: 'Thông tin & Dữ liệu' },
  { id: 2, code: 'D2', title: 'Giao tiếp & Hợp tác' },
  { id: 3, code: 'D3', title: 'Sáng tạo Nội dung & AI' },
  { id: 4, code: 'D4', title: 'An toàn & Bảo mật' },
  { id: 5, code: 'D5', title: 'Giải quyết Vấn đề' },
];

interface Props {
  orgId: string;
  orgName: string;
  slug: string;
}

export function OrgNewAssessmentView({ orgId, orgName, slug }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<number[]>([1, 2, 3, 4, 5]);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [passingScore, setPassingScore] = useState<number>(70);

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
  const previewTitle = trimmedTitle || 'Đề Khảo Thí Năng Lực Số Nội Bộ';
  const previewMonogram = (trimmedTitle ? trimmedTitle[0] : 'Đ').toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedTitle || trimmedTitle.length < 2) {
      setErrorMessage('Vui lòng nhập tên đề khảo thí tối thiểu 2 ký tự');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/personal/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: orgId,
          title: trimmedTitle,
          description: description.trim(),
          domain_codes: selectedDomains.map((d) => `0${d}`),
          duration_minutes: Number(durationMinutes) || 45,
          passing_score: Number(passingScore) || 70,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Khởi tạo đề khảo thí thất bại');
      }

      // Navigate to Step 2: Two-pane authoring editor for Org
      router.push(`/org/${slug}/assessments/${data.assessment.id}/edit`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi hệ thống khi khởi tạo đề');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* 1. Breadcrumb navigation */}
      <div>
        <Link
          href={`/org/${slug}/assessments`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quay lại Thư viện đề đánh giá</span>
        </Link>
      </div>

      {/* 2. Header */}
      <div className="pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Khởi tạo đề khảo thí mới
        </h1>
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
              Tên đề khảo thí <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Khảo sát Năng lực số Đầu khóa - Ngành CNTT"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <span className="block text-[10px] text-slate-400 dark:text-neutral-500 mt-1">
              Tên rõ ràng giúp thí sinh và các giám khảo dễ nhận diện trong danh mục đề nội bộ.
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
              placeholder="VD: Đánh giá trình độ công nghệ thông tin, văn phòng số và tư duy giải quyết vấn đề số cho sinh viên / học viên."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Thời lượng & Điểm chuẩn đạt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1.5">
                Thời lượng làm bài (phút)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">phút</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1.5">
                Điểm chuẩn đạt (thang 100)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">/ 100 điểm</span>
              </div>
            </div>
          </div>

          {/* Phạm vi 5 miền năng lực số */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-2">
              Phạm vi miền năng lực số khảo thí
            </label>
            <div className="space-y-2">
              {DOMAIN_OPTIONS.map((dm) => {
                const checked = selectedDomains.includes(dm.id);
                return (
                  <div
                    key={dm.id}
                    onClick={() => toggleDomain(dm.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                      checked
                        ? 'border-blue-500/70 bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400">
                        {dm.code}
                      </span>
                      <span className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                        {dm.title}
                      </span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                        checked
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 dark:border-zinc-700'
                      }`}
                    >
                      {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-between">
            <Link
              href={`/org/${slug}/assessments`}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              Hủy bỏ
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang khởi tạo đề...</span>
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

        {/* Right: Preview Card & Flow Information (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                XEM TRƯỚC THẺ ĐỀ KHẢO THÍ
              </span>
            </div>

            {/* Simulated Assessment Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/60 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-2xs shrink-0">
                  {previewMonogram}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Nội bộ tổ chức
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {orgName}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug">
                    {previewTitle}
                  </h3>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                {description.trim() || 'Chưa nhập mô tả mục tiêu đề thi...'}
              </p>

              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{durationMinutes} phút</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span>Đạt: {passingScore}/100</span>
                </div>
              </div>
            </div>

            {/* Workflow Explanatory Box */}
            <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Quy trình biên soạn 2 bước chuẩn hóa</span>
              </div>
              <ul className="text-[11px] text-blue-700/80 dark:text-blue-300/80 space-y-1 list-disc list-inside leading-relaxed">
                <li>Bước 1: Thiết lập tên đề, mục tiêu và phạm vi năng lực.</li>
                <li>Bước 2: Trình soạn 2 vùng với câu hỏi Trắc nghiệm &amp; Thực hành số.</li>
                <li>Học viên nộp file hoặc link sẽ tự động chuyển về <strong>Bàn chấm bài</strong>.</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
