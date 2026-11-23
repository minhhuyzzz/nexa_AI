'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Save,
  Sparkles,
  RefreshCw,
  Edit2,
  X,
  Search,
  SlidersHorizontal,
  ShieldAlert,
  FileSpreadsheet,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  FolderPlus,
} from 'lucide-react';
import { BaselinePreviewModal } from './BaselinePreviewModal';

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

interface BaselineSetSummary {
  id: string;
  title: string;
  isPublished: boolean;
  isActive: boolean;
  questionCount: number;
  createdAt: string;
}

interface Props {
  assessment: Assessment | null;
  domains: Domain[];
  competencies: Competency[];
  baselineSets?: BaselineSetSummary[];
}

// Bộ lọc kiểm duyệt nội dung, chặn triệt để dữ liệu rác / dữ liệu giả
function validateQuestionContent(
  prompt: string,
  options: { content: string; is_correct: boolean }[]
): string | null {
  const p = prompt.trim();
  if (p.length < 10) {
    return 'Nội dung câu hỏi phải có ít nhất 10 ký tự mang tính sư phạm và nghiệp vụ.';
  }

  // Chặn các từ ngữ thử nghiệm vô nghĩa
  const dummyPatterns = /^(haha|hihi|hehe|test|aaaa|bbbb|cccc|dddd|asdf|1234|qwer|zzz)/i;
  if (dummyPatterns.test(p) && p.length < 20) {
    return 'Vui lòng nhập nội dung câu hỏi thực tế, không dùng dữ liệu thử nghiệm hoặc chuỗi ký tự rác.';
  }

  for (let i = 0; i < options.length; i++) {
    const optContent = options[i].content.trim();
    if (optContent.length < 2) {
      return `Lựa chọn ${String.fromCharCode(65 + i)} phải có nội dung rõ ràng (tối thiểu 2 ký tự).`;
    }
    if (dummyPatterns.test(optContent) && optContent.length < 12) {
      return `Lựa chọn ${String.fromCharCode(65 + i)} chứa nội dung thử nghiệm ("${optContent}"). Vui lòng nhập đáp án thực tế.`;
    }
  }

  // Chặn các đáp án trùng lặp
  const uniqueContents = new Set(options.map((o) => o.content.trim().toLowerCase()));
  if (uniqueContents.size < options.length) {
    return 'Các lựa chọn đáp án không được trùng lặp nội dung.';
  }

  if (!options.some((o) => o.is_correct)) {
    return 'Vui lòng đánh dấu ít nhất 1 phương án là đáp án đúng.';
  }

  return null;
}

