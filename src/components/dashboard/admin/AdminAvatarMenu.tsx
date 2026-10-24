'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LogOut,
  Sun,
  Moon,
  FolderLock,
  Settings,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function AdminAvatarMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  const [displayName, setDisplayName] = useState('Quản Trị Viên Tối Cao');
  const [displayEmail, setDisplayEmail] = useState('admin.nexa@gmail.com');
  const [displayInitials] = useState('AD');

  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (user.email) setDisplayEmail(user.email);
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, nickname')
            .eq('id', user.id)
            .single();

          if (profile) {
            const name = profile.full_name || user.user_metadata?.full_name || 'Quản Trị Viên Tối Cao';
            setDisplayName(name);
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
          className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center text-xs font-semibold shadow-xs ring-2 ring-transparent hover:ring-slate-300 transition-all focus:outline-none font-mono"
          title="Tài khoản Quản trị viên"
        >
          {displayInitials}
        </button>

        {isOpen && (
          <>
            {/* Backdrop to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-950 border border-slate-200/90 dark:border-zinc-800 rounded-md shadow-sm py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-800 dark:text-zinc-200 text-xs">
              {/* User Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-850">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center font-mono shrink-0">
                    {displayInitials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate font-mono">
                      {displayEmail}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status info */}
              <div className="p-3 mx-2 my-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 dark:text-zinc-400 text-[11px]">Quyền hạn</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-200 border border-slate-700 dark:border-zinc-700">
                    SUPER ADMIN
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Toàn quyền quản trị hạ tầng & dữ liệu
                </div>
              </div>

              {/* Navigation Items */}
              <div className="py-1 space-y-0.5">
                <Link
                  href="/admin/frameworks"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <FolderLock className="w-4 h-4 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                  <span>Quản trị khung năng lực</span>
                </Link>

                <Link
                  href="/admin/settings?tab=ai"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                  <span>Cấu hình AI Gateway</span>
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
    </>
  );
}
