'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to animate a number from its previous value (or 0) to endValue
 * using requestAnimationFrame and quadratic ease-out.
 */
export function useCountUp(endValue: number, duration: number = 900): number {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const prevValueRef = useRef<number>(0);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const diff = endValue - startValue;

    if (diff === 0) {
      setDisplayValue(endValue);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out quad: f(t) = 1 - (1 - t)^2
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      const current = Math.round(startValue + diff * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        prevValueRef.current = endValue;
        setDisplayValue(endValue);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [endValue, duration]);

  return displayValue;
}
