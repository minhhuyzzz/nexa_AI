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
  Send,
  CheckCircle2,
  Layers,
  ArrowRight,
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
    <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-blue-300 dark:hover:border-zinc-700 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Monogram & Info */}
      <div className="flex items-start gap-4 min-w-0 flex-1">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-extrabold text-base shrink-0">
          {monogram}
        </div>

        <div className="min-w-0 space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/personal/authoring/${item.id}`}
              className="text-sm font-bold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
            >
              {item.title}
            </Link>

            <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              {item.code}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1 font-medium text-neutral-700 dark:text-zinc-300">
              <Layers className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.75} />
              {item.domain}
            </span>
            <span>•</span>
            <span>{item.questionCount} câu hỏi ({item.mcqCount} trắc nghiệm, {item.scenarioCount} tình huống, {item.practicalCount} thực hành)</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {item.durationMinutes} phút
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              Chuẩn {item.passingScore}%
            </span>
          </div>

          {item.description && (
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-1 max-w-2xl">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Right: Status badge & Actions */}
      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0">
        {/* Status Badge */}
        <div>
          {item.status === 'READY' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Sẵn sàng
            </span>
          )}
          {item.status === 'DRAFT' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Bản nháp
            </span>
          )}
          {item.status === 'ARCHIVED' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Đã lưu trữ
            </span>
          )}
        </div>

        {/* Primary CTA */}
        {item.status === 'READY' ? (
          <Link
            href={`/personal/authoring/${item.id}`}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Xem chi tiết &amp; Giao bài</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link
            href={`/personal/authoring/${item.id}/edit`}
            className="px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-zinc-750 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200 text-xs font-semibold shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Tiếp tục soạn</span>
          </Link>
        )}

        {/* Overflow Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 dark:text-neutral-400 cursor-pointer"
            title="Thao tác khác"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-lg z-30 p-1.5 text-xs space-y-0.5 animate-in fade-in duration-100">
              <Link
                href={`/personal/authoring/${item.id}/preview`}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200"
                onClick={() => setMenuOpen(false)}
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Xem trước &amp; Kiểm định</span>
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
    </div>
  );
}
