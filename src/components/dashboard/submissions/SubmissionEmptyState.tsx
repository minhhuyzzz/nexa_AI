import React from 'react';
import Link from 'next/link';
import { FileText, Users, ArrowRight } from 'lucide-react';

interface SubmissionEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function SubmissionEmptyState({ hasFilters, onClearFilters }: SubmissionEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="py-14 px-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <FileText className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">
          Không tìm thấy bài được giao phù hợp
        </h3>
        <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto mb-4">
          Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc lớp/nhóm khác.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="py-16 px-6 text-center rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
        <FileText className="w-8 h-8" strokeWidth={1.5} />
      </div>

      <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1.5">
        Bạn chưa có bài được giao
      </h2>
      <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto mb-6 leading-relaxed">
        Khi quản lý lớp hoặc nhóm giao bài tập, bài khảo thí hoặc nhiệm vụ mới, các bài đó sẽ xuất hiện tại đây. Bạn có thể vào lớp/nhóm để theo dõi thông báo và tài liệu ôn tập.
      </p>

      <Link
        href="/personal/groups"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
      >
        <Users className="w-4 h-4" strokeWidth={1.75} />
        <span>Xem Lớp & Nhóm của tôi</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
