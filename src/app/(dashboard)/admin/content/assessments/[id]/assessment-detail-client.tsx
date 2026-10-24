'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCheck,
  FileText,
  Clock,
  Award,
  Lock,
  Unlock,
  Layers,
  X,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { downloadCSVTemplate, parseCSV, type ParsedItemRow } from '@/features/assessments/utils/csv-helper';

export interface AssessmentItemOption {
  id?: string;
  content: string;
  is_correct: boolean;
  explanation?: string | null;
  order_index?: number;
}

export interface AssessmentItemDetail {
  id: string;
  type: string;
  prompt: string;
  points: number;
  order_index: number;
  competency_id: string;
  is_multi_competency?: boolean;
  target_competencies?: string[];
  rubric_guide?: string | null;
  competencies?: {
    id: string;
    skill_code: string;
    title: string;
    domain_id: string;
    competency_domains?: {
      code: string;
      title: string;
    };
  };
  item_options?: AssessmentItemOption[];
}

export interface AssessmentDetailData {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  point_reward: number;
  is_published: boolean;
  is_vip: boolean;
  access_tier: 'FREE' | 'VIP';
  created_at: string;
  assessment_items: AssessmentItemDetail[];
}

interface Props {
  initialAssessment: AssessmentDetailData;
  competenciesList: Array<{ id: string; skill_code: string; title: string; domain_id: string }>;
}

