'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RoleSelector, type SelectableRole } from '@/components/auth/RoleSelector';
import { ArrowRight, AlertCircle, LogOut, CheckCircle2 } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<SelectableRole>('LEARNER');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace('/login');
          return;
        }

        setEmail(user.email || '');

        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, role, is_onboarded')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.is_onboarded === true) {
            // Đã hoàn tất trước đó, điều hướng thẳng tới dashboard
            const target = profile.role === 'EVALUATOR' ? '/evaluator/dashboard' : '/learner/dashboard';
            router.replace(target);
            return;
          }
          if (profile.nickname) {
            setNickname(profile.nickname);
          }
        }
      } catch (err) {
        console.error('Failed to load profile in onboarding:', err);
      } finally {
        setFetching(false);
      }
    }

    loadInitialProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNickname = nickname.trim();
    if (cleanNickname.length < 2 || cleanNickname.length > 30) {
      setError('Biệt danh phải có từ 2 đến 30 ký tự');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          nickname: cleanNickname,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể lưu thông tin hồ sơ');
      }

      router.push(data.redirectUrl || (role === 'EVALUATOR' ? '/evaluator/dashboard' : '/learner/dashboard'));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi hệ thống');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (fetching) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-sky-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Đang chuẩn bị không gian làm việc...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-100 mb-2">
          <CheckCircle2 className="w-3 h-3 text-sky-600" strokeWidth={1.75} />
          <span>Đăng nhập Google thành công</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hoàn tất thiết lập tài khoản</h2>
        <p className="text-xs text-slate-500 mt-1">
          Chọn vai trò và đặt biệt danh hiển thị của bạn để bắt đầu sử dụng NEXA.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email hiển thị (read-only) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email tài khoản
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-600 cursor-not-allowed select-none"
          />
        </div>

        {/* Lựa chọn vai trò (Learner vs Evaluator) */}
        <RoleSelector value={role} onChange={setRole} />
        <p className="text-[11px] text-slate-400 -mt-3">
          Lưu ý: Vai trò được gắn cố định với tài khoản để đảm bảo tính toàn vẹn dữ liệu khảo thí.
        </p>

        {/* Biệt danh hiển thị */}
        <div>
          <label htmlFor="onboarding-nickname" className="block text-xs font-semibold text-slate-700 mb-1">
            Biệt danh hiển thị <span className="text-rose-600">*</span>
          </label>
          <input
            id="onboarding-nickname"
            type="text"
            required
            minLength={2}
            maxLength={30}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Ví dụ: Minh Huy"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Tên công khai trên Bảng xếp hạng và trong các Nhóm học tập (2–30 ký tự, hỗ trợ tiếng Việt).
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Đang hoàn tất...' : 'Bắt đầu trải nghiệm NEXA'}</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </form>

      <div className="text-center text-xs text-slate-400 border-t border-slate-100 pt-4 flex items-center justify-center gap-1.5">
        <span>Không phải tài khoản của bạn?</span>
        <button
          type="button"
          onClick={handleSignOut}
          className="font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
        >
          <LogOut className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
