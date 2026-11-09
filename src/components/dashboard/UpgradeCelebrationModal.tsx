'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  Award,
  Zap,
} from 'lucide-react';
import { CelebrationCanvas } from '@/components/ui/CelebrationCanvas';

export interface UpgradeCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'PERSONAL_PRO' | 'ORG_BUSINESS';
  planName?: string;
  targetName?: string;
  seats?: number;
  credits?: number;
  primaryActionUrl?: string;
  primaryActionLabel?: string;
}

export function UpgradeCelebrationModal({
  isOpen,
  onClose,
  type,
  planName = type === 'PERSONAL_PRO' ? 'NEXA PRO' : 'Gói Business B2B',
  targetName,
  seats = 500,
  credits = 5000,
  primaryActionUrl = type === 'PERSONAL_PRO' ? '/personal/dashboard' : '/admin/organizations',
  primaryActionLabel = type === 'PERSONAL_PRO' ? 'Bắt đầu trải nghiệm ngay' : 'Vào quản trị tổ chức',
}: UpgradeCelebrationModalProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  if (!isOpen) return null;

  const isPersonal = type === 'PERSONAL_PRO';

  const personalPerks = [
    {
      icon: <Award className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />,
      title: 'Mở khóa toàn diện bài khảo thí',
      desc: 'Làm không giới hạn các bài đánh giá chuẩn hóa và nhận chứng nhận số.',
    },
    {
      icon: <Zap className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={1.75} />,
      title: 'Lộ trình AI cá nhân hóa 5 miền',
      desc: 'AI Mentor tự động phân tích khoảng trống và đề xuất học liệu tối ưu.',
    },
    {
      icon: <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />,
      title: `${credits.toLocaleString('vi-VN')} AI Credits ưu tiên`,
      desc: 'Tăng tốc độ xử lý chấm bài tự động và tương tác đa phương tiện.',
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />,
      title: 'Huy hiệu PRO độc quyền',
      desc: 'Ghi nhận vị thế người học năng lực số chuyên nghiệp trên hồ sơ.',
    },
  ];

  const businessPerks = [
    {
      icon: <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />,
      title: `Hạn mức ${seats.toLocaleString('vi-VN')} chỗ ngồi thành viên`,
      desc: 'Sẵn sàng mở rộng lớp học, phòng ban và tài khoản học viên chính thức.',
    },
    {
      icon: <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />,
      title: 'Đợt khảo thí & Chấm thi không giới hạn',
      desc: 'Tổ chức các kỳ thi tập trung, chấm bài tự luận và trắc nghiệm thời gian thực.',
    },
    {
      icon: <Zap className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={1.75} />,
      title: `${credits.toLocaleString('vi-VN')} AI Business Credits`,
      desc: 'Hỗ trợ khảo thí thông minh và tổng hợp báo cáo phân tích toàn đơn vị.',
    },
    {
      icon: <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />,
      title: 'Phân quyền tổ chức độc lập',
      desc: 'Cách ly dữ liệu an toàn, phân chia vai trò Quản trị viên và Khảo thí viên.',
    },
  ];

  const perks = isPersonal ? personalPerks : businessPerks;

  return (
    <>
      {showConfetti && <CelebrationCanvas onComplete={() => setShowConfetti(false)} />}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-6 text-neutral-900 dark:text-neutral-100">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-neutral-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Badge & Title */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide font-mono shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
              <span>{isPersonal ? 'THĂNG HẠNG TÀI KHOẢN' : 'MỞ KHÓA TỔ CHỨC B2B'}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              {isPersonal ? 'Chào mừng bạn đến với NEXA PRO!' : 'Kích hoạt thành công Gói Business!'}
            </h2>

            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
              {targetName ? (
                <>
                  Tài khoản <strong>{targetName}</strong> đã được nâng cấp lên <strong>{planName}</strong> với đầy đủ đặc quyền cao cấp.
                </>
              ) : (
                <>
                  Gói dịch vụ <strong>{planName}</strong> đã được kích hoạt thành công trên hệ thống NEXA AI.
                </>
              )}
            </p>
          </div>

          {/* Unlocked Perks List */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider font-mono block">
              QUYỀN LỢI MỚI MỞ KHÓA
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {perks.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-white dark:bg-[#111114] border border-slate-200/80 dark:border-zinc-800/80 flex items-start gap-2.5 shadow-2xs"
                >
                  <div className="p-1 rounded-md bg-slate-100 dark:bg-zinc-800 shrink-0 mt-0.5">
                    {p.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                      {p.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 leading-normal line-clamp-2">
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            <Link
              href={primaryActionUrl}
              onClick={onClose}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <span>{primaryActionLabel}</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Đóng thông báo
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
