import React from 'react';

interface OrgKpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext: React.ReactNode;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  valueColor?: string;
}

export function OrgKpiCard({
  label,
  value,
  unit,
  subtext,
  icon: Icon,
  valueColor = 'text-neutral-900 dark:text-neutral-100',
}: OrgKpiCardProps) {
  return (
    <div className="p-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500 font-medium uppercase tracking-wider font-mono">
          <span>{label}</span>
          <Icon className="w-4 h-4 text-slate-400 dark:text-neutral-500" strokeWidth={1.75} />
        </div>
        <div className={`text-2xl font-bold font-mono mt-2 tabular-nums ${valueColor}`}>
          {value} {unit && <span className="text-sm font-normal text-slate-400 dark:text-neutral-500">{unit}</span>}
        </div>
      </div>
      <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2">
        {subtext}
      </div>
    </div>
  );
}
