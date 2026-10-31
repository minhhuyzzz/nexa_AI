'use client';

import { OrgAvatarMenu } from '@/components/dashboard/org/OrgAvatarMenu';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { Building2 } from 'lucide-react';

interface OrgTopbarProps {
  orgName: string;
  orgSlug?: string;
}

export function OrgTopbar({ orgName, orgSlug }: OrgTopbarProps) {
  return (
    <header className="h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 bg-white dark:bg-black border-b border-slate-100 dark:border-zinc-850">
      {/* Left: Organization Badge */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-md font-semibold">
          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          <span className="truncate max-w-[260px]">{orgName}</span>
        </div>
      </div>

      {/* Right: Notification and Avatar */}
      <div className="flex items-center gap-3">
        <NotificationBell />
        <OrgAvatarMenu orgSlug={orgSlug} orgName={orgName} />
      </div>
    </header>
  );
}
