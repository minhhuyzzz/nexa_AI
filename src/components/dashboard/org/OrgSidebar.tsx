'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NexaLogo } from '@/components/brand/NexaLogo';
import {
  Building2,
  Users,
  CheckSquare,
  BarChart2,
  Cpu,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  FolderKanban,
  FilePlus,
  Calendar,
  Award,
} from 'lucide-react';

interface OrgSidebarProps {
  orgSlug: string;
  orgName: string;
  userRole?: string;
}

const ROLE_LABELS: Record<string, string> = {
  ORG_OWNER: 'Chủ sở hữu',
  ORG_ADMIN: 'Quản trị viên',
  ASSESSOR: 'Giảng viên chấm bài',
  EVALUATOR: 'Giảng viên chấm bài',
  REPORT_VIEWER: 'Người xem báo cáo',
  MEMBER: 'Thành viên',
  LEARNER: 'Học viên',
};

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
}

export function OrgSidebar({ orgSlug, orgName, userRole = 'MEMBER' }: OrgSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const role = userRole.toUpperCase();
  const roleLabel = ROLE_LABELS[role] || 'Thành viên';

  const isOwnerOrAdmin = role === 'ORG_OWNER' || role === 'ORG_ADMIN';
  const isAssessor = role === 'ASSESSOR' || role === 'EVALUATOR';
  const isReportViewer = role === 'REPORT_VIEWER';

  // Construct items strictly based on role
  let navItems: NavItem[] = [];

  if (isOwnerOrAdmin) {
    navItems = [
      {
        name: 'Tổng quan tổ chức',
        href: `/org/${orgSlug}`,
        icon: Building2,
        exact: true,
      },
      {
        name: 'Thành viên & Phân quyền',
        href: `/org/${orgSlug}/members`,
        icon: Users,
      },
      {
        name: 'Đề thi tổ chức',
        href: `/org/${orgSlug}/assessments`,
        icon: FilePlus,
      },
      {
        name: 'Đợt đánh giá',
        href: `/org/${orgSlug}/campaigns`,
        icon: Calendar,
      },
      {
        name: 'Nhóm & Lớp học',
        href: `/org/${orgSlug}/classes`,
        icon: FolderKanban,
      },
      {
        name: 'Bàn chấm bài',
        href: `/org/${orgSlug}/grading`,
        icon: Award,
      },
      {
        name: 'Báo cáo & Phân tích',
        href: `/org/${orgSlug}/analytics`,
        icon: BarChart2,
      },
      {
        name: 'Gói & Hạn mức',
        href: `/org/${orgSlug}/ai-quota`,
        icon: Cpu,
      },
      {
        name: 'Cài đặt tổ chức',
        href: `/org/${orgSlug}/settings`,
        icon: Settings,
      },
    ];
  } else if (isAssessor) {
    navItems = [
      {
        name: 'Đề thi tổ chức',
        href: `/org/${orgSlug}/assessments`,
        icon: FilePlus,
      },
      {
        name: 'Đợt đánh giá',
        href: `/org/${orgSlug}/campaigns`,
        icon: Calendar,
      },
      {
        name: 'Nhóm & Lớp học',
        href: `/org/${orgSlug}/classes`,
        icon: FolderKanban,
      },
      {
        name: 'Bàn chấm bài',
        href: `/org/${orgSlug}/grading`,
        icon: Award,
      },
      {
        name: 'Báo cáo & Phân tích',
        href: `/org/${orgSlug}/analytics`,
        icon: BarChart2,
      },
    ];
  } else if (isReportViewer) {
    navItems = [
      {
        name: 'Tổng quan tổ chức',
        href: `/org/${orgSlug}`,
        icon: Building2,
        exact: true,
      },
      {
        name: 'Báo cáo & Phân tích',
        href: `/org/${orgSlug}/analytics`,
        icon: BarChart2,
      },
    ];
  } else {
    // MEMBER / LEARNER
    navItems = [
      {
        name: 'Lớp học của tôi',
        href: `/org/${orgSlug}/classes`,
        icon: FolderKanban,
      },
      {
        name: 'Bài được giao',
        href: `/org/${orgSlug}/campaigns`,
        icon: CheckSquare,
      },
      {
        name: 'Kết quả khảo thí',
        href: `/org/${orgSlug}/analytics`,
        icon: BarChart2,
      },
    ];
  }

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  return (
    <aside
      className={`border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Brand & Toggle Button */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
          <Link
            href={`/org/${orgSlug}`}
            className="flex items-center gap-2 overflow-hidden"
            title={orgName}
          >
            <NexaLogo size={28} showText={!isCollapsed} />
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            title={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {/* Current Organization Info Card */}
        {!isCollapsed && (
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{orgName}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Vai trò: <span className="text-slate-700 font-medium">{roleLabel}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Item List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  active
                    ? 'bg-sky-50 text-sky-700 font-semibold border-l-2 border-sky-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
