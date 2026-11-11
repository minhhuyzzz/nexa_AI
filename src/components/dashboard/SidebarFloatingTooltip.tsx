'use client';

export interface TooltipState {
  name: string;
  top: number;
}

export function SidebarFloatingTooltip({ tooltip }: { tooltip: TooltipState | null }) {
  if (!tooltip) return null;

  return (
    <div
      className="fixed z-50 px-2.5 py-1 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[11px] font-medium shadow-md pointer-events-none -translate-y-1/2 left-[72px] transition-all duration-150 animate-in fade-in-0 zoom-in-95 whitespace-nowrap"
      style={{ top: tooltip.top }}
    >
      {tooltip.name}
      {/* Left indicator arrow */}
      <span className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-neutral-900 dark:border-r-white" />
    </div>
  );
}
