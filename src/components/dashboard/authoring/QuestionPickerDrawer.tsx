'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Layers,
  CheckCircle2,
  FileText,
  Plus,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  AuthoringQuestionItem,
  QuestionType,
} from '@/features/assessments/types/authoring-v2.types';

interface QuestionPickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (imported: AuthoringQuestionItem[]) => void;
}

export function QuestionPickerDrawer({
  isOpen,
  onClose,
  onImportQuestions,
}: QuestionPickerDrawerProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<AuthoringQuestionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Load existing questions owned by user
  useEffect(() => {
    if (!isOpen) return;

    async function loadBank() {
      setLoading(true);
      try {
        // 1. First fetch from approved question bank API
        const res = await fetch('/api/question-bank?limit=100');
        if (res.ok) {
          const json = await res.json();
          if (json.items && json.items.length > 0) {
            const mapped: AuthoringQuestionItem[] = json.items.map((item: any) => {
              const comp = item.competencies;
              const domainCode = comp?.skill_code ? `0${comp.skill_code[0]}` : '01';

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

              const options = (item.question_bank_options || []).map((o: any) => ({
                id: o.id,
                text: o.content || '',
                isCorrect: !!o.is_correct,
                explanation: o.explanation || undefined,
              }));

              return {
                id: item.id,
                type: qType,
                prompt: item.prompt || 'Câu hỏi chưa có tiêu đề',
                points: item.default_points || 1,
                domainCode,
                domainTitle: comp?.title || 'Kỹ năng số',
                options,
              };
            });

            setBankQuestions(mapped);
            return;
          }
        }

        // 2. Fallback: Fetch user's existing assessment items with item_options
        const { data, error } = await supabase
          .from('assessment_items')
          .select(`
            id,
            prompt,
            type,
            points,
            item_options (
              id,
              content,
              is_correct,
              explanation
            ),
            competencies (
              skill_code,
              competency_domains (
                code,
                title
              )
            )
          `)
          .limit(100);

        if (error) {
          console.warn('Bank fallback query note:', error);
          setBankQuestions([]);
          return;
        }

        if (data) {
          const mapped: AuthoringQuestionItem[] = data.map((item: any) => {
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

            const options = (item.item_options || []).map((o: any) => ({
              id: o.id,
              text: o.content || '',
              isCorrect: !!o.is_correct,
              explanation: o.explanation || undefined,
            }));

            return {
              id: item.id,
              type: qType,
              prompt: item.prompt || 'Câu hỏi chưa có tiêu đề',
              points: item.points || 1,
              domainCode,
              domainTitle: dom?.title || 'Kỹ năng số',
              options,
            };
          });

          setBankQuestions(mapped);
        }
      } catch (err) {
        console.error('Error loading bank questions:', err);
        setBankQuestions([]);
      } finally {
        setLoading(false);
      }
    }

    loadBank();
    setSelectedIds(new Set());
  }, [isOpen, supabase]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const toImport = bankQuestions.filter((q) => selectedIds.has(q.id));
    // Duplicate questions with fresh temporary IDs
    const cloned = toImport.map((q) => ({
      ...q,
      id: `clone-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      options: (q.options || []).map((opt) => ({
        ...opt,
        id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      })),
    }));

    onImportQuestions(cloned);
    onClose();
  };

  // Filter items
  const filtered = bankQuestions.filter((q) => {
    if (selectedDomain !== 'all' && q.domainCode !== selectedDomain) return false;
    if (selectedType !== 'all') {
      if (selectedType === 'MCQ' && q.type !== 'MCQ') return false;
      if (selectedType === 'PRACTICAL' && q.type === 'MCQ') return false;
    }
    if (searchQuery.trim()) {
      const match = q.prompt.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-white dark:bg-[#111114] border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                KHO CÂU HỎI CÁ NHÂN
              </span>
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Chọn câu hỏi có sẵn của bạn
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-neutral-700 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-4 space-y-2.5 bg-slate-50/50 dark:bg-zinc-900/30">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo nội dung câu hỏi..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              aria-label="Lọc theo miền"
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-neutral-800 dark:text-zinc-200"
            >
              <option value="all">Tất cả miền</option>
              <option value="01">Miền 01: Dữ liệu</option>
              <option value="02">Miền 02: Giao tiếp</option>
              <option value="03">Miền 03: Sáng tạo</option>
              <option value="04">Miền 04: An toàn</option>
              <option value="05">Miền 05: Vấn đề</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Lọc theo loại câu hỏi"
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-neutral-800 dark:text-zinc-200"
            >
              <option value="all">Tất cả loại câu</option>
              <option value="MCQ">Trắc nghiệm</option>
              <option value="PRACTICAL">Tự luận / Thực hành</option>
            </select>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              Đang tải danh sách câu hỏi...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Không tìm thấy câu hỏi nào phù hợp.
            </div>
          ) : (
            filtered.map((q) => {
              const isSelected = selectedIds.has(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleSelect(q.id)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                          D{q.domainCode}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-neutral-700 dark:text-zinc-300">
                          {q.type === 'MCQ' ? 'Trắc nghiệm' : 'Tự luận / Thực hành'}
                        </span>
                        <span>•</span>
                        <span>{q.points} điểm</span>
                      </div>
                      <p className="text-neutral-900 dark:text-neutral-100 font-medium line-clamp-2">
                        {q.prompt}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 dark:border-zinc-700'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 flex items-center justify-between bg-white dark:bg-[#111114]">
          <span className="text-xs text-slate-500">
            Đã chọn <strong>{selectedIds.size}</strong> câu hỏi
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>

            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleConfirm}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              Thêm vào đề ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
