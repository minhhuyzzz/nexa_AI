'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Edit2, Copy, Check, MessageSquare, CheckCircle } from 'lucide-react';

interface ClassHeaderProps {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  memberCount: number;
  role: 'EVALUATOR' | 'LEARNER';
  isChatOpen: boolean;
  onToggleChat: () => void;
  onRename?: (newName: string) => Promise<boolean>;
}

export function ClassHeader({
  name,
  code,
  createdAt,
  memberCount,
  role,
  isChatOpen,
  onToggleChat,
  onRename,
}: ClassHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(name);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const backUrl = role === 'EVALUATOR' ? '/evaluator/groups' : '/learner/groups';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = async () => {
    if (!editingName.trim() || editingName === name || !onRename) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    const success = await onRename(editingName.trim());
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
    }
  };

  const formattedDate = (() => {
    try {
      return new Date(createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return createdAt;
    }
  })();

  return (
    <div className="space-y-4 pb-2 border-b border-slate-200">
      <Link
        href={backUrl}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Quay lại Quản lý nhóm</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="px-2 py-1 text-lg font-bold border border-sky-400 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                  autoFocus
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={isSaving}
                  className="px-2.5 py-1 text-xs bg-sky-600 text-white font-semibold rounded hover:bg-sky-700 cursor-pointer"
                >
                  {isSaving ? 'Lưu...' : 'Lưu'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <div className="group flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {name}
                </h1>
                {role === 'EVALUATOR' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(name);
                      setIsEditing(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-all cursor-pointer"
                    title="Đổi tên nhóm"
                  >
                    <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              <strong className="font-mono text-slate-700">{memberCount}</strong> thành viên
            </span>
            <span>·</span>
            <span>Tạo ngày: {formattedDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Invitation Code */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold border border-slate-200 transition-colors cursor-pointer"
            title="Sao chép mã mời"
          >
            <span>Mã: {code}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            )}
          </button>

          {/* Toggle Chat Panel */}
          <button
            type="button"
            onClick={onToggleChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
              isChatOpen
                ? 'bg-sky-50 border-sky-200 text-sky-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Chat nhóm</span>
          </button>
        </div>
      </div>
    </div>
  );
}
