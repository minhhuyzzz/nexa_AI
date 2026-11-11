'use client';

import { Sparkles, ChevronRight, MessageSquareHeart } from 'lucide-react';

interface SidebarFeedbackCardProps {
  isCollapsed: boolean;
  onOpenFeedback: () => void;
  title?: string;
  description?: string;
  onHoverTooltip?: (tooltip: { name: string; top: number } | null) => void;
}

export function SidebarFeedbackCard({
  isCollapsed,
  onOpenFeedback,
  title = 'Đóng góp ý kiến',
  description = 'Ý kiến của bạn giúp NEXA ngày một hoàn thiện hơn.',
  onHoverTooltip,
}: SidebarFeedbackCardProps) {
  if (isCollapsed) {
    return (
      <div className="flex justify-center p-2 shrink-0">
        <button
          type="button"
          onClick={onOpenFeedback}
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            onHoverTooltip?.({ name: title, top: rect.top + rect.height / 2 });
          }}
          onMouseLeave={() => onHoverTooltip?.(null)}
          className="w-10 h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 flex items-center justify-center transition-all duration-150 shadow-xs group relative cursor-pointer"
          title={title}
          aria-label={title}
        >
          <Sparkles className="w-4 h-4 transition-transform group-hover:scale-110" strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 shrink-0">
      <button
        type="button"
        onClick={onOpenFeedback}
        className="w-full text-left relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-br from-blue-600 to-blue-700 text-white border border-blue-500/80 dark:from-blue-900/90 dark:to-blue-950 dark:border-blue-800/80 shadow-xs hover:from-blue-700 hover:to-blue-800 hover:shadow-md transition-all duration-200 group cursor-pointer"
      >
        {/* Subtle decorative watermark icon */}
        <MessageSquareHeart
          className="w-16 h-16 text-white/10 dark:text-white/5 absolute -right-3 -bottom-3 pointer-events-none group-hover:scale-110 transition-transform"
          strokeWidth={1.25}
        />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/20 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
            </div>
            <span className="text-xs font-semibold text-white tracking-tight">
              {title}
            </span>
          </div>
          <ChevronRight
            className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0"
            strokeWidth={2}
          />
        </div>

        {/* Card Description */}
        <p className="text-[11px] text-blue-100/90 dark:text-blue-200/80 leading-relaxed mb-2 relative z-10">
          {description}
        </p>

        {/* Interactive Click Hint */}
        <div className="relative z-10 flex items-center gap-1 text-[10px] font-semibold text-blue-200 group-hover:text-white transition-colors">
          <span>Nhấn để đóng góp ý kiến</span>
          <span>&rarr;</span>
        </div>
      </button>
    </div>
  );
}
