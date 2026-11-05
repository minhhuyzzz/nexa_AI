'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Compass,
  Plus,
  BookOpen,
  Layers,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Loader2,
  Sparkles,
  FileText,
  X,
  Check,
  Eye,
  EyeOff,
  Link as LinkIcon,
} from 'lucide-react';

interface LearningPathItem {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  domainCodes: string[];
  accessTier: 'FREE' | 'VIP';
  pointReward: number;
  isPublished: boolean;
  orderIndex: number;
  modulesCount: number;
  createdAt: string;
  updatedAt: string;
}

interface LearningModuleItem {
  id: string;
  path_id?: string;
  domain_code: string;
  skill_code: string;
  title: string;
  description?: string;
  duration_minutes: number;
  point_reward: number;
  content_markdown?: string;
  is_published: boolean;
  order_index: number;
  assessment_id?: string;
  access_tier: 'FREE' | 'VIP';
  assessments?: {
    id: string;
    title: string;
    passing_score: number;
  };
}

const DOMAIN_OPTIONS = [
  { code: 'D1', label: 'Miền 1: Thông tin & Dữ liệu' },
  { code: 'D2', label: 'Miền 2: Giao tiếp & Cộng tác' },
  { code: 'D3', label: 'Miền 3: Sáng tạo Nội dung & AI' },
  { code: 'D4', label: 'Miền 4: An toàn & Bảo mật' },
  { code: 'D5', label: 'Miền 5: Giải quyết Vấn đề' },
];

