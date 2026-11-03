'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Target,
  GraduationCap,
  Users,
  FolderKanban,
  FileSpreadsheet,
} from 'lucide-react';

interface OrgEmptyStateProps {
  icon?: React.ReactNode;
  iconName?: 'book' | 'target' | 'grade' | 'grading' | 'users' | 'folder' | 'campaign';
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function OrgEmptyState({
  icon,
  iconName,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  className = '',
}: OrgEmptyStateProps) {
  const renderedIcon = () => {
    if (icon) return icon;
    switch (iconName) {
      case 'book':
        return <BookOpen className="w-5 h-5" strokeWidth={1.75} />;
      case 'target':
        return <Target className="w-5 h-5" strokeWidth={1.75} />;
      case 'grade':
      case 'grading':
        return <GraduationCap className="w-5 h-5" strokeWidth={1.75} />;
      case 'users':
        return <Users className="w-5 h-5" strokeWidth={1.75} />;
      case 'folder':
        return <FolderKanban className="w-5 h-5" strokeWidth={1.75} />;
      case 'campaign':
        return <FileSpreadsheet className="w-5 h-5" strokeWidth={1.75} />;
      default:
        return null;
    }
  };

  const finalIcon = renderedIcon();

  return (
    <div
      className={`py-12 px-6 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-center flex flex-col items-center justify-center shadow-xs ${className}`}
    >
      {finalIcon && (
        <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-center text-slate-500 dark:text-neutral-400 mb-3.5">
          {finalIcon}
        </div>
      )}
      <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 mb-1">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm leading-relaxed mb-4">
        {description}
      </p>

      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs"
        >
          {actionText}
        </Link>
      )}

      {actionText && onAction && !actionHref && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
