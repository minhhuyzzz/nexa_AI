'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PersonalAvatarMenu } from './PersonalAvatarMenu';
import { NotificationBell } from '../NotificationBell';
import { Trophy, Menu } from 'lucide-react';
import { CountUpText } from '@/components/ui/CountUpText';
import { useMobileNav } from '@/contexts/MobileNavContext';
import { NexaLogo } from '@/components/brand/NexaLogo';
import { GlobalSearchInput } from '@/components/dashboard/search/GlobalSearchInput';

export function PersonalTopbar() {
  const [scrolled, setScrolled] = useState(false);
  const [points, setPoints] = useState<number>(0);
  const { toggleMobile } = useMobileNav();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    async function fetchUserData() {
      try {
        const res = await fetch('/api/personal/profile-stats', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.stats) {
            setPoints(json.stats.points ?? 0);
          }
        }
      } catch {
        // fallback
      }
    }

    fetchUserData();
    window.addEventListener('profile-updated', fetchUserData);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('profile-updated', fetchUserData);
    };
  }, []);

  return (
    <header
      className={`h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 gap-3 ${
        scrolled
          ? 'bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-xs'
          : 'bg-transparent'
      }`}
    >
      {/* Left: Mobile Hamburger & Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 md:hidden">
          <button
            type="button"
            onClick={toggleMobile}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-xl text-neutral-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" strokeWidth={2} />
          </button>
          <Link href="/personal/dashboard" className="flex items-center" title="NEXA">
            <NexaLogo size={24} showText={false} />
          </Link>
        </div>
      </div>

      {/* Center: Global Search Input (Centered Max-w-lg) */}
      <div className="flex-1 flex justify-center max-w-lg mx-auto px-2 sm:px-4 min-w-0">
        <GlobalSearchInput scope="personal" />
      </div>

      {/* Right: Points, Notification Bell & Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Points Display */}
        <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs rounded-xl bg-slate-50/60 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/60 group">
          <span className="w-1.5 h-1.5 rounded-full bg-volt ring-2 ring-volt/40 shrink-0" />
          <Trophy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums text-[11px] sm:text-xs">
            <CountUpText value={points} duration={800} /><span className="hidden sm:inline"> PTS</span>
          </span>
        </div>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Avatar Menu */}
        <PersonalAvatarMenu />
      </div>
    </header>
  );
}
