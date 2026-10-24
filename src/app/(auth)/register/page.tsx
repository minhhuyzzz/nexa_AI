'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { RoleSelector, type SelectableRole } from '@/components/auth/RoleSelector';
import { translateAuthError } from '@/lib/utils/auth-error-translator';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<SelectableRole>('LEARNER');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptTerms) {
      setError('Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật để tiếp tục.');
      return;
    }

    const cleanNickname = nickname.trim().replace(/\s+/g, ' ');

    if (cleanNickname.length < 2 || cleanNickname.length > 30) {
      setError('Biệt danh phải từ 2 đến 30 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          nickname: cleanNickname,
          email: cleanEmail,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký tài khoản không thành công');
      }

      if (data.requiresEmailConfirmation) {
        setPendingEmail(cleanEmail);
        return;
      }

      router.push(data.redirectUrl || '/learner/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? translateAuthError(err.message) : 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  if (pendingEmail) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Kiểm tra email của bạn</h2>
          <p className="text-xs text-slate-500 mt-1">
            Chúng tôi đã gửi liên kết xác thực tới hộp thư của bạn.
          </p>
        </div>

        <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 space-y-3">
          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="text-xs text-emerald-900">
              <div className="font-semibold">Xác thực để kích hoạt tài khoản</div>
              <div className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                Mở email gửi tới <span className="font-mono font-medium">{pendingEmail}</span> và bấm
                vào liên kết xác thực. Liên kết sẽ đưa bạn thẳng vào bảng điều khiển.
              </div>
            </div>
          </div>
          <p className="text-[11px] text-emerald-700 border-t border-emerald-200/60 pt-2">
            Không thấy email? Hãy kiểm tra thư mục Spam hoặc Thư rác.
          </p>
        </div>

        <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Đã xác thực xong?{' '}
          <Link href="/login" className="font-semibold text-sky-600 hover:text-sky-700">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tạo tài khoản mới</h2>
        <p className="text-xs text-slate-500 mt-1">
          Chọn đúng vai trò của bạn. Mỗi tài khoản gắn liền với 1 vai trò tĩnh cố định.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <RoleSelector value={role} onChange={setRole} />

        <div>
          <label htmlFor="register-nickname" className="block text-xs font-semibold text-slate-700 mb-1">
            Biệt danh hiển thị <span className="text-rose-600">*</span>
          </label>
          <input
            id="register-nickname"
            type="text"
            required
            minLength={2}
            maxLength={30}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Ví dụ: Trần Minh Huy"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Tên công khai trên Bảng xếp hạng. Không được trùng với người dùng khác.
          </p>
        </div>

        <div>
          <label htmlFor="register-email" className="block text-xs font-semibold text-slate-700 mb-1">
            Địa chỉ email <span className="text-rose-600">*</span>
          </label>
          <input
            id="register-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Bạn sẽ nhận liên kết xác thực tại email này.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="register-password" className="block text-xs font-semibold text-slate-700 mb-1">
              Mật khẩu <span className="text-rose-600">*</span>
            </label>
            <input
              id="register-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
            />
          </div>

          <div>
            <label htmlFor="register-confirm-password" className="block text-xs font-semibold text-slate-700 mb-1">
              Xác nhận lại mật khẩu <span className="text-rose-600">*</span>
            </label>
            <input
              id="register-confirm-password"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
            />
          </div>

          <p className="text-[11px] text-slate-400 -mt-1 sm:col-span-2">
            Mật khẩu từ 6 ký tự (nên kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt).
          </p>
        </div>

        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600 cursor-pointer"
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              Tôi đồng ý với <span className="text-slate-900 font-semibold">Điều khoản dịch vụ</span>{' '}
              và <span className="text-slate-900 font-semibold">Chính sách bảo mật dữ liệu</span> của
              NEXA.
            </span>
          </label>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </form>

      <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-semibold text-sky-600 hover:text-sky-700">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
