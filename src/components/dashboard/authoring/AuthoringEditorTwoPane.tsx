'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ArrowRight,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  HelpCircle,
  Sparkles,
  Award,
  Library,
  Copy,
  UploadCloud,
  Link2,
  FileCode,
  Sliders,
  Scale,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  AuthoringAssessment,
  AuthoringQuestionItem,
  QuestionType,
  MCQOption,
} from '@/features/assessments/types/authoring-v2.types';
import { QuestionPickerDrawer } from './QuestionPickerDrawer';

interface AuthoringEditorTwoPaneProps {
  assessmentId: string;
}

export function AuthoringEditorTwoPane({ assessmentId }: AuthoringEditorTwoPaneProps) {
  const router = useRouter();
  const supabase = createClient();

  const [assessment, setAssessment] = useState<AuthoringAssessment | null>(null);
  const [questions, setQuestions] = useState<AuthoringQuestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Scale & Auto-balancing
  // 100đ is international standard (DigComp % alignment), 10đ is traditional Vietnamese academic scale
  const [totalScale, setTotalScale] = useState<100 | 10>(100);

  // Autosave & Status
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Vừa xong');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drawer
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Dynamic point calculation: Equal distribution across all questions
  const questionCount = questions.length;
  const pointsPerQuestion =
    questionCount > 0 ? Number((totalScale / questionCount).toFixed(2)) : totalScale;

  // 1. Load Assessment & Items
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: asm, error: asmError } = await supabase
          .from('assessments')
          .select(`
            id,
            title,
            description,
            duration_minutes,
            passing_score,
            is_published,
            created_at,
            updated_at
          `)
          .eq('id', assessmentId)
          .single();

        if (asmError || !asm) throw new Error('Không tìm thấy đề đánh giá');

        // Fetch questions with item_options
        const { data: items, error: itemsError } = await supabase
          .from('assessment_items')
          .select(`
            id,
            prompt,
            type,
            points,
            order_index,
            rubric_guide,
            item_options (
              id,
              content,
              is_correct,
              explanation,
              order_index
            ),
            competencies (
              skill_code,
              competency_domains (
                code,
                title
              )
            )
          `)
          .eq('assessment_id', assessmentId)
          .order('order_index', { ascending: true });

        if (itemsError) throw itemsError;

        let parsedQuestions: AuthoringQuestionItem[] = [];
        if (items && items.length > 0) {
          parsedQuestions = items.map((item: any) => {
            const comp = Array.isArray(item.competencies) ? item.competencies[0] : item.competencies;
            const dom = Array.isArray(comp?.competency_domains)
              ? comp?.competency_domains[0]
              : comp?.competency_domains;

            const domainCode = dom?.code ? `0${dom.code}` : '01';

            let qType: QuestionType = 'MCQ';
            if (item.type === 'SCENARIO') qType = 'SCENARIO';
            if (
              item.type === 'PRACTICAL' ||
              item.type === 'DIGITAL_EVIDENCE' ||
              item.type === 'PRACTICAL_TASK' ||
              item.type === 'PRACTICAL_FILE'
            ) {
              qType = 'PRACTICAL';
            }

            const rawOptions = item.item_options || [];
            const sortedOptions = [...rawOptions].sort(
              (a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)
            );

            const options: MCQOption[] = sortedOptions.map((o: any) => ({
              id: o.id,
              text: o.content || '',
              isCorrect: !!o.is_correct,
              explanation: o.explanation || undefined,
            }));

            return {
              id: item.id,
              type: qType,
              prompt: item.prompt || '',
              points: item.points || 1,
              domainCode,
              domainTitle: dom?.title,
              practicalGuide: item.rubric_guide || '',
              options:
                qType !== 'PRACTICAL'
                  ? options.length > 0
                    ? options
                    : [
                        { id: 'opt-1', text: 'Phương án A', isCorrect: true },
                        { id: 'opt-2', text: 'Phương án B', isCorrect: false },
                      ]
                  : undefined,
            };
          });
        } else {
          // Default initial question if empty
          parsedQuestions = [
            {
              id: 'q-init-1',
              type: 'MCQ',
              prompt: 'Nội dung câu hỏi trắc nghiệm...',
              points: 50,
              domainCode: '01',
              options: [
                { id: 'opt-1', text: 'Lựa chọn A', isCorrect: true },
                { id: 'opt-2', text: 'Lựa chọn B', isCorrect: false },
                { id: 'opt-3', text: 'Lựa chọn C', isCorrect: false },
                { id: 'opt-4', text: 'Lựa chọn D', isCorrect: false },
              ],
            },
          ];
        }

        setAssessment({
          id: asm.id,
          code: `ASM-${asm.id.slice(0, 6).toUpperCase()}`,
          title: asm.title,
          description: asm.description || '',
          selectedDomains: [1],
          durationMinutes: asm.duration_minutes || 45,
          passingScore: Number(asm.passing_score) || 70,
          status: asm.is_published ? 'READY' : 'DRAFT',
          questions: parsedQuestions,
          createdAt: asm.created_at,
          updatedAt: asm.updated_at,
        });

        setQuestions(parsedQuestions);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Lỗi tải dữ liệu đề');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [assessmentId, supabase]);

  // 2. Autosave function with auto-balanced points
  const saveChanges = useCallback(
    async (itemsToSave: AuthoringQuestionItem[], scale: number = totalScale) => {
      setIsSaving(true);
      try {
        const count = itemsToSave.length;
        const autoPts = count > 0 ? Number((scale / count).toFixed(2)) : scale;

        // Automatically assign balanced points to each question
        const balancedItems = itemsToSave.map((q) => ({
          ...q,
          points: autoPts,
        }));

        const res = await fetch(`/api/personal/assessments/${assessmentId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalScale: scale,
            questions: balancedItems,
          }),
        });

        if (res.ok) {
          const d = new Date();
          const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d
            .getMinutes()
            .toString()
            .padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
          setLastSavedTime(timeStr);
        }
      } catch {
        // Silent fail for autosave, will retry
      } finally {
        setIsSaving(false);
      }
    },
    [assessmentId, totalScale]
  );

  // Switch total scale (100đ vs 10đ) and rebalance immediately
  const handleScaleChange = (newScale: 100 | 10) => {
    setTotalScale(newScale);
    saveChanges(questions, newScale);
  };

  // Question manipulation helpers
  const handleAddQuestion = (type: QuestionType) => {
    const newQ: AuthoringQuestionItem = {
      id: `q-${Date.now()}`,
      type,
      prompt:
        type === 'MCQ'
          ? 'Nhập câu hỏi trắc nghiệm mới...'
          : type === 'SCENARIO'
          ? 'Tình huống thực tế...'
          : 'Đề bài và yêu cầu thực hành...',
      points: pointsPerQuestion,
      domainCode: '01',
      options:
        type !== 'PRACTICAL'
          ? [
              { id: `opt-${Date.now()}-1`, text: 'Phương án A', isCorrect: true },
              { id: `opt-${Date.now()}-2`, text: 'Phương án B', isCorrect: false },
            ]
          : undefined,
      practicalGuide:
        type === 'PRACTICAL'
          ? 'Hướng dẫn chấm: Kiểm tra đầy đủ minh chứng nộp bài, tính chính xác và thẩm mỹ của sản phẩm.'
          : undefined,
    };

    setQuestions((prev) => {
      const updated = [...prev, newQ];
      saveChanges(updated);
      return updated;
    });
    setSelectedIndex(questions.length);
  };

  const handleDuplicateQuestion = (idx: number) => {
    const source = questions[idx];
    if (!source) return;

    const duplicated: AuthoringQuestionItem = {
      ...source,
      id: `q-dup-${Date.now()}`,
      prompt: `${source.prompt} (Bản sao)`,
      options: source.options?.map((opt) => ({
        ...opt,
        id: `opt-dup-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      })),
    };

    setQuestions((prev) => {
      const updated = [...prev.slice(0, idx + 1), duplicated, ...prev.slice(idx + 1)];
      saveChanges(updated);
      return updated;
    });
    setSelectedIndex(idx + 1);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('Đề đánh giá cần có tối thiểu 1 câu hỏi.');
      return;
    }

    setQuestions((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      saveChanges(updated);
      return updated;
    });

    if (selectedIndex >= questions.length - 1) {
      setSelectedIndex(Math.max(0, questions.length - 2));
    }
  };

  const handleMoveQuestion = (idx: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && idx === 0) return;
    if (direction === 'DOWN' && idx === questions.length - 1) return;

    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      saveChanges(copy);
      return copy;
    });
    setSelectedIndex(targetIdx);
  };

  // Update current question fields
  const currentQ = questions[selectedIndex];

  const updateCurrentQuestion = (updates: Partial<AuthoringQuestionItem>) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[selectedIndex] = { ...copy[selectedIndex], ...updates };
      saveChanges(copy);
      return copy;
    });
  };

  // Option handlers for MCQ
  const handleAddOption = () => {
    if (!currentQ) return;
    const currentOpts = currentQ.options || [];
    const newOption: MCQOption = {
      id: `opt-${Date.now()}`,
      text: `Phương án mới ${String.fromCharCode(65 + currentOpts.length)}`,
      isCorrect: false,
    };
    updateCurrentQuestion({ options: [...currentOpts, newOption] });
  };

  const handleUpdateOption = (optId: string, updates: Partial<MCQOption>) => {
    if (!currentQ) return;
    const currentOpts = currentQ.options || [];
    const updated = currentOpts.map((o) => (o.id === optId ? { ...o, ...updates } : o));
    updateCurrentQuestion({ options: updated });
  };

  const handleSetCorrectOption = (optId: string) => {
    if (!currentQ) return;
    const currentOpts = currentQ.options || [];
    const updated = currentOpts.map((o) => ({
      ...o,
      isCorrect: o.id === optId,
    }));
    updateCurrentQuestion({ options: updated });
  };

  const handleDeleteOption = (optId: string) => {
    if (!currentQ) return;
    const currentOpts = currentQ.options || [];
    if (currentOpts.length <= 2) {
      alert('Câu hỏi trắc nghiệm cần tối thiểu 2 phương án.');
      return;
    }
    const updated = currentOpts.filter((o) => o.id !== optId);
    updateCurrentQuestion({ options: updated });
  };

  if (loading) {
    return (
      <div className="py-32 text-center text-xs text-slate-500">
        Đang mở trình biên soạn câu hỏi...
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/personal/authoring"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            title="Quay lại danh sách đề"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                {assessment?.title || 'Đề đánh giá'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                {assessment?.code}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                Bản nháp
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isSaving ? 'Đang lưu tự động...' : `Đã lưu tự động lúc ${lastSavedTime}`}
            </div>
          </div>
        </div>

        {/* Right actions: Scale Selector + Tools + Next */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* Scale Setting: 100đ vs 10đ with Auto-balance */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-850 border border-slate-200/90 dark:border-zinc-800">
            <span className="text-[10px] font-medium text-slate-500 pl-1.5 pr-0.5">Thang điểm:</span>
            <button
              type="button"
              onClick={() => handleScaleChange(100)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                totalScale === 100
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-neutral-800 dark:text-zinc-400'
              }`}
              title="Thang 100 điểm chuẩn quốc tế (Khuyên dùng cho DigComp)"
            >
              100đ <span className="text-[9px] font-normal opacity-80">(Chuẩn)</span>
            </button>
            <button
              type="button"
              onClick={() => handleScaleChange(10)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                totalScale === 10
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-neutral-800 dark:text-zinc-400'
              }`}
              title="Thang 10 điểm truyền thống"
            >
              10đ
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Library className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Chọn câu có sẵn</span>
          </button>

          <Link
            href={`/personal/authoring/${assessmentId}/preview`}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <span>Kiểm định &amp; Xem trước</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Main Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Pane: Question List Sidebar (4 cols) */}
        <div className="lg:col-span-4 p-4 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-850">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Danh sách câu hỏi ({questions.length})
                </span>
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-0.5">
                <Scale className="w-3 h-3" />
                <span>Thang {totalScale}đ • Cân bằng tự động ({pointsPerQuestion}đ/câu)</span>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleAddQuestion('MCQ')}
                className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                title="Thêm câu trắc nghiệm"
              >
                <Plus className="w-3 h-3" />
                <span>Trắc nghiệm</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('PRACTICAL')}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                title="Thêm bài thực hành"
              >
                <Plus className="w-3 h-3" />
                <span>Thực hành</span>
              </button>
            </div>
          </div>

          {/* Question Cards List */}
          <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-500/20'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300'
                  }`}
                >
                  {/* Number pill */}
                  <span
                    className={`w-6 h-6 rounded-md font-mono text-[10px] font-bold flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400'
                    }`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Summary */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                        D{q.domainCode}
                      </span>
                      <span>•</span>
                      <span className="font-medium text-slate-500">
                        {q.type === 'MCQ' && 'Trắc nghiệm'}
                        {q.type === 'SCENARIO' && 'Tình huống'}
                        {q.type === 'PRACTICAL' && 'Thực hành'}
                      </span>
                      <span>•</span>
                      <span className="font-mono font-semibold text-slate-600 dark:text-zinc-400">
                        {pointsPerQuestion}đ
                      </span>
                    </div>

                    <p className="text-neutral-900 dark:text-neutral-100 font-medium line-clamp-1">
                      {q.prompt || 'Chưa nhập nội dung...'}
                    </p>
                  </div>

                  {/* Action buttons on item */}
                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveQuestion(idx, 'UP')}
                      className="p-1 text-slate-400 hover:text-neutral-700 disabled:opacity-20 cursor-pointer"
                      title="Chuyển lên"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === questions.length - 1}
                      onClick={() => handleMoveQuestion(idx, 'DOWN')}
                      className="p-1 text-slate-400 hover:text-neutral-700 disabled:opacity-20 cursor-pointer"
                      title="Chuyển xuống"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateQuestion(idx)}
                      className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                      title="Nhân bản"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Xóa câu"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Question Detail Editor or Empty State (8 cols) */}
        {currentQ ? (
          <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
            {/* Meta bar for current question */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-slate-100 dark:border-zinc-850">
              {/* Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Loại câu hỏi</label>
                <select
                  value={currentQ.type}
                  onChange={(e) => updateCurrentQuestion({ type: e.target.value as QuestionType })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-neutral-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="MCQ">Trắc nghiệm một lựa chọn đúng</option>
                  <option value="SCENARIO">Câu hỏi tình huống số</option>
                  <option value="PRACTICAL">Bài tập thực hành kỹ năng số</option>
                </select>
              </div>

              {/* Domain */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Miền năng lực số</label>
                <select
                  value={currentQ.domainCode}
                  onChange={(e) => updateCurrentQuestion({ domainCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-neutral-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="01">Miền 01: Dữ liệu &amp; Thông tin</option>
                  <option value="02">Miền 02: Giao tiếp &amp; Hợp tác</option>
                  <option value="03">Miền 03: Sáng tạo Nội dung &amp; AI</option>
                  <option value="04">Miền 04: An toàn &amp; Bảo mật</option>
                  <option value="05">Miền 05: Giải quyết Vấn đề</option>
                </select>
              </div>

              {/* Points (Auto-balanced, no manual input needed) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Điểm câu hỏi</label>
                <div className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {pointsPerQuestion} điểm
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Tự động chia đều ({totalScale}đ/{questionCount} câu)
                  </span>
                </div>
              </div>
            </div>

            {/* Scenario context if scenario */}
            {currentQ.type === 'SCENARIO' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200">
                  Bối cảnh tình huống thực tế
                </label>
                <textarea
                  value={currentQ.scenarioContext || ''}
                  onChange={(e) => updateCurrentQuestion({ scenarioContext: e.target.value })}
                  rows={3}
                  placeholder="Mô tả hoàn cảnh thực tế, dữ liệu và tình huống phát sinh cần người học xử lý..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Prompt textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200">
                {currentQ.type === 'PRACTICAL' ? 'Nhiệm vụ & Đề bài thực hành' : 'Nội dung câu hỏi / Yêu cầu'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={currentQ.prompt}
                onChange={(e) => updateCurrentQuestion({ prompt: e.target.value })}
                rows={4}
                placeholder={
                  currentQ.type === 'PRACTICAL'
                    ? 'Ví dụ: Tạo bảng tính Excel quản lý ngân sách tháng, sử dụng hàm SUM, AVERAGE và vẽ biểu đồ hình cột so sánh các khoản chi. Tải lên tệp kết quả hoặc liên kết Drive...'
                    : 'Nhập nội dung câu hỏi chi tiết...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* MCQ / Scenario Options Builder */}
            {currentQ.type !== 'PRACTICAL' && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-850">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                      Các phương án lựa chọn
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Đánh dấu vào nút tròn bên cạnh phương án để chọn đáp án đúng duy nhất.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm phương án</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(currentQ.options || []).map((opt, optIdx) => (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                        opt.isCorrect
                          ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      {/* Radio button for correct answer */}
                      <button
                        type="button"
                        onClick={() => handleSetCorrectOption(opt.id)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          opt.isCorrect
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 dark:border-zinc-700 hover:border-slate-400'
                        }`}
                        title={opt.isCorrect ? 'Đáp án đúng' : 'Đánh dấu đáp án đúng'}
                      >
                        {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <span className="font-mono text-xs font-bold text-slate-500">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleUpdateOption(opt.id, { text: e.target.value })}
                        placeholder={`Nội dung phương án ${String.fromCharCode(65 + optIdx)}...`}
                        className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => handleDeleteOption(opt.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa phương án"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practical Task View (Clean, No Complicated Rubric Tables) */}
            {currentQ.type === 'PRACTICAL' && (
              <div className="space-y-5 pt-2 border-t border-slate-100 dark:border-zinc-850">
                {/* 1. Accepted submission formats */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                    Hình thức nộp bài minh chứng của học viên
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 flex items-center gap-2.5">
                      <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          Tệp tin đính kèm
                        </div>
                        <div className="text-[10px] text-slate-400">PDF, Excel, Word, Hình ảnh</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 flex items-center gap-2.5">
                      <Link2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          Liên kết trực tuyến
                        </div>
                        <div className="text-[10px] text-slate-400">Google Drive, GitHub, URL</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 flex items-center gap-2.5">
                      <FileCode className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          Văn bản trực tiếp
                        </div>
                        <div className="text-[10px] text-slate-400">Nhập bài làm và giải trình</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Evaluation / Solution Guide for Evaluator */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200">
                      Hướng dẫn chấm điểm / Đáp án mẫu (Ghi chú đánh giá)
                    </label>
                    <span className="text-[10px] text-slate-400">Dành cho người chấm &amp; AI đối chiếu</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Ghi chú các tiêu chuẩn cần kiểm tra hoặc đáp án chuẩn để đối chiếu nhanh khi xem xét bài nộp của học viên (không bắt buộc nhập ma trận tiêu chí).
                  </p>
                  <textarea
                    value={currentQ.practicalGuide || ''}
                    onChange={(e) => updateCurrentQuestion({ practicalGuide: e.target.value })}
                    rows={4}
                    placeholder="Ví dụ: - Bảng tính có đủ các cột: Khoản chi, Số tiền, Ngày chi
- Áp dụng đúng công thức SUM và AVERAGE
- Biểu đồ trực quan, định dạng rõ ràng"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
              <FileText className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Chưa có câu hỏi nào trong đề
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto mt-1">
                Hãy bắt đầu bằng cách thêm câu hỏi trắc nghiệm, bài tập thực hành hoặc nhập nhanh từ ngân hàng câu hỏi có sẵn.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleAddQuestion('MCQ')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm câu trắc nghiệm</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('PRACTICAL')}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 text-neutral-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm bài thực hành</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Library className="w-4 h-4 text-blue-600" />
                <span>Chọn câu có sẵn</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Question Picker Drawer (Screen 04) */}
      <QuestionPickerDrawer
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onImportQuestions={(imported) => {
          setQuestions((prev) => {
            const updated = [...prev, ...imported];
            saveChanges(updated);
            return updated;
          });
          setSelectedIndex(questions.length);
        }}
      />
    </div>
  );
}
