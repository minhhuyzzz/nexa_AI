'use client';

import React from 'react';

interface OfficialRedSealProps {
  className?: string;
  size?: number;
  sealText?: string;
  customSvgData?: string | null;
}

export function OfficialRedSeal({
  className = '',
  size = 110,
  sealText = 'DIGITAL COMPETENCE ASSESSMENT COUNCIL',
  customSvgData,
}: OfficialRedSealProps) {
  // If custom SVG uploaded
  if (customSvgData) {
    return (
      <div
        className={`relative inline-block select-none pointer-events-none rotate-[-10deg] ${className}`}
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: customSvgData }}
      />
    );
  }

  return (
    <div
      className={`relative inline-block select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
      aria-label="Con dấu mộc đỏ chính thức Hội đồng Khảo thí NEXA AI"
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="w-full h-full text-red-600 dark:text-red-500 opacity-90 drop-shadow-2xs rotate-[-10deg]"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Circular Path for Top Text */}
          <path
            id="sealTextTop"
            d="M 25, 100 A 75, 75 0 1, 1 175, 100"
            fill="none"
          />
          {/* Circular Path for Bottom Text */}
          <path
            id="sealTextBottom"
            d="M 175, 100 A 75, 75 0 0, 1 25, 100"
            fill="none"
          />
        </defs>

        {/* Outer Solid Circle */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
        />

        {/* Outer Dotted / Beaded Ring */}
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="3, 3"
        />

        {/* Inner Solid Circle */}
        <circle
          cx="100"
          cy="100"
          r="62"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Top Arc Text */}
        <text
          fontSize="11.5"
          fontWeight="bold"
          letterSpacing="2.2"
          fill="currentColor"
          textAnchor="middle"
        >
          <textPath href="#sealTextTop" startOffset="50%">
            {sealText}
          </textPath>
        </text>

        {/* Bottom Arc Text: ★ NEXA AI PLATFORM ★ */}
        <text
          fontSize="11"
          fontWeight="bold"
          letterSpacing="2.5"
          fill="currentColor"
          textAnchor="middle"
        >
          <textPath href="#sealTextBottom" startOffset="50%">
            ★ NEXA AI PLATFORM ★
          </textPath>
        </text>

        {/* Center Emblem: Star & Official Certification Text */}
        <g transform="translate(100, 100)">
          {/* Center Star */}
          <polygon
            points="0,-24 7,-8 24,-8 11,3 16,19 0,9 -16,19 -11,3 -24,-8 -7,-8"
            fill="currentColor"
            opacity="0.95"
          />

          {/* Center Official Ribbon / Badge Text */}
          <text
            y="26"
            fontSize="9.5"
            fontWeight="bold"
            letterSpacing="1.2"
            fill="currentColor"
            textAnchor="middle"
          >
            OFFICIAL SEAL
          </text>
          <text
            y="38"
            fontSize="7"
            fontWeight="600"
            letterSpacing="1.5"
            fill="currentColor"
            textAnchor="middle"
            opacity="0.85"
          >
            ★ VERIFIED ★
          </text>
        </g>
      </svg>
    </div>
  );
}
