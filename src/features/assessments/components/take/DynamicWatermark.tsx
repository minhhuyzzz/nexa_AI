'use client';

import React from 'react';

interface DynamicWatermarkProps {
  candidateEmail?: string;
  candidateId?: string;
  assessmentCode?: string;
  enabled?: boolean;
}

export function DynamicWatermark({
  candidateEmail,
  candidateId,
  assessmentCode,
  enabled = false,
}: DynamicWatermarkProps) {
  if (!enabled) return null;

  const dateStr = new Date().toLocaleDateString('vi-VN');
  const watermarkText = `${candidateEmail || candidateId || 'NEXA CANDIDATE'} • ${assessmentCode || 'EXAM'} • ${dateStr}`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none fixed inset-0 z-30 overflow-hidden opacity-[0.045] dark:opacity-[0.03] text-neutral-900 dark:text-neutral-100 font-mono text-xs font-bold leading-none"
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="watermark-pattern"
            width="320"
            height="180"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-25)"
          >
            <text x="20" y="50" fill="currentColor">
              {watermarkText}
            </text>
            <text x="140" y="140" fill="currentColor">
              {watermarkText}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#watermark-pattern)" />
      </svg>
    </div>
  );
}
