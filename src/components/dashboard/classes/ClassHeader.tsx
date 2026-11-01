'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Copy,
  Check,
  MessageSquare,
  GraduationCap,
  Users,
  Settings,
  Share2,
} from 'lucide-react';

interface ClassHeaderProps {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  memberCount: number;
  evaluatorName?: string;
  role: 'EVALUATOR' | 'LEARNER';
  isChatOpen: boolean;
  onToggleChat: () => void;
  onOpenSettings?: () => void;
}

export function ClassHeader({
  name,
  code,
  memberCount,
  evaluatorName = 'Người quản lý',
  role,
  isChatOpen,
  onToggleChat,
  onOpenSettings,
}: ClassHeaderProps) {
  const [copied, setCopied] = useState(false);
  const monogram = (name ? name[0] : 'K').toUpperCase();
  const isOwner = role === 'EVALUATOR';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/personal/groups"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quay lại Lớp & Nhóm</span>
        </Link>
      </div>

      {/* Class Banner (Screen 4-8 header design) */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          {/* Monogram Box */}
          <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-sm shrink-0">
            {monogram}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider font-mono">
                LỚP CÁ NHÂN
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Đang hoạt động
              </span>
              {isOwner && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-mono">
                  QUẢN LÝ
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {name}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-neutral-400 flex-wrap">
              <span className="font-mono">{memberCount} thành viên</span>
              <span>&bull;</span>
              <span>Quản lý: <strong className="text-neutral-800 dark:text-zinc-200">{evaluatorName}</strong></span>
              <span>&bull;</span>
              <span>
                Mã lớp: <strong className="font-mono text-neutral-900 dark:text-neutral-100">{code}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Copy Code Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-750 bg-slate-50/70 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 text-neutral-800 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sao chép mã tham gia"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">Đã chép mã</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Sao chép mã</span>
              </>
            )}
          </button>

          {/* Toggle Chat Drawer Button */}
          <button
            type="button"
            onClick={onToggleChat}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              isChatOpen
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-750 text-neutral-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Thảo luận ({isChatOpen ? 'Mở' : 'Đóng'})</span>
          </button>

          {/* Owner Quick Settings */}
          {isOwner && onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-750 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Cài đặt lớp học"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
