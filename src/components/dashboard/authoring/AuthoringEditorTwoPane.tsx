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
  Copy,
  UploadCloud,
  Link2,
  FileCode,
  Sliders,
  Scale,
  Send,
  Loader2,
  Eye,
  Clock,
  X,
  Building2,
  Users,
  Lock,
  Key,
  Globe,
  Radio,
  BookOpen,
  Shield,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  AuthoringAssessment,
  AuthoringQuestionItem,
  QuestionType,
  MCQOption,
} from '@/features/assessments/types/authoring-v2.types';
import { SecuritySettingsCard } from '@/features/assessments/components/SecuritySettingsCard';
import {
  AssessmentSecuritySettings,
  DEFAULT_SECURITY_SETTINGS,
} from '@/features/assessments/types/security.types';

export type AuthoringWorkspaceMode = 'ADMIN' | 'ORG' | 'PERSONAL';

interface AuthoringEditorTwoPaneProps {
  assessmentId: string;
  returnUrl?: string;
  previewUrl?: string;
  organizationId?: string;
  workspaceMode?: AuthoringWorkspaceMode;
  slug?: string;
}

export function AuthoringEditorTwoPane({
  assessmentId,
  returnUrl = '/personal/authoring',
  previewUrl,
  organizationId,
  workspaceMode,
  slug,
}: AuthoringEditorTwoPaneProps) {
  const router = useRouter();
  const supabase = createClient();

  const effectiveMode: AuthoringWorkspaceMode =
    workspaceMode ||
    (organizationId || returnUrl.includes('/org/')
      ? 'ORG'
      : returnUrl.includes('/admin/')
      ? 'ADMIN'
      : 'PERSONAL');

  const [assessment, setAssessment] = useState<AuthoringAssessment | null>(null);
  const [questions, setQuestions] = useState<AuthoringQuestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [mobileTab, setMobileTab] = useState<'list' | 'editor'>('list');
  const [loading, setLoading] = useState(true);

  // Autosave & Status
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Vừa xong');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Settings & Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishDuration, setPublishDuration] = useState(45);
  const [publishPassingScore, setPublishPassingScore] = useState(70);
  const [publishIsVip, setPublishIsVip] = useState(false);

  // Polymorphic Modal States
  const [modalTab, setModalTab] = useState<'GENERAL' | 'SECURITY'>('GENERAL');
  const [orgScope, setOrgScope] = useState<'ORG_WIDE' | 'ASSIGNED_CLASSES' | 'ACCESS_PIN'>('ORG_WIDE');
  const [accessPin, setAccessPin] = useState('');
  const [personalPublishMode, setPersonalPublishMode] = useState<'PRIVATE' | 'LIVE_ROOM' | 'COMMUNITY'>('PRIVATE');
  const [securitySettings, setSecuritySettings] = useState<AssessmentSecuritySettings>(DEFAULT_SECURITY_SETTINGS);

  // Drawer

  // Score computation & Validation
  const currentTotalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  const isScaleBalanced = Math.round(currentTotalPoints) === 100;

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
            is_vip,
            access_tier,
            organization_id,
            security_settings,
            created_at,
            updated_at
          `)
          .eq('id', assessmentId)
          .single();

        if (asmError || !asm) throw new Error('Không tìm thấy đề đánh giá');

        if (asm.duration_minutes) setPublishDuration(asm.duration_minutes);
        if (asm.passing_score) setPublishPassingScore(asm.passing_score);
        if (asm.is_vip !== undefined) setPublishIsVip(asm.is_vip);
        if (asm.security_settings) setSecuritySettings(asm.security_settings);

        // Fetch questions with item_options
        const { data: items, error: itemsError } = await supabase
          .from('assessment_items')
          .select(`
            id,
            prompt,
            type,
            points,
            context,
            submission_modes,
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
              points: item.points ?? 10,
              domainCode,
              domainTitle: dom?.title,
              context: item.context || undefined,
              scenarioContext: item.context || undefined,
              allowedSubmissionModes: Array.isArray(item.submission_modes)
                ? item.submission_modes
                : ['TEXT', 'FILE', 'URL'],
              practicalGuide: item.rubric_guide || '',
              options:
                qType !== 'PRACTICAL'
                  ? options.length > 0
                    ? options
                    : [
                        { id: 'opt-1', text: 'Phương án A', isCorrect: true },
                        { id: 'opt-2', text: 'Phương án B', isCorrect: false },
                        { id: 'opt-3', text: 'Phương án C', isCorrect: false },
                        { id: 'opt-4', text: 'Phương án D', isCorrect: false },
                      ]
                  : undefined,
            };
          });
        } else {
          parsedQuestions = [];
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

        setIsPublished(Boolean(asm.is_published));
        setQuestions(parsedQuestions);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Lỗi tải dữ liệu đề');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [assessmentId, supabase]);

  // 2. Autosave function (preserves question points)
  const saveChanges = useCallback(
    async (itemsToSave: AuthoringQuestionItem[]) => {
      setIsSaving(true);
      try {
        const res = await fetch(`/api/personal/assessments/${assessmentId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalScale: 100,
            questions: itemsToSave,
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
    [assessmentId]
  );

  // Manual Auto-balance handler: distributes 100 points evenly across all questions
  const handleAutoBalance = () => {
    if (questions.length === 0) return;
    const count = questions.length;
    const basePts = Math.floor(100 / count);
    const remainder = 100 - basePts * count;
    const balanced = questions.map((q, idx) => ({
      ...q,
      points: idx === count - 1 ? basePts + remainder : basePts,
    }));
    setQuestions(balanced);
    saveChanges(balanced);
  };

  // Question manipulation helpers
  const handleAddQuestion = (type: QuestionType) => {
    const isPractical = type === 'PRACTICAL' || type === 'OPEN_RESPONSE';
    const defaultPts = questions.length > 0 ? Math.max(1, Math.floor(100 / (questions.length + 1))) : 100;
    const newQ: AuthoringQuestionItem = {
      id: `q-${Date.now()}`,
      type: isPractical ? 'PRACTICAL' : 'MCQ',
      prompt: isPractical
        ? 'Nhiệm vụ thực hành / Tự luận...'
        : 'Nhập câu hỏi trắc nghiệm mới...',
      points: defaultPts,
      domainCode: '01',
      allowedSubmissionModes: isPractical ? ['TEXT', 'FILE', 'URL'] : undefined,
      practicalGuide: isPractical
        ? 'Tiêu chuẩn đánh giá: Kiểm tra tính đúng đắn, đầy đủ và minh chứng nộp bài.'
        : undefined,
      options: !isPractical
        ? [
            { id: `opt-${Date.now()}-1`, text: 'Phương án A', isCorrect: true },
            { id: `opt-${Date.now()}-2`, text: 'Phương án B', isCorrect: false },
            { id: `opt-${Date.now()}-3`, text: 'Phương án C', isCorrect: false },
            { id: `opt-${Date.now()}-4`, text: 'Phương án D', isCorrect: false },
          ]
        : undefined,
    };

    setQuestions((prev) => {
      const updated = [...prev, newQ];
      saveChanges(updated);
      return updated;
    });
    setSelectedIndex(questions.length);
    setMobileTab('editor');
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

  // Publish / Unpublish handler
  const handleTogglePublish = async () => {
    if (questions.length === 0) {
      alert('Vui lòng thêm ít nhất 1 câu hỏi trước khi phát hành đề thi.');
      return;
    }

    // Nếu đang là bản nháp -> Mở modal cài đặt thời gian & phân hạng trước khi phát hành
    if (!isPublished) {
      setIsPublishModalOpen(true);
      return;
    }

    // Nếu đang phát hành -> Chuyển về trạng thái bản nháp
    setIsPublishing(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/personal/assessments/${assessmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: false }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật trạng thái thất bại');
      }

      setIsPublished(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Có lỗi khi cập nhật trạng thái đề thi');
    } finally {
      setIsPublishing(false);
    }
  };

  // Xác nhận phát hành kèm cài đặt thời gian, ngưỡng đạt, phân hạng theo ngữ cảnh
  const handleConfirmPublishWithSettings = async () => {
    setIsPublishing(true);
    setErrorMessage(null);

    try {
      // 1. Lưu câu hỏi mới nhất trước khi chuyển trạng thái
      await fetch(`/api/personal/assessments/${assessmentId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalScale: 100,
          questions,
        }),
      });

      // 2. Cập nhật theo từng Workspace Mode:
      if (effectiveMode === 'ADMIN') {
        const res = await fetch(`/api/admin/assessments/${assessmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_published: true,
            duration_minutes: Number(publishDuration) || 45,
            passing_score: Number(publishPassingScore) || 70,
            is_vip: publishIsVip,
            access_tier: publishIsVip ? 'VIP' : 'FREE',
            security_settings: securitySettings,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Cập nhật trạng thái phát hành toàn sàn thất bại');
      } else if (effectiveMode === 'ORG') {
        const res = await fetch(`/api/personal/assessments/${assessmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_published: true,
            duration_minutes: Number(publishDuration) || 45,
            passing_score: Number(publishPassingScore) || 70,
            visibility: 'ORGANIZATION',
            security_settings: securitySettings,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Phát hành đề thi nội bộ thất bại');
      } else {
        // PERSONAL
        const res = await fetch(`/api/personal/assessments/${assessmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_published: true,
            duration_minutes: Number(publishDuration) || 45,
            passing_score: Number(publishPassingScore) || 70,
            visibility: personalPublishMode === 'COMMUNITY' ? 'PUBLIC' : 'PERSONAL',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Xuất bản đề thi cá nhân thất bại');
      }

      setIsPublished(true);
      setIsPublishModalOpen(false);

      // Chuyển hướng về trang danh sách đề
      router.push(returnUrl);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Có lỗi khi phát hành đề thi');
    } finally {
      setIsPublishing(false);
    }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <Link
            href={returnUrl}
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
              {isPublished ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Sẵn sàng
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Bản nháp
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isSaving ? 'Đang lưu tự động...' : `Đã lưu tự động lúc ${lastSavedTime}`}
            </div>
          </div>
        </div>

        {/* Right actions: Balance Status + Auto-balance + Tools + Next */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* Total score balance indicator */}
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 tabular-nums transition ${
              isScaleBalanced
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : currentTotalPoints < 100
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}
          >
            {isScaleBalanced ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>100/100 điểm</span>
              </>
            ) : currentTotalPoints < 100 ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{currentTotalPoints}/100đ (Thiếu {100 - currentTotalPoints}đ)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{currentTotalPoints}/100đ (Thừa {currentTotalPoints - 100}đ)</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleAutoBalance}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
            title="Tự động chia đều điểm các câu sao cho tổng bằng 100"
          >
            <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Cân bằng về 100</span>
          </button>


          {previewUrl && (
            <Link
              href={previewUrl}
              target="_blank"
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Xem trước</span>
            </Link>
          )}

          {/* Nút Phát hành đề thi */}
          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={isPublishing}
            className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer ${
              isPublished
                ? 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title={isPublished ? 'Chuyển về trạng thái bản nháp' : 'Phát hành chính thức để đưa vào danh mục Đề thi sẵn sàng'}
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isPublished ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isPublishing ? 'Đang lưu...' : isPublished ? 'Chuyển về bản nháp' : 'Phát hành đề thi'}</span>
          </button>

          {/* Nút Lưu nháp & Thoát */}
          <Link
            href={returnUrl}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <span>{isPublished ? 'Thoát' : 'Lưu nháp & Thoát'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-1.5 rounded-lg text-center transition ${
            mobileTab === 'list'
              ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Danh sách câu hỏi ({questions.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-1.5 rounded-lg text-center transition ${
            mobileTab === 'editor'
              ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Soạn câu #{selectedIndex + 1}
        </button>
      </div>

      {/* 2. Main Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Pane: Question List Sidebar (4 cols) */}
        <div className={`lg:col-span-4 p-4 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3 ${
          mobileTab === 'editor' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Danh sách câu hỏi ({questions.length})
            </span>

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
            {questions.length === 0 ? (
              <div className="py-8 px-3 text-center rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 text-xs text-slate-400">
                Chưa có câu hỏi nào.
                <div className="mt-1 text-[11px] text-slate-500">
                  Bấm &quot;+ Trắc nghiệm&quot; hoặc &quot;+ Thực hành&quot; ở trên để tạo câu mới.
                </div>
              </div>
            ) : (
              questions.map((q, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setMobileTab('editor');
                  }}
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
                        {q.type === 'PRACTICAL' || q.type === 'OPEN_RESPONSE' ? 'Tự luận / Thực hành' : 'Trắc nghiệm'}
                      </span>
                      <span>•</span>
                      <span className="font-mono font-semibold text-slate-600 dark:text-zinc-400">
                        {q.points ?? 1}đ
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
            }))}
          </div>
        </div>

        {/* Right Pane: Question Detail Editor or Empty State (8 cols) */}
        {currentQ ? (
          <div className={`lg:col-span-8 p-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6 ${
            mobileTab === 'list' ? 'hidden lg:block' : 'block'
          }`}>
            {/* Meta bar for current question */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-2">
              {/* Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Loại câu hỏi</label>
                <select
                  value={currentQ.type === 'SCENARIO' ? 'MCQ' : currentQ.type}
                  onChange={(e) => {
                    const newType = e.target.value as QuestionType;
                    const isPractical = newType === 'PRACTICAL';
                    updateCurrentQuestion({
                      type: newType,
                      allowedSubmissionModes: isPractical ? ['TEXT', 'FILE', 'URL'] : undefined,
                      options: !isPractical && (!currentQ.options || currentQ.options.length === 0)
                        ? [
                            { id: `opt-${Date.now()}-1`, text: 'Phương án A', isCorrect: true },
                            { id: `opt-${Date.now()}-2`, text: 'Phương án B', isCorrect: false },
                            { id: `opt-${Date.now()}-3`, text: 'Phương án C', isCorrect: false },
                            { id: `opt-${Date.now()}-4`, text: 'Phương án D', isCorrect: false },
                          ]
                        : currentQ.options,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-neutral-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="MCQ">Trắc nghiệm</option>
                  <option value="PRACTICAL">Tự luận / Thực hành</option>
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

              {/* Points (Editable, balanced to 100) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Điểm câu hỏi</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={currentQ.points ?? 1}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                      updateCurrentQuestion({ points: val });
                    }}
                    className="w-20 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                  />
                  <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">điểm</span>
                </div>
              </div>
            </div>

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
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                    Các phương án lựa chọn
                  </h3>

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
              <div className="space-y-5 pt-2">
                {/* 1. Accepted submission formats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                      Hình thức nộp bài minh chứng của học viên
                    </h3>
                    <span className="text-[10px] text-slate-400">Chọn ít nhất 1 hình thức</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label
                      className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition select-none ${
                        (currentQ.allowedSubmissionModes || ['TEXT', 'FILE', 'URL']).includes('FILE')
                          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
                          : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(currentQ.allowedSubmissionModes || ['TEXT', 'FILE', 'URL']).includes('FILE')}
                        onChange={(e) => {
                          const modes = new Set(currentQ.allowedSubmissionModes || ['TEXT', 'FILE', 'URL']);
                          if (e.target.checked) modes.add('FILE');
                          else if (modes.size > 1) modes.delete('FILE');
                          updateCurrentQuestion({ allowedSubmissionModes: Array.from(modes) as any });
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          Tệp đính kèm
                        </div>
                        <div className="text-[10px] text-slate-400">PDF, Word, Ảnh, ZIP</div>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition select-none ${
                        (currentQ.allowedSubmissionModes || ['TEXT', 'FILE', 'URL']).includes('URL')
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(currentQ.allowedSubmissionModes || ['TEXT', 'FILE', 'URL']).includes('URL')}
                        onChange={(e) => {
                          const modes = new Set(currentQ.allowedSubmissionModes || ['TEXT', 'FILE', 'URL']);
                          if (e.target.checked) modes.add('URL');
                          else if (modes.size > 1) modes.delete('URL');
                          updateCurrentQuestion({ allowedSubmissionModes: Array.from(modes) as any });
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <Link2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          Liên kết trực tuyến
                        </div>
                        <div className="text-[10px] text-slate-400">Drive, Figma, GitHub</div>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition select-none ${
                        (currentQ.allowedSubmissionModes || ['TEXT', 'FILE', 'URL']).includes('TEXT')
                          ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/30'
                          : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(currentQ.allowedSubmissionModes || ['TEXT', 'FILE', 'URL']).includes('TEXT')}
                        onChange={(e) => {
                          const modes = new Set(currentQ.allowedSubmissionModes || ['TEXT', 'FILE', 'URL']);
                          if (e.target.checked) modes.add('TEXT');
                          else if (modes.size > 1) modes.delete('TEXT');
                          updateCurrentQuestion({ allowedSubmissionModes: Array.from(modes) as any });
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <FileCode className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          Văn bản trực tiếp
                        </div>
                        <div className="text-[10px] text-slate-400">Nhập bài giải trình</div>
                      </div>
                    </label>
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

                  {/* Informative Workbench Flow Banner */}
                  <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-blue-800 dark:text-blue-300">Luồng chấm bài thực hành:</span>
                      <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
                        Học viên sẽ nộp Tệp (Word/Excel/ảnh) hoặc Đường dẫn (Google Drive/Figma). Bài làm sẽ tự động chuyển vào <strong>Bàn chấm bài (Grading Workbench)</strong> để giảng viên mở sản phẩm thực tế và chấm điểm theo barem này.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`lg:col-span-8 p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] space-y-4 ${
            mobileTab === 'list' ? 'hidden lg:block' : 'block'
          }`}>
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
              <FileText className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Chưa có câu hỏi nào trong đề
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto mt-1">
                Hãy bắt đầu bằng cách thêm câu hỏi trắc nghiệm hoặc bài tập thực hành.
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
            </div>
          </div>
        )}
      </div>

      {/* 3. Modal Cài đặt & Phát hành đề thi */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  {effectiveMode === 'ORG' ? (
                    <Building2 className="w-4 h-4" />
                  ) : effectiveMode === 'ADMIN' ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {effectiveMode === 'ORG'
                      ? 'Cài đặt & Phát hành đề thi nội bộ'
                      : effectiveMode === 'ADMIN'
                      ? 'Cài đặt & Phát hành đề chuẩn Quốc gia'
                      : 'Cài đặt & Xuất bản đề cá nhân'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    {effectiveMode === 'ORG'
                      ? 'Khảo thí Tổ chức & Doanh nghiệp'
                      : effectiveMode === 'ADMIN'
                      ? 'Quản trị Nền tảng'
                      : 'Luyện tập & Chia sẻ cộng đồng'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Pill for ORG and ADMIN */}
            {effectiveMode !== 'PERSONAL' && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl">
                <button
                  type="button"
                  onClick={() => setModalTab('GENERAL')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    modalTab === 'GENERAL'
                      ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {effectiveMode === 'ORG' ? '1. Thông số & Phạm vi giao bài' : '1. Thông số & Phân hạng gói'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('SECURITY')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    modalTab === 'SECURITY'
                      ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  2. Giám thị & Bảo mật
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {modalTab === 'SECURITY' && effectiveMode !== 'PERSONAL' ? (
                <div className="py-1">
                  <SecuritySettingsCard
                    value={securitySettings}
                    onChange={setSecuritySettings}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Thời lượng làm bài (Phút)</span>
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={300}
                        value={publishDuration}
                        onChange={(e) => setPublishDuration(Number(e.target.value) || 45)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-mono"
                      />
                      <p className="text-[11px] text-slate-400">
                        Đồng hồ đếm ngược khi làm bài.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>Ngưỡng đạt tiêu chuẩn (%)</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={publishPassingScore}
                        onChange={(e) => setPublishPassingScore(Number(e.target.value) || 70)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-mono"
                      />
                      <p className="text-[11px] text-slate-400">
                        Tỷ lệ điểm tối thiểu để xếp hạng ĐẠT.
                      </p>
                    </div>
                  </div>

                  {/* Context-specific Section */}
                  {effectiveMode === 'ORG' && (
                    <div className="space-y-2">
                      <label className="font-semibold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Phạm vi giao bài trong tổ chức</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setOrgScope('ORG_WIDE')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            orgScope === 'ORG_WIDE'
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold'
                              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs">Toàn tổ chức</span>
                          </div>
                          <p className="text-[10px] font-normal text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                            Tất cả thành viên trong tổ chức đều thấy và làm bài.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setOrgScope('ASSIGNED_CLASSES')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            orgScope === 'ASSIGNED_CLASSES'
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold'
                              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs">Chỉ định Lớp/Nhóm</span>
                          </div>
                          <p className="text-[10px] font-normal text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                            Chỉ học viên trong các lớp hoặc nhóm được phân công mới thấy đề.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setOrgScope('ACCESS_PIN')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            orgScope === 'ACCESS_PIN'
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold'
                              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs">Mã PIN phòng thi</span>
                          </div>
                          <p className="text-[10px] font-normal text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                            Yêu cầu mã PIN bảo mật khi thí sinh vào làm bài.
                          </p>
                        </button>
                      </div>

                      {orgScope === 'ACCESS_PIN' && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1.5">
                          <label className="text-[11px] font-semibold text-neutral-800 dark:text-zinc-200">
                            Mã PIN tham gia phòng thi (bắt buộc)
                          </label>
                          <input
                            type="text"
                            value={accessPin}
                            onChange={(e) => setAccessPin(e.target.value.toUpperCase())}
                            placeholder="VD: NEXA-EXAM-2026"
                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-neutral-900 dark:text-neutral-100 font-mono tracking-wider uppercase text-xs"
                          />
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                        Đề thi tổ chức thuộc không gian quản lý nội bộ. Thành viên tổ chức làm bài theo quyền hạn phân bổ mà không bị giới hạn bởi các gói trả phí cá nhân.
                      </div>
                    </div>
                  )}

                  {effectiveMode === 'PERSONAL' && (
                    <div className="space-y-2">
                      <label className="font-semibold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Mục đích xuất bản đề thi</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPersonalPublishMode('PRIVATE')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            personalPublishMode === 'PRIVATE'
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold'
                              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs">Luyện tập riêng tư</span>
                          </div>
                          <p className="text-[10px] font-normal text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                            Chỉ lưu trong kho đề cá nhân để tự ôn luyện, không chia sẻ.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPersonalPublishMode('LIVE_ROOM')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            personalPublishMode === 'LIVE_ROOM'
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold'
                              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs">Phòng thi trực tiếp</span>
                          </div>
                          <p className="text-[10px] font-normal text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                            Mở phòng thi thời gian thực cho bạn bè làm bài cùng lúc.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPersonalPublishMode('COMMUNITY')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            personalPublishMode === 'COMMUNITY'
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold'
                              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs">Đóng góp cộng đồng</span>
                          </div>
                          <p className="text-[10px] font-normal text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                            Gửi đề vào Thư viện cộng đồng để người học khác cùng luyện.
                          </p>
                        </button>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                        Đề thi cá nhân phục vụ rèn luyện năng lực số tự chủ. Bạn có thể thay đổi chế độ riêng tư hoặc chia sẻ bất kỳ lúc nào.
                      </div>
                    </div>
                  )}

                  {effectiveMode === 'ADMIN' && (
                    <div className="space-y-2">
                      <label className="font-semibold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                        <span>Phân hạng quyền truy cập người dùng</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPublishIsVip(false)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            !publishIsVip
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold'
                              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          <div className="font-bold">Miễn phí</div>
                          <p className="text-[10px] font-normal text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                            Mọi tài khoản cá nhân đều có quyền vào làm bài khảo thí chuẩn này.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPublishIsVip(true)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            publishIsVip
                              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-bold'
                              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          <div className="font-bold">Gói Chuyên sâu</div>
                          <p className="text-[10px] font-normal text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                            Chỉ dành riêng cho tài khoản cá nhân đã nâng cấp gói chuyên sâu.
                          </p>
                        </button>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                        Đề thi phát hành từ trang Quản trị Nền tảng là đề khảo thí chuẩn của toàn hệ thống, tự động phân phối đến kho khảo thí người học.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isPublishing}
                onClick={handleConfirmPublishWithSettings}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang phát hành...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {effectiveMode === 'ORG'
                        ? 'Xác nhận & Phát hành Nội bộ'
                        : effectiveMode === 'ADMIN'
                        ? 'Xác nhận & Phát hành Toàn sàn'
                        : 'Xác nhận & Xuất bản Đề cá nhân'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
