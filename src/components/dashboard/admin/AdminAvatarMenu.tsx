'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LogOut,
  User,
  ShieldAlert,
  Sparkles,
  Sun,
  Moon,
  FolderLock,
  MessageSquare,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { FeedbackModal } from '../FeedbackModal';

export function AdminAvatarMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = 'nexa_demo_role=; path=/; max-age=0';
    router.push('/login');
    router.refresh();
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <>
      <div className="relative">
        {/* Avatar ONLY - Pure Circle with ZERO adjacent text */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center text-xs font-semibold shadow-xs ring-2 ring-transparent hover:ring-slate-300 transition-all focus:outline-none"
          title="Tài khoản Quản trị viên"
        >
          AD
        </button>

        {isOpen && (
          <>
            {/* Backdrop to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-800 text-xs">
              {/* User Header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    AD
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      Quản trị viên Hệ thống
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      admin@nexa.edu.vn
                    </div>
                  </div>
                </div>
              </div>

              {/* Status info */}
              <div className="p-3 mx-2 my-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 text-[11px]">Quyền hạn</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                    SUPER ADMIN
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Toàn quyền quản trị hạ tầng & dữ liệu
                </div>
              </div>

              {/* Navigation Items */}
              <div className="py-1 space-y-0.5">
                <Link
                  href="/admin/frameworks"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <FolderLock className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  <span>Quản trị khung năng lực</span>
                </Link>

                <Link
                  href="/admin/ai-gateway"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  <span>Cấu hình AI Gateway</span>
                </Link>

                {/* Dark/Light mode toggle */}
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors text-left"
                >
                  <span className="flex items-center gap-2.5">
                    {isDarkMode ? (
                      <Moon className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
                    )}
                    <span>Giao diện {isDarkMode ? 'Tối' : 'Sáng'}</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {isDarkMode ? 'Dark' : 'Light'}
                  </span>
                </button>

                {/* Feedback Modal Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowFeedback(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors text-left"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  <span>Đóng góp ý kiến</span>
                </button>
              </div>

              {/* Sign out */}
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
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
