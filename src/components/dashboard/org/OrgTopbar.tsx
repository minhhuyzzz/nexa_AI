'use client';

import { WorkspaceSwitcher } from '@/components/dashboard/WorkspaceSwitcher';
import { OrgAvatarMenu } from '@/components/dashboard/org/OrgAvatarMenu';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { Building2 } from 'lucide-react';

interface OrgTopbarProps {
  orgName: string;
  orgSlug?: string;
}

export function OrgTopbar({ orgName, orgSlug }: OrgTopbarProps) {
  return (
    <header className="h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 bg-white border-b border-slate-100">
      {/* Left: Workspace Switcher */}
      <div className="flex items-center gap-3">
        <WorkspaceSwitcher />
      </div>

      {/* Right: Notification and Avatar */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-md">
          <Building2 className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
          <span className="font-semibold text-slate-700 truncate max-w-[200px]">{orgName}</span>
        </div>

        <NotificationBell />
        <OrgAvatarMenu orgSlug={orgSlug} orgName={orgName} />
      </div>
    </header>
  );
}
