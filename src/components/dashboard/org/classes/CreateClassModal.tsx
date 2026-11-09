'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Layers,
  Building2,
  Check,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import type { GroupType } from './types';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: () => void;
}

export function CreateClassModal({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
}: CreateClassModalProps) {
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('CLASS');
  const [description, setDescription] = useState('');
  const [term, setTerm] = useState('');
  const [allowJoinCode, setAllowJoinCode] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setGroupType('CLASS');
      setDescription('');
      setTerm('');
      setAllowJoinCode(true);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên lớp / nhóm');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/organizations/${organizationId}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          groupType,
          description: description.trim() || undefined,
          term: groupType === 'CLASS' ? (term.trim() || undefined) : undefined,
          settings: {
            allowJoinCode,
            isActiveListed: true,
            createResourceFolder: false,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tạo lớp thất bại');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo lớp');
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholderByName = () => {
    switch (groupType) {
      case 'DEPARTMENT':
        return 'Ví dụ: Phòng Kỹ thuật & CNTT, Ban Đào tạo...';
      case 'PROJECT_GROUP':
        return 'Ví dụ: Đội thi Olympic Tin học, Nhóm nghiên cứu AI...';
      default:
        return 'Ví dụ: Lớp K66 - Khoa CNTT';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-class-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 animate-in zoom-in-95 duration-150 font-sans">
        {/* Modal Header */}
        <div className="p-5 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Plus className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2
                id="create-class-modal-title"
                className="text-base font-bold text-neutral-900 dark:text-neutral-100"
              >
                Tạo lớp / nhóm mới
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Thiết lập không gian để tổ chức thành viên và giao bài khảo thí.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Loại không gian (3 Cards) */}
          <div>
            <label className="block font-medium text-slate-900 dark:text-neutral-200 mb-1.5">
              Loại không gian <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Card 1: Lớp học */}
              <button
                type="button"
                onClick={() => setGroupType('CLASS')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  groupType === 'CLASS'
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-600'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400">
                    <GraduationCap className="w-4 h-4" />
                    <span>Lớp học</span>
                  </div>
                  {groupType === 'CLASS' && (
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug">
                  Đào tạo, sinh viên, gắn với đợt học tập.
                </p>
              </button>

              {/* Card 2: Phòng ban */}
              <button
                type="button"
                onClick={() => setGroupType('DEPARTMENT')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  groupType === 'DEPARTMENT'
                    ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/30 ring-1 ring-purple-600'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400">
                    <Building2 className="w-4 h-4" />
                    <span>Phòng ban</span>
                  </div>
                  {groupType === 'DEPARTMENT' && (
                    <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug">
                  Đơn vị chức năng trong doanh nghiệp.
                </p>
              </button>

              {/* Card 3: Nhóm dự án */}
              <button
                type="button"
                onClick={() => setGroupType('PROJECT_GROUP')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  groupType === 'PROJECT_GROUP'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-600'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <Layers className="w-4 h-4" />
                    <span>Nhóm dự án</span>
                  </div>
                  {groupType === 'PROJECT_GROUP' && (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug">
                  Đội ngũ theo dự án, nhiệm vụ đặc thù.
                </p>
              </button>
            </div>
          </div>

          {/* 2. Tên lớp/nhóm */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-medium text-slate-900 dark:text-neutral-200">
                Tên lớp / nhóm <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                Hệ thống sẽ tự sinh mã nhận diện duy nhất
              </span>
            </div>
            <input
              type="text"
              autoFocus
              placeholder={getPlaceholderByName()}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
            />
          </div>

          {/* 3. Đợt / Học kỳ (Chỉ hiển thị khi loại không gian là Lớp học) */}
          {groupType === 'CLASS' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-medium text-slate-900 dark:text-neutral-200">
                  Đợt / Học kỳ (tùy chọn)
                </label>
                <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                  Để trống nếu không phân đợt
                </span>
              </div>
              <input
                type="text"
                placeholder="Ví dụ: Học kỳ 1, Đợt 1, Fall 2026..."
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
              />
            </div>
          )}

          {/* 4. Mô tả */}
          <div>
            <label className="block font-medium text-slate-900 dark:text-neutral-200 mb-1">
              Mô tả mục tiêu (tùy chọn)
            </label>
            <textarea
              rows={2}
              placeholder="Mục tiêu đào tạo, phạm vi công việc hoặc nội dung sinh hoạt..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition resize-none"
            />
          </div>

          {/* 5. Cài đặt thành viên */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850/50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={allowJoinCode}
                onChange={(e) => setAllowJoinCode(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-slate-900 dark:text-neutral-100 block">
                  Cho phép thành viên tự tham gia bằng mã lớp
                </span>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 block mt-0.5">
                  Thành viên trong tổ chức có thể nhập mã này tại Không gian cá nhân để tự ghi danh vào lớp.
                </span>
              </div>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-xs cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <span>+ Tạo lớp / nhóm</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
