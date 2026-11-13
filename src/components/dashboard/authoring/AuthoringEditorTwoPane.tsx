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
  GripVertical,
  Send,
  Loader2,
  Eye,
  Play,
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
  ArrowLeft,
  Download,
  Paperclip,
  FileSpreadsheet,
  RefreshCw,
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
  const [publishPointReward, setPublishPointReward] = useState(50);
  const [publishIsVip, setPublishIsVip] = useState(false);

  // AI & Quick Duration States (Quizizz UX Model)
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiActionType, setAiActionType] = useState<string | null>(null);
  const [aiActionMessage, setAiActionMessage] = useState<string | null>(null);
  const [isDurationPopoverOpen, setIsDurationPopoverOpen] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('45');
  const durationPopoverRef = useRef<HTMLDivElement>(null);
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [isPublishSuccessOpen, setIsPublishSuccessOpen] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewActiveQIndex, setPreviewActiveQIndex] = useState(0);
  const [previewShowTeacherKey, setPreviewShowTeacherKey] = useState(false);
  const [isGuideAccordionOpen, setIsGuideAccordionOpen] = useState(true);
  const [guideActiveTab, setGuideActiveTab] = useState<'rubric' | 'solution'>('rubric');

  // Polymorphic Modal States
  const [modalTab, setModalTab] = useState<'GENERAL' | 'SECURITY'>('GENERAL');
  const [orgScope, setOrgScope] = useState<'ORG_WIDE' | 'ASSIGNED_CLASSES' | 'ACCESS_PIN'>('ORG_WIDE');
  const [accessPin, setAccessPin] = useState('');
  const [personalPublishMode, setPersonalPublishMode] = useState<'PRIVATE' | 'LIVE_ROOM' | 'COMMUNITY'>('PRIVATE');
  const [securitySettings, setSecuritySettings] = useState<AssessmentSecuritySettings>(DEFAULT_SECURITY_SETTINGS);

  // Drawer

  // Score computation & Validation
  const currentTotalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  const [isBatchPointsOpen, setIsBatchPointsOpen] = useState(false);
  const [customPointsInput, setCustomPointsInput] = useState('');
  const batchPointsPopoverRef = useRef<HTMLDivElement>(null);

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
            point_reward,
            organization_id,
            security_settings,
            created_at,
            updated_at
          `)
          .eq('id', assessmentId)
          .single();

        if (asmError || !asm) throw new Error('Không tìm thấy đề đánh giá');

        if (asm.duration_minutes) {
          setPublishDuration(asm.duration_minutes);
          setCustomMinutesInput(asm.duration_minutes.toString());
        }
        if (asm.passing_score) setPublishPassingScore(asm.passing_score);
        if (asm.point_reward !== undefined) setPublishPointReward(asm.point_reward || 50);
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
                        { id: 'opt-1', text: '', isCorrect: true },
                        { id: 'opt-2', text: '', isCorrect: false },
                        { id: 'opt-3', text: '', isCorrect: false },
                        { id: 'opt-4', text: '', isCorrect: false },
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

  // Quick Duration change & Auto-save (F23 & F24 Quizizz Model)
  const handleQuickDurationChange = useCallback(
    async (newDuration: number) => {
      const validDuration = Math.max(5, Math.min(300, Math.round(newDuration)));
      setPublishDuration(validDuration);
      setCustomMinutesInput(validDuration.toString());
      setAssessment((prev) => (prev ? { ...prev, durationMinutes: validDuration } : null));

      try {
        const res = await fetch(`/api/personal/assessments/${assessmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration_minutes: validDuration }),
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
        // Keep state; user can continue or retry
      }
    },
    [assessmentId]
  );

  const handleSelectPresetDuration = (mins: number) => {
    handleQuickDurationChange(mins);
    setIsDurationPopoverOpen(false);
  };

  const handleApplyCustomDuration = () => {
    const val = parseInt(customMinutesInput, 10);
    if (!isNaN(val) && val >= 5 && val <= 300) {
      handleQuickDurationChange(val);
      setIsDurationPopoverOpen(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        durationPopoverRef.current &&
        !durationPopoverRef.current.contains(event.target as Node)
      ) {
        setIsDurationPopoverOpen(false);
      }
      if (
        batchPointsPopoverRef.current &&
        !batchPointsPopoverRef.current.contains(event.target as Node)
      ) {
        setIsBatchPointsOpen(false);
      }
    }
    if (isDurationPopoverOpen || isBatchPointsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDurationPopoverOpen, isBatchPointsOpen]);

  // Batch set points handler: sets specified points across all questions
  const handleBatchSetPoints = (pts: number) => {
    if (questions.length === 0 || pts <= 0) return;
    const updated = questions.map((q) => ({
      ...q,
      points: pts,
    }));
    setQuestions(updated);
    saveChanges(updated);
    setIsBatchPointsOpen(false);
  };

  // Question manipulation helpers
  const handleAddQuestion = (type: QuestionType) => {
    const isPractical = type === 'PRACTICAL' || type === 'OPEN_RESPONSE';
    const defaultPts = questions.length > 0 ? (questions[0].points || 1) : 1;
    const newQ: AuthoringQuestionItem = {
      id: `q-${Date.now()}`,
      type: isPractical ? 'PRACTICAL' : 'MCQ',
      prompt: '',
      points: defaultPts,
      domainCode: '01',
      allowedSubmissionModes: isPractical ? ['TEXT', 'FILE', 'URL'] : undefined,
      practicalGuide: '',
      options: !isPractical
        ? [
            { id: `opt-${Date.now()}-1`, text: '', isCorrect: true },
            { id: `opt-${Date.now()}-2`, text: '', isCorrect: false },
            { id: `opt-${Date.now()}-3`, text: '', isCorrect: false },
            { id: `opt-${Date.now()}-4`, text: '', isCorrect: false },
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

  // Drag & Drop reordering state and handlers
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setQuestions((prev) => {
      const copy = [...prev];
      const [movedItem] = copy.splice(draggedIndex, 1);
      copy.splice(targetIndex, 0, movedItem);
      saveChanges(copy);
      return copy;
    });

    setSelectedIndex(targetIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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

  // Practical Rubric and Benchmark Solution parser & updater
  const parsePracticalGuide = (raw?: string): { rubric: string; sampleSolution: string } => {
    if (!raw) return { rubric: '', sampleSolution: '' };
    try {
      const trimmed = raw.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'object' && parsed !== null && ('rubric' in parsed || 'sampleSolution' in parsed)) {
          return {
            rubric: typeof parsed.rubric === 'string' ? parsed.rubric : '',
            sampleSolution: typeof parsed.sampleSolution === 'string' ? parsed.sampleSolution : '',
          };
        }
      }
    } catch {
      // legacy string fallback
    }
    return { rubric: raw, sampleSolution: '' };
  };

  const updatePracticalGuideField = (field: 'rubric' | 'sampleSolution', value: string) => {
    if (!currentQ) return;
    const current = parsePracticalGuide(currentQ.practicalGuide);
    const updated = {
      ...current,
      [field]: value,
    };
    if (!updated.rubric.trim() && !updated.sampleSolution.trim()) {
      updateCurrentQuestion({ practicalGuide: '' });
    } else {
      updateCurrentQuestion({ practicalGuide: JSON.stringify(updated) });
    }
  };

  // Option handlers for MCQ
  const handleAddOption = () => {
    if (!currentQ) return;
    const currentOpts = currentQ.options || [];
    const newOption: MCQOption = {
      id: `opt-${Date.now()}`,
      text: '',
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

  // Helper to parse attachment context (supports multiple files, single file, or legacy URL)
  const parseAttachments = (context?: string): { id: string; url: string; fileName: string; fileSize?: number; storagePath?: string }[] => {
    if (!context || !context.trim()) return [];
    const trimmed = context.trim();
    try {
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item, idx) => ({
            id: item.id || `file-${idx}`,
            url: item.url,
            fileName: item.fileName || 'Tệp đính kèm',
            fileSize: item.fileSize,
            storagePath: item.storagePath,
          }));
        }
        if (parsed.files && Array.isArray(parsed.files)) {
          return parsed.files;
        }
        if (parsed.url) {
          return [{
            id: parsed.id || `file-0`,
            url: parsed.url,
            fileName: parsed.fileName || 'Tệp đính kèm',
            fileSize: parsed.fileSize,
            storagePath: parsed.storagePath,
          }];
        }
      }
    } catch {
      // not JSON
    }
    if (trimmed.startsWith('http')) {
      const fileName = trimmed.split('/').pop()?.split('?')[0] || 'Tệp đính kèm';
      return [{
        id: `file-link-0`,
        url: trimmed,
        fileName,
      }];
    }
    return [];
  };

  const handleUploadAttachment = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    // 10 MB strict limit per file
    const MAX_SIZE = 10 * 1024 * 1024;
    for (const file of fileArray) {
      if (file.size > MAX_SIZE) {
        alert(`Tệp "${file.name}" vượt quá giới hạn 10 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB). Vui lòng chọn tệp nhỏ hơn.`);
        return;
      }
    }

    setIsUploadingAttachment(true);
    try {
      const currentFiles = parseAttachments(currentQ?.context);
      const uploadedFiles = [...currentFiles];

      for (const file of fileArray) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('itemId', currentQ?.id || 'new');
        formData.append('submissionId', 'authoring-attachments');

        const res = await fetch('/api/evidence/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Lỗi khi tải tệp ${file.name}`);
        }

        uploadedFiles.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url: data.url,
          fileName: data.fileName,
          fileSize: data.fileSize,
          storagePath: data.storagePath,
        });
      }

      updateCurrentQuestion({ context: JSON.stringify(uploadedFiles) });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể tải tệp lên. Vui lòng thử lại.');
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAttachment = (fileId: string) => {
    const currentFiles = parseAttachments(currentQ?.context);
    const remaining = currentFiles.filter((f) => f.id !== fileId);
    updateCurrentQuestion({ context: remaining.length > 0 ? JSON.stringify(remaining) : '' });
  };

  // AI Action Handlers (Quizizz Model & 8-Layer Architecture)
  const handleAiGenerateSimilar = async () => {
    if (!currentQ) return;
    setIsAiLoading(true);
    setAiActionType('SIMILAR_QUESTION');
    setAiActionMessage('AI đang phân tích và biên soạn câu hỏi tương tự...');

    try {
      const res = await fetch('/api/ai/authoring-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SIMILAR_QUESTION',
          currentQuestion: {
            prompt: currentQ.prompt,
            domainCode: currentQ.domainCode,
            domainTitle: currentQ.domainTitle,
            options: currentQ.options?.map((o) => ({
              id: o.id,
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'AI sinh câu hỏi thất bại');

      const data = json.data;
      if (data && data.prompt) {
        const newQ: AuthoringQuestionItem = {
          id: `q-ai-${Date.now()}`,
          type: 'MCQ',
          prompt: data.prompt,
          points: data.points || 10,
          domainCode: data.domainCode || currentQ.domainCode || '01',
          domainTitle: data.domainTitle || currentQ.domainTitle,
          options: Array.isArray(data.options)
            ? data.options.map((opt: any, idx: number) => ({
                id: `opt-ai-${Date.now()}-${idx}`,
                text: opt.text || `Phương án ${idx + 1}`,
                isCorrect: Boolean(opt.isCorrect),
                explanation: opt.explanation,
              }))
            : [
                { id: `opt-1`, text: 'Phương án A', isCorrect: true },
                { id: `opt-2`, text: 'Phương án B', isCorrect: false },
              ],
        };

        setQuestions((prev) => {
          const updated = [...prev, newQ];
          saveChanges(updated);
          return updated;
        });
        setSelectedIndex(questions.length);
        setAiActionMessage('Đã thêm 1 câu hỏi tương tự thành công!');
        setTimeout(() => setAiActionMessage(null), 3000);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Có lỗi khi gọi AI');
    } finally {
      setIsAiLoading(false);
      setAiActionType(null);
    }
  };

  const handleAiGenerateExplanations = async () => {
    if (!currentQ || !currentQ.options?.length) return;
    setIsAiLoading(true);
    setAiActionType('EXPLAIN_OPTIONS');
    setAiActionMessage('AI đang viết lời giải thích sư phạm cho từng phương án...');

    try {
      const res = await fetch('/api/ai/authoring-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXPLAIN_OPTIONS',
          currentQuestion: {
            prompt: currentQ.prompt,
            domainCode: currentQ.domainCode,
            domainTitle: currentQ.domainTitle,
            options: currentQ.options?.map((o) => ({
              id: o.id,
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'AI tạo giải thích thất bại');

      const explanationsList = json.data?.explanations;
      if (Array.isArray(explanationsList)) {
        const updatedOptions = currentQ.options.map((opt, idx) => {
          const matched = explanationsList.find((e: any) => e.optionIndex === idx);
          return matched ? { ...opt, explanation: matched.explanation } : opt;
        });

        updateCurrentQuestion({ options: updatedOptions });
        setAiActionMessage('Đã cập nhật lời giải thích cho các phương án!');
        setTimeout(() => setAiActionMessage(null), 3000);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Có lỗi khi gọi AI');
    } finally {
      setIsAiLoading(false);
      setAiActionType(null);
    }
  };

  const handleAiGenerateByDomain = async (selectedDomainCode: string) => {
    setIsAiLoading(true);
    setAiActionType('GENERATE_BY_DOMAIN');
    setIsDomainModalOpen(false);
    setAiActionMessage('AI đang biên soạn câu hỏi theo miền năng lực số...');

    try {
      const res = await fetch('/api/ai/authoring-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GENERATE_BY_DOMAIN',
          domainCode: selectedDomainCode,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'AI sinh câu hỏi thất bại');

      const data = json.data;
      if (data && data.prompt) {
        const newQ: AuthoringQuestionItem = {
          id: `q-ai-dom-${Date.now()}`,
          type: 'MCQ',
          prompt: data.prompt,
          points: data.points || 10,
          domainCode: data.domainCode || selectedDomainCode,
          domainTitle: data.domainTitle,
          options: Array.isArray(data.options)
            ? data.options.map((opt: any, idx: number) => ({
                id: `opt-ai-dom-${Date.now()}-${idx}`,
                text: opt.text,
                isCorrect: Boolean(opt.isCorrect),
                explanation: opt.explanation,
              }))
            : [],
        };

        setQuestions((prev) => {
          const updated = [...prev, newQ];
          saveChanges(updated);
          return updated;
        });
        setSelectedIndex(questions.length);
        setAiActionMessage('Đã thêm câu hỏi theo miền năng lực số thành công!');
        setTimeout(() => setAiActionMessage(null), 3000);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Có lỗi khi gọi AI');
    } finally {
      setIsAiLoading(false);
      setAiActionType(null);
    }
  };

  // Publish / Unpublish handler (Quizizz Model - Instant Save to Library, No Duplicate Time Modal)
  const handleTogglePublish = async () => {
    if (questions.length === 0) {
      alert('Vui lòng thêm ít nhất 1 câu hỏi trước khi phát hành đề thi.');
      return;
    }

    // Nếu đang phát hành -> Chuyển về trạng thái bản nháp
    if (isPublished) {
      setIsPublishing(true);
      setErrorMessage(null);
      try {
        const res = await fetch(`/api/personal/assessments/${assessmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_published: false }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Cập nhật trạng thái thất bại');
        setIsPublished(false);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Có lỗi khi chuyển về bản nháp');
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    // Nếu đang là bản nháp -> Xuất bản trực tiếp vào Kho đề với thời lượng đã cài đặt
    await handleDirectPublish();
  };

  // Trực tiếp lưu và xuất bản đề vào Kho đề thi mà không bắt chọn lại thời gian
  const handleDirectPublish = async () => {
    setIsPublishing(true);
    setErrorMessage(null);

    try {
      // 1. Lưu câu hỏi mới nhất
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
            point_reward: Number(publishPointReward) || 50,
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
        if (!res.ok) throw new Error(data.error || 'Lưu vào Kho đề thất bại');
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
      setIsPublishSuccessOpen(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Có lỗi khi phát hành đề thi');
    } finally {
      setIsPublishing(false);
    }
  };

  // Xác nhận phát hành kèm cài đặt thời gian, ngưỡng đạt, phân hạng theo ngữ cảnh
  const handleConfirmPublishWithSettings = async () => {
    setIsPublishModalOpen(false);
    await handleDirectPublish();
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold transition-colors shrink-0"
            title="Quay lại danh sách đề"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quay lại</span>
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
          {/* Total Points & Quick Batch Set Dropdown */}
          <div className="relative inline-flex items-center shadow-2xs rounded-xl" ref={batchPointsPopoverRef}>
            <div className="px-3 py-2 rounded-l-xl border border-r-0 border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 tabular-nums">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Tổng: {currentTotalPoints} điểm</span>
            </div>

            <button
              type="button"
              onClick={() => setIsBatchPointsOpen((prev) => !prev)}
              className="px-2.5 py-2 rounded-r-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 inline-flex items-center gap-1 cursor-pointer transition-colors"
              title="Đổi điểm cho tất cả các câu hỏi"
            >
              <span>Đổi điểm tất cả</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isBatchPointsOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 w-72 p-3.5 bg-white dark:bg-[#111114] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xl animate-in fade-in zoom-in-95 duration-100 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800/80">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Đổi điểm tất cả câu hỏi
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                    {questions.length} câu
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-neutral-400 mb-1.5">
                    Mức điểm phổ biến:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 5, 10].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => handleBatchSetPoints(pts)}
                        className="py-1.5 px-2 rounded-lg text-xs font-semibold font-mono border border-slate-200 dark:border-zinc-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer text-center"
                      >
                        {pts}đ
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                    Hoặc nhập số điểm cụ thể:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={customPointsInput}
                      onChange={(e) => setCustomPointsInput(e.target.value)}
                      placeholder="VD: 3"
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      disabled={!customPointsInput || Number(customPointsInput) <= 0}
                      onClick={() => {
                        const val = Number(customPointsInput);
                        if (val > 0) handleBatchSetPoints(val);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold whitespace-nowrap cursor-pointer transition shadow-xs"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-neutral-400 leading-normal pt-1">
                  Đổi điểm sẽ gán đồng loạt cho {questions.length} câu. Bạn vẫn có thể tùy chỉnh điểm từng câu sau đó.
                </p>
              </div>
            )}
          </div>


          {/* Cài đặt đề */}
          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
            title="Cài đặt thông số bảo mật, ngưỡng đạt và giám thị"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Cài đặt đề</span>
          </button>

          {/* Nút Xem trước toàn màn hình: chỉ xem cấu trúc, không tính điểm / thời gian */}
          <button
            type="button"
            onClick={() => {
              setPreviewActiveQIndex(selectedIndex >= 0 ? selectedIndex : 0);
              setIsPreviewModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-neutral-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
            title="Xem trước cấu trúc và giao diện đề thi toàn màn hình (Không tính điểm & không giới hạn thời gian)"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
            <span>Xem trước</span>
          </button>

          {/* Nút Lưu đề thi / Xuất bản */}
          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={isPublishing}
            className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer ${
              isPublished
                ? 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title={isPublished ? 'Chuyển về trạng thái bản nháp' : 'Lưu và hoàn tất đề thi trong kho'}
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isPublished ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>
              {isPublishing
                ? 'Đang lưu...'
                : isPublished
                ? effectiveMode === 'ORG'
                  ? 'Đã lưu trong Kho đề'
                  : 'Đã lưu đề thi'
                : effectiveMode === 'ORG'
                ? 'Lưu vào Kho đề'
                : 'Lưu đề thi'}
            </span>
          </button>
        </div>
      </div>

      {/* Sub-Header theo chuẩn Quizizz / Wayground: [X] Câu hỏi • [Z] Phút */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 shadow-2xs">
        <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-600 dark:text-zinc-300">
          <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono">
            {questions.length} Câu hỏi
          </span>
          <span className="text-slate-300 dark:text-zinc-700">&bull;</span>
          <div className="relative" ref={durationPopoverRef}>
            <button
              type="button"
              onClick={() => setIsDurationPopoverOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-750 text-blue-600 dark:text-blue-400 font-bold font-mono transition-colors cursor-pointer"
              title="Bấm để thay đổi thời lượng làm bài nhanh"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{publishDuration} Phút</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isDurationPopoverOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-40 w-64 p-3 bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-2">
                  Thời lượng làm bài:
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                  {[15, 30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleSelectPresetDuration(mins)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
                        publishDuration === mins
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {mins}p
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={customMinutesInput}
                    onChange={(e) => setCustomMinutesInput(e.target.value)}
                    placeholder="Tùy chỉnh"
                    className="flex-1 px-2 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomDuration}
                    className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            )}
          </div>
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
          Câu hỏi ({questions.length})
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
          {/* Quick Add Buttons directly at top without redundant header */}
          <div className="flex items-center gap-1.5 pb-1">
            <button
              type="button"
              onClick={() => handleAddQuestion('MCQ')}
              className="flex-1 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors"
              title="Thêm câu trắc nghiệm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Trắc nghiệm</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddQuestion('PRACTICAL')}
              className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors"
              title="Thêm bài thực hành"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thực hành</span>
            </button>
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
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setMobileTab('editor');
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2 select-none ${
                    draggedIndex === idx ? 'opacity-40 scale-[0.98]' : ''
                  } ${
                    dragOverIndex === idx && draggedIndex !== idx
                      ? 'border-blue-500 ring-2 ring-blue-500/30'
                      : isSelected
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-500/20'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300'
                  }`}
                >
                  {/* Drag Handle */}
                  <div
                    className="p-1 -ml-1 text-slate-300 hover:text-slate-600 dark:text-zinc-600 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing shrink-0"
                    title="Nắm kéo để di chuyển vị trí câu hỏi"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

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
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
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
                            { id: `opt-${Date.now()}-1`, text: '', isCorrect: true },
                            { id: `opt-${Date.now()}-2`, text: '', isCorrect: false },
                            { id: `opt-${Date.now()}-3`, text: '', isCorrect: false },
                            { id: `opt-${Date.now()}-4`, text: '', isCorrect: false },
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
                    className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
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
              <div className="space-y-4 pt-2">
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

                {/* Question-level General Explanation (Optional) */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Giải thích đáp án cho toàn câu hỏi</span>
                      <span className="text-[10px] font-normal text-slate-400">(Tùy chọn)</span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={currentQ.practicalGuide || ''}
                    onChange={(e) => updateCurrentQuestion({ practicalGuide: e.target.value })}
                    placeholder="Nhập giải thích vì sao đáp án đúng hoặc kiến thức cần nhớ cho câu này (để trống nếu không cần)..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Practical Task View (Clean, Modern, Real File Upload & Structured Rubric) */}
            {currentQ.type === 'PRACTICAL' && (
              <div className="space-y-4 pt-2">
                {/* 1. File Upload / Attached Practice Dataset (Max 10 MB) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Tài liệu &amp; Tệp dữ liệu đề bài</span>
                      <span className="text-[10px] font-normal text-slate-400">(Tối đa 10 MB / tệp • Tùy chọn)</span>
                    </label>

                    {/* Quick Button "+ Thêm tệp" on top right if files already exist */}
                    {(() => {
                      const attachments = parseAttachments(currentQ.context);
                      if (attachments.length > 0) {
                        return (
                          <button
                            type="button"
                            onClick={() => !isUploadingAttachment && fileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Thêm tệp</span>
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Hidden file input supporting multiple files */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.json,.png,.jpg,.jpeg,.zip"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) handleUploadAttachment(files);
                    }}
                  />

                  {/* Upload Container (Compact Grid with Hover Actions) */}
                  {(() => {
                    const attachments = parseAttachments(currentQ.context);
                    if (attachments.length > 0) {
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {attachments.map((file, fIdx) => (
                            <div
                              key={file.id || fIdx}
                              className="group relative p-2.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-blue-400 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                  <FileSpreadsheet className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate block"
                                    title={file.fileName}
                                  >
                                    {file.fileName}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    {file.fileSize && (
                                      <span>{(file.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                                    )}
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> Sẵn sàng
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action buttons revealed on hover */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 shrink-0 bg-white/90 dark:bg-[#111114]/90 pl-1">
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                                  title="Tải về kiểm tra"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttachment(file.id)}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                  title="Xóa tệp này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Inline uploading state tile */}
                          {isUploadingAttachment && (
                            <div className="p-2.5 rounded-xl border border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2 text-xs font-semibold animate-pulse">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Đang tải tệp...</span>
                            </div>
                          )}

                          {/* Compact Add-More Tile inside grid */}
                          {!isUploadingAttachment && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-zinc-750 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-zinc-850 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Thêm tệp khác</span>
                            </button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        onClick={() => !isUploadingAttachment && fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = e.dataTransfer.files;
                          if (files && files.length > 0) handleUploadAttachment(files);
                        }}
                        className={`p-6 rounded-xl border border-dashed text-center cursor-pointer transition ${
                          isUploadingAttachment
                            ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                            : 'border-slate-300 dark:border-zinc-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-zinc-850'
                        }`}
                      >
                        {isUploadingAttachment ? (
                          <div className="flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-xs font-semibold">Đang tải tệp lên hệ thống...</span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                                Nhấp để chọn một hoặc nhiều tệp (hoặc kéo thả vào đây)
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                              Hỗ trợ chọn nhiều file cùng lúc: Excel (.xlsx, .xls), Word (.docx), PDF, JSON, ảnh hoặc ZIP • Tối đa 10 MB mỗi tệp
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Structured Barem & Benchmark Solution (Unified Single Card with Tabs) */}
                {(() => {
                  const practicalData = parsePracticalGuide(currentQ.practicalGuide);
                  const hasRubric = Boolean(practicalData.rubric && practicalData.rubric.trim().length > 0);
                  const hasSolution = Boolean(practicalData.sampleSolution && practicalData.sampleSolution.trim().length > 0);

                  let statusText = 'Chưa thiết lập';
                  let statusColor = 'bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500';
                  if (hasRubric && hasSolution) {
                    statusText = 'Đã có tiêu chí & đáp án';
                    statusColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
                  } else if (hasRubric) {
                    statusText = 'Đã có tiêu chí chấm';
                    statusColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
                  } else if (hasSolution) {
                    statusText = 'Đã có đáp án mẫu';
                    statusColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
                  }

                  return (
                    <div className="pt-2">
                      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition-all shadow-2xs">
                        {/* Header bar */}
                        <button
                          type="button"
                          onClick={() => setIsGuideAccordionOpen((prev) => !prev)}
                          className="w-full px-4 py-3 bg-slate-50/70 dark:bg-zinc-850/60 hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 transition flex items-center justify-between cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-neutral-800 dark:text-zinc-100">
                                Barem điểm &amp; Hướng dẫn chấm
                              </span>
                              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                                Ẩn với người làm bài
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                              {statusText}
                            </span>
                            <div className="w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 transition">
                              {isGuideAccordionOpen ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Collapsible Content */}
                        {isGuideAccordionOpen && (
                          <div className="p-4 border-t border-slate-100 dark:border-zinc-800 space-y-3 bg-white dark:bg-zinc-900">
                            {/* Segmented Tab Switcher */}
                            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 max-w-fit">
                              <button
                                type="button"
                                onClick={() => setGuideActiveTab('rubric')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                  guideActiveTab === 'rubric'
                                    ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                                    : 'text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Tiêu chí chấm (Barem)</span>
                                {hasRubric && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setGuideActiveTab('solution')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                  guideActiveTab === 'solution'
                                    ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                                    : 'text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                                }`}
                              >
                                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Đáp án chuẩn &amp; Hướng dẫn giải</span>
                                {hasSolution && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                )}
                              </button>
                            </div>

                            {/* Tab 1: Rubric */}
                            {guideActiveTab === 'rubric' && (
                              <div className="space-y-1.5">
                                <textarea
                                  value={practicalData.rubric}
                                  onChange={(e) => updatePracticalGuideField('rubric', e.target.value)}
                                  rows={4}
                                  placeholder="Nhập tiêu chí và thang điểm chi tiết..."
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/40 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 resize-none focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 transition leading-relaxed font-sans"
                                />
                                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
                                  <span>Tiêu chí dùng khi chấm bài thực hành.</span>
                                  <span className="font-mono text-[10px]">
                                    {practicalData.rubric ? `${practicalData.rubric.length} ký tự` : 'Trống'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Tab 2: Benchmark Solution */}
                            {guideActiveTab === 'solution' && (
                              <div className="space-y-1.5">
                                <textarea
                                  value={practicalData.sampleSolution}
                                  onChange={(e) => updatePracticalGuideField('sampleSolution', e.target.value)}
                                  rows={4}
                                  placeholder="Nhập kết quả mẫu, công thức chuẩn hoặc lưu ý khi chấm..."
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-950/40 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 resize-none focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition leading-relaxed font-sans"
                                />
                                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
                                  <span>Đáp án đối chiếu kết quả làm bài.</span>
                                  <span className="font-mono text-[10px]">
                                    {practicalData.sampleSolution ? `${practicalData.sampleSolution.length} ký tự` : 'Trống'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
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
                      ? 'Cài đặt đề thi & Giám thị'
                      : effectiveMode === 'ADMIN'
                      ? 'Cài đặt đề chuẩn Quốc gia'
                      : 'Cài đặt đề thi cá nhân'}
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

            {/* Navigation Pill only for ORG (Enterprise/School with proctoring) */}
            {effectiveMode === 'ORG' && (
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
                  1. Thông số đề trong Kho
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
                  2. Giám thị &amp; Bảo mật
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {modalTab === 'SECURITY' && effectiveMode === 'ORG' ? (
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
                    </div>
                  </div>

                  {/* Điểm thưởng hoàn thành (PTS) - ĐẶC QUYỀN RIÊNG CỦA PLATFORM ADMIN */}
                  {effectiveMode === 'ADMIN' && (
                    <div className="space-y-1.5">
                      <label className="font-semibold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Điểm thưởng hoàn thành toàn sàn (XP / PTS)</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        value={publishPointReward}
                        onChange={(e) => setPublishPointReward(Number(e.target.value) || 50)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 font-mono"
                      />
                      <p className="text-[11px] text-slate-400">
                        Đặc quyền Admin: Điểm tích lũy ghi nhận vào hồ sơ năng lực số chuẩn hóa toàn hệ thống khi đạt chuẩn.
                      </p>
                    </div>
                  )}

                  {/* Context-specific Section */}
                  {effectiveMode === 'ORG' && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
                        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Lưu vào Kho đề nội bộ của Tổ chức</span>
                      </div>
                      <p className="text-slate-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                        Đề thi sau khi lưu sẽ sẵn sàng trong <strong>Kho đề của tổ chức</strong>. Bạn có thể sử dụng đề này để giao bài cho các Lớp học cụ thể hoặc mở phòng thi trực tiếp bất kỳ lúc nào.
                      </p>
                    </div>
                  )}

                  {effectiveMode === 'PERSONAL' && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                      Đề thi được lưu trữ tự động trong <strong>Kho đề cá nhân</strong> của bạn. Bạn có thể tự vào làm bài luyện tập hoặc xem trước cấu trúc bất kỳ lúc nào mà không cần qua bước xuất bản phức tạp.
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

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2 text-xs">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Quy chế khảo thí hướng đến phát triển năng lực</span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                          <div>&bull; <strong>Tự do gắn cờ xem lại:</strong> Cho phép thí sinh đánh dấu câu hỏi chưa chắc chắn để rà soát trước khi nộp.</div>
                          <div>&bull; <strong>Mở khóa giải thích &amp; lộ trình:</strong> Tự động phân tích 5 miền năng lực số và mở khóa giải thích chi tiết sau khi nộp bài để bù đắp kiến thức.</div>
                        </div>
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
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lưu cài đặt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* 5. Modal Chọn 5 Miền Năng Lực Số để AI Biên Soạn */}
      {isDomainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>AI Biên Soạn Câu Hỏi Theo 5 Miền</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDomainModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Chọn miền năng lực số mà bạn muốn AI thiết kế tình huống và câu hỏi trắc nghiệm đánh giá:
            </p>

            <div className="space-y-2 text-xs">
              {[
                { code: '01', title: 'Miền 1: Dữ liệu và Thông tin số', desc: 'Tìm kiếm, đánh giá độ tin cậy và quản lý dữ liệu' },
                { code: '02', title: 'Miền 2: Giao tiếp và Hợp tác trong môi trường số', desc: 'Chia sẻ, quy tắc ứng xử Netiquette và cộng tác số' },
                { code: '03', title: 'Miền 3: Sáng tạo nội dung số', desc: 'Sản xuất nội dung, bản quyền và tích hợp số' },
                { code: '04', title: 'Miền 4: An toàn và Bảo mật số', desc: 'Bảo vệ thiết bị, dữ liệu cá nhân và phòng tránh lừa đảo' },
                { code: '05', title: 'Miền 5: Giải quyết vấn đề trong môi trường số', desc: 'Xử lý sự cố kỹ thuật và tư duy số' },
              ].map((d) => (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => handleAiGenerateByDomain(d.code)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-zinc-900 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-left transition-all cursor-pointer group"
                >
                  <div className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {d.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                    {d.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Xuất bản Thành công với 3 Hướng Đi Tiếp Theo (Quizizz Completion Model) */}
      {isPublishSuccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {effectiveMode === 'ORG'
                  ? 'Đã lưu vào Kho đề tổ chức thành công!'
                  : effectiveMode === 'ADMIN'
                  ? 'Đã phát hành Đề chuẩn Quốc gia toàn sàn!'
                  : 'Đã xuất bản đề thi cá nhân thành công!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                {effectiveMode === 'ORG'
                  ? `Đề "${assessment?.title}" đã sẵn sàng trong Kho đề (${questions.length} câu, ${publishDuration} phút). Bạn có thể giao cho lớp học hoặc tạo đợt khảo thí diện rộng ngay bây giờ.`
                  : 'Đề thi đã sẵn sàng cho thí sinh thực hiện đánh giá năng lực số.'}
              </p>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              {effectiveMode === 'ORG' && slug && (
                <>
                  <Link
                    href={`/org/${slug}/classes`}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <Users className="w-4 h-4" />
                    <span>Giao đề cho Lớp học ngay</span>
                  </Link>

                  <Link
                    href={`/org/${slug}/campaigns/new?assessmentId=${assessmentId}`}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Tạo Đợt khảo thí (Campaign) diện rộng</span>
                  </Link>
                </>
              )}

              <Link
                href={returnUrl}
                className="w-full py-2 px-4 rounded-xl text-slate-500 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium flex items-center justify-center gap-1.5 transition"
              >
                <span>Về Kho đề thi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem trước toàn màn hình: Chuẩn giao diện làm bài, không tính điểm / thời gian */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-[#0A0A0B] flex flex-col overflow-hidden animate-in fade-in duration-150">
          {/* Top Bar Preview */}
          <div className="h-14 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] px-6 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850 flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Thoát xem trước</span>
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate max-w-md">
                  {assessment?.title || 'Đề thi đánh giá năng lực số'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 shrink-0">
                  CHẾ ĐỘ XEM TRƯỚC
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{publishDuration} phút (Thời lượng dự kiến)</span>
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                <span>Tổng {currentTotalPoints} điểm</span>
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                title="Đóng xem trước (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Banner Thông báo Xem trước */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/40 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                <strong>Giao diện cấu trúc đề:</strong> Mô phỏng trực quan bố cục câu hỏi cho người học. Hệ thống không tính giờ, không tính điểm và không lưu vết kết quả.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewShowTeacherKey(!previewShowTeacherKey)}
              className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{previewShowTeacherKey ? 'Ẩn đáp án & Barem' : 'Hiện đáp án & Barem giảng viên'}</span>
            </button>
          </div>

          {/* Body Preview: Clean Single-Column Student Exam View (No Question List Sidebar) */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:p-8 flex justify-center">
            <div className="w-full max-w-3xl bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col justify-between min-h-[500px]">
              {questions[previewActiveQIndex] ? (
                (() => {
                  const q = questions[previewActiveQIndex];
                  const attachments = parseAttachments(q.context);

                  return (
                    <div className="space-y-6">
                      {/* Question Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono text-xs font-bold">
                            Câu {previewActiveQIndex + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                            {q.type === 'PRACTICAL' ? 'Bài tập Thực hành' : 'Câu hỏi Trắc nghiệm'}
                          </span>
                        </div>
                        <span className="text-xs font-bold font-mono text-neutral-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                          {q.points} điểm
                        </span>
                      </div>

                      {/* Question Prompt */}
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed whitespace-pre-wrap">
                        {q.prompt || 'Chưa nhập nội dung câu hỏi'}
                      </div>

                      {/* Attachments if present */}
                      {attachments.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="text-xs font-bold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Tệp dữ liệu đề bài ({attachments.length} tệp):</span>
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {attachments.map((file, aIdx) => (
                              <div
                                key={file.id || aIdx}
                                className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 flex items-center justify-between gap-2.5 shadow-2xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate" title={file.fileName}>
                                      {file.fileName}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                                      {file.fileSize ? `${(file.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'Tệp đính kèm'}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition shrink-0"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Tải</span>
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* MCQ Options */}
                      {q.type !== 'PRACTICAL' && (
                        <div className="space-y-3 pt-2">
                          {(q.options || []).map((opt, oIdx) => {
                            const isCorrect = opt.isCorrect;
                            return (
                              <div
                                key={opt.id || oIdx}
                                className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 transition ${
                                  previewShowTeacherKey && isCorrect
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 font-semibold'
                                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200'
                                }`}
                              >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                                  previewShowTeacherKey && isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                                }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="flex-1">{opt.text || `Phương án ${String.fromCharCode(65 + oIdx)}`}</span>
                                {previewShowTeacherKey && isCorrect && (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Đáp án đúng
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {previewShowTeacherKey && q.practicalGuide && (
                            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 text-xs text-neutral-800 dark:text-zinc-200 space-y-1">
                              <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                <HelpCircle className="w-3.5 h-3.5" /> Giải thích đáp án:
                              </span>
                              <p className="whitespace-pre-wrap text-slate-600 dark:text-zinc-300">{q.practicalGuide}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Practical Submission Simulation (Upload + Essay options) */}
                      {q.type === 'PRACTICAL' && (
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
                            <span className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                              Hình thức nộp bài của thí sinh:
                            </span>
                            <span className="text-[11px] text-slate-500">
                              (Thí sinh có thể tải tệp lên hoặc nhập bài luận trực tiếp)
                            </span>
                          </div>

                          {/* 1. Tải tệp sản phẩm thực hành */}
                          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                                <span>Tải tệp sản phẩm bài làm</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Tối đa 10 MB • Hỗ trợ Word, Excel, PDF, JSON, ZIP, Ảnh
                              </span>
                            </div>

                            {/* Simulated Uploaded File with full Action Icons */}
                            <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-750 bg-white dark:bg-zinc-850 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate block">
                                    bai_lam_thuc_hanh_mau.xlsx
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span>2.4 MB / 10 MB</span>
                                    <span className="text-emerald-600 font-medium">&bull; Đã sẵn sàng nộp</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-zinc-700 transition cursor-pointer"
                                  title="Tải về kiểm tra"
                                >
                                  <Download className="w-3.5 h-3.5 text-slate-500" />
                                </button>
                                <button
                                  type="button"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-zinc-700 transition cursor-pointer"
                                  title="Tải thêm / Thay tệp khác"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                                </button>
                                <button
                                  type="button"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                  title="Xóa tệp này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 2. Bài luận & giải trình văn bản */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                              Bản tóm tắt giải trình / luận văn bản giải pháp
                            </label>
                            <textarea
                              rows={3}
                              disabled
                              placeholder="Người làm bài nhập giải trình quy trình xử lý, câu lệnh, công thức hoặc đáp án văn bản tại đây..."
                              className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 resize-none opacity-80 cursor-not-allowed"
                            />
                          </div>

                          {previewShowTeacherKey && q.practicalGuide && (() => {
                            const practicalData = parsePracticalGuide(q.practicalGuide);
                            return (
                              <div className="space-y-3 pt-2">
                                {practicalData.rubric && (
                                  <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1.5 text-xs">
                                    <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Barem tiêu chí chấm điểm (Ẩn với người làm bài):
                                    </span>
                                    <p className="whitespace-pre-wrap text-neutral-700 dark:text-zinc-300 leading-relaxed font-sans">
                                      {practicalData.rubric}
                                    </p>
                                  </div>
                                )}
                                {practicalData.sampleSolution && (
                                  <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-1.5 text-xs">
                                    <span className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                                      <BookOpen className="w-3.5 h-3.5" /> Đáp án chuẩn &amp; Hướng dẫn đối chiếu:
                                    </span>
                                    <p className="whitespace-pre-wrap text-neutral-700 dark:text-zinc-300 leading-relaxed font-sans">
                                      {practicalData.sampleSolution}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Prev / Next Nav with Question Pills */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100 dark:border-zinc-800">
                        <button
                          type="button"
                          disabled={previewActiveQIndex === 0}
                          onClick={() => setPreviewActiveQIndex((prev) => Math.max(0, prev - 1))}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
                        >
                          &larr; Câu trước
                        </button>

                        <div className="flex items-center gap-1.5">
                          {questions.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setPreviewActiveQIndex(idx)}
                              className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                                idx === previewActiveQIndex
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          disabled={previewActiveQIndex === questions.length - 1}
                          onClick={() => setPreviewActiveQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Câu tiếp theo &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="py-20 text-center text-xs text-slate-400">
                  Đề thi hiện chưa có câu hỏi nào để xem trước.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
