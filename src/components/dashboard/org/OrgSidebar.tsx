'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NexaLogo } from '@/components/brand/NexaLogo';
import { FeedbackModal } from '@/components/dashboard/FeedbackModal';
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
  MessageSquare,
  CreditCard,
  Radio,
} from 'lucide-react';

interface OrgSidebarProps {
  orgSlug: string;
  orgName: string;
  userRole?: string;
}

const ROLE_LABELS: Record<string, string> = {
  ORG_OWNER: 'Quản trị viên',
  ORG_ADMIN: 'Quản trị viên',
};

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

export function OrgSidebar({ orgSlug, orgName, userRole = 'ORG_ADMIN' }: OrgSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const role = userRole.toUpperCase();
  const roleLabel = ROLE_LABELS[role] || 'Quản trị viên';

  const navGroups: NavGroup[] = [
    {
      label: 'ĐIỀU HÀNH',
      items: [
        {
          name: 'Tổng quan',
          href: `/org/${orgSlug}`,
          icon: Building2,
          exact: true,
        },
        {
          name: 'Thành viên',
          href: `/org/${orgSlug}/members`,
          icon: Users,
        },
        {
          name: 'Nhóm & Đơn vị',
          href: `/org/${orgSlug}/classes`,
          icon: FolderKanban,
        },
      ],
    },
    {
      label: 'ĐÁNH GIÁ NĂNG LỰC',
      items: [
        {
          name: 'Đề đánh giá',
          href: `/org/${orgSlug}/assessments`,
          icon: FilePlus,
        },
        {
          name: 'Đợt đánh giá',
          href: `/org/${orgSlug}/campaigns`,
          icon: Calendar,
        },
        {
          name: 'Bàn chấm bài',
          href: `/org/${orgSlug}/grading`,
          icon: CheckSquare,
        },
        {
          name: 'Phòng thi trực tiếp',
          href: `/org/${orgSlug}/live-room`,
          icon: Radio,
        },
        {
          name: 'Báo cáo năng lực',
          href: `/org/${orgSlug}/analytics`,
          icon: BarChart2,
        },
      ],
    },
    {
      label: 'TÀI KHOẢN TỔ CHỨC',
      items: [
        {
          name: 'Gói sử dụng',
          href: `/org/${orgSlug}/plan`,
          icon: CreditCard,
        },
        {
          name: 'Cài đặt',
          href: `/org/${orgSlug}/settings`,
          icon: Settings,
        },
      ],
    },
  ];

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  return (
    <aside
      className={`border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0A0A0B] flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Brand & Toggle Button */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 shrink-0">
          <Link
            href={`/org/${orgSlug}`}
            className="flex items-center gap-2 overflow-hidden"
            title={orgName}
          >
            <NexaLogo size={28} showText={!isCollapsed} />
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md text-slate-400 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors"
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
          <div className="p-3 border-b border-slate-100 dark:border-zinc-850 bg-slate-50/60 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Building2 className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate" title={orgName}>
                  {orgName}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono mt-0.5">
                  Business &bull; <span className="text-neutral-700 dark:text-zinc-300 font-medium">{roleLabel}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Groups List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && group.label && (
                <div className="px-3 pt-1 pb-1 text-[10px] font-bold font-mono tracking-wider text-slate-400 dark:text-neutral-500 uppercase">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold border-l-2 border-blue-600 dark:border-blue-400'
                        : 'text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-50 dark:hover:bg-zinc-900'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Feedback Trigger Button */}
        <div className="p-3 border-t border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowFeedback(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
            {!isCollapsed && <span>Đóng góp ý kiến</span>}
          </button>
        </div>
      </div>

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </aside>
  );
}
