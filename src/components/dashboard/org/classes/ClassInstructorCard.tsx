'use client';

import React from 'react';
import { Mail, Phone, MessageSquare, ShieldCheck } from 'lucide-react';

interface ClassInstructorCardProps {
  name?: string | null;
  title?: string;
  email?: string;
  phone?: string;
  onSendMessage?: () => void;
}

export function ClassInstructorCard({
  name = 'TS. Trần Thị Mai',
  title = 'Giảng viên – Khoa CNTT',
  email = 'mai.tt@fpt.edu.vn',
  phone = '024 7300 5588 (máy lẻ 221)',
  onSendMessage,
}: ClassInstructorCardProps) {
  const displayName = name || 'Chưa phân công giảng viên';
  const initials = displayName
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-zinc-800">
        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
          Giảng viên phụ trách
        </h3>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-sm flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {displayName}
            </h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400">{title}</p>
          </div>
        </div>

        {onSendMessage && (
          <button
            type="button"
            onClick={onSendMessage}
            title="Gửi tin nhắn"
            className="p-1.5 rounded-md border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 hover:text-blue-600 transition"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-1.5 text-xs text-slate-600 dark:text-neutral-300">
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-mono text-[11px] truncate">{email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-mono text-[11px]">{phone}</span>
        </div>
      </div>
    </div>
  );
}
