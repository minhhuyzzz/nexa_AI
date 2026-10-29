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
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  FolderKanban,
  FilePlus,
  ShieldAlert,
} from 'lucide-react';

interface OrgSidebarProps {
  orgSlug: string;
  orgName: string;
  userRole?: string;
}

export function OrgSidebar({ orgSlug, orgName, userRole = 'MEMBER' }: OrgSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isManager = userRole === 'ORG_OWNER' || userRole === 'ORG_ADMIN';

  const navItems = [
    {
      name: 'Tổng quan tổ chức',
      href: `/org/${orgSlug}`,
      icon: Building2,
      exact: true,
      allowed: true,
    },
    {
      name: 'Thành viên & Phân quyền',
      href: `/org/${orgSlug}/members`,
      icon: Users,
      allowed: true,
    },
    {
      name: 'Đề thi tổ chức',
      href: `/org/${orgSlug}/assessments`,
      icon: FilePlus,
      allowed: true,
    },
    {
      name: 'Nhóm & Lớp học',
      href: `/org/${orgSlug}/classes`,
      icon: FolderKanban,
      allowed: true,
    },
    {
      name: 'Báo cáo & Phân tích',
      href: `/org/${orgSlug}/analytics`,
      icon: BarChart2,
      allowed: true,
    },
    {
      name: 'Ngân sách & Quota AI',
      href: `/org/${orgSlug}/ai-quota`,
      icon: Cpu,
      allowed: isManager,
    },
    {
      name: 'Cài đặt tổ chức',
      href: `/org/${orgSlug}/settings`,
      icon: Settings,
      allowed: true,
    },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
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
        {/* Brand & Organization Title */}
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

        {/* Current Organization Tag */}
        {!isCollapsed && (
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{orgName}</div>
                <div className="text-[10px] text-slate-500 font-mono">Vai trò: {userRole}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems
            .filter((item) => item.allowed)
            .map((item) => {
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

        {/* Switch back to Personal Workspace link */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <Link
            href="/dashboard"
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Quay về Không gian cá nhân"
          >
            <ChevronLeft className="w-4 h-4 shrink-0 text-slate-400" strokeWidth={1.75} />
            {!isCollapsed && <span>Về Không gian cá nhân</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
}
