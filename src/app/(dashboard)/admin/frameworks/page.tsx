'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowRight,
  Database,
  CheckCircle2,
  BookOpen,
  Edit2,
  Plus,
  X,
  Save,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface CompetencyItem {
  id: string;
  skill_code: string;
  title: string;
  description?: string;
  target_level: number;
  display_order: number;
}

interface CompetencyDomainItem {
  id: string;
  code: string;
  title: string;
  description: string;
  domain_index: number;
  competencies: CompetencyItem[];
}

interface FrameworkItem {
  id: string;
  code: string;
  title: string;
  version: string;
  description: string;
  status: string;
}

export default function AdminFrameworksPage() {
  const [framework, setFramework] = useState<FrameworkItem | null>(null);
  const [domains, setDomains] = useState<CompetencyDomainItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Domain Modal
  const [editingDomain, setEditingDomain] = useState<CompetencyDomainItem | null>(null);
  const [domainForm, setDomainForm] = useState({ title: '', code: '', description: '' });

  // Edit Competency Modal
  const [editingCompetency, setEditingCompetency] = useState<CompetencyItem | null>(null);
  const [competencyForm, setCompetencyForm] = useState({ title: '', skill_code: '', target_level: 2, description: '' });

  // Add Competency Modal
  const [addingToDomainId, setAddingToDomainId] = useState<string | null>(null);
  const [newCompForm, setNewCompForm] = useState({ skill_code: '', title: '', target_level: 2, description: '' });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchFramework = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/frameworks');
      const data = await res.json();
      if (data.framework) {
        setFramework(data.framework);
        setDomains(data.domains || []);
      }
    } catch (e) {
      console.error('Failed to load framework', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFramework();
  }, []);

  // Save Domain
  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDomain) return;

    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/frameworks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'DOMAIN',
          id: editingDomain.id,
          title: domainForm.title,
          code: domainForm.code,
          description: domainForm.description,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi cập nhật miền');
      }

      setEditingDomain(null);
      setSuccessMsg('Đã cập nhật thông tin miền năng lực thành công');
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchFramework();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  // Save Competency
  const handleSaveCompetency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompetency) return;

    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/frameworks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'COMPETENCY',
          id: editingCompetency.id,
          title: competencyForm.title,
          skill_code: competencyForm.skill_code,
          target_level: competencyForm.target_level,
          description: competencyForm.description,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi cập nhật kỹ năng');
      }

      setEditingCompetency(null);
      setSuccessMsg('Đã cập nhật kỹ năng thành công');
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchFramework();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  // Add Competency
  const handleAddCompetency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingToDomainId) return;

    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/frameworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain_id: addingToDomainId,
          skill_code: newCompForm.skill_code,
          title: newCompForm.title,
          target_level: newCompForm.target_level,
          description: newCompForm.description,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi thêm kỹ năng mới');
      }

      setAddingToDomainId(null);
      setNewCompForm({ skill_code: '', title: '', target_level: 2, description: '' });
      setSuccessMsg('Đã thêm kỹ năng mới vào miền năng lực');
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchFramework();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  const totalCompetencies = domains.reduce((sum, d) => sum + (d.competencies?.length || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Khung Năng Lực Số Chuẩn Hóa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị 5 miền năng lực số và 21 kỹ năng chuẩn DigComp 2.2. Bạn có thể chỉnh sửa tên, mã hoặc thêm kỹ năng trực tiếp.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchFramework}
            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Làm mới</span>
          </button>
          <Link
            href="/framework"
            target="_blank"
            className="px-3.5 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Xem trang công khai</span>
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Framework Summary Strip */}
      <div className="p-4 rounded-md bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-slate-900">
              {framework?.title || 'Khung Năng Lực Số Chuẩn Hóa EU DigComp 2.2'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold font-mono">
              PHIÊN BẢN {framework?.version || '2.2'}
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            {framework?.description || 'Khung chuẩn hóa năng lực số theo tiêu chuẩn EU DigComp 2.2 và thông tư chuẩn kỹ năng số quốc gia.'}
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div className="text-right">
            <div className="text-slate-400 text-[11px] font-mono">MIỀN NĂNG LỰC</div>
            <div className="text-xl font-bold text-slate-900 font-mono">{domains.length} Miền</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-right">
            <div className="text-slate-400 text-[11px] font-mono">KỸ NĂNG THÀNH PHẦN</div>
            <div className="text-xl font-bold text-sky-600 font-mono">
              {totalCompetencies} Kỹ năng
            </div>
          </div>
        </div>
      </div>

      {/* 3. Domains & Competencies Tree */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-md border border-slate-200 p-8">
          Đang tải dữ liệu khung năng lực...
        </div>
      ) : (
        <div className="space-y-4">
          {domains
            .sort((a, b) => a.domain_index - b.domain_index)
            .map((domain) => (
              <div
                key={domain.id}
                className="p-5 rounded-md bg-white border border-slate-200 shadow-xs space-y-4"
              >
                {/* Domain Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      MIỀN {domain.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{domain.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingDomain(domain);
                        setDomainForm({ title: domain.title, code: domain.code, description: domain.description || '' });
                      }}
                      className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700 inline-flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Sửa tên miền</span>
                    </button>

                    <button
                      onClick={() => {
                        setAddingToDomainId(domain.id);
                        setNewCompForm({
                          skill_code: `${domain.domain_index}.${(domain.competencies?.length || 0) + 1}`,
                          title: '',
                          target_level: 2,
                          description: '',
                        });
                      }}
                      className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Thêm kỹ năng</span>
                    </button>
                  </div>
                </div>

                {domain.description && (
                  <p className="text-xs text-slate-500 leading-relaxed -mt-2">
                    {domain.description}
                  </p>
                )}

                {/* Competencies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {domain.competencies
                    ?.sort((a, b) => a.display_order - b.display_order)
                    .map((comp) => {
                      const levelLabel =
                        comp.target_level === 4
                          ? 'Highly Advanced'
                          : comp.target_level === 3
                          ? 'Advanced'
                          : comp.target_level === 2
                          ? 'Intermediate'
                          : 'Basic';

                      return (
                        <div
                          key={comp.id}
                          className="p-3.5 rounded bg-slate-50 border border-slate-200 text-xs flex flex-col justify-between space-y-2 hover:bg-slate-100/70 transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-sky-700 text-xs font-mono">
                                {comp.skill_code}
                              </span>
                              <span className="text-[10px] text-slate-600 font-mono px-1.5 py-0.2 rounded bg-white border border-slate-200">
                                Level {comp.target_level} &bull; {levelLabel}
                              </span>
                            </div>
                            <div className="font-medium text-slate-900 leading-snug">
                              {comp.title}
                            </div>
                            {comp.description && (
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                {comp.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end">
                            <button
                              onClick={() => {
                                setEditingCompetency(comp);
                                setCompetencyForm({
                                  title: comp.title,
                                  skill_code: comp.skill_code,
                                  target_level: comp.target_level,
                                  description: comp.description || '',
                                });
                              }}
                              className="text-[11px] text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Chỉnh sửa</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* MODAL 1: EDIT DOMAIN */}
      {editingDomain && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-md w-full shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Chỉnh sửa Miền Năng Lực {editingDomain.code}
              </h2>
              <button onClick={() => setEditingDomain(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveDomain} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">Mã miền:</label>
                <input
                  type="text"
                  required
                  value={domainForm.code}
                  onChange={(e) => setDomainForm({ ...domainForm, code: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">Tên miền năng lực:</label>
                <input
                  type="text"
                  required
                  value={domainForm.title}
                  onChange={(e) => setDomainForm({ ...domainForm, title: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">Mô tả miền:</label>
                <textarea
                  rows={3}
                  value={domainForm.description}
                  onChange={(e) => setDomainForm({ ...domainForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white text-xs leading-relaxed"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDomain(null)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT COMPETENCY */}
      {editingCompetency && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-md w-full shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Chỉnh sửa Kỹ năng ({editingCompetency.skill_code})
              </h2>
              <button onClick={() => setEditingCompetency(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCompetency} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Mã kỹ năng:</label>
                  <input
                    type="text"
                    required
                    value={competencyForm.skill_code}
                    onChange={(e) => setCompetencyForm({ ...competencyForm, skill_code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Cấp độ chuẩn (Level):</label>
                  <select
                    value={competencyForm.target_level}
                    onChange={(e) => setCompetencyForm({ ...competencyForm, target_level: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white text-xs"
                  >
                    <option value={1}>Level 1 - Basic</option>
                    <option value={2}>Level 2 - Intermediate</option>
                    <option value={3}>Level 3 - Advanced</option>
                    <option value={4}>Level 4 - Highly Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">Tên kỹ năng:</label>
                <input
                  type="text"
                  required
                  value={competencyForm.title}
                  onChange={(e) => setCompetencyForm({ ...competencyForm, title: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">Mô tả hành vi / yêu cầu:</label>
                <textarea
                  rows={3}
                  value={competencyForm.description}
                  onChange={(e) => setCompetencyForm({ ...competencyForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white text-xs leading-relaxed"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCompetency(null)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD NEW COMPETENCY */}
      {addingToDomainId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-slate-200 p-6 max-w-md w-full shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Thêm Kỹ Năng Mới Vào Miền
              </h2>
              <button onClick={() => setAddingToDomainId(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddCompetency} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Mã kỹ năng:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 1.4"
                    value={newCompForm.skill_code}
                    onChange={(e) => setNewCompForm({ ...newCompForm, skill_code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Cấp độ (Level):</label>
                  <select
                    value={newCompForm.target_level}
                    onChange={(e) => setNewCompForm({ ...newCompForm, target_level: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white text-xs"
                  >
                    <option value={1}>Level 1 - Basic</option>
                    <option value={2}>Level 2 - Intermediate</option>
                    <option value={3}>Level 3 - Advanced</option>
                    <option value={4}>Level 4 - Highly Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">Tên kỹ năng mới:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đánh giá độ tin cậy của mô hình AI"
                  value={newCompForm.title}
                  onChange={(e) => setNewCompForm({ ...newCompForm, title: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">Mô tả kỹ năng:</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả tiêu chuẩn và chỉ báo hành vi của kỹ năng..."
                  value={newCompForm.description}
                  onChange={(e) => setNewCompForm({ ...newCompForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white text-xs leading-relaxed"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddingToDomainId(null)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Đang thêm...' : 'Thêm kỹ năng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
