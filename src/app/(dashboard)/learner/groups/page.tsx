'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  KeyRound,
  MoreVertical,
  MessageSquare,
  CheckSquare,
  FileText,
  ChevronDown,
  UserPlus,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { QuickPinModal } from '@/components/dashboard/QuickPinModal';
import { mockClassGroups } from '@/data/mock-classes';

export default function LearnerGroupsPage() {
  const [showPinModal, setShowPinModal] = useState(false);
  const [showJoinDropdown, setShowJoinDropdown] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Header - Microsoft Teams Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              KHÔNG GIAN LỚP HỌC
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Nhóm &amp; Lớp học
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Không gian học tập, trao đổi bài giảng và nộp bài tập theo nhóm lớp.
          </p>
        </div>

        {/* Join or Create Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setShowJoinDropdown(!showJoinDropdown)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Tham gia hoặc tạo nhóm</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showJoinDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-md border border-slate-200 shadow-lg py-1 z-30 text-xs">
              <button
                onClick={() => {
                  setShowJoinDropdown(false);
                  setShowPinModal(true);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
              >
                <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                <span>Tham gia nhóm bằng mã</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Section Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          <span>Lớp học đang tham gia ({mockClassGroups.length})</span>
        </div>
      </div>

      {/* Teams Grid of Class Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockClassGroups.map((grp) => (
          <div
            key={grp.id}
            className="rounded-md border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden group"
          >
            {/* Card Body */}
            <Link
              href={`/learner/groups/${grp.id}`}
              className="p-4 flex items-start gap-3.5 flex-1"
            >
              {/* Shortcode Square Badge (Teams style) */}
              <div
                className={`w-12 h-12 rounded-md ${grp.avatarBg} text-white flex items-center justify-center text-sm font-bold shrink-0 tracking-wider shadow-inner`}
              >
                {grp.shortCode}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {grp.code}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {grp.memberCount} thành viên
                  </span>
                </div>

                <h2 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug line-clamp-2">
                  {grp.name}
                </h2>

                <p className="text-[11px] text-slate-500 mt-1 truncate">
                  {grp.evaluatorName} &bull; {grp.institution}
                </p>
              </div>
            </Link>

            {/* Bottom Teams Shortcut Icons Bar */}
            <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs">
              <div className="flex items-center gap-4">
                {/* Posts */}
                <Link
                  href={`/learner/groups/${grp.id}?tab=posts`}
                  title={`${grp.unreadPostsCount} bài đăng mới`}
                  className="flex items-center gap-1 hover:text-sky-600 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {grp.unreadPostsCount > 0 && (
                    <span className="text-[10px] font-semibold text-sky-600">
                      {grp.unreadPostsCount}
                    </span>
                  )}
                </Link>

                {/* Assignments */}
                <Link
                  href={`/learner/groups/${grp.id}?tab=assignments`}
                  title={`${grp.pendingAssignmentsCount} bài tập cần nộp`}
                  className="flex items-center gap-1 hover:text-sky-600 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {grp.pendingAssignmentsCount > 0 && (
                    <span className="text-[10px] font-semibold text-amber-600">
                      {grp.pendingAssignmentsCount}
                    </span>
                  )}
                </Link>

                {/* Files */}
                <Link
                  href={`/learner/groups/${grp.id}?tab=files`}
                  title={`${grp.filesCount} tài liệu chia sẻ`}
                  className="flex items-center gap-1 hover:text-sky-600 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span className="text-[10px]">{grp.filesCount}</span>
                </Link>
              </div>

              <Link
                href={`/learner/groups/${grp.id}`}
                className="text-[11px] font-medium text-slate-500 hover:text-sky-600 inline-flex items-center gap-0.5"
              >
                <span>Vào lớp</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quick PIN Modal for joining a group */}
      <QuickPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
      />
    </div>
  );
}
