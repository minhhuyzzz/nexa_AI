'use client';

import { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
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
}

interface Props {
  initialAssessments: AssessmentItemRecord[];
  domains: Array<{ id: string; code: string; title: string }>;
  competencies: Array<{ id: string; skill_code: string; title: string; domain_id: string }>;
}

export function AdminAssessmentBankClient({
  initialAssessments,
  domains,
  competencies,
}: Props) {
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

  // Form State for Create / Edit Assessment
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
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
    setFormDescription('Bài khảo thí chuẩn hóa đo lường năng lực số theo khung DigComp 3.0.');
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
    setFormDuration(exam.duration_minutes);
    setFormPassingScore(exam.passing_score);
    setFormReward(exam.point_reward);
    setFormIsVip(exam.is_vip);
    setFormIsPublished(exam.is_published);
    setIsCreateModalOpen(true);
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

        if (!res.ok) throw new Error('Không thể cập nhật đề thi');

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
            duration_minutes: Number(formDuration),
            passing_score: Number(formPassingScore),
            point_reward: Number(formReward),
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
        showToast('Đã tạo đề thi mới! Bạn có thể thêm câu hỏi ngay bây giờ.');
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
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-md shadow-md border border-slate-700 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.75} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-md bg-white border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              TRUNG TÂM QUẢN TRỊ KHO ĐỀ KHẢO THÍ &amp; HỌC LIỆU NĂNG LỰC SỐ
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Ngân Hàng Đề Khảo Thí &amp; Quản Trị Khảo Hạch
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Hệ thống ngân hàng khảo thí chuẩn hóa DigComp 3.0: Quản lý ma trận đề đa miền, cấu hình phân hạng
            truy cập (Free / VIP), nạp hàng loạt từ file Excel/CSV, và thiết lập rubric thực hành.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={downloadCSVTemplate}
            className="px-3.5 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium inline-flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <span>Tải Tệp Mẫu Excel/CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-md bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 text-xs font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-600" strokeWidth={1.75} />
            <span>Nạp Hàng Loạt (Bulk Import)</span>
          </button>

          <Link
            href="/admin/content/assessments/new"
            className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 text-xs font-semibold inline-flex items-center gap-2 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>Tạo Đề Thi Mới</span>
          </Link>
        </div>
      </div>

      {/* Compact Status Bar (h-10) */}
      <div className="h-10 px-4 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-500">Tổng số đề:</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">{totalAssessments}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-500">Đang phát hành:</span>
            <span className="font-mono font-bold text-emerald-700 tabular-nums">{publishedAssessments}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-500">Miễn phí:</span>
            <span className="font-mono font-bold text-slate-700 tabular-nums">{freeAssessments}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-500">VIP:</span>
            <span className="font-mono font-bold text-amber-700 tabular-nums">{vipAssessments}</span>
          </div>
        </div>

        <div className="hidden sm:block text-[11px] text-slate-400 font-mono">
          Chuẩn hóa DigComp 3.0 &bull; Dữ liệu thời gian thực
        </div>
      </div>

      {/* Danh Sách Đề Khảo Thí */}
      <div className="space-y-4">
          {/* Toolbar: Search & Filters */}
          <div className="p-4 rounded-md bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                strokeWidth={1.75}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên đề, mô tả hoặc miền năng lực..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-sky-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Phân hạng:</span>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value as any)}
                  className="text-xs rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 focus:outline-hidden focus:border-sky-600"
                >
                  <option value="ALL">Tất cả hạng</option>
                  <option value="FREE">Chỉ đề Miễn phí</option>
                  <option value="VIP">Chỉ đề VIP (Khóa)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Trạng thái:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs rounded border border-slate-200 bg-white px-2 py-1 text-slate-800 focus:outline-hidden focus:border-sky-600"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PUBLISHED">Đang phát hành</option>
                  <option value="DRAFT">Bản nháp (Ẩn)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assessments Table */}
          <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
            {filteredAssessments.length === 0 ? (
              <div className="py-16 px-4 text-center space-y-3">
                <FileCheck className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.75} />
                <p className="text-xs text-slate-500 font-medium">
                  Không tìm thấy bài khảo thí nào phù hợp với bộ lọc.
                </p>
                <Link
                  href="/admin/content/assessments/new"
                  className="text-xs text-sky-600 hover:text-sky-700 font-semibold inline-block"
                >
                  + Tạo bài khảo thí mới ngay
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                      <th className="py-3 px-4">Bài Khảo Thí</th>
                      <th className="py-3 px-4">Miền Năng Lực</th>
                      <th className="py-3 px-4">Dạng Câu Hỏi</th>
                      <th className="py-3 px-4 text-center">Số Câu</th>
                      <th className="py-3 px-4 text-center">Thời Gian &amp; Đạt</th>
                      <th className="py-3 px-4 text-center">Phân Hạng</th>
                      <th className="py-3 px-4 text-center">Phát Hành</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAssessments.map((exam) => (
                      <tr key={exam.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 max-w-xs">
                          <Link
                            href={`/admin/content/assessments/${exam.id}`}
                            className="font-bold text-slate-900 hover:text-sky-600 block line-clamp-1"
                          >
                            {exam.title}
                          </Link>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {exam.description || 'Chưa có mô tả'}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-medium">
                            {exam.domainName}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-[11px] text-slate-600">
                            {exam.typeLabel}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono tabular-nums font-semibold text-slate-900">
                          {exam.questionCount} câu
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono tabular-nums text-slate-600">
                          <span>{exam.duration_minutes}p</span> / <span>{exam.passing_score}%</span>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleVip(exam)}
                            title="Bấm để chuyển đổi giữa Free và VIP"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border transition-colors ${
                              exam.is_vip
                                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {exam.is_vip ? (
                              <>
                                <Lock className="w-3 h-3 text-amber-700" strokeWidth={1.75} />
                                <span>VIP</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3 h-3 text-slate-500" strokeWidth={1.75} />
                                <span>FREE</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(exam)}
                            title="Bấm để bật/tắt phát hành"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold border transition-colors ${
                              exam.is_published
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                exam.is_published ? 'bg-emerald-600' : 'bg-slate-400'
                              }`}
                            />
                            <span>{exam.is_published ? 'Phát hành' : 'Bản nháp'}</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/content/assessments/${exam.id}`}
                              className="px-2.5 py-1 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                              title="Mở trình soạn thảo 3-Pane Studio"
                            >
                              <Edit3 className="w-3 h-3" strokeWidth={1.75} />
                              <span>Sửa trong Studio</span>
                            </Link>

                            <Link
                              href={`/learner/take/${exam.id}`}
                              target="_blank"
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Xem thử giao diện làm bài"
                            >
                              <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </Link>

                            <button
                              type="button"
                              onClick={() => setDeletingId(exam.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Xóa bài thi"
                            >
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      {/* Modal: Tạo / Chỉnh Sửa Bài Khảo Thí */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 w-full max-w-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {editingAssessment ? 'Chỉnh Sửa Thông Tin Đề Thi' : 'Tạo Bài Khảo Thí Chuẩn Hóa Mới'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Thiết lập tham số bài thi, phân hạng Free / VIP và trạng thái phát hành.
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Thời Lượng (Phút)</label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 font-mono text-slate-900 focus:outline-hidden focus:border-sky-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Chuẩn Đạt (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formPassingScore}
                    onChange={(e) => setFormPassingScore(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 font-mono text-slate-900 focus:outline-hidden focus:border-sky-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Điểm Thưởng (Pts)</label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={formReward}
                    onChange={(e) => setFormReward(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded border border-slate-200 font-mono text-slate-900 focus:outline-hidden focus:border-sky-600 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <span className="block font-semibold text-slate-800 mb-1.5">Phân Hạng Truy Cập</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormIsVip(false)}
                      className={`flex-1 py-1.5 px-3 rounded border text-xs font-semibold text-center transition-colors ${
                        !formIsVip
                          ? 'bg-sky-50 border-sky-300 text-sky-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      FREE (Tự do)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsVip(true)}
                      className={`flex-1 py-1.5 px-3 rounded border text-xs font-semibold text-center transition-colors ${
                        formIsVip
                          ? 'bg-amber-50 border-amber-300 text-amber-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      VIP (Khóa nâng cao)
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formIsVip
                      ? 'Chỉ tài khoản người học đã nâng cấp gói VIP mới được làm bài này'
                      : 'Mọi người học tài khoản Free đều có thể truy cập làm bài'}
                  </p>
                </div>

                <div>
                  <span className="block font-semibold text-slate-800 mb-1.5">Trạng Thái Phát Hành</span>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Công khai trên kho đề thi ngay
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
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

      {/* Modal: Nạp Hàng Loạt (Bulk Import) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 w-full max-w-2xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                  <span>Nạp Đề &amp; Câu Hỏi Hàng Loạt (Bulk Import)</span>
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
                    placeholder="Ví dụ: Đánh giá Đa Miền Năng Lực Số Tổng Hợp DigComp 3.0"
                    className="w-full px-3 py-2 rounded border border-slate-200 text-slate-900 text-xs focus:outline-hidden focus:border-sky-600"
                  />
                </div>
              )}

              {/* Template & Guidelines */}
              {/* Template & Guidelines */}
              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">
                    Tải tệp mẫu Excel / CSV chuẩn theo 5 Miền DigComp (UTF-8)
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
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Kỹ năng</th>
                          <th className="py-2 px-3">Dạng</th>
                          <th className="py-2 px-3">Nội dung</th>
                          <th className="py-2 px-3">Đáp án / Rubric</th>
                          <th className="py-2 px-3 text-right">Điểm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
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

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50">
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
          <div className="bg-white rounded-md border border-slate-200 w-full max-w-sm p-6 space-y-4 shadow-lg animate-in fade-in zoom-in-95">
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
    </div>
  );
}
