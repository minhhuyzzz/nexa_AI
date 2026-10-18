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

  // Primary facet colors
  const primaryFill = isWhite ? '#FFFFFF' : isAccent ? '#0284C7' : '#0F172A';
  const shadowFill = isWhite ? '#94A3B8' : isAccent ? '#0369A1' : '#334155';
  const textColor = isWhite ? 'text-white' : 'text-slate-900';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Isometric 3D 'N' Emblem */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200"
      >
        {/* Left Vertical 3D Column */}
        {/* Front Face */}
        <polygon
          points="18,36 36,33 26,76 8,79"
          fill={primaryFill}
        />
        {/* Top/Side Extrusion Facet */}
        <polygon
          points="8,79 26,76 34,84 16,87"
          fill={shadowFill}
        />
        <polygon
          points="18,36 26,34 36,33 28,35"
          fill={shadowFill}
        />

        {/* Right Chevron & Diagonal 3D Ribbon */}
        {/* Top Horizontal Hook */}
        <polygon
          points="52,28 88,24 88,30 54,34"
          fill={primaryFill}
        />
        {/* Main Folding Ribbon (Diagonal Down-stroke) */}
        <polygon
          points="52,28 66,31 46,75 32,72"
          fill={primaryFill}
        />
        {/* Lower Right Fold / Return */}
        <polygon
          points="46,75 72,71 72,77 46,81"
          fill={primaryFill}
        />
        {/* Inner 3D Extruded Shadow Facet */}
        <polygon
          points="54,34 66,31 46,75 34,78"
          fill={shadowFill}
        />
      </svg>

      {/* Refined Bespoke Geometric Wordmark */}
      {showText && variant !== 'icon' && (
        <span
          className={`font-extrabold tracking-[0.18em] uppercase ${textSize} ${textColor} leading-none flex items-center`}
          style={{ letterSpacing: '0.15em' }}
        >
          NEXA
          <span className="text-sky-600 font-bold ml-0.5">.</span>
        </span>
      )}
    </div>
  );
}

export default NexaLogo;
