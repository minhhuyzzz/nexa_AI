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
} from 'lucide-react';
import { FeedbackModal } from '../FeedbackModal';

export function LearnerAvatarMenu() {
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
    // Visual toggle notification or theme switch
  };

  return (
    <>
      <div className="relative">
        {/* Avatar ONLY - Pure Circle with zero adjacent text */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center text-xs font-semibold shadow-xs ring-2 ring-transparent hover:ring-slate-300 transition-all focus:outline-none"
          title="Tài khoản cá nhân"
        >
          MH
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
                    MH
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      Trần Minh Huy
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      minhhuy@nexa.edu.vn
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Plan Badge & Upgrade Link */}
              <div className="p-3 mx-2 my-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 text-[11px]">Gói dịch vụ</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-800 border border-slate-200">
                    CÁ NHÂN (FREE)
                  </span>
                </div>
                <Link
                  href="/learner/billing"
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
                  href="/learner/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  <span>Cài đặt thông tin tài khoản</span>
                </Link>

                <Link
                  href="/learner/groups"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <Users className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  <span>Lớp học & Nhóm đã tham gia</span>
                </Link>

                <Link
                  href="/learner/credentials"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <FolderLock className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  <span>Kho lưu trữ & Minh chứng</span>
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

                {/* Feedback */}
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
                  <LogOut className="w-4 h-4 text-rose-500" strokeWidth={1.75} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </>
  );
}

export default LearnerAvatarMenu;
