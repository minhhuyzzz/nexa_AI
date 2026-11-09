'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Users,
  Loader2,
  AlertCircle,
  Plus,
  KeyRound,
} from 'lucide-react';

interface CreatePersonalGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (groupId: string) => void;
}

export function CreatePersonalGroupModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePersonalGroupModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      setError('Vui lòng nhập tên lớp hoặc nhóm tối thiểu 2 ký tự');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tạo lớp thất bại');
      }

      onClose();
      if (onSuccess && data.class?.id) {
        onSuccess(data.class.id);
      } else if (data.class?.id) {
        router.push(`/personal/groups/${data.class.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo lớp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-personal-group-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2
                id="create-personal-group-modal-title"
                className="text-base font-bold text-neutral-900 dark:text-neutral-100"
              >
                Tạo lớp hoặc nhóm mới
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Khởi tạo không gian để giao bài khảo thí và cùng học tập.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
              Tên lớp hoặc nhóm học tập <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Lớp Kỹ năng số K48 - Chuyên đề D1"
              autoFocus
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-zinc-850 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
              Mục tiêu &amp; Mô tả ngắn (tùy chọn)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Ôn luyện chuẩn 5 miền năng lực số, làm bài khảo thí định kỳ và thảo luận học liệu..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-zinc-850 transition resize-none"
            />
          </div>

          {/* Auto-generate code note */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center gap-2.5 text-xs text-slate-500 dark:text-neutral-400">
            <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
            <span>
              Mã tham gia lớp sẽ được hệ thống <strong>tự động sinh ngẫu nhiên</strong> (dạng <code className="font-mono text-blue-600 dark:text-blue-400 font-bold">CLS-XXXX</code>) sau khi tạo.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-xs cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo lớp/nhóm</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
