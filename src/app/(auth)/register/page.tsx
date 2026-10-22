'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Award, AlertCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'LEARNER' | 'EVALUATOR'>('LEARNER');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptTerms) {
      setError('Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật để tiếp tục.');
      return;
    }

    // Validate username: only lowercase, numbers, and underscore, 3-24 characters
    const cleanUsername = username.trim().toLowerCase();
    const validUsernameRegex = /^[a-z0-9_]{3,24}$/;

    if (!validUsernameRegex.test(cleanUsername)) {
      setError('Tên tài khoản chỉ được chứa chữ thường không dấu, số và dấu gạch dưới (_), không chứa khoảng trắng (từ 3 đến 24 ký tự).');
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          fullName: fullName.trim(),
          username: cleanUsername,
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký tài khoản không thành công');
      }

      router.push(data.redirectUrl || '/learner/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Role selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Vai trò tài khoản <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('LEARNER')}
              className={`p-3 rounded-md border text-left transition-colors flex flex-col justify-between ${role === 'LEARNER'
                ? 'border-sky-600 bg-sky-50/50 text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <User className={`w-4 h-4 ${role === 'LEARNER' ? 'text-sky-600' : 'text-slate-400'}`} strokeWidth={1.75} />
                {role === 'LEARNER' && <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Người học</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Học &amp; phát triển</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('EVALUATOR')}
              className={`p-3 rounded-md border text-left transition-colors flex flex-col justify-between ${role === 'EVALUATOR'
                ? 'border-sky-600 bg-sky-50/50 text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Award className={`w-4 h-4 ${role === 'EVALUATOR' ? 'text-sky-600' : 'text-slate-400'}`} strokeWidth={1.75} />
                {role === 'EVALUATOR' && <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Người đánh giá</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Đánh giá / Khảo thí</div>
              </div>
            </button>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tên người dùng muốn hiển thị <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ví dụ: Trần Minh Huy"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tên tài khoản <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ví dụ: minhhuy2026"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Địa chỉ Email <span className="text-rose-600">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
          />
        </div>

        {/* Password & Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mật khẩu <span className="text-rose-600">*</span>
            </label>
            <input
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Xác nhận lại mật khẩu <span className="text-rose-600">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
            />
          </div>
        </div>

        {/* Accept Policy Checkbox */}
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
              Tôi đồng ý với{' '}
              <span className="text-slate-900 font-semibold">Điều khoản dịch vụ</span>{' '}
              và{' '}
              <span className="text-slate-900 font-semibold">Chính sách bảo mật dữ liệu</span>{' '}
              của NEXA.
            </span>
          </label>
        </div>

        {/* Submit */}
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
