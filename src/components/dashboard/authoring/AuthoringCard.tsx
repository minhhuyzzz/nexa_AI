'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  Award,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  Eye,
  CheckCircle2,
  Layers,
  ArrowRight,
  Play,
  Archive,
} from 'lucide-react';

export interface AuthoringCardItem {
  id: string;
  code: string;
  title: string;
  description: string;
  domain: string;
  durationMinutes: number;
  passingScore: number;
  questionCount: number;
  mcqCount: number;
  scenarioCount: number;
  practicalCount: number;
  status: 'READY' | 'DRAFT' | 'ARCHIVED';
  updatedAt: string;
}

interface AuthoringCardProps {
  item: AuthoringCardItem;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function AuthoringCard({ item, onDuplicate, onDelete }: AuthoringCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monogram = item.title ? item.title.trim()[0].toUpperCase() : 'D';

  return (
    <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col justify-between group h-full space-y-4">
      {/* Top Header: Monogram Avatar + Code + Status Badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-sm shrink-0">
            {monogram}
          </div>
          <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md truncate">
            {item.code}
          </span>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {item.status === 'READY' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Đã phát hành</span>
            </span>
          )}
          {item.status === 'DRAFT' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
              <FileText className="w-3 h-3 text-slate-500" />
              <span>Bản nháp</span>
            </span>
          )}
          {item.status === 'ARCHIVED' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200">
              <Archive className="w-3 h-3 text-zinc-500" />
              <span>Đã lưu trữ</span>
            </span>
          )}
        </div>
      </div>

      {/* Middle Content: Title, Domain & Description */}
      <div className="space-y-2 flex-1 min-w-0">
        <Link
          href={`/personal/authoring/${item.id}`}
          className="text-base font-bold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 leading-snug block"
          title={item.title}
        >
          {item.title}
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
          <Layers className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{item.domain}</span>
        </div>

        {item.description ? (
          <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 leading-relaxed pt-0.5">
            {item.description}
          </p>
        ) : (
          <p className="text-xs text-slate-400 dark:text-neutral-500 italic pt-0.5">
            Chưa có phần mô tả bổ sung cho bộ đề này.
          </p>
        )}
      </div>

      {/* Metadata 3-Column Strip */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono uppercase">Câu hỏi</span>
          <div className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {item.questionCount} câu
          </div>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono uppercase">Thời gian</span>
          <div className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{item.durationMinutes}p</span>
          </div>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono uppercase">Đạt chuẩn</span>
          <div className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums flex items-center gap-1">
            <Award className="w-3 h-3 text-slate-400" />
            <span>{item.passingScore}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          {/* Nút Bắt đầu làm bài tự luyện */}
          <Link
            href={`/personal/take/${item.id}`}
            className="p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 transition-colors shadow-2xs inline-flex items-center justify-center cursor-pointer"
            title="Bắt đầu làm bài tự luyện ngay"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </Link>

          {/* Overflow Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-500 dark:text-neutral-400 cursor-pointer transition-colors"
              title="Thao tác khác"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute left-0 bottom-full mb-1.5 w-44 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-lg z-30 p-1.5 text-xs space-y-0.5 animate-in fade-in duration-100">
                <Link
                  href={`/personal/take/${item.id}?preview=true`}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200"
                  onClick={() => setMenuOpen(false)}
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Xem trước</span>
                </Link>

                <Link
                  href={`/personal/authoring/${item.id}/edit`}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200"
                  onClick={() => setMenuOpen(false)}
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Chỉnh sửa câu hỏi</span>
                </Link>

                {onDuplicate && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate(item.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-left cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Nhân bản đề</span>
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(item.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-left cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa đề</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Primary CTA */}
        {item.status === 'READY' ? (
          <Link
            href={`/personal/authoring/${item.id}`}
            className="flex-1 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <span>Xem chi tiết và Giao bài</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link
            href={`/personal/authoring/${item.id}/edit`}
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-zinc-750 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold shadow-2xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Tiếp tục soạn</span>
          </Link>
        )}
      </div>
    </div>
  );
}
