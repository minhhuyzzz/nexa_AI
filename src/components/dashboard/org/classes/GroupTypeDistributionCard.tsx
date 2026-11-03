'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import type { OrgClassItem } from './types';

interface GroupTypeDistributionCardProps {
  classes: OrgClassItem[];
}

export function GroupTypeDistributionCard({ classes }: GroupTypeDistributionCardProps) {
  const total = classes.length || 1;

  const classCount = classes.filter((c) => c.groupType === 'CLASS').length;
  const deptCount = classes.filter((c) => c.groupType === 'DEPARTMENT').length;
  const projectCount = classes.filter((c) => c.groupType === 'PROJECT_GROUP').length;

  const classPct = Math.round((classCount / total) * 100);
  const deptPct = Math.round((deptCount / total) * 100);
  const projectPct = Math.max(0, 100 - classPct - deptPct);

  // SVG Donut calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const classStroke = (classPct / 100) * circumference;
  const deptStroke = (deptPct / 100) * circumference;
  const projectStroke = (projectPct / 100) * circumference;

  const classOffset = 0;
  const deptOffset = -classStroke;
  const projectOffset = -(classStroke + deptStroke);

  return (
    <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 rounded-md p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-zinc-800">
        <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
          Phân bổ loại nhóm
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
        {/* Donut graphic */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-slate-100 dark:stroke-zinc-800"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Class segment (Blue) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-blue-600 dark:stroke-blue-500 transition-all duration-500"
              strokeWidth="12"
              strokeDasharray={`${classStroke} ${circumference}`}
              strokeDashoffset={classOffset}
              fill="transparent"
            />
            {/* Dept segment (Purple) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-purple-600 dark:stroke-purple-500 transition-all duration-500"
              strokeWidth="12"
              strokeDasharray={`${deptStroke} ${circumference}`}
              strokeDashoffset={deptOffset}
              fill="transparent"
            />
            {/* Project segment (Emerald) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-emerald-500 dark:stroke-emerald-400 transition-all duration-500"
              strokeWidth="12"
              strokeDasharray={`${projectStroke} ${circumference}`}
              strokeDashoffset={projectOffset}
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 leading-none">
              {classes.length}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-none">
              lớp & nhóm
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 w-full text-xs font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <span className="text-slate-700 dark:text-zinc-300 font-sans">Lớp học</span>
            </div>
            <span className="text-neutral-900 dark:text-neutral-100 tabular-nums">
              {classCount} ({classPct}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
              <span className="text-slate-700 dark:text-zinc-300 font-sans">Phòng ban</span>
            </div>
            <span className="text-neutral-900 dark:text-neutral-100 tabular-nums">
              {deptCount} ({deptPct}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-700 dark:text-zinc-300 font-sans">Nhóm dự án</span>
            </div>
            <span className="text-neutral-900 dark:text-neutral-100 tabular-nums">
              {projectCount} ({projectPct}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
