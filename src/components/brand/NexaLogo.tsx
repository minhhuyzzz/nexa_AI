import React from 'react';

interface NexaLogoProps {
  variant?: 'dark' | 'white' | 'icon' | 'accent';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showText?: boolean;
}

export function NexaLogo({
  variant = 'dark',
  size = 'md',
  className = '',
  showText = true,
}: NexaLogoProps) {
  // Size presets
  const sizeMap: Record<string, { h: number; iconSize: number; textSize: string }> = {
    xs: { h: 18, iconSize: 18, textSize: 'text-sm' },
    sm: { h: 24, iconSize: 24, textSize: 'text-base' },
    md: { h: 32, iconSize: 30, textSize: 'text-xl' },
    lg: { h: 40, iconSize: 38, textSize: 'text-2xl' },
    xl: { h: 48, iconSize: 46, textSize: 'text-3xl' },
  };

  const isNumeric = typeof size === 'number';
  const iconSize = isNumeric ? size : (sizeMap[size] || sizeMap.md).iconSize;
  const textSize = isNumeric ? 'text-lg' : (sizeMap[size] || sizeMap.md).textSize;

  const isWhite = variant === 'white';
  const isAccent = variant === 'accent';

  // Razor Nexus N colors
  const pillarClass = isWhite
    ? 'fill-white'
    : isAccent
    ? 'fill-blue-600'
    : 'fill-neutral-900 dark:fill-white';
  const beamClass = isWhite
    ? 'fill-blue-400'
    : isAccent
    ? 'fill-blue-800'
    : 'fill-blue-600 dark:fill-blue-400';
  const textColor = isWhite ? 'text-white' : 'text-neutral-900 dark:text-neutral-100';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Razor Nexus 'N' Emblem: Dual Pillars + Dynamic Cobalt Diagonal */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200"
      >
        {/* Left Pillar: Diagnostic Baseline & Evidence */}
        <rect x="18" y="18" width="16" height="64" rx="2" className={pillarClass} />
        {/* Right Pillar: Competency Benchmark & Mastery */}
        <rect x="66" y="18" width="16" height="64" rx="2" className={pillarClass} />
        {/* Dynamic Diagonal Beam: AI Learning Pathway & Ascent */}
        <polygon points="34,18 50,18 66,82 50,82" className={beamClass} />
      </svg>

      {/* Refined Bespoke Geometric Wordmark */}
      {showText && variant !== 'icon' && (
        <span
          className={`font-extrabold tracking-[0.16em] uppercase ${textSize} ${textColor} leading-none flex items-center`}
          style={{ letterSpacing: '0.15em' }}
        >
          NEXA
          <span className="text-blue-600 dark:text-blue-400 font-bold ml-0.5">.</span>
        </span>
      )}
    </div>
  );
}

export default NexaLogo;
