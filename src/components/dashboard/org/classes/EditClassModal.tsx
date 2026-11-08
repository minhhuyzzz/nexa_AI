'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Building,
  Layers,
  Check,
  Loader2,
  AlertCircle,
  Save,
} from 'lucide-react';
import type { OrgClassItem, GroupType } from './types';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  classItem: OrgClassItem | null;
  onSuccess: () => void;
}

export function EditClassModal({
  isOpen,
  onClose,
  organizationId,
  classItem,
  onSuccess,
}: EditClassModalProps) {
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('CLASS');
  const [description, setDescription] = useState('');
  const [term, setTerm] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when classItem changes
  useEffect(() => {
    if (classItem && isOpen) {
      setName(classItem.name || '');
      setGroupType(classItem.groupType || 'CLASS');
      setDescription(classItem.description || '');
      setTerm(classItem.term || '');
      setError(null);
    }
  }, [classItem, isOpen]);

  if (!isOpen || !classItem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên lớp / nhóm');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/organizations/${organizationId}/classes/${classItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          groupType,
          description: description.trim() || null,
          term: term.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật thông tin thất bại');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật lớp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Chỉnh sửa Lớp / Nhóm
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Cập nhật thông tin nhận diện và loại không gian của đơn vị.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tên lớp / nhóm */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
              Tên lớp hoặc nhóm <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Lớp Kỹ năng số K48"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
            />
          </div>

          {/* Loại không gian */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
              Loại không gian
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setGroupType('CLASS')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                  groupType === 'CLASS'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-neutral-400'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span className="text-[11px]">Lớp học</span>
              </button>

              <button
                type="button"
                onClick={() => setGroupType('DEPARTMENT')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                  groupType === 'DEPARTMENT'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-neutral-400'
                }`}
              >
                <Building className="w-4 h-4" />
                <span className="text-[11px]">Phòng ban</span>
              </button>

              <button
                type="button"
                onClick={() => setGroupType('PROJECT_GROUP')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                  groupType === 'PROJECT_GROUP'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-neutral-400'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="text-[11px]">Nhóm dự án</span>
              </button>
            </div>
          </div>

          {/* Đợt / Học kỳ */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
              Đợt / Học kỳ
            </label>
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="VD: Học kỳ 2, Fall 2026, Đợt 1..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
            />
          </div>

          {/* Mô tả */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
              Mô tả không gian (tùy chọn)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả mục tiêu đào tạo, đối tượng tham gia..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-zinc-800 font-semibold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
