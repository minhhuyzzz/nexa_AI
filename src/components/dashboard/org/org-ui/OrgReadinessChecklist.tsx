import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

interface OrgReadinessChecklistProps {
  orgSlug: string;
  isBrandNew: boolean;
  classesCount: number;
  membersCount: number;
  publishedAssessmentsCount: number;
  campaignsCount: number;
  isActiveEntitlement: boolean;
}

export function OrgReadinessChecklist({
  orgSlug,
  isBrandNew,
  classesCount = 0,
  membersCount = 0,
  publishedAssessmentsCount = 0,
  campaignsCount = 0,
  isActiveEntitlement = false,
}: OrgReadinessChecklistProps) {
  const steps = [
    {
      title: 'Tạo lớp và thêm thành viên',
      isDone: classesCount > 0 && membersCount > 1,
      href: `/org/${orgSlug}/classes`,
      description: 'Phân bổ học viên theo lớp để sẵn sàng giao bài',
    },
    {
      title: 'Xây dựng ngân hàng đề',
      isDone: publishedAssessmentsCount > 0,
      href: `/org/${orgSlug}/assessments`,
      description: 'Chuẩn bị đề thi đánh giá năng lực 5 miền',
    },
    {
      title: 'Phát hành đợt đánh giá',
      isDone: campaignsCount > 0,
      href: `/org/${orgSlug}/campaigns`,
      description: 'Thiết lập kỳ khảo thí và phân công người chấm',
    },
    {
      title: 'Quyền lợi & hạn mức gói Business',
      isDone: isActiveEntitlement,
      href: `/org/${orgSlug}/plan`,
      description: 'Xem thông tin quyền lợi và quota AI cấp cho đơn vị',
    },
  ];

  return (
    <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col justify-between h-full">
      <div className="p-4 border-b border-slate-100 dark:border-zinc-800/80">
        <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
          {isBrandNew ? 'Bắt đầu vận hành NEXA' : 'Mức độ sẵn sàng vận hành'}
        </h2>
        <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
          {isBrandNew
            ? 'Thiết lập một lần, dùng xuyên suốt các đợt khảo thí'
            : 'Các hạng mục thiết yếu cho chu trình đánh giá của đơn vị'}
        </p>
      </div>

      <div className="p-4 divide-y divide-slate-100 dark:divide-zinc-850 flex-1">
        {steps.map((step, idx) => {
          const stepNumber = String(idx + 1).padStart(2, '0');
          return (
            <div
              key={step.title}
              className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-mono font-bold border ${
                    step.isDone
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-neutral-500 border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  {step.isDone ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {step.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                    {step.description}
                  </div>
                </div>
              </div>
              <Link
                href={step.href}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 shrink-0 transition-colors"
              >
                <span>{step.isDone ? 'Xem' : 'Thiết lập'}</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </Link>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30 text-[11px] text-slate-500 dark:text-neutral-400">
        Chu trình đánh giá khép kín: Lớp &bull; Đề &bull; Đợt &bull; Chấm &bull; Báo cáo 5 miền
      </div>
    </div>
  );
}
