'use client';

import { useState, useEffect } from 'react';
import { OrgAvatarMenu } from '@/components/dashboard/org/OrgAvatarMenu';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { Building2 } from 'lucide-react';

interface OrgTopbarProps {
  orgName: string;
  orgSlug?: string;
}

export function OrgTopbar({ orgName, orgSlug }: OrgTopbarProps) {
  const [scrolled, setScrolled] = useState(false);

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
          ? 'bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 shadow-xs'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      {/* Left: Workspace breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-300">
        <Building2 className="w-4 h-4 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
        <span className="truncate max-w-[260px] font-semibold text-slate-800 dark:text-neutral-200">{orgName}</span>
      </div>

      {/* Right: Notification and Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <NotificationBell />
        <OrgAvatarMenu orgSlug={orgSlug} orgName={orgName} />
      </div>
    </header>
  );
}
