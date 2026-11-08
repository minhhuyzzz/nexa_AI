'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Users,
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

const TERM_SUGGESTIONS = [
  'Học kỳ 1',
  'Học kỳ 2',
  'Học kỳ Fall 2026',
  'Học kỳ Spring 2026',
  'Đợt 1',
  'Đợt 2',
  'Q1 2026',
  'Q2 2026',
];

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
          term: term.trim() || undefined,
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
    if (groupType === 'DEPARTMENT') return 'Ví dụ: Phòng Kỹ thuật & Công nghệ';
    if (groupType === 'PROJECT_GROUP') return 'Ví dụ: Đội Dự án Chuyển đổi số 2026';
    return 'Ví dụ: Lớp K66 – Khoa CNTT';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                Tạo lớp / nhóm mới
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Thiết lập không gian để tổ chức thành viên và giao bài khảo thí.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Loại nhóm (3 Cards) */}
          <div>
            <label className="block font-medium text-slate-900 dark:text-neutral-200 mb-1.5">
              Loại không gian <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Card 1: Lớp học */}
              <button
                type="button"
                onClick={() => setGroupType('CLASS')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
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
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
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
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
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

          {/* 2. Tên lớp/nhóm (Toàn bộ chiều rộng, hệ thống tự động cấp mã duy nhất) */}
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
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
            />
          </div>

          {/* 3. Đợt / Học kỳ (Tự do nhập hoặc chọn nhanh suggestion) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-medium text-slate-900 dark:text-neutral-200">
                Đợt / Học kỳ (tùy chọn)
              </label>
              <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                Tự do đặt tên theo đợt vận hành
              </span>
            </div>
            <input
              type="text"
              placeholder="Ví dụ: Học kỳ Fall 2026, Đợt 1 - Tuyển dụng, Q2/2026..."
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition mb-1.5"
            />
            {/* Quick Suggestions Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 dark:text-neutral-500">Gợi ý nhanh:</span>
              {TERM_SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTerm(item)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                    term === item
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {item}
                </button>
              ))}
              {term && (
                <button
                  type="button"
                  onClick={() => setTerm('')}
                  className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

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
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition resize-none"
            />
          </div>

          {/* 5. Cài đặt thành viên */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-850/50 cursor-pointer transition">
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
          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition shadow-xs cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span>Tạo lớp / nhóm</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
