'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Layers,
  Sparkles,
  HelpCircle,
  Plus,
  Trash,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RubricBuilder } from '@/components/dashboard/assessments/RubricBuilder';
import { RubricDefinition } from '@/features/assessments/types/rubric.types';

interface OptionItem {
  id?: string;
  content: string;
  is_correct: boolean;
  explanation?: string;
}

export default function QuestionItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [itemCode, setItemCode] = useState('');
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'MCQ' | 'SCENARIO' | 'PRACTICAL_FILE' | 'DIGITAL_LINK'>('MCQ');
  const [domainId, setDomainId] = useState('D1');
  const [difficulty, setDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('INTERMEDIATE');
  const [defaultPoints, setDefaultPoints] = useState(10);
  const [subCompetenceCode, setSubCompetenceCode] = useState('1.1');
  const [status, setStatus] = useState<'DRAFT' | 'APPROVED' | 'ARCHIVED'>('APPROVED');

  const [options, setOptions] = useState<OptionItem[]>([
    { content: '', is_correct: true },
    { content: '', is_correct: false },
    { content: '', is_correct: false },
    { content: '', is_correct: false },
  ]);

  const [rubric, setRubric] = useState<RubricDefinition | null>(null);

  useEffect(() => {
    async function fetchQuestion() {
      if (id === 'new') {
        setItemCode(`QB-${Date.now().toString(36).toUpperCase()}`);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('question_bank_items')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          setErrorMessage('Không tìm thấy câu hỏi yêu cầu trong ngân hàng');
          setLoading(false);
          return;
        }

        setItemCode(data.code || `QB-${id.slice(0, 8).toUpperCase()}`);
        setPrompt(data.prompt || '');
        setType(data.type || 'MCQ');
        setDifficulty(data.difficulty_level || 'INTERMEDIATE');
        setDefaultPoints(data.default_points || 10);
        setStatus(data.status || 'APPROVED');

        if (Array.isArray(data.options) && data.options.length > 0) {
          setOptions(data.options);
        }

        if (data.rubric_definition) {
          setRubric(data.rubric_definition);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    }

    fetchQuestion();
  }, [id]);

  const handleSave = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Nội dung câu hỏi không được để trống');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const payload: Record<string, any> = {
        code: itemCode,
        prompt: prompt.trim(),
        type,
        difficulty_level: difficulty,
        default_points: Number(defaultPoints) || 10,
        status,
      };

      if (type === 'MCQ') {
        payload.options = options.filter((o) => o.content.trim().length > 0);
      } else {
        payload.options = null;
        if (rubric) {
          payload.rubric_definition = rubric;
        }
      }

      if (id === 'new') {
        const { data, error } = await supabase
          .from('question_bank_items')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setSaveSuccess(true);
        setTimeout(() => {
          router.push(`/personal/item-bank/${data.id}`);
        }, 1000);
      } else {
        const { error } = await supabase
          .from('question_bank_items')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  const handleOptionChange = (idx: number, field: keyof OptionItem, value: any) => {
    setOptions((prev) => {
      const copy = [...prev];
      if (field === 'is_correct' && value === true) {
        // Single correct choice
        copy.forEach((o, i) => {
          o.is_correct = i === idx;
        });
      } else {
        copy[idx] = { ...copy[idx], [field]: value };
      }
      return copy;
    });
  };

  const handleAddOption = () => {
    setOptions((prev) => [...prev, { content: '', is_correct: false }]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-xs">Đang tải dữ liệu câu hỏi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/personal/item-bank"
            className="p-2 rounded-md border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 transition-colors"
            title="Quay lại danh sách câu hỏi"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                {itemCode}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">
                {id === 'new' ? 'Tạo câu hỏi mới' : 'Biên soạn chi tiết câu hỏi'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              {prompt ? prompt.slice(0, 60) + (prompt.length > 60 ? '...' : '') : 'Chi tiết câu hỏi'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/personal/item-bank"
            className="px-4 py-2 rounded-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors"
          >
            Quay lại
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Lưu câu hỏi</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Câu hỏi đã được cập nhật thành công vào ngân hàng!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main 2-Pane Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Content Canvas */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide">
                Nội dung câu hỏi &amp; Yêu cầu khảo thí
              </label>
              <span className="text-[11px] text-slate-400 font-mono">Hỗ trợ Markdown &amp; KaTeX</span>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="Nhập nội dung câu hỏi, tình huống thực tế hoặc mô tả đề bài..."
              className="w-full p-3.5 text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md focus:border-blue-600 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Question Type Logic */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-3">
              <h2 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wide">
                {type === 'MCQ' ? 'Các phương án trả lời trắc nghiệm' : 'Thang tiêu chí đánh giá (Rubric)'}
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">
                {type === 'MCQ' ? 'Tối thiểu 2 phương án' : 'Đa tầng tiêu chí & mức độ'}
              </span>
            </div>

            {type === 'MCQ' ? (
              <div className="space-y-3">
                {options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-md border text-xs transition-colors flex items-start gap-3 ${
                      opt.is_correct
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                        : 'bg-slate-50/70 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <label className="flex items-center gap-2 shrink-0 mt-2 cursor-pointer">
                      <input
                        type="radio"
                        name="correct-option"
                        checked={opt.is_correct}
                        onChange={() => handleOptionChange(idx, 'is_correct', true)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                    </label>

                    <input
                      type="text"
                      value={opt.content}
                      onChange={(e) => handleOptionChange(idx, 'content', e.target.value)}
                      placeholder={`Nội dung phương án ${String.fromCharCode(65 + idx)}...`}
                      className="flex-1 p-2 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded focus:border-blue-600 focus:outline-none"
                    />

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-slate-400 hover:text-rose-500 p-2 transition-colors mt-0.5"
                        title="Xóa phương án"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-slate-300 dark:border-zinc-700 hover:border-blue-600 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm phương án</span>
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <RubricBuilder
                  itemMaxPoints={defaultPoints}
                  initialRubric={rubric || undefined}
                  onChange={(updatedRubric) => setRubric(updatedRubric)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Metadata & Properties */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md p-5 space-y-4 shadow-2xs text-xs">
            <h2 className="font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wide border-b border-slate-100 dark:border-zinc-850 pb-2">
              Thuộc tính câu hỏi
            </h2>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Hình thức câu hỏi</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md focus:border-blue-600 focus:outline-none"
              >
                <option value="MCQ">Trắc nghiệm khách quan (MCQ)</option>
                <option value="SCENARIO">Xử lý tình huống (Scenario)</option>
                <option value="PRACTICAL_FILE">Thực hành nộp tệp tin (File)</option>
                <option value="DIGITAL_LINK">Nộp liên kết số (URL / Product)</option>
              </select>
            </div>

            {/* Domain */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Miền năng lực DigComp</label>
              <select
                value={domainId}
                onChange={(e) => setDomainId(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md focus:border-blue-600 focus:outline-none"
              >
                <option value="D1">D1: Vận hành thiết bị &amp; Dữ liệu số</option>
                <option value="D2">D2: Giao tiếp &amp; Hợp tác số</option>
                <option value="D3">D3: Sáng tạo nội dung số</option>
                <option value="D4">D4: An toàn &amp; Bảo mật số</option>
                <option value="D5">D5: Giải quyết vấn đề số</option>
              </select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Độ khó khảo thí</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full p-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md focus:border-blue-600 focus:outline-none"
              >
                <option value="BEGINNER">Cơ bản (Beginner / Foundation)</option>
                <option value="INTERMEDIATE">Trung cấp (Intermediate)</option>
                <option value="ADVANCED">Nâng cao (Advanced)</option>
                <option value="EXPERT">Chuyên gia (Expert)</option>
              </select>
            </div>

            {/* Default Points */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Điểm tối đa</label>
              <input
                type="number"
                min={1}
                max={100}
                value={defaultPoints}
                onChange={(e) => setDefaultPoints(parseInt(e.target.value, 10) || 10)}
                className="w-full p-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md focus:border-blue-600 focus:outline-none font-mono"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Trạng thái kiểm định</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md focus:border-blue-600 focus:outline-none"
              >
                <option value="APPROVED">Đã kiểm duyệt (Approved)</option>
                <option value="DRAFT">Bản nháp (Draft)</option>
                <option value="ARCHIVED">Lưu trữ (Archived)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
