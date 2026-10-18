'use client';

import { useState, useEffect } from 'react';
import { LearnerAvatarMenu } from './LearnerAvatarMenu';
import { NotificationBell } from '../NotificationBell';
import { Search, Trophy } from 'lucide-react';

export function LearnerTopbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      {/* Search Input */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Tìm kiếm bài đánh giá, lớp học, tài liệu..."
            className="w-full bg-transparent hover:bg-slate-50 focus:bg-white text-xs text-slate-900 pl-10 pr-4 py-2 rounded-full border border-slate-200 focus:border-sky-500 focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Stats & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Points Display - Seamless without background */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs">
          <Trophy className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
          <span className="font-semibold text-slate-900">240 điểm</span>
        </div>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Avatar Menu */}
        <LearnerAvatarMenu />
      </div>
    </header>
  );
}

