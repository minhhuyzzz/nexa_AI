'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { OrgAvatarMenu } from '@/components/dashboard/org/OrgAvatarMenu';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { Building2, Menu, FilePlus, CalendarRange, ClipboardCheck, Radio } from 'lucide-react';
import { useMobileNav } from '@/contexts/MobileNavContext';
import { NexaLogo } from '@/components/brand/NexaLogo';

interface OrgTopbarProps {
  orgName: string;
  orgSlug?: string;
  userRole?: string;
}

export function OrgTopbar({ orgName, orgSlug, userRole }: OrgTopbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { toggleMobile } = useMobileNav();

  const isAssessmentRoute =
    Boolean(orgSlug) &&
    (pathname.startsWith(`/org/${orgSlug}/assessments`) ||
      pathname.startsWith(`/org/${orgSlug}/campaigns`) ||
      pathname.startsWith(`/org/${orgSlug}/grading`) ||
      pathname.startsWith(`/org/${orgSlug}/live-room`));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-xs'
          : 'bg-white dark:bg-black'
      }`}
    >
      <div className="h-16 px-4 md:px-8 flex items-center justify-between">
        {/* Left: Mobile Hamburger & Workspace breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 md:hidden shrink-0">
            <button
              type="button"
              onClick={toggleMobile}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-1 rounded-xl text-neutral-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="w-5 h-5" strokeWidth={2} />
            </button>
            <Link href={orgSlug ? `/org/${orgSlug}` : '/personal/dashboard'} className="flex items-center" title="NEXA">
              <NexaLogo size={24} showText={false} />
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-300 min-w-0">
            <Building2 className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" strokeWidth={1.75} />
            <span className="truncate max-w-[160px] sm:max-w-[260px] font-semibold text-slate-800 dark:text-neutral-200">{orgName}</span>
          </div>
        </div>

        {/* Right: Notification and Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <NotificationBell />
          <OrgAvatarMenu orgSlug={orgSlug} orgName={orgName} userRole={userRole} />
        </div>
      </div>

      {/* Mobile Assessment Quick Sub-Nav Strip */}
      {isAssessmentRoute && orgSlug && (
        <div className="md:hidden px-4 pb-2.5 pt-0.5 overflow-x-auto no-scrollbar flex items-center gap-1.5">
          {[
            {
              name: 'Kho đề thi',
              href: `/org/${orgSlug}/assessments`,
              icon: FilePlus,
              active: pathname.startsWith(`/org/${orgSlug}/assessments`),
            },
            {
              name: 'Đợt khảo thí',
              href: `/org/${orgSlug}/campaigns`,
              icon: CalendarRange,
              active: pathname.startsWith(`/org/${orgSlug}/campaigns`),
            },
            {
              name: 'Chấm bài',
              href: `/org/${orgSlug}/grading`,
              icon: ClipboardCheck,
              active: pathname.startsWith(`/org/${orgSlug}/grading`),
            },
            {
              name: 'Phòng thi',
              href: `/org/${orgSlug}/live-room`,
              icon: Radio,
              active: pathname.startsWith(`/org/${orgSlug}/live-room`),
            },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  tab.active
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20'
                    : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
