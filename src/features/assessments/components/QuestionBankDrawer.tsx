'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  Filter,
  Check,
  Plus,
  BookOpen,
  Radio,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ParsedItemRow } from '../utils/csv-helper';

interface QuestionBankItem {
  id: string;
  code: string;
  prompt: string;
  type: string;
  difficulty_level: string;
  default_points: number;
  status: string;
  competencies?: {
    id: string;
    skill_code: string;
    title: string;
  } | null;
  question_bank_options?: Array<{
    id: string;
    content: string;
    is_correct: boolean;
    explanation?: string;
    order_index: number;
  }>;
}

interface QuestionBankDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (selectedQuestions: ParsedItemRow[]) => void;
}

export function QuestionBankDrawer({
  isOpen,
  onClose,
  onAddQuestions,
}: QuestionBankDrawerProps) {
  const [items, setItems] = useState<QuestionBankItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter !== 'ALL') params.set('type', typeFilter);

      const res = await fetch(`/api/question-bank?${params.toString()}`);
      if (!res.ok) throw new Error('Không thể tải câu hỏi');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Fetch question bank error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, fetchItems]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const handleConfirmAdd = () => {
    const selectedItems = items.filter((i) => selectedIds.has(i.id));
    const converted: ParsedItemRow[] = selectedItems.map((item) => {
      const sortedOpts = [...(item.question_bank_options || [])].sort(
        (a, b) => a.order_index - b.order_index
      );

      const correctOptIdx = sortedOpts.findIndex((o) => o.is_correct);
      const answerLetters = ['A', 'B', 'C', 'D'];
      const correctAnswerLetter =
        correctOptIdx >= 0 && correctOptIdx < 4 ? answerLetters[correctOptIdx] : 'A';

      const correctOpt = sortedOpts.find((o) => o.is_correct);

      return {
        prompt: item.prompt,
        type: item.type === 'DIGITAL_EVIDENCE' ? 'PRACTICAL' : item.type,
        skill_code: item.competencies?.skill_code || '1.1',
        points: Number(item.default_points) || 10,
        option_a: sortedOpts[0]?.content || '',
        option_b: sortedOpts[1]?.content || '',
        option_c: sortedOpts[2]?.content || '',
        option_d: sortedOpts[3]?.content || '',
        correct_answer: correctAnswerLetter,
        explanation: correctOpt?.explanation || '',
      };
    });

    onAddQuestions(converted);
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              Ngân Hàng Câu Hỏi Khảo Thí
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn câu hỏi chuẩn hóa DigComp từ kho trung tâm để đưa vào bài thi
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Đóng drawer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
              <input
                type="text"
                placeholder="Tìm kiếm nội dung câu hỏi hoặc mã câu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 transition-colors"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-sky-600 transition-colors"
            >
              <option value="ALL">Tất cả định dạng</option>
              <option value="MCQ">Trắc nghiệm (MCQ)</option>
              <option value="SCENARIO">Tình huống (Scenario)</option>
              <option value="DIGITAL_EVIDENCE">Thực hành (Evidence)</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span>
              Tìm thấy <strong className="font-mono text-slate-900">{items.length}</strong> câu hỏi khả dụng
            </span>
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-sky-600 hover:text-sky-700 font-medium"
              >
                {selectedIds.size === items.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            )}
          </div>
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
              <p className="text-xs">Đang tải danh sách câu hỏi...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-md p-6 text-center">
              <BookOpen className="w-8 h-8 text-slate-300 mb-2" strokeWidth={1.75} />
              <p className="text-xs font-medium text-slate-700">Không tìm thấy câu hỏi phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">Hãy thử tìm với từ khóa khác hoặc nạp thêm câu hỏi vào ngân hàng.</p>
            </div>
          ) : (
            items.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const opts = item.question_bank_options || [];

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`p-3.5 rounded-md border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5 shrink-0">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-sky-600 border-sky-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" strokeWidth={2.5} />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-medium">
                          {item.code || 'QB-ITEM'}
                        </span>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono">
                          {item.type}
                        </span>
                        {item.competencies && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded text-[10px] font-mono">
                            DigComp {item.competencies.skill_code}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono ml-auto">
                          {item.default_points}đ
                        </span>
                      </div>

                      <p className="text-xs text-slate-900 font-medium leading-relaxed">
                        {item.prompt}
                      </p>

                      {/* Options preview for MCQ */}
                      {opts.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                          {opts.slice(0, 4).map((opt, optIdx) => (
                            <div
                              key={opt.id}
                              className={`px-2 py-1 rounded text-[11px] border flex items-center gap-1.5 ${
                                opt.is_correct
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              <span className="font-mono text-[10px]">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span className="truncate">{opt.content}</span>
                              {opt.is_correct && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 ml-auto" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            Đã chọn <strong className="font-mono text-slate-900">{selectedIds.size}</strong> câu hỏi
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleConfirmAdd}
              className="px-4 py-1.5 text-xs font-medium bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-md shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Thêm vào bài thi ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
