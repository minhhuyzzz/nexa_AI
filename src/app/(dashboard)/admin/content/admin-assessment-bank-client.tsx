'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileCheck,
  BookOpen,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  ArrowRight,
  ExternalLink,
  Lock,
  Unlock,
  Eye,
  Trash2,
  Edit3,
  X,
  AlertCircle,
  FileText,
  HelpCircle,
  Sparkles,
  Copy,
  Crown,
  MoreHorizontal,
  Ban,
  Compass,
  Settings,
  Shield,
} from 'lucide-react';
import { SecuritySettingsCard } from '@/features/assessments/components/SecuritySettingsCard';
import {
  AssessmentSecuritySettings,
  DEFAULT_SECURITY_SETTINGS,
} from '@/features/assessments/types/security.types';
import {
  downloadMCQTemplate,
  downloadScenarioTemplate,
  downloadPracticalTemplate,
  downloadCSVTemplate,
  parseCSV,
  type ParsedItemRow,
} from '@/features/assessments/utils/csv-helper';

export interface AssessmentItemRecord {
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
  questionCount: number;
  types: string[];
  typeLabel: string;
  domainName: string;
  domainCodes: string[];
  security_settings?: AssessmentSecuritySettings | null;
}

interface Props {
  initialAssessments: AssessmentItemRecord[];
  domains: Array<{ id: string; code: string; title: string }>;
  competencies: Array<{ id: string; skill_code: string; title: string; domain_id: string }>;
  pendingContributionsCount?: number;
}