export function AdminAssessmentDetailClient({
  initialAssessment,
  competenciesList,
}: Props) {
  const [assessment, setAssessment] = useState<AssessmentDetailData>(initialAssessment);
  const [items, setItems] = useState<AssessmentItemDetail[]>(initialAssessment.assessment_items || []);

  // Inline Add / Edit Question State (No popup modal)
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<AssessmentItemDetail | null>(null);

  // Form State for Question
  const [qType, setQType] = useState<'MCQ' | 'SCENARIO' | 'PRACTICAL_TASK'>('MCQ');
  const [qIsMultiComp, setQIsMultiComp] = useState<boolean>(false);
  const [qSkillCode, setQSkillCode] = useState<string>(competenciesList[0]?.skill_code || '1.1');
  const [qTargetCompetencies, setQTargetCompetencies] = useState<string[]>(['1.1']);
  const [qPoints, setQPoints] = useState<number>(10);
  const [qPrompt, setQPrompt] = useState<string>('');
  const [qOptions, setQOptions] = useState<Array<{ content: string; is_correct: boolean; explanation: string }>>([
    { content: '', is_correct: true, explanation: '' },
    { content: '', is_correct: false, explanation: '' },
    { content: '', is_correct: false, explanation: '' },
    { content: '', is_correct: false, explanation: '' },
  ]);
  const [qRubricGuide, setQRubricGuide] = useState<string>('');
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  // Modal: Import questions directly into this assessment
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importParsedItems, setImportParsedItems] = useState<ParsedItemRow[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);

  // Deleting item
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const totalPoints = items.reduce((sum, it) => sum + (it.points || 0), 0);

  // Toggle VIP / Free
  const handleToggleVip = async () => {
    const nextVip = !assessment.is_vip;
    try {
      const res = await fetch(`/api/admin/assessments/${assessment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_vip: nextVip,
          access_tier: nextVip ? 'VIP' : 'FREE',
        }),
      });
      if (!res.ok) throw new Error('Lỗi cập nhật');
      setAssessment((prev) => ({
        ...prev,
        is_vip: nextVip,
        access_tier: nextVip ? 'VIP' : 'FREE',
      }));
      showToast(nextVip ? 'Đã đổi sang chế độ VIP (Khóa)' : 'Đã đổi sang chế độ Free (Mở)');
    } catch {
      showToast('Không thể cập nhật phân hạng bài thi.');
    }
  };

  // Toggle Publish
  const handleTogglePublish = async () => {
    const nextPublished = !assessment.is_published;
    try {
      const res = await fetch(`/api/admin/assessments/${assessment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: nextPublished }),
      });
      if (!res.ok) throw new Error('Lỗi cập nhật');
      setAssessment((prev) => ({ ...prev, is_published: nextPublished }));
      showToast(nextPublished ? 'Đã công khai bài thi' : 'Đã chuyển về bản nháp (ẩn)');
    } catch {
      showToast('Không thể cập nhật trạng thái phát hành.');
    }
  };

  // Open Inline Add Question Card
  const handleOpenAddQuestion = () => {
    setEditingItemId(null);
    setEditingItem(null);
    setQType('MCQ');
    setQIsMultiComp(false);
    setQSkillCode(competenciesList[0]?.skill_code || '1.1');
    setQTargetCompetencies(['1.1']);
    setQPoints(10);
    setQPrompt('');
    setQOptions([
      { content: '', is_correct: true, explanation: '' },
      { content: '', is_correct: false, explanation: '' },
      { content: '', is_correct: false, explanation: '' },
      { content: '', is_correct: false, explanation: '' },
    ]);
    setQRubricGuide('');
    setIsAddingInline(true);
  };

  // Open Inline Edit Question Card
  const handleOpenEditQuestion = (item: AssessmentItemDetail) => {
    setIsAddingInline(false);
    setEditingItemId(item.id);
    setEditingItem(item);
    const resolvedType =
      item.type === 'DIGITAL_EVIDENCE' || item.type === 'PRACTICAL_TASK'
        ? 'PRACTICAL_TASK'
        : (item.type as 'MCQ' | 'SCENARIO');
    setQType(resolvedType);
    setQIsMultiComp(Boolean(item.is_multi_competency));
    setQSkillCode(item.competencies?.skill_code || '1.1');
    setQTargetCompetencies(
      item.target_competencies && item.target_competencies.length > 0
        ? item.target_competencies
        : [item.competencies?.skill_code || '1.1']
    );
    setQPoints(item.points || 10);
    setQPrompt(item.prompt);
    setQRubricGuide(item.rubric_guide || '');

    if (item.item_options && item.item_options.length > 0) {
      setQOptions(
        item.item_options.map((o) => ({
          content: o.content,
          is_correct: o.is_correct,
          explanation: o.explanation || '',
        }))
      );
    } else {
      setQOptions([
        { content: '', is_correct: true, explanation: '' },
        { content: '', is_correct: false, explanation: '' },
        { content: '', is_correct: false, explanation: '' },
        { content: '', is_correct: false, explanation: '' },
      ]);
    }
  };

  const handleCloseInline = () => {
    setIsAddingInline(false);
    setEditingItemId(null);
    setEditingItem(null);
  };

  // Save Question (Create or Edit)
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qPrompt.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    if (qType === 'MCQ' || qType === 'SCENARIO') {
      const validOptions = qOptions.filter((o) => o.content.trim().length > 0);
      if (validOptions.length < 2) {
        showToast('Câu hỏi trắc nghiệm/tình huống cần ít nhất 2 lựa chọn có nội dung.');
        return;
      }
      const hasCorrect = validOptions.some((o) => o.is_correct);
      if (!hasCorrect) {
        showToast('Vui lòng đánh dấu ít nhất 1 đáp án đúng.');
        return;
      }
    }

    setIsSavingQuestion(true);
    try {
      const targetCompetencies = qIsMultiComp ? qTargetCompetencies : [qSkillCode];

      if (editingItem) {
        // Update item
        const payload = {
          type: qType === 'PRACTICAL_TASK' ? 'DIGITAL_EVIDENCE' : qType,
          prompt: qPrompt.trim(),
          points: Number(qPoints),
          skill_code: qSkillCode,
          target_competencies: targetCompetencies,
          is_multi_competency: qIsMultiComp,
          rubric_guide: qType === 'PRACTICAL_TASK' ? qRubricGuide.trim() : null,
          options:
            qType === 'MCQ' || qType === 'SCENARIO'
              ? qOptions
                  .filter((o) => o.content.trim().length > 0)
                  .map((o) => ({
                    content: o.content.trim(),
                    is_correct: o.is_correct,
                    explanation: o.explanation.trim() || null,
                  }))
              : [],
        };

        const res = await fetch(`/api/admin/assessments/${assessment.id}/items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Không thể cập nhật câu hỏi');

        // Refresh detail from API
        const refreshRes = await fetch(`/api/admin/assessments/${assessment.id}`);
        const refreshData = await refreshRes.json();
        if (refreshData.assessment) {
          setAssessment(refreshData.assessment);
          setItems(refreshData.assessment.assessment_items || []);
        }

        showToast('Đã cập nhật câu hỏi thành công!');
      } else {
        // Create new item
        const payload = {
          type: qType === 'PRACTICAL_TASK' ? 'DIGITAL_EVIDENCE' : qType,
          prompt: qPrompt.trim(),
          points: Number(qPoints),
          skill_code: qSkillCode,
          target_competencies: targetCompetencies,
          is_multi_competency: qIsMultiComp,
          rubric_guide: qType === 'PRACTICAL_TASK' ? qRubricGuide.trim() : null,
          options:
            qType === 'MCQ' || qType === 'SCENARIO'
              ? qOptions
                  .filter((o) => o.content.trim().length > 0)
                  .map((o) => ({
                    content: o.content.trim(),
                    is_correct: o.is_correct,
                    explanation: o.explanation.trim() || null,
                  }))
              : [],
        };

        const res = await fetch(`/api/admin/assessments/${assessment.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Không thể tạo câu hỏi mới');

        // Refresh detail
        const refreshRes = await fetch(`/api/admin/assessments/${assessment.id}`);
        const refreshData = await refreshRes.json();
        if (refreshData.assessment) {
          setAssessment(refreshData.assessment);
          setItems(refreshData.assessment.assessment_items || []);
        }

        showToast('Đã thêm câu hỏi mới vào đề thi!');
      }

      handleCloseInline();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu câu hỏi');
    } finally {
      setIsSavingQuestion(false);
    }
  };

  // Delete Question Item
  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/admin/assessments/${assessment.id}/items/${itemId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa câu hỏi');

      setItems((prev) => prev.filter((i) => i.id !== itemId));
      showToast('Đã xóa câu hỏi khỏi đề thi.');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa câu hỏi');
    } finally {
      setDeletingItemId(null);
    }
  };

  // Handle File Upload for Bulk Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('Tệp rỗng');

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const rawItems = Array.isArray(parsed) ? parsed : parsed.items;
          setImportParsedItems(rawItems || []);
        } else {
          const parsed = parseCSV(text);
          setImportParsedItems(parsed);
        }
      } catch (err: any) {
        setImportError(err.message || 'Lỗi đọc tệp');
        setImportParsedItems([]);
      }
    };

    reader.readAsText(file, 'utf-8');
  };

  // Execute Bulk Import
  const handleExecuteImport = async () => {
    if (importParsedItems.length === 0) {
      setImportError('Vui lòng chọn tệp có câu hỏi hợp lệ');
      return;
    }

    setIsSubmittingImport(true);
    setImportError(null);

    try {
      const res = await fetch(`/api/admin/assessments/${assessment.id}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: importParsedItems }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi nạp dữ liệu');

      showToast(`Đã nạp thành công ${data.successCount}/${data.totalReceived} câu hỏi!`);

      // Refresh items
      const refreshRes = await fetch(`/api/admin/assessments/${assessment.id}`);
      const refreshData = await refreshRes.json();
      if (refreshData.assessment) {
        setAssessment(refreshData.assessment);
        setItems(refreshData.assessment.assessment_items || []);
      }

      setIsImportModalOpen(false);
      setImportParsedItems([]);
      setImportFileName('');
    } catch (err: any) {
      setImportError(err.message || 'Lỗi nạp câu hỏi');
    } finally {
      setIsSubmittingImport(false);
    }
  };

  const renderInlineQuestionForm = (isNew: boolean, itemIndex?: number) => (
    <div className="p-5 rounded-md border-2 border-sky-500 bg-white shadow-xs space-y-4 animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-600 text-white">
            {isNew ? '+ THÊM CÂU HỎI MỚI (INLINE)' : `CHỈNH SỬA CÂU HỎI #${(itemIndex ?? 0) + 1}`}
          </span>
          <span className="text-xs text-slate-500">Soạn trực tiếp không qua bảng popup</span>
        </div>
        <button
          type="button"
          onClick={handleCloseInline}
          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          title="Hủy bỏ"
        >
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>

      <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
        {/* Type selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Hình thức câu hỏi:
            </label>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setQType('MCQ')}
                className={`py-1.5 px-2 rounded border text-[11px] font-semibold transition-colors ${
                  qType === 'MCQ'
                    ? 'bg-sky-50 border-sky-300 text-sky-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Trắc Nghiệm
              </button>
              <button
                type="button"
                onClick={() => setQType('SCENARIO')}
                className={`py-1.5 px-2 rounded border text-[11px] font-semibold transition-colors ${
                  qType === 'SCENARIO'
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Tình Huống
              </button>
              <button
                type="button"
                onClick={() => setQType('PRACTICAL_TASK')}
                className={`py-1.5 px-2 rounded border text-[11px] font-semibold transition-colors ${
                  qType === 'PRACTICAL_TASK'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Thực Hành
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Phân loại năng lực:
            </label>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setQIsMultiComp(false)}
                className={`flex-1 py-1.5 px-3 rounded border text-xs font-semibold transition-colors ${
                  !qIsMultiComp
                    ? 'bg-sky-50 border-sky-300 text-sky-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Đơn Năng Lực (1 Skill)
              </button>
              <button
                type="button"
                onClick={() => setQIsMultiComp(true)}
                className={`flex-1 py-1.5 px-3 rounded border text-xs font-semibold transition-colors ${
                  qIsMultiComp
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Đa Năng Lực (Nhiều Skill)
              </button>
            </div>
          </div>
        </div>

        {/* Competencies & Points */}
        {!qIsMultiComp ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-semibold text-slate-800 mb-1">
                Kỹ Năng Mục Tiêu (DigComp 3.0) *
              </label>
              <select
                value={qSkillCode}
                onChange={(e) => setQSkillCode(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-200 text-slate-900 bg-white text-xs focus:outline-none focus:border-sky-600"
              >
                {competenciesList.map((c) => (
                  <option key={c.id} value={c.skill_code}>
                    [{c.skill_code}] {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Điểm Số *</label>
              <input
                type="number"
                min={1}
                max={100}
                value={qPoints}
                onChange={(e) => setQPoints(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border border-slate-200 font-mono text-slate-900 text-xs focus:outline-none focus:border-sky-600"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-800">
                Chọn Các Kỹ Năng Mục Tiêu Cho Câu Hỏi Đa Năng Lực *
              </label>
              <div className="w-24">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={qPoints}
                  onChange={(e) => setQPoints(Number(e.target.value))}
                  placeholder="Điểm"
                  className="w-full px-2 py-1 rounded border border-slate-200 font-mono text-slate-900 text-xs text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded">
              {competenciesList.map((c) => {
                const isChecked = qTargetCompetencies.includes(c.skill_code);
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-1.5 p-1.5 rounded cursor-pointer text-[11px] border ${
                      isChecked
                        ? 'bg-amber-50/70 border-amber-300 text-amber-950 font-semibold'
                        : 'bg-white border-slate-100 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setQTargetCompetencies((prev) => [...prev, c.skill_code]);
                        } else {
                          setQTargetCompetencies((prev) =>
                            prev.filter((code) => code !== c.skill_code)
                          );
                        }
                      }}
                      className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-mono">[{c.skill_code}]</span>
                    <span className="truncate">{c.title}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Prompt */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1">
            Nội Dung Câu Hỏi / Đề Bài Tình Huống *
          </label>
          <textarea
            rows={3}
            required
            autoFocus={isNew}
            value={qPrompt}
            onChange={(e) => setQPrompt(e.target.value)}
            placeholder="Nhập nội dung câu hỏi, kịch bản bối cảnh hoặc yêu cầu thực hành chi tiết..."
            className="w-full px-3 py-2 rounded border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-sky-600"
          />
        </div>

        {/* MCQ / Scenario Options */}
        {(qType === 'MCQ' || qType === 'SCENARIO') && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-800 block">
              Các Lựa Chọn Đáp Án (Chọn nút tròn cho đáp án đúng) *
            </span>

            {qOptions.map((opt, optIndex) => {
              const letter = String.fromCharCode(65 + optIndex);
              return (
                <div key={optIndex} className="space-y-1 p-2.5 rounded border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name={`correct_radio_${isNew ? 'new' : editingItemId}`}
                        checked={opt.is_correct}
                        onChange={() => {
                          setQOptions((prev) =>
                            prev.map((o, i) => ({ ...o, is_correct: i === optIndex }))
                          );
                        }}
                        className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-mono font-bold text-slate-800">{letter}.</span>
                    </label>

                    <input
                      type="text"
                      value={opt.content}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQOptions((prev) =>
                          prev.map((o, i) => (i === optIndex ? { ...o, content: val } : o))
                        );
                      }}
                      placeholder={`Nội dung lựa chọn ${letter}...`}
                      className="flex-1 px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:border-sky-600"
                    />
                  </div>

                  {opt.is_correct && (
                    <div className="pl-7 pt-1">
                      <input
                        type="text"
                        value={opt.explanation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQOptions((prev) =>
                            prev.map((o, i) => (i === optIndex ? { ...o, explanation: val } : o))
                          );
                        }}
                        placeholder="Giải thích sư phạm vì sao đáp án này đúng (tùy chọn)..."
                        className="w-full px-2.5 py-1 rounded border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Practical Rubric Guide */}
        {qType === 'PRACTICAL_TASK' && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block font-semibold text-slate-800">
              Hướng Dẫn Chấm &amp; Tiêu Chí Rubric (Dành cho AI &amp; Giảng viên) *
            </label>
            <textarea
              rows={4}
              value={qRubricGuide}
              onChange={(e) => setQRubricGuide(e.target.value)}
              placeholder="Ví dụ: 1. Đầy đủ các tiêu chí bảo mật (40%); 2. Cấu trúc trình bày khoa học (30%); 3. Thuyết minh rõ ràng giải pháp thực hiện (30%)..."
              className="w-full px-3 py-2 rounded border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-sky-600"
            />
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCloseInline}
            className="px-4 py-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSavingQuestion}
            className="px-4 py-2 rounded bg-sky-600 text-white hover:bg-sky-700 font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
          >
            {isSavingQuestion ? 'Đang lưu...' : isNew ? 'Thêm Vào Đề Thi' : 'Cập Nhật Câu Hỏi'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-md shadow-md border border-slate-700 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.75} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/admin/content"
          className="hover:text-slate-900 font-medium inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Quản trị Kho Đề Khảo Thí</span>
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold line-clamp-1">{assessment.title}</span>
      </div>

      {/* Assessment Header Card */}
      <div className="p-6 rounded-md bg-white border border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                CHI TIẾT MA TRẬN ĐỀ KHẢO THÍ CHUẨN HÓA
              </span>

              {/* VIP / Free Badge */}
              <button
                type="button"
                onClick={handleToggleVip}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border transition-colors ${
                  assessment.is_vip
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
                title="Bấm để đổi hạng Free / VIP"
              >
                {assessment.is_vip ? (
                  <>
                    <Lock className="w-3 h-3 text-amber-700" strokeWidth={1.75} />
                    <span>HẠNG VIP (KHÓA)</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3 text-slate-500" strokeWidth={1.75} />
                    <span>HẠNG FREE (TỰ DO)</span>
                  </>
                )}
              </button>

              {/* Publish Toggle Badge */}
              <button
                type="button"
                onClick={handleTogglePublish}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                  assessment.is_published
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                }`}
                title="Bấm để phát hành hoặc ẩn bài thi"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    assessment.is_published ? 'bg-emerald-600' : 'bg-slate-400'
                  }`}
                />
                <span>{assessment.is_published ? 'ĐANG PHÁT HÀNH' : 'BẢN NHÁP (ẨN)'}</span>
              </button>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {assessment.title}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {assessment.description || 'Chưa có mô tả mục tiêu cho đề thi này.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={downloadCSVTemplate}
              className="px-3 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium inline-flex items-center gap-1.5"
              title="Tải tệp mẫu CSV UTF-8 để soạn thảo"
            >
              <Download className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
              <span>Tải Mẫu Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 rounded-md bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4 text-slate-600" strokeWidth={1.75} />
              <span>Nạp Tệp Vào Đề</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddQuestion}
              className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              <span>Thêm Câu Hỏi Mới</span>
            </button>
          </div>
        </div>

        {/* Quick parameters pill list */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-600 flex-wrap">
          <div className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            <span>Thời lượng: <strong className="text-slate-900">{assessment.duration_minutes} phút</strong></span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span>Chuẩn đạt: <strong className="text-slate-900">{assessment.passing_score}%</strong></span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <Award className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            <span>Thưởng: <strong className="text-emerald-700">+{assessment.point_reward} pts</strong></span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <FileText className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            <span>Tổng số: <strong className="text-slate-900">{items.length} câu hỏi</strong></span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span>Tổng điểm đề: <strong className="text-sky-700">{totalPoints} điểm</strong></span>
          </div>
        </div>
      </div>

      {/* Question Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
              <span>Ma Trận Câu Hỏi Trong Đề ({items.length})</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Danh sách chi tiết các câu hỏi, phân loại đơn/đa năng lực, đáp án chuẩn và tiêu chí Rubric thực hành.
            </p>
          </div>
        </div>

        {/* Inline editor card for creating new question */}
        {isAddingInline && renderInlineQuestionForm(true)}

        {items.length === 0 && !isAddingInline ? (
          <div className="p-12 rounded-md border border-dashed border-slate-200 bg-white text-center space-y-3">
            <FileCheck className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.75} />
            <h3 className="text-xs font-bold text-slate-800">Đề thi chưa có câu hỏi nào</h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Bạn có thể bấm &quot;Thêm Câu Hỏi Mới&quot; để soạn trực tiếp tại đây, hoặc bấm &quot;Nạp Tệp Vào Đề&quot; để nhập hàng loạt từ Excel/CSV trong vài giây.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleOpenAddQuestion}
                className="px-3.5 py-1.5 rounded bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 shadow-xs"
              >
                + Soạn Câu Hỏi Đầu Tiên
              </button>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-1.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium hover:bg-slate-200"
              >
                Nạp Từ Tệp CSV/JSON
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              if (editingItemId === item.id) {
                return (
                  <div key={item.id}>
                    {renderInlineQuestionForm(false, idx)}
                  </div>
                );
              }

              const itemTypeLabel =
                item.type === 'MCQ'
                  ? 'Trắc Nghiệm'
                  : item.type === 'SCENARIO'
                  ? 'Kịch Bản Tình Huống'
                  : 'Nhiệm Vụ Thực Hành';

              const skillLabel = item.competencies?.skill_code || '1.1';
              const targetCompetencies =
                item.target_competencies && item.target_competencies.length > 0
                  ? item.target_competencies
                  : [skillLabel];

              const isMulti = item.is_multi_competency || targetCompetencies.length > 1;

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-md bg-white border border-slate-200 space-y-3 hover:border-slate-300 transition-colors"
                >
                  {/* Top Bar of item */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        #{idx + 1}
                      </span>

                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                        {itemTypeLabel}
                      </span>

                      {/* Competency Tag */}
                      {isMulti ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Đa năng lực: {targetCompetencies.join(', ')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          Kỹ năng {skillLabel}
                        </span>
                      )}

                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        +{item.points} pts
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditQuestion(item)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Chỉnh sửa câu hỏi"
                      >
                        <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingItemId(item.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <p className="text-xs text-slate-900 font-medium leading-relaxed">
                    {item.prompt}
                  </p>

                  {/* Options if MCQ or Scenario */}
                  {(item.type === 'MCQ' || item.type === 'SCENARIO') &&
                    item.item_options &&
                    item.item_options.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        {item.item_options.map((opt, optIdx) => {
                          const optionLetter = String.fromCharCode(65 + optIdx);
                          return (
                            <div
                              key={opt.id || optIdx}
                              className={`p-2.5 rounded border text-xs flex items-start gap-2.5 ${
                                opt.is_correct
                                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium'
                                  : 'bg-slate-50/60 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                  opt.is_correct
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white text-slate-500 border border-slate-200'
                                }`}
                              >
                                {optionLetter}
                              </span>

                              <div className="flex-1">
                                <span>{opt.content}</span>
                                {opt.is_correct && (
                                  <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-800 font-semibold">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" strokeWidth={1.75} />
                                    <span>Đáp án chuẩn</span>
                                    {opt.explanation && (
                                      <span className="font-normal text-emerald-700 ml-1">
                                        — {opt.explanation}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  {/* Practical Task Rubric Display */}
                  {(item.type === 'PRACTICAL_TASK' ||
                    item.type === 'DIGITAL_EVIDENCE' ||
                    item.type === 'PRACTICAL') && (
                    <div className="p-3.5 rounded bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                        <span className="font-bold text-slate-900">
                          Tiêu chí &amp; Hướng dẫn chấm Rubric (Chuyên gia &amp; AI)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
                        {item.rubric_guide ||
                          'Chưa thiết lập tiêu chí Rubric. AI sẽ đánh giá theo chuẩn DigComp mặc định.'}
                      </p>
                      <div className="pl-6 pt-1 text-[10px] text-slate-400">
                        Học viên được phép nộp: Thuyết minh giải pháp (văn bản) + Tải tệp đính kèm + Dán link URL minh chứng.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Nạp Tệp Hàng Loạt Vào Đề Thi Này */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 w-full max-w-xl p-6 space-y-4 shadow-sm animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Nạp Câu Hỏi Từ Tệp Vào Đề: {assessment.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tải lên tệp CSV hoặc JSON chuẩn hóa để thêm hàng loạt câu hỏi vào đề hiện tại.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <div>
              <input
                type="file"
                accept=".csv,.json,text/csv,application/json"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
              />
            </div>

            {importError && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" strokeWidth={1.75} />
                <span>{importError}</span>
              </div>
            )}

            {importParsedItems.length > 0 && (
              <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs">
                <span className="font-semibold text-slate-800 block mb-1">
                  Đã phân tích: {importParsedItems.length} câu hỏi hợp lệ từ {importFileName}
                </span>
                <span className="text-[11px] text-slate-500">
                  Bấm &quot;Xác Nhận Nạp&quot; để bổ sung trực tiếp các câu hỏi này vào đề thi hiện tại.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isSubmittingImport || importParsedItems.length === 0}
                className="px-4 py-2 rounded bg-sky-600 text-white hover:bg-sky-700 text-xs font-semibold disabled:opacity-50"
              >
                {isSubmittingImport ? 'Đang nạp...' : `Xác Nhận Nạp ${importParsedItems.length} Câu Hỏi`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Item */}
      {deletingItemId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 w-full max-w-sm p-6 space-y-4 shadow-sm animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-50 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Xóa Câu Hỏi Khỏi Đề?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Câu hỏi sẽ bị xóa vĩnh viễn khỏi đề khảo thí này nếu chưa có học viên nào nộp bài làm liên quan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItemId(null)}
                className="px-3.5 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleDeleteItem(deletingItemId)}
                className="px-3.5 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