export function BaselineAdminClient({ assessment, domains, competencies, baselineSets = [] }: Props) {
  const router = useRouter();

  // State Quản lý bộ khảo sát
  const [showSetDropdown, setShowSetDropdown] = useState(false);
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [newSetTitle, setNewSetTitle] = useState('');
  const [isSubmittingSet, setIsSubmittingSet] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // State danh sách câu hỏi
  const [items, setItems] = useState<Item[]>(assessment?.assessment_items || []);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // State Tab lọc & Tìm kiếm
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // State Modal Xóa trắng
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearInputText, setClearInputText] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  // State Modal Xóa 1 câu
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // State Xuất Báo Cáo Khảo Sát
  const [isExportingSurvey, setIsExportingSurvey] = useState(false);

  // State Modal Xem Trước (Mô phỏng người học)
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // State Thu gọn / Mở rộng câu hỏi
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());
  const [isExpandAll, setIsExpandAll] = useState(false);

  const toggleExpandItem = (id: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (isExpandAll) {
      setExpandedItemIds(new Set());
      setIsExpandAll(false);
    } else {
      setExpandedItemIds(new Set(items.map((i) => i.id)));
      setIsExpandAll(true);
    }
  };

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

  // Helper tìm domainId từ competency
  const getDomainIdFromItem = useCallback((item: Item): string => {
    const comp = Array.isArray(item.competencies) ? item.competencies[0] : item.competencies;
    if (comp?.domain_id) return comp.domain_id;
    if (comp?.competency_domains?.code) {
      const d = domains.find((dom) => dom.code === comp.competency_domains.code);
      if (d) return d.id;
    }
    return domains[0]?.id || '';
  }, [domains]);

  // Helper tìm competencyId hợp lệ từ domainId
  const getCompetencyIdForDomain = (domainId: string): string => {
    const matched = competencies.find((c) => c.domain_id === domainId);
    return matched?.id || competencies[0]?.id || '';
  };

  // Tính số lượng câu hỏi thực tế của từng miền trong đề
  const domainItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    domains.forEach((d) => {
      counts[d.code] = 0;
    });

    items.forEach((it) => {
      const comp = Array.isArray(it.competencies) ? it.competencies[0] : it.competencies;
      const dom = Array.isArray(comp?.competency_domains)
        ? comp?.competency_domains[0]
        : comp?.competency_domains;
      const dCode = dom?.code;
      if (dCode && counts[dCode] !== undefined) {
        counts[dCode]++;
      } else if (comp?.domain_id) {
        const matched = domains.find((d) => d.id === comp.domain_id);
        if (matched) counts[matched.code]++;
      }
    });

    return counts;
  }, [items, domains]);

  // Danh sách câu hỏi sau khi lọc theo Tab và Search
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab !== 'ALL') {
        const dId = getDomainIdFromItem(item);
        if (dId !== activeTab) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchPrompt = item.prompt?.toLowerCase().includes(q);
        const matchOption = item.item_options?.some((o) => o.content?.toLowerCase().includes(q));
        if (!matchPrompt && !matchOption) return false;
      }
      return true;
    });
  }, [items, activeTab, searchQuery, getDomainIdFromItem]);

  if (!assessment) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          Chưa tìm thấy bản ghi khảo thí đầu vào
        </h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
          Hệ thống không tìm thấy đề khảo thí chuẩn mang mã a0000000-0000-0000-0000-000000000001.
        </p>
      </div>
    );
  }

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
    const validationError = validateQuestionContent(editPrompt, editOptions);
    if (validationError) {
      showToast('error', validationError);
      return;
    }

    setIsSavingEdit(true);
    try {
      const compId = getCompetencyIdForDomain(editDomainId);
      const res = await fetch(`/api/admin/assessments/${assessment.id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'MCQ',
          prompt: editPrompt.trim(),
          points: 1,
          competency_id: compId || undefined,
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
              item_options: editOptions.map((o) => ({
                id: o.id,
                content: o.content.trim(),
                is_correct: o.is_correct,
                explanation: o.explanation?.trim() || '',
              })),
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
    const validationError = validateQuestionContent(newPrompt, newOptions);
    if (validationError) {
      showToast('error', validationError);
      return;
    }

    setIsSubmittingNew(true);
    try {
      const compId = getCompetencyIdForDomain(newDomainId);
      const res = await fetch(`/api/admin/assessments/${assessment.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'MCQ',
          prompt: newPrompt.trim(),
          points: 1,
          competency_id: compId || undefined,
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
      showToast('success', 'Đã thêm câu hỏi trắc nghiệm mới thành công!');
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi thêm câu hỏi');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Xóa 1 câu hỏi
  const handleDeleteItem = async (itemId: string) => {
    setIsDeletingItem(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/assessments/${assessment.id}/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa câu hỏi');

      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setDeletingItemId(null);
      setDeleteError(null);
      showToast('success', 'Đã xóa câu hỏi khỏi bài khảo thí!');
    } catch (err: any) {
      setDeleteError(err.message || 'Lỗi xóa câu hỏi');
      showToast('error', err.message || 'Lỗi xóa câu hỏi');
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Xuất Báo Cáo Phân Tích Khảo Sát ra File Excel
  const handleExportSurveyExcel = async () => {
    if (isExportingSurvey) return;
    setIsExportingSurvey(true);
    try {
      const res = await fetch(`/api/admin/assessments/${assessment.id}/survey-export`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi tải dữ liệu khảo sát');

      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'NEXA AI Platform';
      workbook.created = new Date();

      // Sheet 1: Kết quả khảo sát học viên
      const ws1 = workbook.addWorksheet('Ket_Qua_Khao_Sat', {
        views: [{ showGridLines: true }],
      });

      ws1.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Họ và tên', key: 'name', width: 26 },
        { header: 'Email', key: 'email', width: 32 },
        { header: 'Thời gian nộp', key: 'submittedAt', width: 20 },
        { header: 'Tổng điểm (%)', key: 'totalScore', width: 16 },
        { header: 'M1: Dữ liệu (%)', key: 'd1', width: 16 },
        { header: 'M2: Giao tiếp (%)', key: 'd2', width: 16 },
        { header: 'M3: Sáng tạo (%)', key: 'd3', width: 16 },
        { header: 'M4: An toàn (%)', key: 'd4', width: 16 },
        { header: 'M5: Vấn đề số (%)', key: 'd5', width: 16 },
        { header: 'Miền cần bồi dưỡng', key: 'weakest', width: 22 },
      ];

      const headerRow1 = ws1.getRow(1);
      headerRow1.height = 28;
      headerRow1.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' },
        };
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      (data.participants || []).forEach((p: any) => {
        ws1.addRow({
          stt: p.stt,
          name: p.fullName,
          email: p.email,
          submittedAt: p.submittedAt,
          totalScore: `${p.totalScorePercent}%`,
          d1: `${p.domainScores?.['01'] ?? 0}%`,
          d2: `${p.domainScores?.['02'] ?? 0}%`,
          d3: `${p.domainScores?.['03'] ?? 0}%`,
          d4: `${p.domainScores?.['04'] ?? 0}%`,
          d5: `${p.domainScores?.['05'] ?? 0}%`,
          weakest: p.weakestDomain?.startsWith('M') ? p.weakestDomain : `Miền ${p.weakestDomain}`,
        });
      });

      // Sheet 2: Thống kê từng câu hỏi khảo sát
      const ws2 = workbook.addWorksheet('Thong_Ke_Cau_Hoi', {
        views: [{ showGridLines: true }],
      });

      ws2.columns = [
        { header: 'Câu số', key: 'num', width: 10 },
        { header: 'Miền năng lực', key: 'domain', width: 22 },
        { header: 'Nội dung câu hỏi', key: 'prompt', width: 45 },
        { header: 'Đáp án chuẩn', key: 'correctKey', width: 14 },
        { header: 'Tổng lượt trả lời', key: 'total', width: 16 },
        { header: 'Số lượt đúng', key: 'correct', width: 14 },
        { header: 'Tỷ lệ đúng (%)', key: 'rate', width: 16 },
        { header: 'Lựa chọn A (Nội dung)', key: 'optA_content', width: 28 },
        { header: 'Lựa chọn A (Số lượt)', key: 'optA_count', width: 18 },
        { header: 'Lựa chọn A (Tỷ lệ)', key: 'optA_pct', width: 16 },
        { header: 'Lựa chọn B (Nội dung)', key: 'optB_content', width: 28 },
        { header: 'Lựa chọn B (Số lượt)', key: 'optB_count', width: 18 },
        { header: 'Lựa chọn B (Tỷ lệ)', key: 'optB_pct', width: 16 },
        { header: 'Lựa chọn C (Nội dung)', key: 'optC_content', width: 28 },
        { header: 'Lựa chọn C (Số lượt)', key: 'optC_count', width: 18 },
        { header: 'Lựa chọn C (Tỷ lệ)', key: 'optC_pct', width: 16 },
        { header: 'Lựa chọn D (Nội dung)', key: 'optD_content', width: 28 },
        { header: 'Lựa chọn D (Số lượt)', key: 'optD_count', width: 18 },
        { header: 'Lựa chọn D (Tỷ lệ)', key: 'optD_pct', width: 16 },
      ];

      const headerRow2 = ws2.getRow(1);
      headerRow2.height = 28;
      headerRow2.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E40AF' },
        };
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      (data.questionAnalytics || []).forEach((q: any) => {
        const optA = q.optionStats?.[0];
        const optB = q.optionStats?.[1];
        const optC = q.optionStats?.[2];
        const optD = q.optionStats?.[3];
        const correctOpt = q.optionStats?.find((o: any) => o.isCorrect);

        ws2.addRow({
          num: q.questionNumber,
          domain: `${q.domainCode} - ${q.domainTitle}`,
          prompt: q.prompt,
          correctKey: correctOpt ? `Đáp án ${correctOpt.label}` : 'N/A',
          total: q.totalAnswers,
          correct: q.correctAnswers,
          rate: `${q.correctRate}%`,
          optA_content: optA?.content || '-',
          optA_count: optA?.count ?? 0,
          optA_pct: `${optA?.percent ?? 0}%`,
          optB_content: optB?.content || '-',
          optB_count: optB?.count ?? 0,
          optB_pct: `${optB?.percent ?? 0}%`,
          optC_content: optC?.content || '-',
          optC_count: optC?.count ?? 0,
          optC_pct: `${optC?.percent ?? 0}%`,
          optD_content: optD?.content || '-',
          optD_count: optD?.count ?? 0,
          optD_pct: `${optD?.percent ?? 0}%`,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `NEXA_Khao_Sat_Nang_Luc_So_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      showToast('success', 'Đã tải xuống file Excel phân tích khảo sát!');
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi khi xuất file Excel');
    } finally {
      setIsExportingSurvey(false);
    }
  };

  // Xóa trắng toàn bộ
  const handleClearAllItems = async () => {
    if (clearInputText.trim() !== 'XOA TRANG') {
      showToast('error', 'Vui lòng nhập chính xác "XOA TRANG" để xác nhận.');
      return;
    }

    setIsClearing(true);
    try {
      const res = await fetch(`/api/admin/assessments/${assessment.id}/items`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa toàn bộ câu hỏi');

      setItems([]);
      setShowClearConfirm(false);
      setClearInputText('');
      showToast('success', 'Đã xóa trắng toàn bộ câu hỏi!');
      router.refresh();
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi xóa câu hỏi');
    } finally {
      setIsClearing(false);
    }
  };

  // Tên miền hiện tại đang được chọn ở tab
  const activeDomain = domains.find((d) => d.id === activeTab);

  // Kiểm tra bộ hiện tại có phải đang kích hoạt không
  const currentSet = baselineSets.find((s) => s.id === assessment?.id);
  const isCurrentActive = currentSet?.isActive ?? true;

  // Tạo bộ khảo sát mới
  const handleCreateSet = async () => {
    if (!newSetTitle.trim() || newSetTitle.trim().length < 3) {
      showToast('error', 'Tên bộ khảo sát phải có ít nhất 3 ký tự');
      return;
    }
    setIsSubmittingSet(true);
    try {
      const res = await fetch('/api/admin/baseline-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: newSetTitle.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo bộ khảo sát');
      showToast('success', `Đã tạo "${newSetTitle.trim()}". Đang chuyển...`);
      setNewSetTitle('');
      setIsCreatingSet(false);
      // Navigate to the new set by reloading
      router.refresh();
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi tạo bộ khảo sát');
    } finally {
      setIsSubmittingSet(false);
    }
  };

  // Kích hoạt bộ khảo sát
  const handleActivateSet = async (setId: string) => {
    setIsActivating(true);
    try {
      const res = await fetch(`/api/admin/baseline-sets/${setId}/activate`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi kích hoạt');
      showToast('success', data.message || 'Đã kích hoạt bộ khảo sát!');
      router.refresh();
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi kích hoạt');
    } finally {
      setIsActivating(false);
    }
  };

  // Chuyển sang xem bộ khảo sát khác (reload page với bộ khác)
  const handleSwitchSet = async (setId: string) => {
    setShowSetDropdown(false);
    if (setId === assessment?.id) return;
    // Navigate to the same page — server will render the selected set
    // For now, we use a query param approach; page.tsx will read it
    router.push(`/admin/baseline?set=${setId}`);
    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* 1. Header Tinh Gọn — Tone Trắng / Đen chuẩn SaaS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
              Khảo Thí Đầu Vào Hệ Thống
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
              Tổng số câu:{' '}
              <strong className="text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                {items.length}
              </strong>
            </span>
            {isCurrentActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                ● Đang kích hoạt
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                Chưa kích hoạt (Nháp)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Đánh giá đầu vào
            </h1>

            {/* Dropdown Bộ Đề Khảo Sát */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSetDropdown((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs cursor-pointer"
                title="Chuyển đổi giữa các bộ đề khảo sát"
              >
                <span className="max-w-[200px] sm:max-w-[260px] truncate text-blue-600 dark:text-blue-400 font-medium">
                  {assessment?.title || 'Chọn bộ đề'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {showSetDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSetDropdown(false)}
                  />
                  <div className="absolute left-0 top-full mt-1.5 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                      Danh sách bộ khảo sát ({baselineSets.length})
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                      {baselineSets.map((s) => {
                        const isCurrent = s.id === assessment?.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSwitchSet(s.id)}
                            className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isCurrent
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                                : 'hover:bg-slate-50 dark:hover:bg-zinc-900 text-neutral-800 dark:text-zinc-200'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs truncate">{s.title}</div>
                              <div className="text-[11px] text-slate-400 dark:text-neutral-500 flex items-center gap-2 mt-0.5">
                                <span>{s.questionCount} câu hỏi</span>
                                <span>&bull;</span>
                                <span>{new Date(s.createdAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1">
                              {s.isActive && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  Đang dùng
                                </span>
                              )}
                              {isCurrent && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSetDropdown(false);
                          setIsCreatingSet(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>+ Tạo bộ khảo sát mới</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Nút Kích Hoạt nếu bộ này chưa được kích hoạt */}
            {!isCurrentActive && assessment && (
              <button
                type="button"
                onClick={() => handleActivateSet(assessment.id)}
                disabled={isActivating || items.length === 0}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                title={items.length === 0 ? 'Cần có ít nhất 1 câu hỏi để kích hoạt' : 'Đặt bộ đề này làm khảo thí đầu vào chính thức'}
              >
                {isActivating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>{isActivating ? 'Đang kích hoạt...' : 'Kích hoạt bộ đề này'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
          {/* Nút Tạo Bộ Khảo Sát Mới */}
          <button
            type="button"
            onClick={() => setIsCreatingSet(true)}
            className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            title="Tạo thêm một bộ khảo sát đầu vào mới (trạng thái Nháp)"
          >
            <FolderPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Tạo bộ mới</span>
          </button>

          {/* Nút Xem Trước Nhanh (Modal Popup mô phỏng người học) */}
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            title="Xem trước giao diện làm khảo sát của người học"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Xem trước</span>
          </button>

          {/* Nút Xuất Dữ Liệu Khảo Sát ra Excel */}
          <button
            type="button"
            onClick={handleExportSurveyExcel}
            disabled={isExportingSurvey}
            className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Tải bảng dữ liệu phân tích khảo sát ra file Excel (.xlsx)"
          >
            {isExportingSurvey ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{isExportingSurvey ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </button>

          {items.length > 0 && (
            <button
              onClick={() => {
                setClearInputText('');
                setShowClearConfirm(true);
              }}
              className="min-w-[44px] min-h-[44px] sm:min-h-0 p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 transition-colors shadow-xs flex items-center justify-center cursor-pointer"
              title="Xóa trắng bài thi (Thao tác nguy hiểm)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              if (activeTab !== 'ALL') {
                setNewDomainId(activeTab);
              }
              setIsAddingNew(true);
            }}
            className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeDomain ? `Thêm câu (${activeDomain.code})` : 'Thêm câu hỏi mới'}
            </span>
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
            <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span className="font-medium">{toast.text}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Form Thêm Câu Hỏi Mới — Chuẩn hóa sư phạm, chống text rác */}
      {isAddingNew && (
        <div className="bg-white dark:bg-[#111114] border-2 border-blue-600/70 dark:border-blue-500/70 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                +
              </span>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Thêm câu hỏi khảo thí mới (Câu {items.length + 1})
              </h3>
            </div>
            <button
              onClick={() => setIsAddingNew(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                Nội dung câu hỏi (Prompt) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Ví dụ: Khi nhận được email yêu cầu cung cấp thông tin đăng nhập từ ngân hàng, hành động an toàn nhất là gì?"
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
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
              4 Lựa chọn trả lời (Tích chọn 1 đáp án đúng):
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {newOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-all ${
                    opt.is_correct
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
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
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-700'
                      }`}
                      title="Chọn làm đáp án đúng"
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

                  <input
                    type="text"
                    value={opt.explanation || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewOptions((prev) =>
                        prev.map((o, i) => (i === idx ? { ...o, explanation: val } : o))
                      );
                    }}
                    placeholder={`Giải thích sư phạm cho đáp án ${String.fromCharCode(65 + idx)} (tùy chọn)...`}
                    className="text-[11px] text-slate-500 dark:text-neutral-400 bg-transparent pl-8 focus:outline-hidden placeholder:text-slate-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850"
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

      {/* 4. Tab Lọc Theo Miền & Thanh Tìm Kiếm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ALL'
                ? 'bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Tất cả ({items.length})
          </button>
          {domains.map((dom) => {
            const count = domainItemCounts[dom.code] || 0;
            const isTab = activeTab === dom.id;
            return (
              <button
                key={dom.id}
                type="button"
                onClick={() => setActiveTab(dom.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isTab
                    ? 'bg-white dark:bg-[#111114] text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {dom.code} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Nút Thu gọn / Mở rộng tất cả đáp án */}
          <button
            type="button"
            onClick={toggleExpandAll}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs font-semibold text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
            title={isExpandAll ? 'Thu gọn đáp án của tất cả câu hỏi' : 'Mở rộng đáp án của tất cả câu hỏi'}
          >
            {isExpandAll ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isExpandAll ? 'Thu gọn đáp án' : 'Xem hết đáp án'}</span>
          </button>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo nội dung câu hỏi..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Danh Sách Câu Hỏi Theo Miền */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Không tìm thấy câu hỏi phù hợp
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              {searchQuery
                ? `Không có câu hỏi nào khớp với từ khóa "${searchQuery}".`
                : 'Miền năng lực này hiện chưa có câu hỏi nào trong đề chuẩn.'}
            </p>
          </div>
          <div>
            <button
              onClick={() => {
                if (activeTab !== 'ALL') setNewDomainId(activeTab);
                setIsAddingNew(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm câu hỏi mới</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, localIdx) => {
            const isEditing = editingItemId === item.id;
            const comp = Array.isArray(item.competencies) ? item.competencies[0] : item.competencies;
            const dom = Array.isArray(comp?.competency_domains)
              ? comp?.competency_domains[0]
              : comp?.competency_domains;

            if (isEditing) {
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#111114] border-2 border-blue-600 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      Đang chỉnh sửa câu hỏi: {item.prompt.slice(0, 50)}...
                    </span>
                    <button
                      onClick={() => setEditingItemId(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                        Nội dung câu hỏi <span className="text-red-500">*</span>
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
                        {domains.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.code}: {d.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 4 Phương án */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {editOptions.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl border flex flex-col gap-2 ${
                          opt.is_correct
                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                            : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
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

                        <input
                          type="text"
                          value={opt.explanation || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditOptions((prev) =>
                              prev.map((o, i) => (i === oIdx ? { ...o, explanation: val } : o))
                            );
                          }}
                          placeholder={`Giải thích đáp án ${String.fromCharCode(65 + oIdx)} (tùy chọn)...`}
                          className="text-[11px] text-slate-500 dark:text-neutral-400 bg-transparent pl-8 focus:outline-hidden placeholder:text-slate-400"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingItemId(null)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 hover:bg-slate-50"
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

            const isExpanded = expandedItemIds.has(item.id) || isExpandAll;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 font-mono font-bold text-xs flex items-center justify-center shrink-0 tabular-nums">
                      {localIdx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {dom?.code && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40">
                            {dom.code}: {dom.title}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">
                          Trắc nghiệm chuẩn hóa
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                        {item.prompt}
                      </h4>
                    </div>
                  </div>

                  {/* Hành động xem đáp án / sửa / xóa */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleExpandItem(item.id)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer ${
                        isExpanded
                          ? 'border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                      }`}
                      title={isExpanded ? 'Thu gọn đáp án' : 'Xem chi tiết 4 đáp án'}
                    >
                      <span>{item.item_options?.length || 4} đáp án</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleStartEdit(item)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-semibold text-neutral-700 dark:text-zinc-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>

                    <button
                      onClick={() => setDeletingItemId(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Danh sách 4 đáp án (Chỉ mở ra khi toggle) */}
                {isExpanded && item.item_options && item.item_options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9 pt-1 animate-in fade-in duration-150">
                    {item.item_options.map((opt, oIdx) => (
                      <div
                        key={opt.id || oIdx}
                        className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 ${
                          opt.is_correct
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-50/60 border-slate-200/70 text-neutral-800 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              opt.is_correct
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="truncate font-medium">{opt.content}</span>
                          {opt.is_correct && (
                            <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                              (Đáp án đúng)
                            </span>
                          )}
                        </div>
                        {opt.explanation && (
                          <div className="pl-7 text-[11px] text-slate-500 dark:text-neutral-400 italic">
                            {opt.explanation}
                          </div>
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

      {/* 6. Modal Xác Nhận Xóa 1 Câu */}
      {deletingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Xóa câu hỏi khỏi bài khảo sát?
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Câu hỏi và dữ liệu trả lời liên quan sẽ được dọn sạch khỏi đề thi.
              </p>
              {deleteError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400">
                  {deleteError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingItemId(null);
                  setDeleteError(null);
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={() => handleDeleteItem(deletingItemId)}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingItem && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeletingItem ? 'Đang xóa...' : 'Xác nhận xóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Xác Nhận Xóa Trắng Toàn Bộ (Bảo Mật Hai Lớp) */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Xóa trắng toàn bộ {items.length} câu hỏi?
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                Hành động này sẽ xóa sạch tất cả các câu hỏi của bài khảo thí đầu vào trên production. Để tránh sơ suất bấm nhầm, vui lòng gõ chính xác chữ <strong className="text-red-600 font-mono">XOA TRANG</strong> vào ô dưới đây để mở khóa nút xóa.
              </p>
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                value={clearInputText}
                onChange={(e) => setClearInputText(e.target.value)}
                placeholder="Nhập: XOA TRANG"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearInputText('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isClearing || clearInputText.trim() !== 'XOA TRANG'}
                onClick={handleClearAllItems}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-opacity"
              >
                {isClearing ? 'Đang xóa...' : 'Xác nhận xóa trắng'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 8. Modal Xem Trước Khảo Sát (Mô phỏng người học) */}
      <BaselinePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        items={items}
        assessmentTitle={assessment.title}
      />

      {/* 9. Modal Tạo Bộ Khảo Sát Mới */}
      {isCreatingSet && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FolderPlus className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Tạo bộ khảo sát đầu vào mới
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Khảo thí chuẩn hóa đo lường năng lực số
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingSet(false);
                  setNewSetTitle('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-800 dark:text-zinc-200">
                Tên bộ khảo sát
              </label>
              <input
                type="text"
                value={newSetTitle}
                onChange={(e) => setNewSetTitle(e.target.value)}
                placeholder="Ví dụ: Đánh Giá Năng Lực Số (Đợt 2 - 2026)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSetTitle.trim().length >= 3 && !isSubmittingSet) {
                    handleCreateSet();
                  }
                }}
              />
              <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                Bộ khảo sát mới sẽ ở trạng thái <strong>Nháp</strong>. Bạn có thể soạn câu hỏi hoàn chỉnh rồi bấm <strong>Kích hoạt</strong> để áp dụng cho người học.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingSet(false);
                  setNewSetTitle('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateSet}
                disabled={isSubmittingSet || newSetTitle.trim().length < 3}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmittingSet && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmittingSet ? 'Đang tạo...' : 'Tạo bộ khảo sát'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