export function AdminAssessmentBankClient({
  initialAssessments,
  domains,
  competencies,
  pendingContributionsCount = 0,
}: Props) {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentItemRecord[]>(initialAssessments);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'FREE' | 'VIP'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentItemRecord | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);

  // 3-dots Dropdown State (Fixed floating popover)
  const [dropdownMenu, setDropdownMenu] = useState<{
    id: string;
    top: number;
    right: number;
    placement: 'top' | 'bottom';
    exam: AssessmentItemRecord;
  } | null>(null);

  // Đóng dropdown khi click ngoài hoặc cuộn trang
  useEffect(() => {
    const handleClose = () => setDropdownMenu(null);
    if (dropdownMenu) {
      window.addEventListener('click', handleClose);
      window.addEventListener('scroll', handleClose, true);
      return () => {
        window.removeEventListener('click', handleClose);
        window.removeEventListener('scroll', handleClose, true);
      };
    }
  }, [dropdownMenu]);

  const handleOpenDropdown = (e: React.MouseEvent, exam: AssessmentItemRecord) => {
    e.stopPropagation();
    if (dropdownMenu?.id === exam.id) {
      setDropdownMenu(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: 'top' | 'bottom' = spaceBelow < menuHeight && rect.top > menuHeight ? 'top' : 'bottom';

    setDropdownMenu({
      id: exam.id,
      top: placement === 'bottom' ? rect.bottom + 6 : rect.top - 6,
      right: window.innerWidth - rect.right,
      placement,
      exam,
    });
  };

  // Quick Settings Modal State (Thay thế modal chi tiết brochure)
  const [settingsExam, setSettingsExam] = useState<AssessmentItemRecord | null>(null);
  const [settingsTitle, setSettingsTitle] = useState('');
  const [settingsDescription, setSettingsDescription] = useState('');
  const [settingsDuration, setSettingsDuration] = useState(60);
  const [settingsPassingScore, setSettingsPassingScore] = useState(70);
  const [settingsIsVip, setSettingsIsVip] = useState(false);
  const [settingsIsPublished, setSettingsIsPublished] = useState(true);
  const [settingsSecurity, setSettingsSecurity] = useState<AssessmentSecuritySettings>(DEFAULT_SECURITY_SETTINGS);
  const [settingsTab, setSettingsTab] = useState<'GENERAL' | 'SECURITY'>('GENERAL');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Form State for Create / Edit Assessment
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTargetDomain, setFormTargetDomain] = useState('ALL');
  const [formDuration, setFormDuration] = useState(45);
  const [formPassingScore, setFormPassingScore] = useState(70);
  const [formReward, setFormReward] = useState(50);
  const [formIsVip, setFormIsVip] = useState(false);
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Bulk Import State
  const [importTargetAssessmentId, setImportTargetAssessmentId] = useState<string>('');
  const [importNewTitle, setImportNewTitle] = useState('');
  const [importParsedItems, setImportParsedItems] = useState<ParsedItemRow[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Metrics
  const totalAssessments = assessments.length;
  const publishedAssessments = assessments.filter((a) => a.is_published).length;
  const freeAssessments = assessments.filter((a) => !a.is_vip).length;
  const vipAssessments = assessments.filter((a) => a.is_vip).length;

  // Filtered Assessments
  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.domainName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTier =
      tierFilter === 'ALL' ? true : tierFilter === 'VIP' ? a.is_vip : !a.is_vip;

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'PUBLISHED'
        ? a.is_published
        : !a.is_published;

    return matchesSearch && matchesTier && matchesStatus;
  });

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingAssessment(null);
    setFormTitle('');
    setFormDescription('Bài khảo thí chuẩn hóa đo lường 5 miền năng lực số toàn diện.');
    setFormTargetDomain('ALL');
    setFormDuration(45);
    setFormPassingScore(70);
    setFormReward(50);
    setFormIsVip(false);
    setFormIsPublished(true);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (exam: AssessmentItemRecord) => {
    setEditingAssessment(exam);
    setFormTitle(exam.title);
    setFormDescription(exam.description || '');
    setFormTargetDomain((exam as any).target_domain || 'ALL');
    setFormDuration(exam.duration_minutes);
    setFormPassingScore(exam.passing_score);
    setFormReward(exam.point_reward);
    setFormIsVip(exam.is_vip);
    setFormIsPublished(exam.is_published);
    setIsCreateModalOpen(true);
  };

  // Open Settings Modal
  const handleOpenSettings = (exam: AssessmentItemRecord) => {
    setSettingsExam(exam);
    setSettingsTitle(exam.title);
    setSettingsDescription(exam.description || '');
    setSettingsDuration(exam.duration_minutes);
    setSettingsPassingScore(exam.passing_score);
    setSettingsIsVip(exam.is_vip);
    setSettingsIsPublished(exam.is_published);
    setSettingsSecurity(
      exam.security_settings
        ? { ...DEFAULT_SECURITY_SETTINGS, ...exam.security_settings }
        : DEFAULT_SECURITY_SETTINGS
    );
    setSettingsTab('GENERAL');
  };

  // Save Settings Modal
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsExam) return;
    if (!settingsTitle.trim()) {
      showToast('Tiêu đề bài thi không được để trống.');
      return;
    }

    setIsSavingSettings(true);
    try {
      const res = await fetch(`/api/admin/assessments/${settingsExam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: settingsTitle.trim(),
          description: settingsDescription.trim(),
          duration_minutes: Number(settingsDuration),
          passing_score: Number(settingsPassingScore),
          is_vip: settingsIsVip,
          access_tier: settingsIsVip ? 'VIP' : 'FREE',
          is_published: settingsIsPublished,
          security_settings: settingsSecurity,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Không thể lưu cài đặt');
      }

      setAssessments((prev) =>
        prev.map((item) =>
          item.id === settingsExam.id
            ? {
                ...item,
                title: settingsTitle.trim(),
                description: settingsDescription.trim(),
                duration_minutes: Number(settingsDuration),
                passing_score: Number(settingsPassingScore),
                is_vip: settingsIsVip,
                access_tier: settingsIsVip ? 'VIP' : 'FREE',
                is_published: settingsIsPublished,
                security_settings: settingsSecurity,
              }
            : item
        )
      );

      showToast('Đã lưu cấu hình bài khảo thí thành công!');
      setSettingsExam(null);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Save Create or Edit Assessment
  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Tiêu đề bài thi không được để trống.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingAssessment) {
        // Update
        const res = await fetch(`/api/admin/assessments/${editingAssessment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDescription.trim(),
            duration_minutes: Number(formDuration),
            passing_score: Number(formPassingScore),
            point_reward: Number(formReward),
            is_vip: formIsVip,
            access_tier: formIsVip ? 'VIP' : 'FREE',
            is_published: formIsPublished,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Không thể cập nhật đề thi');
        }

        setAssessments((prev) =>
          prev.map((item) =>
            item.id === editingAssessment.id
              ? {
                  ...item,
                  title: formTitle.trim(),
                  description: formDescription.trim(),
                  duration_minutes: Number(formDuration),
                  passing_score: Number(formPassingScore),
                  point_reward: Number(formReward),
                  is_vip: formIsVip,
                  access_tier: formIsVip ? 'VIP' : 'FREE',
                  is_published: formIsPublished,
                }
              : item
          )
        );
        showToast('Đã cập nhật bài khảo thí thành công!');
      } else {
        // Create New
        const res = await fetch('/api/admin/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDescription.trim(),
            duration_minutes: Number(formDuration) || 45,
            passing_score: Number(formPassingScore) || 70,
            point_reward: Number(formReward) || 50,
            target_domain: formTargetDomain,
            is_vip: formIsVip,
            access_tier: formIsVip ? 'VIP' : 'FREE',
            is_published: formIsPublished,
          }),
        });

        if (!res.ok) throw new Error('Không thể tạo đề thi');
        const data = await res.json();
        const created = data.assessment;

        const newRecord: AssessmentItemRecord = {
          id: created.id,
          title: created.title,
          description: created.description,
          duration_minutes: created.duration_minutes,
          passing_score: Number(created.passing_score),
          point_reward: created.point_reward,
          is_published: created.is_published,
          is_vip: created.is_vip || created.access_tier === 'VIP',
          access_tier: created.access_tier || 'FREE',
          created_at: created.created_at,
          questionCount: 0,
          types: [],
          typeLabel: 'Chưa có câu hỏi',
          domainName: 'Chưa phân miền',
          domainCodes: [],
        };

        setAssessments((prev) => [newRecord, ...prev]);
        setIsCreateModalOpen(false);
        showToast('Đã tạo đề thi mới! Đang chuyển đến trình biên soạn câu hỏi...');
        router.push(`/admin/content/assessments/${created.id}`);
        return;
      }

      setIsCreateModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu đề thi');
    } finally {
      setIsSaving(false);
    }
  };

  // Fast Toggle VIP / FREE
  const handleToggleVip = async (exam: AssessmentItemRecord) => {
    const nextVip = !exam.is_vip;
    try {
      const res = await fetch(`/api/admin/assessments/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_vip: nextVip,
          access_tier: nextVip ? 'VIP' : 'FREE',
        }),
      });

      if (!res.ok) throw new Error('Lỗi cập nhật');

      setAssessments((prev) =>
        prev.map((item) =>
          item.id === exam.id
            ? { ...item, is_vip: nextVip, access_tier: nextVip ? 'VIP' : 'FREE' }
            : item
        )
      );
      showToast(
        nextVip
          ? `Đã chuyển bài "${exam.title}" sang chế độ VIP (Khóa chuyên sâu)`
          : `Đã mở miễn phí bài "${exam.title}" cho mọi người học`
      );
    } catch (err) {
      showToast('Không thể cập nhật hạng bài thi.');
    }
  };

  // Fast Toggle Publish / Unpublish
  const handleTogglePublish = async (exam: AssessmentItemRecord) => {
    const nextPublished = !exam.is_published;
    try {
      const res = await fetch(`/api/admin/assessments/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: nextPublished }),
      });

      if (!res.ok) throw new Error('Lỗi cập nhật');

      setAssessments((prev) =>
        prev.map((item) =>
          item.id === exam.id ? { ...item, is_published: nextPublished } : item
        )
      );
      showToast(
        nextPublished
          ? `Đã phát hành bài thi "${exam.title}" lên kho khảo thí!`
          : `Đã chuyển bài thi "${exam.title}" về trạng thái Bản nháp (Ẩn khỏi học viên)`
      );
    } catch (err) {
      showToast('Không thể cập nhật trạng thái phát hành.');
    }
  };

  // Delete Assessment
  const handleDeleteAssessment = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/assessments/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa bài thi');

      if (data.softDeleted) {
        setAssessments((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_published: false } : item))
        );
        showToast('Bài thi đã có học viên làm bài nên được chuyển sang trạng thái Ẩn');
      } else {
        setAssessments((prev) => prev.filter((item) => item.id !== id));
        showToast('Đã xóa bài thi thành công!');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa bài thi');
    } finally {
      setDeletingId(null);
    }
  };

  // Clone Assessment to new Version (DRAFT)
  const handleCloneAssessment = async (exam: AssessmentItemRecord) => {
    setCloningId(exam.id);
    try {
      const res = await fetch(`/api/admin/assessments/${exam.id}/clone`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi nhân bản bài khảo thí');
      }

      const created = data.assessment;
      const clonedRecord: AssessmentItemRecord = {
        id: created.id,
        title: created.title,
        description: created.description,
        duration_minutes: created.duration_minutes,
        passing_score: Number(created.passing_score),
        point_reward: created.point_reward,
        is_published: false,
        is_vip: created.is_vip || created.access_tier === 'VIP',
        access_tier: created.access_tier || 'FREE',
        created_at: created.created_at,
        questionCount: exam.questionCount,
        types: exam.types,
        typeLabel: exam.typeLabel,
        domainName: exam.domainName,
        domainCodes: exam.domainCodes,
      };

      setAssessments((prev) => [clonedRecord, ...prev]);
      showToast('Đã nhân bản đề thi sang phiên bản mới (Bản nháp)!');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi nhân bản bài khảo thí');
    } finally {
      setCloningId(null);
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
        if (!text) throw new Error('Tệp tải lên rỗng');

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const rawItems = Array.isArray(parsed) ? parsed : parsed.items;
          if (!Array.isArray(rawItems) || rawItems.length === 0) {
            throw new Error('Định dạng JSON không hợp lệ hoặc không có danh sách câu hỏi');
          }
          setImportParsedItems(rawItems);
        } else {
          // Assume CSV
          const parsed = parseCSV(text);
          if (parsed.length === 0) {
            throw new Error('Không tìm thấy dòng câu hỏi hợp lệ trong tệp CSV');
          }
          setImportParsedItems(parsed);
        }
      } catch (err: any) {
        setImportError(err.message || 'Lỗi đọc tệp');
        setImportParsedItems([]);
      }
    };

    reader.readAsText(file, 'utf-8');
  };

  // Submit Bulk Import
  const handleExecuteImport = async () => {
    if (importParsedItems.length === 0) {
      setImportError('Vui lòng chọn hoặc tải lên tệp có ít nhất một câu hỏi hợp lệ');
      return;
    }

    setIsSubmittingImport(true);
    setImportError(null);

    try {
      let targetId = importTargetAssessmentId;

      // If user selected "Create new assessment"
      if (targetId === 'NEW') {
        if (!importNewTitle.trim()) {
          throw new Error('Vui lòng nhập tiêu đề cho bài thi mới');
        }

        const createRes = await fetch('/api/admin/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: importNewTitle.trim(),
            description: `Bài khảo thí nạp hàng loạt từ tệp ${importFileName || 'mẫu'}`,
            duration_minutes: 45,
            passing_score: 70,
            point_reward: 50,
            is_published: true,
            is_vip: false,
          }),
        });

        if (!createRes.ok) throw new Error('Không thể khởi tạo bài thi mới để nạp câu hỏi');
        const createdData = await createRes.json();
        targetId = createdData.assessment.id;
      }

      if (!targetId) {
        throw new Error('Vui lòng chọn bài thi cần nạp câu hỏi');
      }

      // Execute import
      const importRes = await fetch(`/api/admin/assessments/${targetId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: importParsedItems }),
      });

      const importData = await importRes.json();
      if (!importRes.ok) throw new Error(importData.error || 'Lỗi khi nạp dữ liệu');

      showToast(
        `Nạp thành công ${importData.successCount}/${importData.totalReceived} câu hỏi vào đề thi!`
      );

      // Refresh assessment question count locally
      setAssessments((prev) =>
        prev.map((item) =>
          item.id === targetId
            ? { ...item, questionCount: item.questionCount + importData.successCount }
            : item
        )
      );

      setIsImportModalOpen(false);
      setImportParsedItems([]);
      setImportFileName('');
      setImportTargetAssessmentId('');
      setImportNewTitle('');
    } catch (err: any) {
      setImportError(err.message || 'Lỗi nạp dữ liệu');
    } finally {
      setIsSubmittingImport(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.75} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header (Chuẩn Ảnh 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Ngân hàng đề khảo thí chuẩn
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Quản trị đề chuẩn, phiên bản phát hành và tài sản khảo thí dùng chung toàn nền tảng.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={downloadCSVTemplate}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
            <span>Tải mẫu Excel/CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition-colors shadow-xs inline-flex items-center gap-2"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
            <span>Nạp hàng loạt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingAssessment(null);
              setFormTitle('');
              setFormDescription('');
              setFormTargetDomain('ALL');
              setFormDuration(45);
              setFormPassingScore(70);
              setFormReward(50);
              setFormIsVip(false);
              setFormIsPublished(false);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Tạo đề chuẩn mới</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bài khảo thí (tên bài, mã đề, chủ đề, từ khóa...)"
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs">
            <option>Miền năng lực: Tất cả</option>
            {domains.map((d) => (
              <option key={d.id} value={d.code}>{d.title}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          >
            <option value="ALL">Trạng thái: Tất cả</option>
            <option value="PUBLISHED">Đang phát hành</option>
            <option value="DRAFT">Bản nháp / Sắp phát hành</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          >
            <option value="ALL">Phân hạng: Tất cả</option>
            <option value="VIP">Có khóa</option>
            <option value="FREE">Miễn phí</option>
          </select>
        </div>
      </div>

      {/* 5. Assessments Table (Chuẩn Ảnh 6) */}
      <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] overflow-hidden shadow-xs">
        {filteredAssessments.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <FileCheck className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.75} />
            <p className="text-xs text-slate-500 font-medium">
              Không tìm thấy bài khảo thí nào phù hợp với bộ lọc.
            </p>
            <Link
              href="/admin/content/assessments/new"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-block"
            >
              + Tạo bài khảo thí mới ngay
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 text-xs font-medium">
                  <th className="py-3 px-4 min-w-[260px]">Bài khảo thí</th>
                  <th className="py-3 px-4 min-w-[130px]">Miền năng lực</th>
                  <th className="py-3 px-4 min-w-[120px]">Dạng câu hỏi</th>
                  <th className="py-3 px-4 text-center min-w-[65px]">Số câu</th>
                  <th className="py-3 px-4 min-w-[150px]">Thời gian &amp; ngưỡng đạt</th>
                  <th className="py-3 px-4 text-center min-w-[85px]">Phân hạng</th>
                  <th className="py-3 px-4 min-w-[130px]">Trạng thái</th>
                  <th className="py-3 px-4 text-right min-w-[90px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((exam, index) => {
                  const examCode = `NEXA-${(exam.domainCodes?.[0] || 'GEN').toUpperCase()}-${String(index + 1).padStart(4, '0')}`;
                  const isNearBottom = filteredAssessments.length > 3 && index >= filteredAssessments.length - 2;
                  return (
                    <tr key={exam.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition-colors">
                      {/* Bài khảo thí */}
                      <td className="py-3.5 px-4 min-w-[260px] max-w-[420px]">
                        <div className="flex items-center gap-2.5">
                          <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="group relative min-w-0 flex-1">
                                <Link
                                  href={`/admin/content/assessments/${exam.id}`}
                                  className="font-bold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 block transition-colors leading-snug cursor-pointer line-clamp-1"
                                  title={exam.title}
                                >
                                  {exam.title}
                                </Link>

                                {/* Tooltip khi rê chuột vào hiện đầy đủ */}
                                <div className="pointer-events-none absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-max max-w-xs rounded-xl bg-neutral-900 dark:bg-zinc-800 text-white dark:text-zinc-100 px-3 py-2 text-xs shadow-xl border border-neutral-700 dark:border-zinc-700 animate-in fade-in duration-150 whitespace-normal leading-relaxed">
                                  <p className="font-semibold">{exam.title}</p>
                                  {exam.description && (
                                    <p className="text-[10px] text-neutral-400 mt-1 line-clamp-2">{exam.description}</p>
                                  )}
                                  <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-neutral-900 dark:border-t-zinc-800" />
                                </div>
                              </div>

                              {Boolean(exam.id === 'a0000000-0000-0000-0000-000000000001' || exam.title?.toLowerCase().includes('đầu vào')) && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                                  Đầu Vào
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              Mã: {examCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Miền năng lực */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-xs text-slate-700 dark:text-zinc-300 font-medium">
                          {exam.domainName}
                        </span>
                      </td>

                      {/* Dạng câu hỏi */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-600 dark:text-zinc-400">
                          {exam.typeLabel || 'Trắc nghiệm (MCQ)'}
                        </span>
                      </td>

                      {/* Số câu */}
                      <td className="py-3.5 px-4 text-center font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {exam.questionCount}
                      </td>

                      {/* Thời gian & ngưỡng đạt */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{exam.duration_minutes} phút</span>
                          <span>|</span>
                          <span>≥ {exam.passing_score}%</span>
                        </div>
                      </td>

                      {/* Phân hạng */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleVip(exam)}
                          title={exam.is_vip ? 'Cần nâng cấp để mở khóa (Bấm để chuyển sang Miễn phí)' : 'Miễn phí (Bấm để đặt khóa)'}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer ${
                            exam.is_vip
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {exam.is_vip ? (
                            <>
                              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span>Có khóa</span>
                            </>
                          ) : (
                            <>
                              <span>Miễn phí</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Trạng thái phát hành */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(exam)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              exam.is_published ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                          />
                          <span className={exam.is_published ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-blue-700 dark:text-blue-400 font-semibold'}>
                            {exam.is_published ? 'Đang phát hành' : 'Sắp phát hành'}
                          </span>
                        </button>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenSettings(exam)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Cài đặt tham số đề thi"
                          >
                            <Settings className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenDropdown(e, exam)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              dropdownMenu?.id === exam.id
                                ? 'text-blue-600 bg-blue-50 dark:bg-zinc-800'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800'
                            }`}
                            title="Tùy chọn thao tác khác"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div>
              Hiển thị 1–{Math.min(8, filteredAssessments.length)} trên {totalAssessments.toLocaleString('vi-VN')} đề chuẩn
            </div>
            <div className="flex items-center gap-1">
              <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold">1</span>
              {totalAssessments > 8 && (
                <span className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">2</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3-dots Floating Dropdown Menu (Nổi trên mọi khung viền, tự động lật hướng) */}
      {dropdownMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: dropdownMenu.placement === 'bottom' ? dropdownMenu.top : undefined,
            bottom: dropdownMenu.placement === 'top' ? window.innerHeight - dropdownMenu.top : undefined,
            right: dropdownMenu.right,
            zIndex: 9999,
          }}
          className="w-48 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-xl py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100 font-sans"
        >
          <button
            type="button"
            onClick={() => {
              const target = dropdownMenu.exam;
              setDropdownMenu(null);
              handleOpenSettings(target);
            }}
            className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-blue-600" />
            <span>Cài đặt tham số đề</span>
          </button>

          <Link
            href={`/admin/content/assessments/${dropdownMenu.exam.id}/preview`}
            onClick={() => setDropdownMenu(null)}
            className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Xem trước bài thi</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              const target = dropdownMenu.exam;
              setDropdownMenu(null);
              handleTogglePublish(target);
            }}
            className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
          >
            {dropdownMenu.exam.is_published ? (
              <>
                <Ban className="w-3.5 h-3.5 text-amber-600" />
                <span>Tạm ngưng</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kích hoạt phát hành</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              const target = dropdownMenu.exam;
              setDropdownMenu(null);
              handleCloneAssessment(target);
            }}
            disabled={cloningId === dropdownMenu.exam.id}
            className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5 text-blue-600" />
            <span>Nhân bản đề</span>
          </button>

          <Link
            href={`/admin/content/assessments/${dropdownMenu.exam.id}`}
            onClick={() => setDropdownMenu(null)}
            className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Sửa trong Studio</span>
          </Link>

          <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

          {Boolean(dropdownMenu.exam.id === 'a0000000-0000-0000-0000-000000000001' || dropdownMenu.exam.title?.toLowerCase().includes('đầu vào')) ? (
            <div className="px-3 py-2 text-[11px] text-slate-400 italic">
              Đề đầu vào mặc định (Không thể xóa)
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                const targetId = dropdownMenu.exam.id;
                setDropdownMenu(null);
                handleDeleteAssessment(targetId);
              }}
              className="w-full px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa đề</span>
            </button>
          )}
        </div>
      )}

      {/* Modal: Tạo / Chỉnh Sửa Bài Khảo Thí */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 w-full max-w-lg shadow-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {editingAssessment ? 'Chỉnh Sửa Thông Tin Đề Thi' : 'Tạo Bài Khảo Thí Chuẩn Hóa Mới'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Thiết lập tham số bài thi, phân hạng truy cập và trạng thái phát hành.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Tiêu Đề Bài Khảo Thí *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Đánh giá Năng lực Tìm kiếm &amp; Xác thực Dữ liệu số"
                  className="w-full px-3 py-2 rounded border border-slate-200 text-slate-900 focus:outline-hidden focus:border-sky-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Mô Tả Mục Tiêu Khảo Hạch</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt chuẩn đầu ra năng lực của bài thi..."
                  className="w-full px-3 py-2 rounded border border-slate-200 text-slate-900 focus:outline-hidden focus:border-sky-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                  Miền Năng Lực Số (Khảo thí trọng tâm) *
                </label>
                <select
                  value={formTargetDomain}
                  onChange={(e) => setFormTargetDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-600 text-xs cursor-pointer font-medium"
                >
                  <option value="ALL">Đa Miền Năng Lực Số (Đánh giá toàn diện 5 miền)</option>
                  <option value="01">Miền 01: Thông tin &amp; Dữ liệu số</option>
                  <option value="02">Miền 02: Giao tiếp &amp; Cộng tác số</option>
                  <option value="03">Miền 03: Sáng tạo Nội dung số &amp; AI</option>
                  <option value="04">Miền 04: An toàn &amp; Bảo mật số</option>
                  <option value="05">Miền 05: Giải quyết Vấn đề số</option>
                </select>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                  Đề thi được phân loại theo chuẩn 5 miền năng lực số để người học dễ dàng lọc và đánh giá đúng trọng tâm.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3">
                <div>
                  <span className="block font-semibold text-slate-800 mb-1.5">Phân Hạng Truy Cập</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormIsVip(false)}
                      className={`flex-1 py-1.5 px-3 rounded border text-xs font-semibold text-center transition-colors cursor-pointer ${
                        !formIsVip
                          ? 'bg-sky-50 border-sky-300 text-sky-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Miễn phí
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsVip(true)}
                      className={`flex-1 py-1.5 px-3 rounded border text-xs font-semibold text-center transition-colors cursor-pointer ${
                        formIsVip
                          ? 'bg-amber-50 border-amber-300 text-amber-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Có khóa (Cần nâng cấp)
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formIsVip
                      ? 'Yêu cầu người học phải nâng cấp gói để mở khóa làm bài này'
                      : 'Mọi người học tài khoản miễn phí đều có thể truy cập làm bài'}
                  </p>
                </div>

                <div>
                  <span className="block font-semibold text-slate-800 mb-1.5">Trạng Thái Phát Hành</span>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Công khai trên kho đề thi ngay
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded bg-sky-600 text-white hover:bg-sky-700 font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Đang lưu...' : editingAssessment ? 'Cập Nhật' : 'Tạo Đề Thi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nạp Hàng Loạt */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 w-full max-w-2xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                  <span>Nạp đề &amp; câu hỏi hàng loạt</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Nhập nhanh danh sách câu hỏi Trắc nghiệm, Tình huống, Thực hành từ tệp Excel/CSV hoặc JSON.
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

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Target selection */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Chọn Đề Khảo Thí Tiếp Nhận Câu Hỏi *
                </label>
                <select
                  value={importTargetAssessmentId}
                  onChange={(e) => setImportTargetAssessmentId(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-200 text-slate-900 bg-white text-xs focus:outline-hidden focus:border-sky-600"
                >
                  <option value="">-- Chọn bài thi có sẵn hoặc tạo bài mới --</option>
                  <option value="NEW">+ Tạo bài khảo thí mới từ danh sách này</option>
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.questionCount} câu - {a.is_vip ? 'VIP' : 'FREE'})
                    </option>
                  ))}
                </select>
              </div>

              {importTargetAssessmentId === 'NEW' && (
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Tiêu Đề Bài Khảo Thí Mới *
                  </label>
                  <input
                    type="text"
                    value={importNewTitle}
                    onChange={(e) => setImportNewTitle(e.target.value)}
                    placeholder="Ví dụ: Đánh giá Đa Miền Năng Lực Số Tổng Hợp"
                    className="w-full px-3 py-2 rounded border border-slate-200 text-slate-900 text-xs focus:outline-hidden focus:border-sky-600"
                  />
                </div>
              )}

              {/* Template & Guidelines */}
              {/* Template & Guidelines */}
              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">
                    Tải tệp mẫu Excel / CSV chuẩn theo 5 Miền năng lực số (UTF-8)
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={downloadMCQTemplate}
                      className="px-2 py-1 rounded bg-white border border-slate-200 text-sky-700 hover:bg-sky-50 font-semibold inline-flex items-center gap-1 text-[11px]"
                    >
                      <Download className="w-3 h-3" strokeWidth={1.75} />
                      <span>Mẫu Trắc Nghiệm</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadScenarioTemplate}
                      className="px-2 py-1 rounded bg-white border border-slate-200 text-amber-700 hover:bg-amber-50 font-semibold inline-flex items-center gap-1 text-[11px]"
                    >
                      <Download className="w-3 h-3" strokeWidth={1.75} />
                      <span>Mẫu Tình Huống</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadPracticalTemplate}
                      className="px-2 py-1 rounded bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 font-semibold inline-flex items-center gap-1 text-[11px]"
                    >
                      <Download className="w-3 h-3" strokeWidth={1.75} />
                      <span>Mẫu Thực Hành</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Cột <code className="font-mono text-slate-800">domain</code> nhận số 1 đến 5 (hoặc kết hợp &ldquo;1, 2&rdquo;). Mẫu Thực hành hỗ trợ các cột tiêu chí phẳng (<code className="font-mono text-slate-800">criterion_1_name</code>, <code className="font-mono text-slate-800">criterion_1_weight</code>...) không cần nhập JSON phức tạp.
                </p>
              </div>

              {/* Upload Input */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Chọn Tệp CSV hoặc JSON từ máy tính
                </label>
                <input
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
              </div>

              {/* Error message */}
              {importError && (
                <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" strokeWidth={1.75} />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview table */}
              {importParsedItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Xem trước dữ liệu ({importParsedItems.length} câu hỏi hợp lệ)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      File: {importFileName}
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-md">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 font-semibold text-slate-500 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Kỹ năng</th>
                          <th className="py-2 px-3">Dạng</th>
                          <th className="py-2 px-3">Nội dung</th>
                          <th className="py-2 px-3">Đáp án / Rubric</th>
                          <th className="py-2 px-3 text-right">Điểm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importParsedItems.slice(0, 15).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-mono font-medium text-slate-800">
                              {row.skill_code || '1.1'}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                {row.type || 'MCQ'}
                              </span>
                            </td>
                            <td className="py-2 px-3 max-w-xs truncate text-slate-800" title={row.prompt}>
                              {row.prompt}
                            </td>
                            <td className="py-2 px-3 text-slate-600 font-mono">
                              {row.correct_answer || (row.rubric_guide ? 'Rubric' : '-')}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                              {row.points || 10}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importParsedItems.length > 15 && (
                    <p className="text-[10px] text-slate-400 italic">
                      ... và {importParsedItems.length - 15} câu hỏi khác
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isSubmittingImport || importParsedItems.length === 0}
                className="px-4 py-2 rounded bg-sky-600 text-white hover:bg-sky-700 font-semibold text-xs transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isSubmittingImport ? (
                  'Đang xử lý...'
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Xác Nhận Nạp {importParsedItems.length} Câu Hỏi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Assessment */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 w-full max-w-sm p-6 space-y-4 shadow-sm animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-rose-50 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Xóa Bài Khảo Thí?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Nếu bài thi đã có thí sinh nộp bài, hệ thống sẽ tự động chuyển sang chế độ Ẩn để bảo
                  toàn lịch sử điểm số.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAssessment(deletingId)}
                className="px-3.5 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cài Đặt Tham Số Bài Khảo Thí Chuẩn (Exam Settings) */}
      {settingsExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                    Cài đặt bài khảo thí
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                    {settingsExam.questionCount} câu hỏi &bull; {settingsExam.domainName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSettingsExam(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 pt-2 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSettingsTab('GENERAL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  settingsTab === 'GENERAL'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800'
                }`}
              >
                Thông số cơ bản
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('SECURITY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  settingsTab === 'SECURITY'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Cấu hình trải nghiệm thi</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveSettings} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {settingsTab === 'GENERAL' ? (
                <>
                  <div>
                    <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                      Tiêu đề bài khảo thí <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsTitle}
                      onChange={(e) => setSettingsTitle(e.target.value)}
                      placeholder="Ví dụ: Đánh Giá Năng Lực Số Toàn Diện 5 Miền"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                      Mô tả mục tiêu khảo hạch
                    </label>
                    <textarea
                      rows={2}
                      value={settingsDescription}
                      onChange={(e) => setSettingsDescription(e.target.value)}
                      placeholder="Mô tả tóm tắt chuẩn đầu ra năng lực của bài thi..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                        Thời lượng làm bài (Phút)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={300}
                        value={settingsDuration}
                        onChange={(e) => setSettingsDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1">
                        Chuẩn đạt yêu cầu (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={settingsPassingScore}
                        onChange={(e) => setSettingsPassingScore(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1.5">
                        Phân hạng truy cập
                      </span>
                      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setSettingsIsVip(false)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer ${
                            !settingsIsVip
                              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
                          }`}
                        >
                          Miễn phí
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettingsIsVip(true)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer ${
                            settingsIsVip
                              ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs'
                              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
                          }`}
                        >
                          Có khóa
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="block font-semibold text-neutral-800 dark:text-zinc-200 mb-1.5">
                        Trạng thái phát hành
                      </span>
                      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setSettingsIsPublished(false)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer ${
                            !settingsIsPublished
                              ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-neutral-200 shadow-xs'
                              : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900'
                          }`}
                        >
                          Bản nháp (Ẩn)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettingsIsPublished(true)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer ${
                            settingsIsPublished
                              ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                              : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900'
                          }`}
                        >
                          Đang phát hành
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tóm tắt metadata thực tế */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400">
                    <span>Dạng đề: <strong>{settingsExam.typeLabel || 'Trắc nghiệm'}</strong></span>
                    <span>Ngày tạo: <strong>{new Date(settingsExam.created_at).toLocaleDateString('vi-VN')}</strong></span>
                    <Link
                      href={`/admin/content/assessments/${settingsExam.id}`}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Soạn câu hỏi trong Studio &rarr;</span>
                    </Link>
                  </div>
                </>
              ) : (
                <SecuritySettingsCard
                  value={settingsSecurity}
                  onChange={setSettingsSecurity}
                  disabled={isSavingSettings}
                  mode="canonical"
                />
              )}

              {/* Footer Actions */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/content/assessments/${settingsExam.id}/preview`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Xem trước</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleCloneAssessment(settingsExam);
                      setSettingsExam(null);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-neutral-700 dark:text-zinc-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Nhân bản</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSettingsExam(null)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSavingSettings ? 'Đang lưu...' : 'Lưu cấu hình'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
