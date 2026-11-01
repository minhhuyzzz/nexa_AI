'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldAlert, LogOut, Mail, HelpCircle } from 'lucide-react';

export default function AccountSuspendedPage() {
  const router = useRouter();
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSuspensionInfo() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_suspended, suspended_reason')
          .eq('id', user.id)
          .single();

        if (profile && !profile.is_suspended) {
          router.push('/dashboard');
          return;
        }

        setReason(profile?.suspended_reason || 'Vi phạm điều khoản dịch vụ hoặc chính sách bảo mật');
      } catch (err) {
        console.error('Error fetching suspension info:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSuspensionInfo();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = 'nexa_active_workspace=; path=/; max-age=0';
    document.cookie = 'nexa_demo_role=; path=/; max-age=0';
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 shrink-0">
          <ShieldAlert className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
            Tài khoản đang bị tạm khóa
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Quyền truy cập vào các không gian làm việc trên NEXA AI hiện đã bị tạm ngưng.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-md bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
        <div className="text-xs font-semibold text-rose-900 dark:text-rose-300">
          Lý do tạm khóa từ ban quản trị:
        </div>
        <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed font-mono">
          &ldquo;{reason}&rdquo;
        </p>
      </div>

      <div className="p-4 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300">
          <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <span className="font-semibold">Bạn cho rằng có sự nhầm lẫn?</span>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              Vui lòng gửi email khiếu nại tới bộ phận hỗ trợ kỹ thuật và an toàn thông tin của NEXA AI kèm địa chỉ email đăng ký để được giải quyết.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
          <Mail className="w-4 h-4" strokeWidth={1.75} />
          <a href="mailto:support@nexa.vn" className="hover:underline">
            support@nexa.vn
          </a>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full py-2.5 px-4 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Đăng xuất khỏi thiết bị này</span>
        </button>
      </div>
    </div>
  );
}
