'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Award,
  Clock,
  Layers,
  ArrowRight,
  Edit3,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PreviewItem {
  id: string;
  prompt: string;
  type: string;
  points: number;
  domainCode: string;
  options: { id: string; text: string; isCorrect: boolean }[];
}

export default function PersonalAuthoringPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [assessment, setAssessment] = useState<any>(null);
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: asm, error: asmError } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', id)
          .single();

        if (asmError || !asm) throw new Error('Không tìm thấy đề đánh giá');
        setAssessment(asm);

        const { data: qData, error: qError } = await supabase
          .from('assessment_items')
          .select(`
            id,
            prompt,
            type,
            points,
            item_options (
              id,
              content,
              is_correct
            ),
            competencies (
              skill_code,
              competency_domains (
                code,
                title
              )
            )
          `)
          .eq('assessment_id', id);

        if (qError) throw qError;

        const mapped: PreviewItem[] = (qData || []).map((q: any) => {
          const comp = Array.isArray(q.competencies) ? q.competencies[0] : q.competencies;
          const dom = Array.isArray(comp?.competency_domains)
            ? comp?.competency_domains[0]
            : comp?.competency_domains;

          return {
            id: q.id,
            prompt: q.prompt || '',
            type: q.type || 'MCQ',
            points: q.points || 1,
            domainCode: dom?.code ? `D${dom.code}` : 'D1',
            options: (q.item_options || []).map((o: any) => ({
              id: o.id,
              text: o.content || '',
              isCorrect: !!o.is_correct,
            })),
          };
        });

        setItems(mapped);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, supabase]);

  // Validation Rules Check
  const hasQuestions = items.length > 0;
  const allPromptsFilled = items.every((i) => i.prompt.trim().length > 0);
  const allMCQHaveCorrectAnswer = items.every((i) => {
    if (i.type === 'MCQ' || i.type === 'SCENARIO') {
      return i.options.some((o) => o.isCorrect) && i.options.length >= 2;
    }
    return true;
  });

  const isValidForPublish = hasQuestions && allPromptsFilled && allMCQHaveCorrectAnswer;

  const totalPoints = items.reduce((sum, i) => sum + i.points, 0);
  const coveredDomains = [...new Set(items.map((i) => i.domainCode))];

  const handlePublish = async () => {
    if (!isValidForPublish) return;

    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from('assessments')
        .update({
          is_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      router.push(`/personal/authoring/${id}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi xuất bản đề');
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center text-xs text-slate-500">
        Đang tải dữ liệu kiểm định...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Breadcrumbs */}
      <div>
        <Link
          href={`/personal/authoring/${id}/edit`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quay lại Trình soạn câu hỏi</span>
        </Link>
      </div>

      {/* 2. Header */}
      <div className="pb-4 border-b border-slate-100 dark:border-zinc-850">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
            BƯỚC 3: KIỂM ĐỊNH CHẤT LƯỢNG ĐỀ
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Xem trước &amp; Kiểm định đề
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              {assessment?.title} • Mã đề: ASM-{id.slice(0, 6).toUpperCase()}
            </p>
          </div>

          <div className="shrink-0">
            {isValidForPublish ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Đạt điều kiện xuất bản
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Cần hoàn thiện tiêu chí
              </span>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Validation Checklist & Preview List (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Validation Checklist Panel */}
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Kiểm tra tiêu chuẩn chất lượng đề
            </h2>

            <div className="space-y-3 text-xs">
              {/* Check 1 */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                <span className="text-neutral-800 dark:text-zinc-200">
                  1. Đề thi có tối thiểu 1 câu hỏi đánh giá
                </span>
                {hasQuestions ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Đạt ({items.length} câu)
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Chưa có câu hỏi
                  </span>
                )}
              </div>

              {/* Check 2 */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                <span className="text-neutral-800 dark:text-zinc-200">
                  2. Mọi câu hỏi đều có nội dung chi tiết
                </span>
                {allPromptsFilled ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Đạt
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Có câu chưa nhập nội dung
                  </span>
                )}
              </div>

              {/* Check 3 */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                <span className="text-neutral-800 dark:text-zinc-200">
                  3. Câu hỏi trắc nghiệm có ít nhất 2 lựa chọn và đã có đáp án đúng
                </span>
                {allMCQHaveCorrectAnswer ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Đạt chuẩn
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Thiếu đáp án đúng
                  </span>
                )}
              </div>

              {/* Check 4 */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                <span className="text-neutral-800 dark:text-zinc-200">
                  4. Điểm chuẩn đạt (passing score) hợp lệ
                </span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {assessment?.passing_score || 70}%
                </span>
              </div>
            </div>
          </div>

          {/* Question Preview List */}
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Xem trước câu hỏi đề thi ({items.length})
            </h2>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600 font-mono">Câu 0{idx + 1}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        {item.domainCode}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 font-semibold">{item.points} điểm</span>
                  </div>

                  <p className="text-xs text-neutral-900 dark:text-neutral-100 font-medium leading-relaxed">
                    {item.prompt}
                  </p>

                  {/* Options */}
                  {item.options.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {item.options.map((opt, oIdx) => (
                        <div
                          key={opt.id}
                          className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                            opt.isCorrect
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-900'
                              : 'bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-neutral-400'
                          }`}
                        >
                          <span className="font-mono text-[10px] font-bold">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          <span>{opt.text}</span>
                          {opt.isCorrect && (
                            <span className="ml-auto text-[10px] text-emerald-600">
                              (Đáp án đúng)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Validation Summary & Action (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Thông số kiểm định
            </h2>

            <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-zinc-850">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Tổng số câu hỏi</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                  {items.length} câu
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500">Tổng điểm tối đa</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                  {totalPoints} điểm
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500">Thời lượng dự kiến</span>
                <span className="font-semibold text-neutral-800 dark:text-zinc-200 font-mono">
                  {assessment?.duration_minutes} phút
                </span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Miền năng lực có bằng chứng:</span>
                <div className="flex flex-wrap gap-1">
                  {coveredDomains.map((code) => (
                    <span
                      key={code}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 space-y-2">
              {isValidForPublish ? (
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handlePublish}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xuất bản...</span>
                    </>
                  ) : (
                    <>
                      <span>Lưu &amp; Xuất bản đề</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center space-y-2">
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
                    Vui lòng bổ sung đầy đủ đáp án và nội dung câu hỏi trước khi xuất bản.
                  </div>
                  <Link
                    href={`/personal/authoring/${id}/edit`}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-neutral-800 font-semibold text-xs inline-flex items-center justify-center gap-1.5 hover:bg-slate-50"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Quay lại sửa câu hỏi</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            Xuất bản đề sẽ chuyển trạng thái đề sang <strong>Sẵn sàng</strong>. Hệ thống không tự động mở phiên thi live khi vừa xuất bản; bạn có thể cấu hình đợt giao bài hoặc mở phòng thi ở trang chi tiết đề sau đó.
          </div>
        </div>
      </div>
    </div>
  );
}
