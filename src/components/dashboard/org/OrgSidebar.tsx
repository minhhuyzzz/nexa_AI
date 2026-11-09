'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NexaLogo } from '@/components/brand/NexaLogo';
import { FeedbackModal } from '@/components/dashboard/FeedbackModal';
import {
  Building2,
  Users,
  CheckSquare,
  BarChart2,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  FolderKanban,
  FilePlus,
  Calendar,
  MessageSquare,
  CreditCard,
  Plus,
  ChevronRight,
  CalendarRange,
  Radio,
  ClipboardCheck,
} from 'lucide-react';
import {
  normalizeOrgRole,
  type StandardOrgRole,
} from '@/lib/auth/org-roles';

interface OrgSidebarProps {
  orgSlug: string;
  orgName: string;
  userRole?: string;
}

const ROLE_LABELS: Record<StandardOrgRole, string> = {
  ORG_OWNER: 'Chủ sở hữu',
  ORG_ADMIN: 'Quản trị viên',
  ASSESSOR: 'Khảo thí viên',
  MEMBER: 'Thành viên',
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
  const [showFeedback, setShowFeedback] = useState(false);

  const normalizedRole = normalizeOrgRole(userRole);
  const isOwner = normalizedRole === 'ORG_OWNER';
  const isAdmin = normalizedRole === 'ORG_ADMIN';
  const isAssessor = normalizedRole === 'ASSESSOR';
  const isMember = normalizedRole === 'MEMBER';
  const roleLabel = ROLE_LABELS[normalizedRole] || 'Quản trị viên';

  // Xác định xem người dùng có đang ở trong phân hệ Khảo thí không
  // Báo cáo năng lực (/analytics) nay đã thuộc Menu chính nên không còn kích hoạt Rail phụ.
  const isAssessmentRoute =
    !isMember &&
    (pathname.startsWith(`/org/${orgSlug}/assessments`) ||
      pathname.startsWith(`/org/${orgSlug}/campaigns`) ||
      pathname.startsWith(`/org/${orgSlug}/grading`) ||
      pathname.startsWith(`/org/${orgSlug}/live-room`));

  // Khi vào phân hệ Khảo thí, Sidebar chính tự động chuyển thành Icon Rail (w-20)
  // Khi ở các trang khác, Sidebar chính mở rộng (w-64)
  const [isPrimaryCollapsed, setIsPrimaryCollapsed] = useState(isAssessmentRoute);

  useEffect(() => {
    setIsPrimaryCollapsed(isAssessmentRoute);
  }, [isAssessmentRoute]);

  // MENU CHÍNH (PRIMARY):
  // [F21 Note]: Dead code for isMember pruned per F21 (MEMBER redirected to /personal/groups).
  // Historical reference: label: 'CÁ NHÂN', name: 'Phòng thi trực tiếp', href: `/org/${orgSlug}/live-room`
  // Báo cáo năng lực số nằm ở Menu chính; Đánh giá năng lực dẫn vào phân hệ Khảo thí.
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
            ...(isOwner || isAdmin
              ? [
                  {
                    name: 'Thành viên',
                    href: `/org/${orgSlug}/members`,
                    icon: Users,
                  },
                ]
              : []),
            {
              name: 'Nhóm & Đơn vị',
              href: `/org/${orgSlug}/classes`,
              icon: FolderKanban,
            },
            {
              name: 'Báo cáo năng lực',
              href: `/org/${orgSlug}/analytics`,
              icon: BarChart2,
            },
          ],
        },
        {
          label: 'KHẢO THÍ',
          items: [
            {
              name: 'Đánh giá năng lực',
              href: `/org/${orgSlug}/assessments`,
              icon: CheckSquare,
            },
            ...(isAssessor
              ? [
                  {
                    name: 'Chấm bài',
                    href: `/org/${orgSlug}/grading`,
                    icon: ClipboardCheck,
                  },
                ]
              : []),
          ],
        },
        ...(isOwner
          ? [
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
            ]
          : []),
      ];

  const isPrimaryActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    // Mục "Đánh giá năng lực" active khi ở bất kỳ trang nào trong phân hệ Khảo thí
    if (item.href === `/org/${orgSlug}/assessments` && isAssessmentRoute) {
      return true;
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  // MENU THỨ 2 (SECONDARY SUB-SIDEBAR):
  // Hiển thị khi vào phân hệ Khảo thí gồm: Kho đề thi, Hoạt động khảo thí, Phòng thi trực tiếp
  const assessmentSubNavItems = [
    {
      name: 'Kho đề thi',
      href: `/org/${orgSlug}/assessments`,
      icon: FilePlus,
      isActive: pathname.startsWith(`/org/${orgSlug}/assessments`),
    },
    {
      name: 'Hoạt động khảo thí',
      href: `/org/${orgSlug}/campaigns`,
      icon: CalendarRange,
      isActive: pathname.startsWith(`/org/${orgSlug}/campaigns`),
    },
    {
      name: 'Chấm bài',
      href: `/org/${orgSlug}/grading`,
      icon: ClipboardCheck,
      isActive: pathname.startsWith(`/org/${orgSlug}/grading`),
    },
    {
      name: 'Phòng thi trực tiếp',
      href: `/org/${orgSlug}/live-room`,
      icon: Radio,
      isActive: pathname.startsWith(`/org/${orgSlug}/live-room`),
    },
  ];

  return (
    <div className="flex h-screen sticky top-0 z-30 shrink-0">
      {/* 1. PRIMARY SIDEBAR / ICON RAIL */}
      <aside
        className={`border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0A0A0B] flex flex-col justify-between shrink-0 h-full transition-all duration-300 ease-in-out select-none ${
          isPrimaryCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Brand & Toggle Button */}
          <div
            className={`h-16 flex items-center shrink-0 ${
              isPrimaryCollapsed ? 'justify-center px-2 flex-col gap-1' : 'justify-between px-4'
            }`}
          >
            <Link
              href={`/org/${orgSlug}`}
              className="flex items-center gap-2 overflow-hidden"
              title={orgName}
            >
              <NexaLogo size={28} showText={!isPrimaryCollapsed} />
            </Link>

            <button
              type="button"
              onClick={() => setIsPrimaryCollapsed(!isPrimaryCollapsed)}
              className="p-1.5 rounded-md text-slate-400 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
              title={isPrimaryCollapsed ? 'Mở rộng Sidebar chính' : 'Thu gọn Sidebar chính'}
              aria-label={isPrimaryCollapsed ? 'Mở rộng Sidebar chính' : 'Thu gọn Sidebar chính'}
            >
              {isPrimaryCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
              ) : (
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
              )}
            </button>
          </div>

          {/* Current Organization Info Card (khi mở rộng) */}
          {!isPrimaryCollapsed && (
            <div className="p-3 bg-slate-50/60 dark:bg-zinc-900/60">
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
                {!isPrimaryCollapsed && group.label && (
                  <div className="px-3 pt-1 pb-1 text-[10px] font-bold font-mono tracking-wider text-slate-400 dark:text-neutral-500 uppercase">
                    {group.label}
                  </div>
                )}
                {group.items.map((item) => {
                  const active = isPrimaryActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        active
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold border-l-2 border-blue-600 dark:border-blue-400'
                          : 'text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-50 dark:hover:bg-zinc-900'
                      } ${isPrimaryCollapsed ? 'justify-center px-0' : ''}`}
                      title={isPrimaryCollapsed ? item.name : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      {!isPrimaryCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Feedback Trigger Button */}
          <div className="p-3">
            <button
              type="button"
              onClick={() => setShowFeedback(true)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer ${
                isPrimaryCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Đóng góp ý kiến"
            >
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
              {!isPrimaryCollapsed && <span>Đóng góp ý kiến</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* 2. SECONDARY SUB-SIDEBAR (MENU THỨ 2: Chỉ xuất hiện khi vào Phân hệ Khảo thí) */}
      {isAssessmentRoute && (
        <aside className="w-60 border-r border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-[#0E0E11] flex flex-col justify-between shrink-0 h-full transition-all duration-300 ease-in-out select-none">
          <div className="flex flex-col h-full min-h-0">
            {/* Header phân hệ Khảo thí: Chỉ có tiêu đề Đánh giá năng lực */}
            <div className="h-16 px-4 flex items-center shrink-0 bg-white/50 dark:bg-black/20">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Đánh giá năng lực
              </h2>
            </div>

            {/* Menu dọc gồm 3 tab khảo thí */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold font-mono tracking-wider text-slate-400 dark:text-neutral-500 uppercase">
                DANH MỤC KHẢO THÍ
              </div>

              {assessmentSubNavItems.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${
                      tab.isActive
                        ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs border border-slate-200/90 dark:border-zinc-800'
                        : 'text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-100/70 dark:hover:bg-zinc-900/60 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    <span className="font-semibold truncate flex-1">{tab.name}</span>
                    {tab.isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Quick Actions Footer trong Sidebar phụ */}
            <div className="p-3 bg-white/40 dark:bg-black/10 space-y-2">
              <Link
                href={`/org/${orgSlug}/assessments/new`}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Soạn đề thi mới</span>
              </Link>
            </div>
          </div>
        </aside>
      )}

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
}
