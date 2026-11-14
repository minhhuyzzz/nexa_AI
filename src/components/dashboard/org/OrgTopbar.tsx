'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OrgAvatarMenu } from '@/components/dashboard/org/OrgAvatarMenu';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { Building2, Menu } from 'lucide-react';
import { useMobileNav } from '@/contexts/MobileNavContext';
import { NexaLogo } from '@/components/brand/NexaLogo';

interface OrgTopbarProps {
  orgName: string;
  orgSlug?: string;
  userRole?: string;
}

export function OrgTopbar({ orgName, orgSlug, userRole }: OrgTopbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const { toggleMobile } = useMobileNav();

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
      className={`h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-xs'
          : 'bg-transparent'
      }`}
    >
      {/* Left: Mobile Hamburger & Workspace breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 md:hidden shrink-0">
          <button
            type="button"
            onClick={toggleMobile}
            className="p-2 -ml-1 rounded-lg text-neutral-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
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
    </header>
  );
}
