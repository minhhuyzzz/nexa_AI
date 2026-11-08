'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  GraduationCap,
  Sparkles,
  Info,
  Loader2,
  Lock,
  Globe,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export default function CreatePersonalGroupPage() {
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [allowMemberPost, setAllowMemberPost] = useState(true);
  const [allowMemberUpload, setAllowMemberUpload] = useState(true);

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const trimmedName = name.trim();
  const previewName = trimmedName || 'Lớp Kỹ năng số K48';
  const previewMonogram = (trimmedName ? trimmedName[0] : 'K').toUpperCase();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Vui lòng nhập tên lớp hoặc nhóm tối thiểu 2 ký tự');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim(),
          classCode: customCode.trim() ? customCode.trim().toUpperCase() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tạo nhóm lớp thất bại');
      }

      // Success -> Redirect to newly created group page
      router.push(`/personal/groups/${data.class?.id || ''}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi hệ thống');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Breadcrumb navigation */}
      <div>
        <Link
          href="/personal/groups"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quay lại Lớp & Nhóm</span>
        </Link>
      </div>

      {/* 2. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
              KHỞI TẠO KHÔNG GIAN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Tạo lớp hoặc nhóm học tập mới
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Thiết lập tên không gian, mô tả mục tiêu và quy chế thành viên tham gia học tập.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. Main 2-column layout: Form Panel (Left) vs Live Preview Panel (Right) */}
      <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Panel (Left - 7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
          {/* 1. Name & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1.5">
                Tên lớp hoặc nhóm học tập <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Lớp Kỹ năng số K48 - Chuyên đề D1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <span className="block text-[10px] text-slate-400 dark:text-neutral-500 mt-1">
                Tên rõ ràng giúp các thành viên dễ dàng nhận diện khi tham gia.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1.5">
                Mục tiêu & Mô tả ngắn
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="VD: Không gian ôn luyện chuẩn 5 miền năng lực số, làm bài khảo thí định kỳ và thảo luận học liệu."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* 2. Participation Policy */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-2.5">
              Chế độ thành viên tham gia
            </label>
            <div className="space-y-2.5">
              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  !requiresApproval
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50/30 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                      Vào lớp ngay khi có mã
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400">
                      Thành viên nhập đúng mã sẽ được vào không gian học tập ngay lập tức.
                    </div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="approvalMode"
                  checked={!requiresApproval}
                  onChange={() => setRequiresApproval(false)}
                  className="text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  requiresApproval
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50/30 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                      Yêu cầu phê duyệt từ Quản lý
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400">
                      Thành viên nhập mã sẽ vào hàng đợi chờ bạn xác nhận trước khi vào.
                    </div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="approvalMode"
                  checked={requiresApproval}
                  onChange={() => setRequiresApproval(true)}
                  className="text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* 3. Member Permissions */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-2.5">
              Quyền hạn của thành viên
            </label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    Cho phép thành viên đăng bài lên Bảng tin
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-neutral-500">
                    Nếu tắt, chỉ bạn mới có quyền đăng bài; thành viên chỉ được bình luận.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowMemberPost(!allowMemberPost)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    allowMemberPost ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      allowMemberPost ? 'left-5.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    Cho phép thành viên chia sẻ học liệu & tài liệu
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-neutral-500">
                    Học viên có thể tải tài liệu ôn tập và chia sẻ liên kết trong lớp.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowMemberUpload(!allowMemberUpload)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    allowMemberUpload ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      allowMemberUpload ? 'left-5.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 4. Custom Code */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 dark:text-zinc-200 mb-1.5">
              Mã tham gia tùy chỉnh (tùy chọn)
            </label>
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="VD: K48-AI (Để trống hệ thống sẽ tự sinh ngẫu nhiên CLS-XXXX)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-between">
            <Link
              href="/personal/groups"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-700 dark:text-zinc-300 text-xs font-semibold"
            >
              Hủy bỏ
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !trimmedName}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-blue-500/25 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Khởi tạo không gian ngay</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Preview Panel (Right - 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between pb-3 mb-4">
              <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider font-mono">
                XEM TRƯỚC THẺ KHÔNG GIAN
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 font-mono">
                LIVE PREVIEW
              </span>
            </div>

            {/* Simulated Group Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
              <div className="p-4 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent dark:from-blue-950/30 dark:via-indigo-950/20">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-2xs bg-blue-600 text-white">
                  {previewMonogram}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-zinc-800/90 text-neutral-800 dark:text-zinc-200 border border-slate-200/60 dark:border-zinc-700">
                    Lớp / Nhóm học tập
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Quản lý
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {previewName}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-2">
                  {description.trim() || 'Chưa có mô tả mục tiêu học tập.'}
                </p>

                <div className="pt-3 mt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
                  <span>1 thành viên (Bạn)</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Vào không gian &rarr;</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>
                Không gian lớp cá nhân giúp bạn chủ động tổ chức học liệu, giao đề luyện thi và quản trị các thành viên học tập cùng nhau.
              </span>
            </div>
          </div>

          {/* Business Isolation Notice */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40 text-xs text-slate-500 dark:text-neutral-400 space-y-1.5 leading-relaxed">
            <div className="font-bold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Phân định không gian NEXA</span>
            </div>
            <p className="text-[11px]">
              Tạo lớp cá nhân không biến tài khoản của bạn thành tổ chức Business. Các đợt đánh giá doanh nghiệp và báo cáo tập thể được vận hành độc lập tại Không gian Tổ chức.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
