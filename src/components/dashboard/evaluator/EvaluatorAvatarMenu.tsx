'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LogOut,
  User,
  Award,
  Sparkles,
  Sun,
  Moon,
  FolderLock,
  MessageSquare,
  Users,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { FeedbackModal } from '../FeedbackModal';

export function EvaluatorAvatarMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const [showFeedback, setShowFeedback] = useState(false);

  const [displayName, setDisplayName] = useState('Chuyên Gia Khảo Thí');
  const [displayEmail, setDisplayEmail] = useState('evaluator@nexa.edu.vn');
  const [displayInitials, setDisplayInitials] = useState('CG');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (user.email) setDisplayEmail(user.email);
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('id', user.id)
            .single();

          if (profile) {
            const name = profile.full_name || user.user_metadata?.full_name || 'Chuyên Gia Khảo Thí';
            setDisplayName(name);
            const inits = name
              .split(' ')
              .filter(Boolean)
              .slice(-2)
              .map((w: string) => w[0]?.toUpperCase())
              .join('') || 'CG';
            setDisplayInitials(inits);

            const avatar =
              profile.avatar_url ||
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              null;
            setAvatarUrl(avatar);
          }
        }
      } catch {
        // Fallback
      }
    }
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = 'nexa_demo_role=; path=/; max-age=0';
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <div className="relative">
        {/* Avatar ONLY - Pure Circle with ZERO adjacent text */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-9 rounded-full bg-sky-700 hover:bg-sky-800 text-white flex items-center justify-center text-xs font-semibold shadow-xs ring-2 ring-transparent hover:ring-sky-200 transition-all focus:outline-none overflow-hidden"
          title="Tài khoản chuyên gia khảo thí"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            displayInitials
          )}
        </button>

        {isOpen && (
          <>
            {/* Backdrop to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-950 border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-800 dark:text-zinc-200 text-xs">
              {/* User Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-850">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-700 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      displayInitials
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {displayEmail}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Plan Badge & Upgrade Link */}
              <div className="p-3 mx-2 my-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-zinc-400 text-[11px]">Gói khảo thí</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-zinc-700">
                    CHUYÊN GIA PRO
                  </span>
                </div>
                <Link
                  href="/evaluator/billing"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-[11px] transition-colors shadow-xs"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-sky-200" />
                    <span>Nâng cấp gói dịch vụ</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-sky-200" />
                </Link>
              </div>

              {/* Navigation Items */}
              <div className="py-1 space-y-0.5">
                <Link
                  href="/evaluator/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                  <span>Hồ sơ chuyên gia</span>
                </Link>

                <Link
                  href="/evaluator/groups"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <Users className="w-4 h-4 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                  <span>Quản lý lớp học</span>
                </Link>

                <Link
                  href="/evaluator/item-bank"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <FolderLock className="w-4 h-4 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                  <span>Kho đề & Ngân hàng câu hỏi</span>
                </Link>

                {/* Dark/Light mode toggle switch */}
                <div className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                  <div className="flex items-center gap-2.5">
                    {isDarkMode ? (
                      <Moon className="w-4 h-4 text-sky-400" strokeWidth={1.75} />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
                    )}
                    <span className="font-medium text-xs text-slate-700 dark:text-zinc-300">Giao diện {isDarkMode ? 'Tối' : 'Sáng'}</span>
                  </div>
                  {/* Thanh gạt switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isDarkMode}
                    onClick={toggleTheme}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isDarkMode ? 'bg-sky-600' : 'bg-slate-300'
                    }`}
                  >
                    <span className="sr-only">Bật tắt chế độ tối</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isDarkMode ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Feedback Modal Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowFeedback(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors text-left"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                  <span>Đóng góp ý kiến</span>
                </button>
              </div>

              {/* Sign out */}
              <div className="pt-1 mt-1 border-t border-slate-100 dark:border-zinc-850">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-600" strokeWidth={1.75} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </>
  );
}
