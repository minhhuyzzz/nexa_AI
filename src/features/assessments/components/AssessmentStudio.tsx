'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Award,
  ShieldCheck,
  FileText,
  Layers,
  Lock,
  Unlock,
  Check,
  X,
  FileCheck,
  ChevronUp,
  ChevronDown,
  Loader2,
  Radio,
  BookOpen,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import {
  downloadMCQTemplate,
  downloadScenarioTemplate,
  downloadPracticalTemplate,
  parseMCQCSV,
  parseScenarioCSV,
  parsePracticalCSV,
  type ParsedItemRow,
  type RubricCriterion,
} from '@/features/assessments/utils/csv-helper';
import { QuestionBankDrawer } from './QuestionBankDrawer';
import { PublishValidationModal } from './PublishValidationModal';
import { RubricBuilder } from '@/components/dashboard/assessments/RubricBuilder';
import type { RubricDefinition } from '@/features/assessments/types/rubric.types';

export interface AssessmentStudioProps {
  role: 'ADMIN' | 'EVALUATOR';
  assessmentId?: string;
  organizationId?: string;
  returnUrl?: string;
}

const DOMAIN_OPTIONS = [
  { id: 1, code: '01', title: 'Thông tin & Dữ liệu' },
  { id: 2, code: '02', title: 'Giao tiếp & Cộng tác' },
  { id: 3, code: '03', title: 'Sáng tạo Nội dung & AI' },
  { id: 4, code: '04', title: 'An toàn & Bảo mật' },
  { id: 5, code: '05', title: 'Giải quyết Vấn đề' },
];

