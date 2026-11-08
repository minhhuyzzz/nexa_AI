'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Save,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Edit2,
  X,
} from 'lucide-react';

interface Option {
  id?: string;
  content: string;
  is_correct: boolean;
  explanation?: string;
  order_index?: number;
}

interface Item {
  id: string;
  prompt: string;
  type: string;
  points: number;
  order_index: number;
  competency_id?: string;
  competencies?: any;
  item_options?: Option[];
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  point_reward: number;
  is_published: boolean;
  access_tier: string;
  visibility: string;
  created_at: string;
  assessment_items?: Item[];
}

interface Domain {
  id: string;
  code: string;
  title: string;
}

interface Competency {
  id: string;
  skill_code: string;
  title: string;
  domain_id: string;
}

interface Props {
  assessment: Assessment | null;
  domains: Domain[];
  competencies: Competency[];
}

export function BaselineAdminClient({ assessment, domains, competencies }: Props) {
  const router = useRouter();

  // State danh sách câu hỏi
  const [items, setItems] = useState<Item[]>(assessment?.assessment_items || []);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // State Modal Xóa trắng
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // State Modal Xóa 1 câu
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // State Thêm câu mới
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [newDomainId, setNewDomainId] = useState(domains[0]?.id || '');
  const [newOptions, setNewOptions] = useState<Option[]>([
    { content: '', is_correct: true, explanation: '' },
    { content: '', is_correct: false, explanation: '' },
    { content: '', is_correct: false, explanation: '' },
    { content: '', is_correct: false, explanation: '' },
  ]);

  // State Chỉnh sửa câu hỏi hiện có
  const [editPrompt, setEditPrompt] = useState('');
  const [editDomainId, setEditDomainId] = useState('');
  const [editOptions, setEditOptions] = useState<Option[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Toast / Thông báo
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  if (!assessment) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          Chưa tìm thấy bản ghi khảo thí đầu vào
        </h2>
      </div>
    );
  }

  // Helper tìm domainId từ competency
  const getDomainIdFromItem = (item: Item): string => {
    const comp = Array.isArray(item.competencies) ? item.competencies[0] : item.competencies;
    if (comp?.domain_id) return comp.domain_id;
    if (comp?.competency_domains?.code) {
      const d = domains.find((dom) => dom.code === comp.competency_domains.code);
      if (d) return d.id;
    }
    return domains[0]?.id || '';
  };

  // Helper tìm competencyId hợp lệ từ domainId
  const getCompetencyIdForDomain = (domainId: string): string => {
    const matched = competencies.find((c) => c.domain_id === domainId);
    return matched?.id || competencies[0]?.id || '';
  };

  // Bắt đầu sửa 1 câu
  const handleStartEdit = (item: Item) => {
    setEditingItemId(item.id);
    setEditPrompt(item.prompt);
    setEditDomainId(getDomainIdFromItem(item));
    const existingOpts = item.item_options || [];
    if (existingOpts.length === 0) {
      setEditOptions([
        { content: '', is_correct: true, explanation: '' },
        { content: '', is_correct: false, explanation: '' },
        { content: '', is_correct: false, explanation: '' },
        { content: '', is_correct: false, explanation: '' },
      ]);
    } else {
      setEditOptions(
        existingOpts.map((o) => ({
          id: o.id,
          content: o.content,
          is_correct: o.is_correct,
          explanation: o.explanation || '',
        }))
      );
    }
  };

  // Lưu chỉnh sửa câu hỏi
  const handleSaveEdit = async (itemId: string) => {
    if (!editPrompt.trim()) {
      showToast('error', 'Nội dung câu hỏi không được để trống.');
      return;
    }
    if (editOptions.some((o) => !o.content.trim())) {
      showToast('error', 'Vui lòng điền đầy đủ cả 4 phương án lựa chọn.');
      return;
    }
    if (!editOptions.some((o) => o.is_correct)) {
      showToast('error', 'Vui lòng chọn ít nhất 1 đáp án đúng.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const compId = getCompetencyIdForDomain(editDomainId);
      const res = await fetch(`/api/admin/assessments/${assessment.id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MCQ',
          prompt: editPrompt.trim(),
          points: 1,
          competency_id: compId,
          options: editOptions.map((o) => ({
            id: o.id,
            content: o.content.trim(),
            is_correct: o.is_correct,
            explanation: o.explanation?.trim() || null,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi cập nhật câu hỏi');

      // Cập nhật state local
      const selectedDom = domains.find((d) => d.id === editDomainId);
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              prompt: editPrompt.trim(),
              points: 1,
              competency_id: compId,
              competencies: {
                domain_id: editDomainId,
                competency_domains: {
                  code: selectedDom?.code || '',
                  title: selectedDom?.title || '',
                },
              },
              item_options: editOptions,
            };
          }
          return item;
        })
      );

      setEditingItemId(null);
      showToast('success', 'Đã lưu thay đổi câu hỏi thành công!');
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi cập nhật');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Thêm câu hỏi mới
  const handleAddNewItem = async () => {
    if (!newPrompt.trim()) {
      showToast('error', 'Nội dung câu hỏi không được để trống.');
      return;
    }
    if (newOptions.some((o) => !o.content.trim())) {
      showToast('error', 'Vui lòng điền đầy đủ 4 phương án lựa chọn.');
      return;
    }
    if (!newOptions.some((o) => o.is_correct)) {
      showToast('error', 'Vui lòng đánh dấu 1 phương án là đáp án đúng.');
      return;
    }

    setIsSubmittingNew(true);
    try {
      const compId = getCompetencyIdForDomain(newDomainId);
      const res = await fetch(`/api/admin/assessments/${assessment.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MCQ',
          prompt: newPrompt.trim(),
          points: 1,
          competency_id: compId,
          options: newOptions.map((o) => ({
            content: o.content.trim(),
            is_correct: o.is_correct,
            explanation: o.explanation?.trim() || null,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi tạo câu hỏi');

      const selectedDom = domains.find((d) => d.id === newDomainId);
      const createdItem: Item = {
        id: data.item?.id || `new-${Date.now()}`,
        prompt: newPrompt.trim(),
        type: 'MCQ',
        points: 1,
        order_index: items.length + 1,
        competency_id: compId,
        competencies: {
          domain_id: newDomainId,
          competency_domains: {
            code: selectedDom?.code || '',
            title: selectedDom?.title || '',
          },
        },
        item_options: newOptions,
      };

      setItems((prev) => [...prev, createdItem]);
      setIsAddingNew(false);
      setNewPrompt('');
      setNewOptions([
        { content: '', is_correct: true, explanation: '' },
        { content: '', is_correct: false, explanation: '' },
        { content: '', is_correct: false, explanation: '' },
        { content: '', is_correct: false, explanation: '' },
      ]);
      showToast('success', 'Đã thêm câu hỏi trắc nghiệm mới!');
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi thêm câu hỏi');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Xóa 1 câu hỏi
  const handleDeleteItem = async (itemId: string) => {
    setIsDeletingItem(true);
    try {
      const res = await fetch(`/api/admin/assessments/${assessment.id}/items/${itemId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa câu hỏi');

      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setDeletingItemId(null);
      showToast('success', 'Đã xóa câu hỏi khỏi bài khảo thí!');
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi xóa câu hỏi');
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Xóa trắng toàn bộ
  const handleClearAllItems = async () => {
    setIsClearing(true);
    try {
      const res = await fetch(`/api/admin/assessments/${assessment.id}/items`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa toàn bộ câu hỏi');

      setItems([]);
      setShowClearConfirm(false);
      showToast('success', 'Đã xóa trắng toàn bộ câu hỏi. Đề thi hiện có 0 câu!');
      router.refresh();
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi xóa câu hỏi');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* 1. Header tinh gọn - Hoàn toàn không có card rườm rà */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
              Khảo Thí Đầu Vào Hệ Thống
            </span>
            <span className="text-xs font-semibold text-neutral-600 dark:text-zinc-400">
              Tổng số câu: <strong className="text-neutral-900 dark:text-neutral-100 font-mono">{items.length}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {assessment.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Soạn thảo trực tiếp các câu hỏi trắc nghiệm chẩn đoán 5 miền năng lực số tại đây.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {items.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa trắng ({items.length})</span>
            </button>
          )}

          <Link
            href={`/admin/content/assessments/${assessment.id}/preview`}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Xem trước bài thi</span>
          </Link>

          <button
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu hỏi mới</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Form Thêm Câu Hỏi Mới Trực Tiếp */}
      {isAddingNew && (
        <div className="bg-white dark:bg-[#111114] border-2 border-blue-500/70 dark:border-blue-500/50 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                +
              </span>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Thêm câu hỏi trắc nghiệm mới (Câu {items.length + 1})
              </h3>
            </div>
            <button
              onClick={() => setIsAddingNew(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                Nội dung câu hỏi (Prompt) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Ví dụ: Khi cần tìm kiếm tài liệu học thuật đáng tin cậy, công cụ nào sau đây là phù hợp nhất?"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                Miền Năng Lực Số <span className="text-red-500">*</span>
              </label>
              <select
                value={newDomainId}
                onChange={(e) => setNewDomainId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                {domains.map((dom) => (
                  <option key={dom.id} value={dom.id}>
                    {dom.code}: {dom.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4 Phương án lựa chọn */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                4 Lựa chọn trả lời (Tích chọn 1 đáp án đúng):
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {newOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                    opt.is_correct
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setNewOptions((prev) =>
                        prev.map((o, i) => ({ ...o, is_correct: i === idx }))
                      );
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      opt.is_correct
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </button>

                  <input
                    type="text"
                    value={opt.content}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewOptions((prev) =>
                        prev.map((o, i) => (i === idx ? { ...o, content: val } : o))
                      );
                    }}
                    placeholder={`Nội dung lựa chọn ${String.fromCharCode(65 + idx)}...`}
                    className="flex-1 text-xs bg-transparent focus:outline-hidden text-neutral-900 dark:text-neutral-100"
                  />

                  {opt.is_correct && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      ✓ Đáp án đúng
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSubmittingNew}
              onClick={handleAddNewItem}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              {isSubmittingNew ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu câu hỏi</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. Danh sách câu hỏi */}
      {items.length === 0 ? (
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Bài khảo thí đầu vào hiện đang trống trơn (0 câu)
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Bạn có thể bắt đầu tự tay tạo từng câu hỏi trắc nghiệm tình huống chuẩn 5 miền năng lực số ngay tại đây.
            </p>
          </div>
          <div>
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm câu hỏi đầu tiên</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const isEditing = editingItemId === item.id;
            const comp = Array.isArray(item.competencies) ? item.competencies[0] : item.competencies;
            const dom = Array.isArray(comp?.competency_domains)
              ? comp?.competency_domains[0]
              : comp?.competency_domains;

            if (isEditing) {
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#111114] border-2 border-blue-500 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between pb-3">
                    <span className="text-xs font-bold text-blue-600">
                      Đang chỉnh sửa câu hỏi số {idx + 1}
                    </span>
                    <button
                      onClick={() => setEditingItemId(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                        Nội dung câu hỏi
                      </label>
                      <textarea
                        rows={2}
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                        Miền Năng Lực Số
                      </label>
                      <select
                        value={editDomainId}
                        onChange={(e) => setEditDomainId(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200"
                      >
                        {domains.map((dom) => (
                          <option key={dom.id} value={dom.id}>
                            {dom.code}: {dom.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 4 Phương án */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {editOptions.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                          opt.is_correct
                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                            : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setEditOptions((prev) =>
                              prev.map((o, i) => ({ ...o, is_correct: i === oIdx }))
                            );
                          }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            opt.is_correct
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </button>

                        <input
                          type="text"
                          value={opt.content}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditOptions((prev) =>
                              prev.map((o, i) => (i === oIdx ? { ...o, content: val } : o))
                            );
                          }}
                          className="flex-1 text-xs bg-transparent focus:outline-hidden text-neutral-900 dark:text-neutral-100"
                        />

                        {opt.is_correct && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            ✓ Đúng
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingItemId(null)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      disabled={isSavingEdit}
                      onClick={() => handleSaveEdit(item.id)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                    >
                      {isSavingEdit ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Lưu câu hỏi</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {dom?.code && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/50">
                            {dom.code}: {dom.title}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                        {item.prompt}
                      </h4>
                    </div>
                  </div>

                  {/* Hành động sửa / xóa */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold text-neutral-700 dark:text-zinc-300 transition-colors inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>

                    <button
                      onClick={() => setDeletingItemId(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Danh sách 4 đáp án */}
                {item.item_options && item.item_options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9 pt-1">
                    {item.item_options.map((opt, oIdx) => (
                      <div
                        key={opt.id || oIdx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                          opt.is_correct
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-semibold'
                            : 'bg-slate-50/60 border-slate-200/70 text-slate-700 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            opt.is_correct
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="truncate">{opt.content}</span>
                        {opt.is_correct && (
                          <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            (Đúng)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modal Xác nhận xóa 1 câu */}
      {deletingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Xóa câu hỏi này?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Câu hỏi sẽ bị xóa khỏi bài khảo thí đầu vào. Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItemId(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={() => handleDeleteItem(deletingItemId)}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {isDeletingItem ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Xác nhận xóa trắng toàn bộ */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Xóa trắng toàn bộ {items.length} câu hỏi?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Đưa bài khảo thí đầu vào về trạng thái 0 câu hỏi để bạn tự tay thiết kế lại toàn bộ.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={handleClearAllItems}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {isClearing ? 'Đang xóa...' : 'Xác nhận xóa trắng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
