'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface OrgCodeCopyPillProps {
  code: string;
  label?: string;
  className?: string;
}

export function OrgCodeCopyPill({ code, label = 'Mã', className = '' }: OrgCodeCopyPillProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={handleCopy}
      title={`Sao chép ${label}: ${code}`}
      aria-label={copied ? `Đã sao chép ${label} ${code}` : `Sao chép ${label} ${code}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:py-0.5 min-h-[36px] sm:min-h-0 rounded-md font-mono text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors border border-slate-200/80 dark:border-zinc-700/80 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none motion-reduce:transition-none ${className}`}
    >
      <span suppressHydrationWarning>{code}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
      ) : (
        <Copy className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
      )}
    </button>
  );
}
