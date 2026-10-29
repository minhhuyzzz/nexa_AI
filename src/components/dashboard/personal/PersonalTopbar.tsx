'use client';

import { useState, useEffect } from 'react';
import { WorkspaceSwitcher } from '@/components/dashboard/WorkspaceSwitcher';
import { PersonalAvatarMenu } from './PersonalAvatarMenu';
import { NotificationBell } from '../NotificationBell';
import { Search, Trophy, KeyRound } from 'lucide-react';
import { QuickPinModal } from '@/components/dashboard/QuickPinModal';

export function PersonalTopbar() {
  const [scrolled, setScrolled] = useState(false);
  const [points, setPoints] = useState<number>(0);
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    async function fetchPoints() {
      try {
        const res = await fetch('/api/personal/profile-stats', { cache: 'no-store' });
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
    <>
      <header
        className={`h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs'
            : 'bg-white border-b border-slate-100'
        }`}
      >
        {/* Left: Workspace Switcher & Search Input */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <WorkspaceSwitcher />
          <div className="relative flex-1 hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Tìm kiếm bài đánh giá, lớp học, tài liệu..."
              className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-900 pl-10 pr-4 py-2 rounded-full border border-slate-200 focus:border-sky-600 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right: Quick PIN, Points & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <button
            onClick={() => setShowPinModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
            title="Nhập mã PIN vào phòng thi"
          >
            <KeyRound className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
            <span>Vào phòng thi</span>
          </button>

          {/* Points Display */}
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs">
            <Trophy className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
            <span className="font-semibold text-slate-900 font-mono tabular-nums">{points} điểm</span>
          </div>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Avatar Menu */}
          <PersonalAvatarMenu />
        </div>
      </header>

      <QuickPinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} />
    </>
  );
}

export { PersonalTopbar as LearnerTopbar };
