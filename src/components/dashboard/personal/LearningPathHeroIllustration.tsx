'use client';

import React from 'react';

export function LearningPathHeroIllustration() {
  return (
    <div className="relative w-64 sm:w-72 h-48 sm:h-52 select-none flex items-center justify-center shrink-0">
      <svg
        viewBox="0 0 320 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm pointer-events-none"
      >
        <defs>
          <radialGradient id="lp-glow-main" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="lp-body-grad" x1="80" y1="30" x2="220" y2="170" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          <linearGradient id="lens-gloss" x1="160" y1="70" x2="240" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EFF6FF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.45" />
          </linearGradient>

          <linearGradient id="rim-blue" x1="150" y1="60" x2="250" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          <linearGradient id="shield-emerald" x1="220" y1="120" x2="280" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <filter id="lp-sh" x="-15%" y="-15%" width="130%" height="140%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#1E3A8A" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Ambient Glow */}
        <circle cx="160" cy="120" r="115" fill="url(#lp-glow-main)" />

        {/* Left Floating Documents */}
        <g filter="url(#lp-sh)" transform="rotate(-12 60 70)">
          <rect x="30" y="50" width="55" height="42" rx="8" fill="#3B82F6" />
          <circle cx="45" cy="71" r="7" fill="#93C5FD" />
          <rect x="58" y="66" width="20" height="4" rx="2" fill="#FFFFFF" />
          <rect x="58" y="74" width="14" height="3" rx="1.5" fill="#BFDBFE" />
        </g>

        <g filter="url(#lp-sh)" transform="rotate(8 70 160)">
          <rect x="45" y="145" width="48" height="38" rx="8" fill="#FFFFFF" />
          <circle cx="59" cy="164" r="6" fill="#60A5FA" />
          <rect x="69" y="160" width="16" height="3.5" rx="1.75" fill="#94A3B8" />
          <rect x="69" y="166" width="11" height="3" rx="1.5" fill="#CBD5E1" />
        </g>

        {/* 3D Laptop */}
        <g filter="url(#lp-sh)">
          {/* Screen Outer Lid */}
          <rect x="75" y="42" width="160" height="110" rx="14" fill="url(#lp-body-grad)" />
          {/* Screen Inner Bezel */}
          <rect x="82" y="49" width="146" height="96" rx="10" fill="#0F172A" />
          {/* Screen White Display */}
          <rect x="86" y="53" width="138" height="88" rx="7" fill="#FFFFFF" />

          {/* Browser UI Bar */}
          <rect x="98" y="62" width="114" height="14" rx="7" fill="#F1F5F9" />
          <circle cx="106" cy="69" r="3.5" fill="#3B82F6" />
          <rect x="115" y="67" width="55" height="4" rx="2" fill="#94A3B8" />

          {/* Content Layout on Screen */}
          <rect x="98" y="83" width="34" height="42" rx="5" fill="#DBEAFE" />
          <rect x="104" y="90" width="22" height="3.5" rx="1.75" fill="#3B82F6" />
          <rect x="104" y="97" width="16" height="3" rx="1.5" fill="#60A5FA" />

          <rect x="140" y="83" width="72" height="8" rx="3.5" fill="#E2E8F0" />
          <rect x="140" y="95" width="62" height="6" rx="3" fill="#F1F5F9" />
          <rect x="140" y="104" width="68" height="6" rx="3" fill="#F1F5F9" />
          <rect x="140" y="113" width="45" height="6" rx="3" fill="#F1F5F9" />

          {/* Laptop Base Deck */}
          <path d="M50 152 L260 152 L238 168 L72 168 Z" fill="#CBD5E1" />
          <rect x="135" y="154" width="38" height="8" rx="2.5" fill="#94A3B8" opacity="0.6" />
        </g>

        {/* Big 3D Magnifying Glass (Center-Right) */}
        <g filter="url(#lp-sh)">
          {/* Lens Glass */}
          <circle cx="200" cy="110" r="38" fill="url(#lens-gloss)" />
          {/* Lens Rim Ring */}
          <circle cx="200" cy="110" r="38" stroke="url(#rim-blue)" strokeWidth="8" fill="none" />
          {/* Inner White Shine Highlight */}
          <circle cx="200" cy="110" r="33" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.75" fill="none" />
          <path d="M180 88 A26 26 0 0 1 220 88" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.85" />

          {/* Handle extending down-right */}
          <path d="M228 138 L262 176" stroke="#1E40AF" strokeWidth="13" strokeLinecap="round" />
          <path d="M230 140 L260 174" stroke="#3B82F6" strokeWidth="7" strokeLinecap="round" />
        </g>

        {/* 3D Green Security Shield (Far Right) */}
        <g filter="url(#lp-sh)" transform="translate(225, 118)">
          <path d="M22 6 L42 14 C42 32 22 46 22 46 C22 46 2 32 2 14 Z" fill="url(#shield-emerald)" />
          <path d="M22 9 L38 15 C38 30 22 41 22 41 Z" fill="#FFFFFF" opacity="0.25" />
          <path d="M14 23 L20 29 L31 18" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Floating Spheres */}
        <circle cx="80" cy="35" r="7" fill="#93C5FD" opacity="0.8" />
        <circle cx="265" cy="55" r="9" fill="#60A5FA" opacity="0.65" />
        <circle cx="280" cy="95" r="5" fill="#3B82F6" opacity="0.7" />
      </svg>
    </div>
  );
}
