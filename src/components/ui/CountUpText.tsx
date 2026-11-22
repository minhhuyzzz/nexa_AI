'use client';

import React from 'react';
import { useCountUp } from '@/hooks/useCountUp';

export interface CountUpTextProps {
  value: number;
  duration?: number;
  className?: string;
  format?: (value: number) => string | number;
}

export function CountUpText({
  value,
  duration = 900,
  className,
  format,
}: CountUpTextProps) {
  const animatedValue = useCountUp(value, duration);
  const display = format ? format(animatedValue) : animatedValue;

  if (className) {
    return <span className={className}>{display}</span>;
  }

  return <>{display}</>;
}
