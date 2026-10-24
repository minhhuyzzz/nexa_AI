'use client';

import { useState, useEffect } from 'react';
import { LearnerAvatarMenu } from './LearnerAvatarMenu';
import { NotificationBell } from '../NotificationBell';
import { Search, Trophy } from 'lucide-react';

export function LearnerTopbar() {
  const [scrolled, setScrolled] = useState(false);
  const [points, setPoints] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    async function fetchPoints() {
      try {
        const res = await fetch('/api/learner/profile-stats', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.stats) {
            setPoints(json.stats.points ?? 0);
          }
        }
      } catch {
        // fallback to 0
      }
    }

    fetchPoints();
    window.addEventListener('profile-updated', fetchPoints);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('profile-updated', fetchPoints);
    };
  }, []);

  return (
    <header
      className={`h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 shadow-xs'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      {/* Search Input */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Tìm kiếm bài đánh giá, lớp học, tài liệu..."
            className="w-full bg-transparent hover:bg-slate-50 dark:hover:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-900 text-xs text-slate-900 dark:text-zinc-100 pl-10 pr-4 py-2 rounded-full border border-slate-200 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-500 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Right Stats & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Points Display - Seamless without background */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs">
          <Trophy className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" strokeWidth={1.75} />
          <span className="font-semibold text-slate-900 dark:text-zinc-100 font-mono tabular-nums">{points} điểm</span>
        </div>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Avatar Menu */}
        <LearnerAvatarMenu />
      </div>
    </header>
  );
}

