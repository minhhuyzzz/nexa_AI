'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Copy,
  Check,
  Search,
  Trash2,
  Edit2,
  X,
  Loader2,
  FolderPlus,
} from 'lucide-react';

interface ClassAssignment {
  id: string;
  assessmentId: string;
  title: string;
  deadline?: string | null;
}

interface ClassData {
  id: string;
  name: string;
  code: string;
  description: string;
  memberCount: number;
  activeExams: number;
  assignments: ClassAssignment[];
  createdAt: string;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function EvaluatorGroupsPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [editName, setEditName] = useState('');

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/evaluator/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch (err: unknown) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/evaluator/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClassName.trim(),
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewClassName('');
        fetchClasses();
      } else {
        const err = await res.json();
        alert(err.error || 'Không thể tạo nhóm');
      }
    } catch {
      alert('Đã xảy ra lỗi khi tạo nhóm.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editName.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/evaluator/classes/${editingClass.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
        }),
      });

      if (res.ok) {
        setEditingClass(null);
        fetchClasses();
      } else {
        const err = await res.json();
        alert(err.error || 'Không thể cập nhật tên nhóm');
      }
    } catch {
      alert('Đã xảy ra lỗi khi cập nhật.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhóm "${name}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/evaluator/classes?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchClasses();
      } else {
        const err = await res.json();
        alert(err.error || 'Không thể xóa nhóm');
      }
    } catch {
      alert('Đã xảy ra lỗi khi xóa nhóm.');
    }
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              QUẢN TRỊ NHÓM &amp; HỌC VIÊN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Nhóm Khảo Thí &amp; Học Viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Không gian cộng tác học tập, giao bài khảo thí và chấm điểm bài nộp theo từng nhóm.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Tạo nhóm mới</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã nhóm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
          />
        </div>

        <span className="text-xs font-mono text-slate-500">
          Tổng cộng: <strong>{filteredClasses.length}</strong> nhóm
        </span>
      </div>

      {/* Group Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-sky-600" strokeWidth={1.75} />
          <span>Đang nạp danh sách nhóm...</span>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-md bg-white space-y-3">
          <FolderPlus className="w-10 h-10 text-slate-300 mx-auto" strokeWidth={1.75} />
          <h3 className="text-sm font-bold text-slate-800">Chưa có nhóm nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tạo nhóm học tập để quản lý sinh viên, giao bài khảo thí và trao đổi trực tiếp trong nhóm.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 rounded-md bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors shadow-xs cursor-pointer"
          >
            Tạo nhóm đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => (
            <Link
              key={cls.id}
              href={`/evaluator/groups/${cls.id}`}
              className="block group"
            >
              <div className="p-5 rounded-md border border-slate-200 bg-white group-hover:border-slate-300 group-hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col justify-between h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Tên nhóm + hover-edit icon sát tên */}
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                        {cls.name}
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingClass(cls);
                          setEditName(cls.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition-opacity rounded hover:bg-slate-100"
                        title="Đổi tên nhóm"
                      >
                        <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>

                    {/* Metadata: ngày tạo & số lượng thành viên */}
                    <p className="text-xs text-slate-500 mt-1">
                      Tạo ngày {formatDate(cls.createdAt)} · <span className="font-mono">{cls.memberCount}</span> thành viên
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Mã mời DUY NHẤT */}
                    <button
                      type="button"
                      onClick={(e) => handleCopy(cls.code, e)}
                      className="flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                      title="Sao chép mã tham gia nhóm"
                    >
                      <span>{cls.code}</span>
                      {copiedCode === cls.code ? (
                        <Check className="w-3 h-3 text-emerald-600" strokeWidth={1.75} />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
                      )}
                    </button>

                    {/* Nút xóa nhóm kín đáo */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteClass(cls.id, cls.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-all rounded hover:bg-slate-100"
                      title="Xóa nhóm"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal Tạo Nhóm Mới (1 input field duy nhất) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateClass}
            className="bg-white border border-slate-200 rounded-md shadow-md max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                <span>Tạo Nhóm Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-800 block mb-1.5">
                  Tên nhóm *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="VD: Lớp Năng lực số K12"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Mã mời 6 ký tự sẽ được hệ thống tự động sinh ngẫu nhiên sau khi tạo.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newClassName.trim()}
                className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo nhóm ngay'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Sửa Tên Nhóm */}
      {editingClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateClass}
            className="bg-white border border-slate-200 rounded-md shadow-md max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                <span>Đổi Tên Nhóm</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-800 block mb-1.5">Tên nhóm mới *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="px-3.5 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !editName.trim()}
                className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
