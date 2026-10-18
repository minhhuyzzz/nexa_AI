'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'LEARNER' | 'EVALUATOR'>('LEARNER');
  const [consentNd13, setConsentNd13] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consentNd13) {
      setError('Bạn bắt buộc phải đồng ý với Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          role,
          consentNd13,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký thất bại');
      }

      router.push(data.redirectUrl || '/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tạo tài khoản mới</h2>
        <p className="text-xs text-slate-500 mt-1">
          Chọn đúng vai trò của bạn. Mỗi email gắn liền với 1 vai trò tĩnh cố định.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Vai trò của bạn <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('LEARNER')}
              className={`p-3 rounded-md border text-left transition-colors flex flex-col justify-between ${
                role === 'LEARNER'
                  ? 'border-sky-600 bg-sky-50/50 text-slate-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <User className={`w-4 h-4 ${role === 'LEARNER' ? 'text-sky-600' : 'text-slate-400'}`} strokeWidth={1.75} />
                {role === 'LEARNER' && <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Người học (Learner)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Tự đánh giá & phát triển</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('EVALUATOR')}
              className={`p-3 rounded-md border text-left transition-colors flex flex-col justify-between ${
                role === 'EVALUATOR'
                  ? 'border-sky-600 bg-sky-50/50 text-slate-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <GraduationCap className={`w-4 h-4 ${role === 'EVALUATOR' ? 'text-sky-600' : 'text-slate-400'}`} strokeWidth={1.75} />
                {role === 'EVALUATOR' && <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Người đánh giá</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Giảng viên / Khảo thí</div>
              </div>
            </button>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Họ và tên hiển thị <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ví dụ: Nguyễn Văn A"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Địa chỉ Email <span className="text-rose-600">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Mật khẩu <span className="text-rose-600">*</span>
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
          />
        </div>

        {/* Consent Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={consentNd13}
              onChange={(e) => setConsentNd13(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-600"
            />
            <span className="text-xs text-slate-600 leading-normal">
              Tôi xác nhận đồng ý với Điều khoản dịch vụ và Chính sách bảo vệ dữ liệu cá nhân theo{' '}
              <span className="font-semibold text-slate-900">Nghị định 13/2023/NĐ-CP</span>.
            </span>
          </label>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-semibold text-sky-600 hover:text-sky-700">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
