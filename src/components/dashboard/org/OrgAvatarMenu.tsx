'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LogOut,
  User,
  Building2,
  Settings,
  Sun,
  Moon,
  MessageSquare,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { FeedbackModal } from '../FeedbackModal';

interface OrgAvatarMenuProps {
  orgSlug?: string;
  orgName?: string;
}

export function OrgAvatarMenu({ orgSlug, orgName }: OrgAvatarMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const [showFeedback, setShowFeedback] = useState(false);

  const [displayName, setDisplayName] = useState('Thành viên Tổ chức');
  const [displayEmail, setDisplayEmail] = useState('');
  const [displayInitials, setDisplayInitials] = useState('TC');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/personal/profile-stats');
        if (res.ok) {
          const data = await res.json();
          const userObj = data?.user || data?.profile;
          if (userObj) {
            const name = userObj.fullName || userObj.displayName || 'Thành viên Tổ chức';
            setDisplayName(name);
            if (userObj.email) setDisplayEmail(userObj.email);
            const inits =
              name
                .split(' ')
                .filter(Boolean)
                .slice(-2)
                .map((w: string) => w[0]?.toUpperCase())
                .join('') || 'TC';
            setDisplayInitials(inits);
            if (userObj.avatarUrl) {
              setAvatarUrl(userObj.avatarUrl);
              return;
            }
          }
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const email = user.email || '';
          setDisplayEmail(email);
          const name = user.user_metadata?.full_name || email.split('@')[0] || 'Thành viên';
          setDisplayName(name);
          setDisplayInitials(name.slice(0, 2).toUpperCase());
          if (user.user_metadata?.avatar_url) {
            setAvatarUrl(user.user_metadata.avatar_url);
          }
        }
      } catch (err) {
        console.error('Error fetching org profile:', err);
      }
    }
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Menu tài khoản tổ chức"
          className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-medium text-xs flex items-center justify-center shadow-xs">
              {displayInitials}
            </div>
          )}
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-72 rounded-md bg-white border border-slate-200 shadow-sm py-2 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100">
              {/* Profile Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-start gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {displayInitials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{displayName}</p>
                  <p className="text-[11px] font-mono text-slate-500 truncate">{displayEmail}</p>
                  {orgName && (
                    <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-sky-50 text-sky-700 font-medium border border-sky-100">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate max-w-[140px]">{orgName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Workspace Jump: Back to Personal */}
              <div className="p-2 mx-2 my-1.5 rounded bg-slate-50 border border-slate-200/80">
                <Link
                  href="/personal/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-800 font-medium text-[11px] border border-slate-200 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-600" />
                    <span>Workspace Cá nhân</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </Link>
              </div>

              {/* Navigation Items */}
              <div className="py-1 space-y-0.5">
                {orgSlug && (
                  <Link
                    href={`/org/${orgSlug}/settings`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                    <span>Cài đặt Tổ chức</span>
                  </Link>
                )}

                <Link
                  href="/personal/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  <span>Hồ sơ tài khoản</span>
                </Link>

                {/* Dark/Light mode toggle switch */}
                <div className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    {isDarkMode ? (
                      <Moon className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
                    )}
                    <span className="font-medium text-xs text-slate-700">
                      Giao diện {isDarkMode ? 'Tối' : 'Sáng'}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isDarkMode}
                    onClick={toggleTheme}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isDarkMode ? 'bg-sky-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        isDarkMode ? 'translate-x-3' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

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

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </>
  );
}

export default OrgAvatarMenu;