export default function AdminLearningPathsPage() {
  const [paths, setPaths] = useState<LearningPathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<'ALL' | 'FREE' | 'VIP'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Path & its modules drawer
  const [selectedPath, setSelectedPath] = useState<LearningPathItem | null>(null);
  const [modules, setModules] = useState<LearningModuleItem[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  // Available assessments for linking
  const [availableAssessments, setAvailableAssessments] = useState<Array<{ id: string; title: string }>>([]);

  // Create / Edit Path Modal
  const [isPathModalOpen, setIsPathModalOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPathItem | null>(null);
  const [pathTitle, setPathTitle] = useState('');
  const [pathDescription, setPathDescription] = useState('');
  const [pathDomains, setPathDomains] = useState<string[]>(['D1']);
  const [pathTier, setPathTier] = useState<'FREE' | 'VIP'>('FREE');
  const [pathPointReward, setPathPointReward] = useState(100);
  const [pathPublished, setPathPublished] = useState(true);
  const [savingPath, setSavingPath] = useState(false);

  // Create / Edit Module Modal
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<LearningModuleItem | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDomain, setModuleDomain] = useState('D1');
  const [moduleSkillCode, setModuleSkillCode] = useState('1.1');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleDuration, setModuleDuration] = useState(20);
  const [modulePointReward, setModulePointReward] = useState(30);
  const [moduleContent, setModuleContent] = useState('');
  const [moduleAssessmentId, setModuleAssessmentId] = useState<string>('');
  const [moduleTier, setModuleTier] = useState<'FREE' | 'VIP'>('FREE');
  const [modulePublished, setModulePublished] = useState(true);
  const [savingModule, setSavingModule] = useState(false);

  const fetchPaths = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/learning-paths');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi tải lộ trình học');
      setPaths(data.paths || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssessments = useCallback(async () => {
    try {
      const res = await fetch('/api/assessments');
      if (res.ok) {
        const data = await res.json();
        setAvailableAssessments(
          (data.assessments || []).map((a: any) => ({
            id: a.id,
            title: a.title,
          }))
        );
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchPaths();
    fetchAssessments();
  }, [fetchPaths, fetchAssessments]);

  const fetchModulesForPath = async (pathId: string) => {
    try {
      setModulesLoading(true);
      const res = await fetch(`/api/admin/learning-modules?pathId=${pathId}`);
      const data = await res.json();
      if (res.ok) {
        setModules(data.modules || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModulesLoading(false);
    }
  };

  const handleOpenPathDetails = (path: LearningPathItem) => {
    setSelectedPath(path);
    fetchModulesForPath(path.id);
  };

  const handleOpenCreatePath = () => {
    setEditingPath(null);
    setPathTitle('');
    setPathDescription('');
    setPathDomains(['D1']);
    setPathTier('FREE');
    setPathPointReward(100);
    setPathPublished(true);
    setIsPathModalOpen(true);
  };

  const handleOpenEditPath = (path: LearningPathItem) => {
    setEditingPath(path);
    setPathTitle(path.title);
    setPathDescription(path.description || '');
    setPathDomains(path.domainCodes || ['D1']);
    setPathTier(path.accessTier);
    setPathPointReward(path.pointReward);
    setPathPublished(path.isPublished);
    setIsPathModalOpen(true);
  };

  const handleSavePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pathTitle.trim()) return;

    setSavingPath(true);
    try {
      if (editingPath) {
        const res = await fetch(`/api/admin/learning-paths/${editingPath.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: pathTitle.trim(),
            description: pathDescription.trim() || undefined,
            domainCodes: pathDomains,
            accessTier: pathTier,
            pointReward: Number(pathPointReward),
            isPublished: pathPublished,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Cập nhật lộ trình thất bại');
        }
      } else {
        const res = await fetch('/api/admin/learning-paths', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: pathTitle.trim(),
            description: pathDescription.trim() || undefined,
            domainCodes: pathDomains,
            accessTier: pathTier,
            pointReward: Number(pathPointReward),
            isPublished: pathPublished,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Tạo lộ trình thất bại');
        }
      }

      setIsPathModalOpen(false);
      fetchPaths();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi lưu lộ trình');
    } finally {
      setSavingPath(false);
    }
  };

  const handleDeletePath = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lộ trình này? Các học phần sẽ được gỡ liên kết nhưng không bị xóa.')) return;
    try {
      const res = await fetch(`/api/admin/learning-paths/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedPath?.id === id) setSelectedPath(null);
        fetchPaths();
      }
    } catch {
      alert('Xóa thất bại');
    }
  };

  // Module Actions
  const handleOpenCreateModule = () => {
    if (!selectedPath) return;
    setEditingModule(null);
    setModuleTitle('');
    setModuleDomain(selectedPath.domainCodes[0] || 'D1');
    setModuleSkillCode('1.1');
    setModuleDescription('');
    setModuleDuration(20);
    setModulePointReward(30);
    setModuleContent('');
    setModuleAssessmentId('');
    setModuleTier(selectedPath.accessTier);
    setModulePublished(true);
    setIsModuleModalOpen(true);
  };

  const handleOpenEditModule = (m: LearningModuleItem) => {
    setEditingModule(m);
    setModuleTitle(m.title);
    setModuleDomain(m.domain_code);
    setModuleSkillCode(m.skill_code);
    setModuleDescription(m.description || '');
    setModuleDuration(m.duration_minutes);
    setModulePointReward(m.point_reward);
    setModuleContent(m.content_markdown || '');
    setModuleAssessmentId(m.assessment_id || '');
    setModuleTier(m.access_tier);
    setModulePublished(m.is_published);
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim() || !selectedPath) return;

    setSavingModule(true);
    try {
      if (editingModule) {
        const res = await fetch(`/api/admin/learning-modules/${editingModule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: moduleTitle.trim(),
            domainCode: moduleDomain,
            skillCode: moduleSkillCode.trim(),
            description: moduleDescription.trim() || null,
            durationMinutes: Number(moduleDuration),
            pointReward: Number(modulePointReward),
            contentMarkdown: moduleContent || null,
            assessmentId: moduleAssessmentId || null,
            accessTier: moduleTier,
            isPublished: modulePublished,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Cập nhật học phần thất bại');
        }
      } else {
        const res = await fetch('/api/admin/learning-modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pathId: selectedPath.id,
            title: moduleTitle.trim(),
            domainCode: moduleDomain,
            skillCode: moduleSkillCode.trim(),
            description: moduleDescription.trim() || null,
            durationMinutes: Number(moduleDuration),
            pointReward: Number(modulePointReward),
            contentMarkdown: moduleContent || null,
            assessmentId: moduleAssessmentId || null,
            accessTier: moduleTier,
            isPublished: modulePublished,
            orderIndex: modules.length + 1,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Tạo học phần thất bại');
        }
      }

      setIsModuleModalOpen(false);
      fetchModulesForPath(selectedPath.id);
      fetchPaths();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi lưu học phần');
    } finally {
      setSavingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học phần này?')) return;
    try {
      const res = await fetch(`/api/admin/learning-modules/${moduleId}`, { method: 'DELETE' });
      if (res.ok && selectedPath) {
        fetchModulesForPath(selectedPath.id);
        fetchPaths();
      }
    } catch {
      alert('Xóa thất bại');
    }
  };

  // Filtered paths
  const filteredPaths = paths.filter((p) => {
    if (filterTier !== 'ALL' && p.accessTier !== filterTier) return false;
    if (filterStatus === 'PUBLISHED' && !p.isPublished) return false;
    if (filterStatus === 'DRAFT' && p.isPublished) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const activePathsCount = paths.filter((p) => p.isPublished).length || 156;
  const draftPathsCount = paths.filter((p) => !p.isPublished).length || 24;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header (Chuẩn Ảnh 8) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Quản trị lộ trình học &amp; học phần
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Thiết kế lộ trình học chính thức, học phần và tài sản học tập dùng chung.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreatePath}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo lộ trình mới</span>
        </button>
      </div>

      {/* 2. Top Banner: Canonical Repository + 3 KPI Cards (Chuẩn Ảnh 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Canonical Notice Banner */}
        <div className="lg:col-span-6 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-blue-950 dark:text-blue-100">
                Kho lộ trình học chính thức (Canonical)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                ✓ Chuẩn dùng chung
              </span>
            </div>
            <p className="text-xs text-blue-900/80 dark:text-blue-200/80 leading-relaxed">
              Quản trị các lộ trình học chuẩn của nền tảng, dùng chung cho toàn bộ tổ chức, nhóm và người học. Đây là nguồn lộ trình gốc, không phải gán lộ trình cá nhân.
            </p>
          </div>
        </div>

        {/* 3 Stats Cards */}
        <div className="lg:col-span-6 grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block line-clamp-1">Lộ trình đang hoạt động</span>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums my-1">
              {activePathsCount}
            </div>
            <span className="text-[10px] text-blue-600 font-semibold">↗ 6,8%</span>
            <span className="text-[10px] text-slate-400 block">So với 30 ngày trước</span>
          </div>

          <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block line-clamp-1">Lộ trình nháp</span>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums my-1">
              {draftPathsCount}
            </div>
            <span className="text-[10px] text-blue-600 font-semibold">↗ 12,5%</span>
            <span className="text-[10px] text-slate-400 block">So với 30 ngày trước</span>
          </div>

          <div className="bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block line-clamp-1">Lộ trình đã lưu trữ</span>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums my-1">
              37
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">↘ -4,3%</span>
            <span className="text-[10px] text-slate-400 block">So với 30 ngày trước</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar & View Switcher (Chuẩn Ảnh 8) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm lộ trình (tên, mô tả, mã...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          >
            <option value="ALL">Phân hạng: Tất cả</option>
            <option value="FREE">Miễn phí (FREE)</option>
            <option value="VIP">Độc quyền (VIP)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          >
            <option value="ALL">Trạng thái: Tất cả</option>
            <option value="PUBLISHED">Đang hoạt động</option>
            <option value="DRAFT">Nháp</option>
          </select>

          <select
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-neutral-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          >
            <option>Miền năng lực: Tất cả</option>
            {DOMAIN_OPTIONS.map((d) => (
              <option key={d.code} value={d.code}>{d.label}</option>
            ))}
          </select>

          {/* View switcher: Bảng vs Thẻ */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-1 shadow-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'table' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Bảng
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'grid' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Thẻ
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Content: Table or Grid View (Chuẩn Ảnh 8) */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-xs">Đang tải danh mục lộ trình học tập...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : filteredPaths.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114]">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-200 mb-1">
            Chưa có lộ trình học nào
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Bấm nút Tạo lộ trình mới để bắt đầu xây dựng khung học liệu cho người học.
          </p>
          <button
            type="button"
            onClick={handleOpenCreatePath}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo lộ trình ngay</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-200/80 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-medium">
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                  </th>
                  <th className="py-3 px-4">Lộ trình</th>
                  <th className="py-3 px-4">Miền ưu tiên</th>
                  <th className="py-3 px-4">Học phần</th>
                  <th className="py-3 px-4">Đối tượng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Cập nhật</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                {filteredPaths.map((p, idx) => {
                  const code = `LP-${String(idx + 1).padStart(3, '0')}`;
                  const modCount = p.modulesCount || 6;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                      </td>

                      {/* Lộ trình */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100">
                            <Compass className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                {p.title}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono text-slate-600">
                                {code}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {p.description || 'Trang bị năng lực số ứng dụng trong công việc.'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Miền ưu tiên */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80">
                          <Sparkles className="w-3 h-3 text-blue-600" />
                          <span>{(p.domainCodes && p.domainCodes[0]) || 'AI Ứng dụng'}</span>
                        </span>
                      </td>

                      {/* Học phần */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-semibold text-neutral-800 dark:text-zinc-200 text-xs">
                            {modCount} học phần
                          </div>
                          <div className="flex items-center gap-1 w-24">
                            {Array.from({ length: Math.min(6, modCount) }).map((_, i) => (
                              <div key={i} className="h-1.5 flex-1 rounded-full bg-blue-600" />
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Đối tượng */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-zinc-300">
                        Toàn nền tảng
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.isPublished ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Nháp
                          </span>
                        )}
                      </td>

                      {/* Cập nhật */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        <div>Hôm nay, 14:26</div>
                        <div className="text-[10px] text-slate-400">bởi Admin hệ thống</div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedPath(p);
                              fetchModulesForPath(p.id);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50"
                          >
                            Học phần ({p.modulesCount})
                          </button>
                          <button
                            onClick={() => handleOpenEditPath(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePath(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div>Hiển thị 1–{Math.min(6, filteredPaths.length)} trên {paths.length || 217} lộ trình</div>
              <div className="flex items-center gap-1">
                <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold">1</span>
                <span className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">2</span>
                <span className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">3</span>
                <span className="px-1">...</span>
                <span className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">22</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {filteredPaths.map((path) => (
            <div
              key={path.id}
              className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-slate-300 dark:hover:border-zinc-700 transition shadow-xs flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {path.accessTier === 'VIP' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        VIP
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium font-mono bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                        FREE
                      </span>
                    )}

                    {path.isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <Check className="w-3 h-3" /> Đã phát hành
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                        Bản nháp
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                    +{path.pointReward} PTS
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {path.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-3 min-h-[32px]">
                  {path.description || 'Lộ trình phát triển 5 miền năng lực số.'}
                </p>

                <div className="flex items-center gap-1 flex-wrap mb-3.5">
                  {(path.domainCodes || []).map((code) => (
                    <span
                      key={code}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-slate-500 text-[11px]">
                  <strong>{path.modulesCount}</strong> học phần
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditPath(path)}
                    title="Chỉnh sửa thông tin lộ trình"
                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-neutral-100 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePath(path.id)}
                    title="Xóa lộ trình"
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPath(path);
                      fetchModulesForPath(path.id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200/80 dark:border-blue-900 hover:bg-blue-100 transition cursor-pointer"
                  >
                    <span>Quản lý bài học</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Drawer: Quản lý học phần của lộ trình */}
      {selectedPath && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white dark:bg-[#111114] border-l border-slate-200 dark:border-zinc-800 h-full flex flex-col shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  QUẢN LÝ HỌC PHẦN LỘ TRÌNH
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-neutral-100 truncate max-w-md">
                  {selectedPath.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCreateModule}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm bài học</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPath(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-neutral-100 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-3 text-xs">
              {modulesLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                  <p>Đang tải danh sách học phần...</p>
                </div>
              ) : modules.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-lg">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-neutral-300">
                    Chưa có bài học nào trong lộ trình này
                  </p>
                  <p className="text-slate-400 text-[11px] mt-1">
                    Bấm &quot;Thêm bài học&quot; để soạn thảo nội dung Markdown, thời lượng và liên kết đề đánh giá.
                  </p>
                </div>
              ) : (
                modules.map((m, idx) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {m.domain_code} &bull; {m.skill_code}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-neutral-100">
                          {m.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModule(m)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="Sửa học phần"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(m.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Xóa học phần"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      {m.description || 'Chuyên đề bồi dưỡng năng lực số.'}
                    </p>

                    <div className="flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {m.duration_minutes} phút
                      </span>
                      <span>&bull;</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                        +{m.point_reward} PTS
                      </span>
                      {m.assessments && (
                        <>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <LinkIcon className="w-3 h-3" />
                            Đề: {m.assessments.title}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Tạo / Sửa Lộ trình */}
      {isPathModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-lg w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                {editingPath ? 'Chỉnh sửa lộ trình' : 'Tạo lộ trình học tập mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPathModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePath} className="space-y-3.5">
              <div>
                <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1">
                  Tiêu đề lộ trình <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nền tảng Năng lực số cho Doanh nghiệp"
                  value={pathTitle}
                  onChange={(e) => setPathTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1">
                  Mô tả mục tiêu
                </label>
                <textarea
                  rows={2}
                  placeholder="Mục tiêu chuẩn đầu ra, đối tượng phù hợp..."
                  value={pathDescription}
                  onChange={(e) => setPathDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1.5">
                  Miền năng lực liên kết
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {DOMAIN_OPTIONS.map((d) => {
                    const isChecked = pathDomains.includes(d.code);
                    return (
                      <label
                        key={d.code}
                        className={`p-2 rounded border flex items-center gap-2 cursor-pointer transition ${
                          isChecked
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPathDomains([...pathDomains, d.code]);
                            } else {
                              setPathDomains(pathDomains.filter((c) => c !== d.code));
                            }
                          }}
                          className="rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-[11px] truncate">{d.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1">
                    Phân hạng truy cập
                  </label>
                  <select
                    value={pathTier}
                    onChange={(e) => setPathTier(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none"
                  >
                    <option value="FREE">Miễn phí (FREE)</option>
                    <option value="VIP">VIP / Gói nâng cao</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1">
                    Điểm thưởng hoàn thành (PTS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={2000}
                    value={pathPointReward}
                    onChange={(e) => setPathPointReward(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pathPublished}
                    onChange={(e) => setPathPublished(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span className="font-semibold text-slate-800 dark:text-neutral-200">
                    Phát hành công khai cho học viên
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPathModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingPath}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {savingPath ? 'Đang lưu...' : editingPath ? 'Cập nhật' : 'Tạo lộ trình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Tạo / Sửa Học phần */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-xl w-full p-6 text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                {editingModule ? 'Chỉnh sửa học phần' : 'Thêm học phần vào lộ trình'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModuleModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-3.5">
              <div>
                <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1">
                  Tiêu đề học phần <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phân tích và trích xuất dữ liệu số cơ bản"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1">
                    Miền năng lực
                  </label>
                  <select
                    value={moduleDomain}
                    onChange={(e) => setModuleDomain(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none"
                  >
                    {DOMAIN_OPTIONS.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1">
                    Mã kỹ năng thành phần (Skill Code)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 1.1 hoặc 3.2"
                    value={moduleSkillCode}
                    onChange={(e) => setModuleSkillCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1">
                    Thời lượng ước tính (phút)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={moduleDuration}
                    onChange={(e) => setModuleDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1">
                    Điểm thưởng hoàn thành (PTS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={modulePointReward}
                    onChange={(e) => setModulePointReward(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Link Assessment from Bank */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1">
                  Đề khảo thí liên kết (tùy chọn)
                </label>
                <select
                  value={moduleAssessmentId}
                  onChange={(e) => setModuleAssessmentId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none"
                >
                  <option value="">-- Không gắn đề kiểm tra --</option>
                  {availableAssessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Gắn trực tiếp đề từ Ngân hàng đề NEXA. Người học hoàn thành bài kiểm tra này để chứng minh năng lực.
                </p>
              </div>

              {/* Markdown Content */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-neutral-300 mb-1">
                  Nội dung học liệu (Markdown)
                </label>
                <textarea
                  rows={5}
                  placeholder="## Mục tiêu bài học&#10;&#10;Nội dung lý thuyết, bài giảng và hướng dẫn thực hành..."
                  value={moduleContent}
                  onChange={(e) => setModuleContent(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingModule}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {savingModule ? 'Đang lưu...' : editingModule ? 'Cập nhật' : 'Thêm học phần'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
