'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export interface ExamCountdownClockProps {
  initialSeconds: number;
  isDisabled?: boolean;
  isPaused?: boolean;
  isPreview?: boolean;
  durationMinutes?: number;
  extendedSeconds?: number;
  onTick?: (remainingSeconds: number) => void;
  onExpire?: () => void;
}

export function ExamCountdownClock({
  initialSeconds,
  isDisabled = false,
  isPaused = false,
  isPreview = false,
  durationMinutes = 45,
  extendedSeconds = 0,
  onTick,
  onExpire,
}: ExamCountdownClockProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(initialSeconds);
  const prevInitialRef = useRef<number>(initialSeconds);
  const prevExtendedRef = useRef<number>(extendedSeconds);

  // Sync initialSeconds when changed (e.g. after assessment loaded from server)
  useEffect(() => {
    if (initialSeconds !== prevInitialRef.current) {
      prevInitialRef.current = initialSeconds;
      setTimeRemaining(initialSeconds);
      onTick?.(initialSeconds);
    }
  }, [initialSeconds, onTick]);

  // Handle extendedSeconds delta from room broadcast
  useEffect(() => {
    if (extendedSeconds !== prevExtendedRef.current) {
      const delta = extendedSeconds - prevExtendedRef.current;
      prevExtendedRef.current = extendedSeconds;
      if (delta > 0) {
        setTimeRemaining((prev) => {
          const next = prev + delta;
          onTick?.(next);
          return next;
        });
      }
    }
  }, [extendedSeconds, onTick]);

  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Internal 1-second interval
  const isExpired = timeRemaining <= 0;

  useEffect(() => {
    if (isDisabled || isPaused || isPreview || isExpired) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpireRef.current?.();
          return 0;
        }
        const next = prev - 1;
        onTickRef.current?.(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDisabled, isPaused, isPreview, isExpired]);

  const isLowTime = timeRemaining < 300 && !isPreview;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold tabular-nums transition-colors ${
        isLowTime
          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 animate-pulse'
          : 'bg-slate-100 dark:bg-zinc-800 border-slate-200/80 dark:border-zinc-700 text-slate-800 dark:text-neutral-200'
      }`}
    >
      <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
      <span>{isPreview ? `${durationMinutes} phút` : formatTime(timeRemaining)}</span>
    </div>
  );
}
