'use client';

import { useState, useEffect } from 'react';
import { PersonalAvatarMenu } from './PersonalAvatarMenu';
import { NotificationBell } from '../NotificationBell';
import { Search, Trophy } from 'lucide-react';

export function PersonalTopbar() {
  const [scrolled, setScrolled] = useState(false);
  const [points, setPoints] = useState<number>(0);

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
      className={`h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 shadow-xs'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      {/* Left: Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Tìm kiếm bài đánh giá, lớp học, tài liệu..."
            className="w-full bg-slate-50/90 dark:bg-zinc-900/90 hover:bg-slate-100 dark:hover:bg-zinc-850 focus:bg-white dark:focus:bg-zinc-900 text-xs text-neutral-900 dark:text-neutral-100 pl-10 pr-4 py-2 rounded-md border border-slate-200/80 dark:border-zinc-800 focus:border-blue-600 dark:focus:border-blue-400 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-neutral-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Right: Points, Notification Bell & Avatar */}
      <div className="flex items-center gap-3">
        {/* Points Display */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-slate-50/60 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/60 group">
          <span className="w-1.5 h-1.5 rounded-full bg-volt ring-2 ring-volt/40" />
          <Trophy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">{points} PTS</span>
        </div>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Avatar Menu (Chứa Dropdown Không gian làm việc, Gói tài khoản & CTA Nâng cấp, và Chuyển Dark/Light Mode) */}
        <PersonalAvatarMenu />
      </div>
    </header>
  );
}