export function AssessmentStudio({
  role,
  assessmentId,
  organizationId,
  returnUrl,
}: AssessmentStudioProps) {
  const router = useRouter();
  const backHref = returnUrl || (role === 'ADMIN' ? '/admin/content' : '/personal/authoring');

  // General Settings State
  const [title, setTitle] = useState('Đề Khảo Thí Năng Lực Số');
  const [description, setDescription] = useState('Bài khảo thí chuẩn hóa đo lường năng lực số.');
  const [selectedDomains, setSelectedDomains] = useState<number[]>([1]);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [passingScore, setPassingScore] = useState(70);
  const [assessmentType, setAssessmentType] = useState<'CERTIFICATION' | 'PRACTICE' | 'DIAGNOSTIC'>('CERTIFICATION');
  const [accessTier, setAccessTier] = useState<'FREE' | 'VIP'>('FREE');
  const [proctoringMode, setProctoringMode] = useState<'PRACTICE' | 'STANDARD' | 'SUPERVISED_LIVE' | 'HIGH_STAKES'>('STANDARD');
  const [isPublished, setIsPublished] = useState(false);

  // Questions State & Current Selected Index & Inspector Tab
  const [questions, setQuestions] = useState<ParsedItemRow[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [inspectorTab, setInspectorTab] = useState<'EXAM' | 'QUESTION'>('EXAM');

  // Loading & Saving State
  const [isLoading, setIsLoading] = useState<boolean>(!!assessmentId);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Bulk Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<'MCQ' | 'SCENARIO' | 'PRACTICAL'>('MCQ');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importPreviewItems, setImportPreviewItems] = useState<ParsedItemRow[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [showQuestionBankDrawer, setShowQuestionBankDrawer] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Existing Assessment if editing
  const loadExistingAssessment = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/assessments/${id}`);
      if (!res.ok) throw new Error('Không thể tải bài khảo thí');
      const data = await res.json();
      const asm = data.assessment;

      if (asm) {
        setTitle(asm.title || 'Đề khảo thí');
        setDescription(asm.description || '');
        setDurationMinutes(asm.duration_minutes || 45);
        setPassingScore(Number(asm.passing_score) || 70);
        setIsPublished(Boolean(asm.is_published));
        setAccessTier(asm.access_tier || (asm.is_vip ? 'VIP' : 'FREE'));

        // Parse items
        const rawItems = asm.assessment_items || [];
        const loadedQuestions: ParsedItemRow[] = rawItems.map((item: any) => {
          let type: 'MCQ' | 'SCENARIO' | 'PRACTICAL' = 'MCQ';
          if (item.type === 'SCENARIO') type = 'SCENARIO';
          else if (
            item.type === 'PRACTICAL' ||
            item.type === 'DIGITAL_EVIDENCE' ||
            item.type === 'PRACTICAL_TASK' ||
            item.type === 'PRACTICAL_FILE'
          ) {
            type = 'PRACTICAL';
          }

          // Options
          const opts = item.item_options || [];
          const optA = opts[0]?.content || '';
          const optB = opts[1]?.content || '';
          const optC = opts[2]?.content || '';
          const optD = opts[3]?.content || '';
          const correctOpt = opts.find((o: any) => o.is_correct);
          let correctKey = 'A';
          if (correctOpt) {
            const idx = opts.indexOf(correctOpt);
            correctKey = ['A', 'B', 'C', 'D'][idx] || 'A';
          }

          // Context extraction if scenario
          let prompt = item.prompt || '';
          let scenarioContext = '';
          if (prompt.startsWith('[Bối cảnh]:')) {
            const split = prompt.split('\n\n[Câu hỏi]:');
            if (split.length >= 2) {
              scenarioContext = split[0].replace('[Bối cảnh]:', '').trim();
              prompt = split.slice(1).join('\n\n[Câu hỏi]:').trim();
            }
          }

          const domainNum = Number(item.competencies?.competency_domains?.code) || 1;

          let structuredRubric: RubricDefinition | undefined = undefined;
          const rub = (item.rubrics && item.rubrics.length > 0) ? item.rubrics[0] : item.rubric;
          if (rub && rub.rubric_criteria) {
            structuredRubric = {
              title: rub.title || 'Rubric chấm điểm',
              itemId: item.id,
              criteria: (rub.rubric_criteria || []).map((c: any) => ({
                id: c.id,
                name: c.name || '',
                description: c.description || '',
                maxPoints: Number(c.max_points) || 5,
                weightPercent: Number(c.weight_percent) || 50,
                orderIndex: c.order_index ?? 0,
                levels: (c.rubric_levels || []).map((l: any) => ({
                  id: l.id,
                  levelName: l.name || l.levelName || '',
                  scorePercent: Number(l.score_percent ?? l.scorePercent) || 0,
                  description: l.description || '',
                })),
              })),
            };
          }

          return {
            type,
            domain: domainNum,
            domains: [domainNum],
            prompt,
            scenario_context: scenarioContext,
            option_a: optA,
            option_b: optB,
            option_c: optC,
            option_d: optD,
            correct_answer: correctKey,
            explanation: correctOpt?.explanation || '',
            rubric_guide: item.rubric_guide || '',
            structured_rubric: structuredRubric,
            points: Number(item.points) || 10,
          };
        });

        setQuestions(loadedQuestions);
        if (loadedQuestions.length > 0) {
          const doms = [...new Set(loadedQuestions.map((q) => q.domain || 1))];
          setSelectedDomains(doms);
        }
      }
    } catch (err) {
      console.error('Error loading assessment:', err);
      setErrorMessage('Không thể tải dữ liệu bài khảo thí này.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (assessmentId) {
      loadExistingAssessment(assessmentId);
    }
  }, [assessmentId, loadExistingAssessment]);

  // Current Question
  const currentQuestion = questions[selectedIndex];

  // Add Question Helpers
  const handleAddQuestion = (type: 'MCQ' | 'SCENARIO' | 'PRACTICAL') => {
    const primaryDomain = selectedDomains[0] || 1;
    let newQ: ParsedItemRow;

    if (type === 'MCQ') {
      newQ = {
        type: 'MCQ',
        domain: primaryDomain,
        domains: [primaryDomain],
        prompt: 'Nhập nội dung câu hỏi trắc nghiệm...',
        option_a: 'Lựa chọn A',
        option_b: 'Lựa chọn B',
        option_c: 'Lựa chọn C',
        option_d: 'Lựa chọn D',
        correct_answer: 'A',
        explanation: 'Giải thích vì sao phương án A là chính xác.',
        points: 10,
      };
    } else if (type === 'SCENARIO') {
      newQ = {
        type: 'SCENARIO',
        domain: primaryDomain,
        domains: [primaryDomain],
        scenario_context: 'Mô tả bối cảnh tình huống thực tế phát sinh tại môi trường số...',
        prompt: 'Với vai trò người xử lý, giải pháp nào sau đây là tối ưu nhất?',
        option_a: 'Phương án xử lý A',
        option_b: 'Phương án xử lý B',
        option_c: 'Phương án xử lý C',
        option_d: 'Phương án xử lý D',
        correct_answer: 'B',
        explanation: 'Giải thích cơ sở quyết định phương án tối ưu theo tiêu chuẩn năng lực số.',
        points: 15,
      };
    } else {
      newQ = {
        type: 'PRACTICAL',
        domain: primaryDomain,
        domains: [primaryDomain],
        prompt: 'Yêu cầu thực hành: Hãy xây dựng sản phẩm số và nộp minh chứng...',
        submission_type: 'BOTH',
        rubric_criteria: [
          { name: 'Đúng chuẩn yêu cầu sản phẩm', weight: 50 },
          { name: 'Kỹ năng vận dụng công cụ số & Trình bày', weight: 50 },
        ],
        rubric_guide: 'Tiêu chí chấm: 1. Đúng chuẩn yêu cầu sản phẩm (50%); 2. Kỹ năng vận dụng công cụ số & Trình bày (50%).',
        points: 20,
      };
    }

    setQuestions((prev) => [...prev, newQ]);
    setSelectedIndex(questions.length);
    setInspectorTab('QUESTION');
  };

  // Update current question field
  const updateCurrentQuestion = (fields: Partial<ParsedItemRow>) => {
    if (selectedIndex < 0 || selectedIndex >= questions.length) return;
    setQuestions((prev) => {
      const updated = [...prev];
      updated[selectedIndex] = { ...updated[selectedIndex], ...fields };
      return updated;
    });
  };

  // Delete question
  const handleDeleteQuestion = (indexToDelete: number) => {
    const nextQuestions = questions.filter((_, i) => i !== indexToDelete);
    setQuestions(nextQuestions);
    if (nextQuestions.length === 0) {
      setSelectedIndex(0);
      setInspectorTab('EXAM');
    } else {
      const nextIdx = Math.max(0, Math.min(selectedIndex >= indexToDelete ? selectedIndex - 1 : selectedIndex, nextQuestions.length - 1));
      setSelectedIndex(nextIdx);
      setInspectorTab('QUESTION');
    }
  };

  // Smart 100-Point Allocation Algorithm (Exact 100.0 with remainder added to last question)
  const handleAutoBalance100Points = () => {
    if (questions.length === 0) return;
    const N = questions.length;
    const basePoint = Math.floor((100 / N) * 10) / 10;
    const allocatedSum = Number((basePoint * (N - 1)).toFixed(1));
    const lastPoint = Number((100 - allocatedSum).toFixed(1));

    const updated = questions.map((q, idx) => ({
      ...q,
      points: idx === N - 1 ? lastPoint : basePoint,
    }));
    setQuestions(updated);
    showToast(`Đã tự động cân bằng 100 điểm cho ${N} câu hỏi (${basePoint}đ/câu, câu cuối ${lastPoint}đ).`);
  };

  // Move Question up/down
  const handleMoveQuestion = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === questions.length - 1) return;

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    setQuestions((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
    setSelectedIndex(targetIndex);
  };

  // Bulk Import File Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportErrors([]);
    setImportPreviewItems([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      let result;
      if (importTab === 'MCQ') {
        result = parseMCQCSV(content);
      } else if (importTab === 'SCENARIO') {
        result = parseScenarioCSV(content);
      } else {
        result = parsePracticalCSV(content);
      }

      setImportErrors(result.errors);
      setImportPreviewItems(result.items);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleConfirmImport = () => {
    if (importPreviewItems.length === 0) return;
    setQuestions((prev) => [...prev, ...importPreviewItems]);
    setShowImportModal(false);
    setImportPreviewItems([]);
    setImportErrors([]);
    setImportFileName('');
    showToast(`Đã nạp thành công ${importPreviewItems.length} câu hỏi vào đề thi!`);
  };

  // Toggle Domains
  const toggleDomain = (domainId: number) => {
    setSelectedDomains((prev) => {
      if (prev.includes(domainId)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== domainId);
      }
      return [...prev, domainId].sort((a, b) => a - b);
    });
  };

  const selectAllDomains = () => {
    setSelectedDomains([1, 2, 3, 4, 5]);
  };

  // Save / Publish
  const handleSaveAssessment = async (publish: boolean, openLiveRoom = false) => {
    if (!title.trim()) {
      setErrorMessage('Tiêu đề bài khảo thí không được để trống.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      let targetAssessmentId = assessmentId;

      if (!targetAssessmentId) {
        // Create assessment
        const res = await fetch('/api/admin/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            duration_minutes: durationMinutes,
            passing_score: passingScore,
            point_reward: 50,
            is_vip: accessTier === 'VIP',
            access_tier: accessTier,
            is_published: publish,
            organization_id: organizationId || null,
          }),
        });

        if (!res.ok) throw new Error('Không thể tạo bài khảo thí mới');
        const data = await res.json();
        targetAssessmentId = data.assessment.id;
      } else {
        // Update existing assessment
        const res = await fetch(`/api/admin/assessments/${targetAssessmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            duration_minutes: durationMinutes,
            passing_score: passingScore,
            is_vip: accessTier === 'VIP',
            access_tier: accessTier,
            is_published: publish,
            organization_id: organizationId || null,
          }),
        });

        if (!res.ok) throw new Error('Không thể cập nhật cấu hình bài khảo thí');
      }

      // Sync / Import Questions if questions exist
      if (questions.length > 0 && targetAssessmentId) {
        const importRes = await fetch(`/api/admin/assessments/${targetAssessmentId}/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: questions }),
        });

        if (!importRes.ok) {
          console.warn('Questions import sync warning');
        }
      }

      showToast(
        publish
          ? 'Đã công khai đề thi thành công! Học viên có thể nhìn thấy ngay.'
          : 'Đã lưu bài khảo thí thành công!'
      );

      if (openLiveRoom && targetAssessmentId) {
        router.push(`/personal/live-room?assessmentId=${targetAssessmentId}`);
      } else if (!assessmentId) {
        // If newly created, replace url or go to list
        router.push(backHref);
      } else {
        setIsPublished(publish);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu bài khảo thí');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculations
  const totalQuestions = questions.length;
  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 0), 0);
  const mcqCount = questions.filter((q) => q.type === 'MCQ').length;
  const scenarioCount = questions.filter((q) => q.type === 'SCENARIO').length;
  const practicalCount = questions.filter((q) => q.type === 'PRACTICAL').length;

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-3" strokeWidth={1.75} />
        <p className="text-xs font-medium">Đang nạp trình soạn thảo Assessment Studio...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col bg-white border border-slate-200 rounded-md">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-md shadow-md border border-slate-700 flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.75} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP ACTION BAR (Fixed) */}
      <header className="h-14 px-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
          <Link
            href={backHref}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Quay lại danh mục"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          </Link>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề đề khảo thí..."
              className="text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-600 focus:outline-none transition-colors px-1 py-0.5 w-full max-w-md truncate"
            />

            <span
              className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                isPublished
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPublished ? 'bg-emerald-600' : 'bg-slate-400'
                }`}
              />
              <span>{isPublished ? 'Đã phát hành' : 'Bản nháp'}</span>
            </span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {errorMessage && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-rose-600 font-medium mr-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              <span className="truncate max-w-[200px]">{errorMessage}</span>
            </div>
          )}

          {role === 'ADMIN' ? (
            <>
              <button
                type="button"
                onClick={() => handleSaveAssessment(false)}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu bản nháp'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPublishModal(true)}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{isSaving ? 'Đang xử lý...' : 'Công khai sang Người học'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSaveAssessment(false)}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu đề thi'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPublishModal(true)}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
              >
                <Radio className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{isSaving ? 'Đang mở...' : 'Kiểm Định & Mở Phòng Live'}</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* 2. 3-COLUMN SPLIT PANE BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* COLUMN 1: QUESTION NAVIGATOR (Width: 280px) */}
        <aside className="w-72 border-r border-slate-200 bg-slate-50/70 flex flex-col shrink-0 overflow-hidden">
          {/* Top Quick Add Bar */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleAddQuestion('MCQ')}
                className="py-1.5 px-2 rounded border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 text-[11px] font-semibold text-slate-700 flex flex-col items-center justify-center transition-colors"
                title="Thêm câu trắc nghiệm 4 lựa chọn"
              >
                <Plus className="w-3.5 h-3.5 text-sky-600 mb-0.5" strokeWidth={2} />
                <span>Trắc nghiệm</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddQuestion('SCENARIO')}
                className="py-1.5 px-2 rounded border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 text-[11px] font-semibold text-slate-700 flex flex-col items-center justify-center transition-colors"
                title="Thêm câu hỏi tình huống thực tế"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-600 mb-0.5" strokeWidth={2} />
                <span>Tình huống</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddQuestion('PRACTICAL')}
                className="py-1.5 px-2 rounded border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 text-[11px] font-semibold text-slate-700 flex flex-col items-center justify-center transition-colors"
                title="Thêm bài thực hành và rubric"
              >
                <FileCheck className="w-3.5 h-3.5 text-sky-600 mb-0.5" strokeWidth={2} />
                <span>Thực hành</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="w-full py-1.5 px-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
              <span>Nạp hàng loạt từ Excel/CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQuestionBankDrawer(true)}
              className="w-full py-1.5 px-2 rounded border border-sky-200 bg-sky-50/60 hover:bg-sky-100 text-sky-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
              <span>Chọn từ Ngân Hàng Câu Hỏi</span>
            </button>
          </div>

          {/* Navigator Header */}
          <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-500 uppercase tracking-wider">
              Câu hỏi ({questions.length})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAutoBalance100Points}
                disabled={questions.length === 0}
                className="px-2 py-0.5 rounded bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-sky-700 text-[10px] font-bold flex items-center gap-1 transition-colors disabled:opacity-40"
                title="Tự động chia đều và dồn số dư chính xác 100.0 điểm"
              >
                <Sparkles className="w-2.5 h-2.5 text-sky-600" />
                <span>Cân bằng 100đ</span>
              </button>
              <span className={`font-mono font-bold text-xs tabular-nums px-1.5 py-0.5 rounded ${
                Math.round(totalPoints) === 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
              }`}>
                {totalPoints.toFixed(1)}đ
              </span>
            </div>
          </div>

          {/* Questions Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {questions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
                <p className="text-xs">Chưa có câu hỏi nào trong đề.</p>
                <p className="text-[11px] text-slate-400">Bấm các nút phía trên để thêm câu hỏi.</p>
              </div>
            ) : (
              questions.map((q, idx) => {
                const isSelected = idx === selectedIndex;
                const typeLabel =
                  q.type === 'MCQ' ? 'MCQ' : q.type === 'SCENARIO' ? 'T.HUỐNG' : 'T.HÀNH';

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedIndex(idx);
                      setInspectorTab('QUESTION');
                    }}
                    className={`p-2 rounded-md border text-left cursor-pointer transition-colors relative group ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-800 tabular-nums">
                          Câu {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {typeLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                          {q.points || 10}đ
                        </span>

                        {/* Order & Delete Actions */}
                        <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveQuestion(idx, 'UP');
                            }}
                            disabled={idx === 0}
                            className="p-0.5 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30"
                            title="Di chuyển lên"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveQuestion(idx, 'DOWN');
                            }}
                            disabled={idx === questions.length - 1}
                            className="p-0.5 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30"
                            title="Di chuyển xuống"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuestion(idx);
                            }}
                            className="p-0.5 rounded hover:bg-rose-100 text-rose-500 ml-0.5"
                            title="Xóa câu này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {q.prompt || '(Chưa nhập nội dung câu hỏi)'}
                    </p>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Miền {q.domain || 1}</span>
                      {q.type === 'MCQ' && <span>Đáp án: {q.correct_answer || 'A'}</span>}
                      {q.type === 'SCENARIO' && <span>Tối ưu: {q.correct_answer || 'B'}</span>}
                      {q.type === 'PRACTICAL' && <span>{q.submission_type || 'BOTH'}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* COLUMN 2: LIVE QUESTION CANVAS EDITOR (Flex-1) */}
        <main className="flex-1 overflow-y-auto bg-white p-6">
          {!currentQuestion ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-slate-400">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" strokeWidth={1.5} />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Chưa chọn câu hỏi nào để chỉnh sửa</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Chọn một câu hỏi ở danh sách bên trái hoặc bấm nút thêm câu hỏi mới để bắt đầu biên soạn trực tiếp trên canvas.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleAddQuestion('MCQ')}
                  className="px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Trắc nghiệm</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('SCENARIO')}
                  className="px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <span>+ Tình huống</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Question Header & Type indicator */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
                    Câu {String(selectedIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {currentQuestion.type === 'MCQ'
                      ? 'Trắc Nghiệm Khách Quan'
                      : currentQuestion.type === 'SCENARIO'
                      ? 'Tình Huống Thực Tế'
                      : 'Bài Tập Thực Hành & Rubric'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Điểm số:</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={currentQuestion.points || 10}
                    onChange={(e) => updateCurrentQuestion({ points: Number(e.target.value) || 10 })}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-center border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:border-sky-600"
                  />
                  <span className="text-xs text-slate-500">điểm</span>
                </div>
              </div>

              {/* DẠNG 1: TRẮC NGHIỆM (MCQ) */}
              {currentQuestion.type === 'MCQ' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                      Nội dung câu hỏi trắc nghiệm (Prompt):
                    </label>
                    <textarea
                      rows={3}
                      value={currentQuestion.prompt}
                      onChange={(e) => updateCurrentQuestion({ prompt: e.target.value })}
                      placeholder="Nhập câu hỏi tại đây..."
                      className="w-full p-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-sky-600 bg-slate-50/50 focus:bg-white leading-relaxed resize-y"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-800">
                        4 Phương án lựa chọn (Click radio để chọn đáp án đúng):
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Đáp án đúng hiện tại: <strong className="text-emerald-700 font-mono">{currentQuestion.correct_answer || 'A'}</strong>
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {(['A', 'B', 'C', 'D'] as const).map((key) => {
                        const optKey = `option_${key.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c' | 'option_d';
                        const isCorrect = (currentQuestion.correct_answer || 'A').toUpperCase() === key;

                        return (
                          <div
                            key={key}
                            className={`flex items-center gap-3 p-2.5 rounded-md border transition-colors ${
                              isCorrect
                                ? 'bg-emerald-50/50 border-emerald-300'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <label className="flex items-center gap-2 cursor-pointer shrink-0">
                              <input
                                type="radio"
                                name={`correct_${selectedIndex}`}
                                checked={isCorrect}
                                onChange={() => updateCurrentQuestion({ correct_answer: key })}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span
                                className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {key}
                              </span>
                            </label>

                            <input
                              type="text"
                              value={currentQuestion[optKey] || ''}
                              onChange={(e) => updateCurrentQuestion({ [optKey]: e.target.value })}
                              placeholder={`Nội dung phương án ${key}...`}
                              className="flex-1 p-2 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:border-sky-600"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Giải thích đáp án &amp; Căn cứ học thuật:
                    </label>
                    <textarea
                      rows={2}
                      value={currentQuestion.explanation || ''}
                      onChange={(e) => updateCurrentQuestion({ explanation: e.target.value })}
                      placeholder="Giải thích vì sao phương án trên là chính xác (sẽ hiển thị khi xem lại bài thi)..."
                      className="w-full p-2.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-sky-600 bg-slate-50/50 focus:bg-white text-slate-700"
                    />
                  </div>
                </div>
              )}

              {/* DẠNG 2: TÌNH HUỐNG (SCENARIO) */}
              {currentQuestion.type === 'SCENARIO' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                    <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                      <span>Bối cảnh tình huống thực tế (Scenario Context Box):</span>
                    </label>
                    <textarea
                      rows={3}
                      value={currentQuestion.scenario_context || ''}
                      onChange={(e) => updateCurrentQuestion({ scenario_context: e.target.value })}
                      placeholder="Mô tả bối cảnh tình huống phát sinh (Ví dụ: sự cố an toàn dữ liệu, bất đồng trong nhóm làm việc từ xa, tấn công mạng giả mạo...)..."
                      className="w-full p-3 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:border-sky-600 leading-relaxed resize-y"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                      Câu hỏi xử lý tình huống:
                    </label>
                    <textarea
                      rows={2}
                      value={currentQuestion.prompt}
                      onChange={(e) => updateCurrentQuestion({ prompt: e.target.value })}
                      placeholder="Ví dụ: Với vai trò người phụ trách, bạn sẽ thực hiện chuỗi hành động nào để giải quyết vấn đề trên an toàn nhất?"
                      className="w-full p-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-sky-600 bg-slate-50/50 focus:bg-white leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-800">
                        Các phương án hành động (Chọn phương án xử lý tối ưu nhất):
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Phương án tối ưu: <strong className="text-emerald-700 font-mono">{currentQuestion.correct_answer || 'B'}</strong>
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {(['A', 'B', 'C', 'D'] as const).map((key) => {
                        const optKey = `option_${key.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c' | 'option_d';
                        const isCorrect = (currentQuestion.correct_answer || 'B').toUpperCase() === key;

                        return (
                          <div
                            key={key}
                            className={`flex items-center gap-3 p-2.5 rounded-md border transition-colors ${
                              isCorrect
                                ? 'bg-emerald-50/50 border-emerald-300'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <label className="flex items-center gap-2 cursor-pointer shrink-0">
                              <input
                                type="radio"
                                name={`correct_scenario_${selectedIndex}`}
                                checked={isCorrect}
                                onChange={() => updateCurrentQuestion({ correct_answer: key })}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span
                                className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {key}
                              </span>
                            </label>

                            <input
                              type="text"
                              value={currentQuestion[optKey] || ''}
                              onChange={(e) => updateCurrentQuestion({ [optKey]: e.target.value })}
                              placeholder={`Mô tả phương án hành động ${key}...`}
                              className="flex-1 p-2 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:border-sky-600"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Giải thích phương án tối ưu:
                    </label>
                    <textarea
                      rows={2}
                      value={currentQuestion.explanation || ''}
                      onChange={(e) => updateCurrentQuestion({ explanation: e.target.value })}
                      placeholder="Phân tích vì sao đây là hành động giải quyết tình huống đúng nguyên tắc và đạo đức số..."
                      className="w-full p-2.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-sky-600 bg-slate-50/50 focus:bg-white text-slate-700"
                    />
                  </div>
                </div>
              )}

              {/* DẠNG 3: BÀI TẬP THỰC HÀNH & RUBRIC (PRACTICAL) */}
              {currentQuestion.type === 'PRACTICAL' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                      Đề bài sản phẩm thực hành &amp; Yêu cầu nhiệm vụ:
                    </label>
                    <textarea
                      rows={4}
                      value={currentQuestion.prompt}
                      onChange={(e) => updateCurrentQuestion({ prompt: e.target.value })}
                      placeholder="Mô tả chi tiết sản phẩm cần tạo (Ví dụ: thiết kế infographic an toàn dữ liệu, phân tích bảng dữ liệu khảo sát trên Google Sheets kèm biểu đồ...)..."
                      className="w-full p-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-sky-600 bg-slate-50/50 focus:bg-white leading-relaxed resize-y"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                      Hình thức nộp bài cho phép:
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'FILE', label: 'Chỉ tải tệp tin', desc: 'PDF, DOCX, ZIP, PNG...' },
                        { id: 'LINK', label: 'Chỉ dán liên kết số', desc: 'Canva, Figma, Drive, Docs...' },
                        { id: 'BOTH', label: 'Cả hai hình thức', desc: 'Linh hoạt cho thí sinh' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateCurrentQuestion({ submission_type: item.id as any })}
                          className={`p-3 rounded-md border text-left transition-colors ${
                            (currentQuestion.submission_type || 'BOTH') === item.id
                              ? 'bg-sky-50 border-sky-600 text-sky-900 font-semibold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs">{item.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rubric Criteria Builder (MOD-01) */}
                  <div className="pt-2">
                    <RubricBuilder
                      itemMaxPoints={currentQuestion.points || 10}
                      initialRubric={currentQuestion.structured_rubric}
                      onChange={(rubric) => {
                        updateCurrentQuestion({
                          structured_rubric: rubric,
                          rubric_guide: rubric
                            ? rubric.criteria
                                .map((c, i) => `${i + 1}. ${c.name} (${c.maxPoints}đ, ${c.weightPercent}%)`)
                                .join('; ')
                            : '',
                          rubric_criteria: rubric
                            ? rubric.criteria.map((c) => ({
                                name: c.name,
                                weight: c.weightPercent ?? 0,
                              }))
                            : [],
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* COLUMN 3: SETTINGS INSPECTOR (Width: 320px) */}
        <aside className="w-80 border-l border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden">
          {/* Segmented Tab Bar with Auto-Switch */}
          <div className="p-3 border-b border-slate-200 bg-slate-50 shrink-0">
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-200/80 rounded-md text-xs font-semibold">
              <button
                type="button"
                onClick={() => setInspectorTab('EXAM')}
                className={`py-1.5 rounded transition-all flex items-center justify-center gap-1.5 ${
                  inspectorTab === 'EXAM'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                <span>Cấu hình Đề thi</span>
              </button>
              <button
                type="button"
                disabled={!currentQuestion}
                onClick={() => setInspectorTab('QUESTION')}
                className={`py-1.5 rounded transition-all flex items-center justify-center gap-1.5 ${
                  inspectorTab === 'QUESTION'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                <span>Câu #{selectedIndex + 1}</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {inspectorTab === 'EXAM' ? (
              /* TAB 1: CẤU HÌNH ĐỀ THI */
              <div className="space-y-4">
                {/* 1. Auto-Aggregated DigComp Domain Tags */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>Miền năng lực DigComp 3.0:</span>
                    <span className="font-mono text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {Array.from(new Set(questions.map((q) => q.domain || 1))).length}/5 Miền
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {DOMAIN_OPTIONS.map((d) => {
                      const count = questions.filter((q) => (q.domain || 1) === d.id).length;
                      const isCovered = count > 0;

                      return (
                        <div
                          key={d.id}
                          className={`p-2 rounded border text-xs flex items-center justify-between transition-colors ${
                            isCovered
                              ? 'bg-sky-50/60 border-sky-300 text-sky-950 font-medium'
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                          }`}
                        >
                          <span className="truncate">
                            Miền {d.code}: {d.title}
                          </span>
                          {isCovered && (
                            <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded shrink-0 ml-1">
                              {count} câu
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    * Miền năng lực được tự động tổng hợp từ từng câu hỏi trong đề.
                  </p>
                </div>

                {/* 2. Proctoring Toggle Switches */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <label className="text-xs font-semibold text-slate-800 block">
                    Chế độ Giám sát Khảo thí:
                  </label>

                  {/* Switch 1: Anti-cheat / Fullscreen */}
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-800">
                        Giám sát chuyển tab
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        {proctoringMode !== 'PRACTICE'
                          ? 'Đang bật: Phát hiện và cảnh báo khi thí sinh chuyển tab'
                          : 'Đang tắt: Chế độ ôn luyện tự do, cho phép tra cứu'}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={proctoringMode !== 'PRACTICE'}
                      onClick={() => setProctoringMode(proctoringMode === 'PRACTICE' ? 'STANDARD' : 'PRACTICE')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        proctoringMode !== 'PRACTICE' ? 'bg-sky-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          proctoringMode !== 'PRACTICE' ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Switch 2: Supervised Live */}
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-800">
                        Đồng bộ Giám thị trực tiếp
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        {proctoringMode === 'SUPERVISED_LIVE'
                          ? 'Đang bật: Truyền sự kiện vi phạm tức thời tới Giám thị'
                          : 'Đang tắt: Không đồng bộ phòng thi trực tiếp'}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={proctoringMode === 'SUPERVISED_LIVE'}
                      onClick={() => setProctoringMode(proctoringMode === 'SUPERVISED_LIVE' ? 'STANDARD' : 'SUPERVISED_LIVE')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        proctoringMode === 'SUPERVISED_LIVE' ? 'bg-sky-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          proctoringMode === 'SUPERVISED_LIVE' ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Switch 3: High Stakes */}
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-800">
                        Bảo mật cao (Khóa bài khi vi phạm 3 lần)
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        {proctoringMode === 'HIGH_STAKES'
                          ? 'Đang bật: Tự động khóa và nộp bài nếu chuyển tab 3 lần'
                          : 'Đang tắt: Chỉ ghi nhật ký, không tự động khóa bài'}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={proctoringMode === 'HIGH_STAKES'}
                      onClick={() => setProctoringMode(proctoringMode === 'HIGH_STAKES' ? 'STANDARD' : 'HIGH_STAKES')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        proctoringMode === 'HIGH_STAKES' ? 'bg-sky-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          proctoringMode === 'HIGH_STAKES' ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* 3. Duration */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-800 block mb-1">
                    Thời lượng làm bài:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={300}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value) || 45)}
                      className="w-full p-2 text-xs border border-slate-200 rounded-md font-mono focus:border-sky-600 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500 font-mono shrink-0">phút</span>
                  </div>
                </div>

                {/* 4. Access Tier (Admin only) */}
                {role === 'ADMIN' && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Phân hạng quyền truy cập:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccessTier('FREE')}
                        className={`p-2 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                          accessTier === 'FREE'
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>FREE</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccessTier('VIP')}
                        className={`p-2 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                          accessTier === 'VIP'
                            ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>VIP</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : currentQuestion ? (
              /* TAB 2: THUỘC TÍNH CÂU HỎI */
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                    <span>Thuộc tính câu #{selectedIndex + 1}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentQuestion.type}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">
                    Miền năng lực DigComp của câu:
                  </label>
                  <select
                    value={currentQuestion.domain || 1}
                    onChange={(e) => updateCurrentQuestion({ domain: Number(e.target.value) })}
                    className="w-full p-2 text-xs border border-slate-200 rounded-md bg-white text-slate-800 focus:border-sky-600 focus:outline-none"
                  >
                    {DOMAIN_OPTIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        Miền {d.code}: {d.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">
                    Điểm số của câu:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0.1}
                      max={100}
                      step={0.1}
                      value={currentQuestion.points || 10}
                      onChange={(e) => updateCurrentQuestion({ points: Number(e.target.value) || 0 })}
                      className="w-full p-2 text-xs border border-slate-200 rounded-md font-mono focus:border-sky-600 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500 font-mono shrink-0">điểm</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      {/* 3. BULK IMPORT MODAL (3 TABS) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md shadow-md max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                <span>Nạp Hàng Loạt Câu Hỏi Từ Tệp Excel/CSV</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Tabs */}
            <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => {
                  setImportTab('MCQ');
                  setImportPreviewItems([]);
                  setImportErrors([]);
                }}
                className={`py-1.5 text-xs font-semibold rounded text-center transition-colors ${
                  importTab === 'MCQ'
                    ? 'bg-sky-50 text-sky-800 border border-sky-300'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Trắc Nghiệm
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportTab('SCENARIO');
                  setImportPreviewItems([]);
                  setImportErrors([]);
                }}
                className={`py-1.5 text-xs font-semibold rounded text-center transition-colors ${
                  importTab === 'SCENARIO'
                    ? 'bg-sky-50 text-sky-800 border border-sky-300'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Tình Huống
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportTab('PRACTICAL');
                  setImportPreviewItems([]);
                  setImportErrors([]);
                }}
                className={`py-1.5 text-xs font-semibold rounded text-center transition-colors ${
                  importTab === 'PRACTICAL'
                    ? 'bg-sky-50 text-sky-800 border border-sky-300'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Thực Hành &amp; Rubric
              </button>
            </div>

            {/* Template Download Prompt */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                Chưa có mẫu chuẩn? Tải file mẫu{' '}
                <strong>
                  {importTab === 'MCQ'
                    ? 'Trắc nghiệm'
                    : importTab === 'SCENARIO'
                    ? 'Tình huống'
                    : 'Thực hành'}
                </strong>:
              </span>
              <button
                type="button"
                onClick={() => {
                  if (importTab === 'MCQ') downloadMCQTemplate();
                  else if (importTab === 'SCENARIO') downloadScenarioTemplate();
                  else downloadPracticalTemplate();
                }}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 text-xs font-medium inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải mẫu</span>
              </button>
            </div>

            {/* File Input */}
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">
                Chọn tệp CSV / Excel (UTF-8):
              </label>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="w-full p-2 text-xs border border-slate-200 rounded bg-slate-50 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
              />
            </div>

            {/* Errors */}
            {importErrors.length > 0 && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1 max-h-32 overflow-y-auto">
                <div className="font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Phát hiện lỗi trong tệp ({importErrors.length}):</span>
                </div>
                {importErrors.map((err, i) => (
                  <div key={i} className="text-[11px] pl-4">
                    &bull; {err}
                  </div>
                ))}
              </div>
            )}

            {/* Preview Success */}
            {importPreviewItems.length > 0 && (
              <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <span className="font-semibold">
                  Sẵn sàng nạp {importPreviewItems.length} câu hỏi hợp lệ!
                </span>
                <span className="text-[11px]">
                  Tổng {importPreviewItems.reduce((acc, q) => acc + (q.points || 0), 0)} điểm
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importPreviewItems.length === 0}
                className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Nạp vào đề thi ({importPreviewItems.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Question Bank Drawer */}
      <QuestionBankDrawer
        isOpen={showQuestionBankDrawer}
        onClose={() => setShowQuestionBankDrawer(false)}
        onAddQuestions={(newQuestions) => {
          setQuestions((prev) => [...prev, ...newQuestions]);
          showToast(`Đã thêm ${newQuestions.length} câu hỏi từ ngân hàng vào bài thi!`);
        }}
      />

      {/* 5. Pre-publish Validation Modal */}
      <PublishValidationModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        metadata={{
          title,
          durationMinutes,
          passingScore,
        }}
        questions={questions}
        isPublishing={isSaving}
        onSelectQuestionToFix={(idx) => {
          setSelectedIndex(idx);
          setInspectorTab('QUESTION');
        }}
        onConfirmPublish={() => {
          setShowPublishModal(false);
          handleSaveAssessment(true, role !== 'ADMIN');
        }}
      />
    </div>
  );
}
