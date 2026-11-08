'use client';

import React from 'react';

// MIỀN 1: TÌM KIẾM, ĐÁNH GIÁ & QUẢN LÝ THÔNG TIN
export function Domain1Illustration3D() {
  return (
    <div className="relative w-full h-36 flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 200 140" fill="none" className="w-full h-full drop-shadow-md">
        <defs>
          <radialGradient id="d1-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="d1-cube-top" x1="60" y1="30" x2="140" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
          <linearGradient id="d1-cube-left" x1="50" y1="60" x2="100" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="d1-cube-right" x1="100" y1="60" x2="150" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          <linearGradient id="d1-glass" x1="110" y1="20" x2="170" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#BFDBFE" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="70" r="60" fill="url(#d1-glow)" />
        {/* Isometric Data Base */}
        <path d="M100 40 L145 62 L100 85 L55 62 Z" fill="url(#d1-cube-top)" />
        <path d="M55 62 L100 85 L100 115 L55 92 Z" fill="url(#d1-cube-left)" />
        <path d="M100 85 L145 62 L145 92 L100 115 Z" fill="url(#d1-cube-right)" />
        {/* Floating Search Disc / Lens */}
        <circle cx="130" cy="50" r="22" fill="url(#d1-glass)" stroke="#60A5FA" strokeWidth="2.5" />
        <line x1="145" y1="65" x2="165" y2="85" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
        {/* Floating Data Nodes */}
        <circle cx="50" cy="40" r="5" fill="#60A5FA" className="animate-pulse" />
        <circle cx="155" cy="30" r="4" fill="#93C5FD" />
        <circle cx="60" cy="110" r="3" fill="#3B82F6" />
      </svg>
    </div>
  );
}

// MIỀN 2: GIAO TIẾP & HỢP TÁC
export function Domain2Illustration3D() {
  return (
    <div className="relative w-full h-36 flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 200 140" fill="none" className="w-full h-full drop-shadow-md">
        <defs>
          <radialGradient id="d2-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="d2-node-a" x1="50" y1="40" x2="90" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="d2-node-b" x1="110" y1="30" x2="160" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="d2-node-c" x1="80" y1="70" x2="130" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="70" r="60" fill="url(#d2-glow)" />
        {/* Connection Network Lines */}
        <path d="M70 60 L135 50 L105 95 Z" stroke="#A7F3D0" strokeWidth="2.5" strokeDasharray="4 3" />
        {/* 3D Floating Avatar Nodes */}
        <g transform="translate(68, 58)">
          <circle cx="0" cy="0" r="18" fill="url(#d2-node-a)" />
          <circle cx="0" cy="-4" r="6" fill="#FFFFFF" />
          <path d="M-9 10 Q0 3 9 10" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
        <g transform="translate(135, 48)">
          <circle cx="0" cy="0" r="22" fill="url(#d2-node-b)" />
          <circle cx="0" cy="-5" r="7" fill="#FFFFFF" />
          <path d="M-11 12 Q0 4 11 12" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
        <g transform="translate(105, 95)">
          <circle cx="0" cy="0" r="16" fill="url(#d2-node-c)" />
          <circle cx="0" cy="-3" r="5" fill="#FFFFFF" />
          <path d="M-8 8 Q0 2 8 8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
        {/* Chat / Ping Signals */}
        <circle cx="155" cy="30" r="4" fill="#34D399" className="animate-ping" />
      </svg>
    </div>
  );
}

// MIỀN 3: SÁNG TẠO NỘI DUNG SỐ
export function Domain3Illustration3D() {
  return (
    <div className="relative w-full h-36 flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 200 140" fill="none" className="w-full h-full drop-shadow-md">
        <defs>
          <radialGradient id="d3-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="d3-bulb" x1="80" y1="20" x2="120" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="d3-pen" x1="120" y1="40" x2="160" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="70" r="60" fill="url(#d3-glow)" />
        {/* Isometric Creative Canvas */}
        <path d="M90 55 L140 75 L95 95 L45 75 Z" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="1.5" />
        {/* 3D Glowing Bulb / AI Core */}
        <g transform="translate(85, 35)">
          <circle cx="15" cy="15" r="16" fill="url(#d3-bulb)" />
          <rect x="11" y="31" width="8" height="6" rx="2" fill="#B45309" />
          {/* AI Sparkles */}
          <path d="M15 0 L17 6 L23 8 L17 10 L15 16 L13 10 L7 8 L13 6 Z" fill="#FFFFFF" />
        </g>
        {/* 3D Stylus / Paint Tool */}
        <g transform="rotate(35 130 55)">
          <rect x="115" y="45" width="8" height="35" rx="3" fill="url(#d3-pen)" />
          <polygon points="115,80 123,80 119,88" fill="#78350F" />
        </g>
        {/* Color Palette Dots */}
        <circle cx="55" cy="65" r="4" fill="#3B82F6" />
        <circle cx="70" cy="60" r="4" fill="#EC4899" />
        <circle cx="85" cy="65" r="4" fill="#10B981" />
      </svg>
    </div>
  );
}

// MIỀN 4: AN TOÀN & TRÁCH NHIỆM
export function Domain4Illustration3D() {
  return (
    <div className="relative w-full h-36 flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 200 140" fill="none" className="w-full h-full drop-shadow-md">
        <defs>
          <radialGradient id="d4-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="d4-shield" x1="75" y1="30" x2="125" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          <linearGradient id="d4-lock" x1="90" y1="50" x2="110" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#DDD6FE" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="70" r="60" fill="url(#d4-glow)" />
        {/* Orbital Shield Ring */}
        <ellipse cx="100" cy="75" rx="55" ry="25" stroke="#C4B5FD" strokeWidth="1.5" strokeDasharray="6 4" />
        {/* 3D Cyber Shield */}
        <path
          d="M100 35 Q125 35 130 55 C130 85 100 105 100 105 C100 105 70 85 70 55 Q75 35 100 35 Z"
          fill="url(#d4-shield)"
          stroke="#C4B5FD"
          strokeWidth="2"
        />
        {/* Holographic Lock Core */}
        <g transform="translate(93, 56)">
          <path d="M3 8 V5 C3 2.5 5 0.5 7 0.5 C9 0.5 11 2.5 11 5 V8" stroke="#FFFFFF" strokeWidth="2" fill="none" />
          <rect x="0" y="7" width="14" height="12" rx="3" fill="url(#d4-lock)" />
          <circle cx="7" cy="12" r="1.5" fill="#5B21B6" />
        </g>
        {/* Floating Green Protection Indicator */}
        <circle cx="135" cy="45" r="4" fill="#34D399" />
      </svg>
    </div>
  );
}

// MIỀN 5: NHẬN DIỆN & GIẢI QUYẾT VẤN ĐỀ
export function Domain5Illustration3D() {
  return (
    <div className="relative w-full h-36 flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 200 140" fill="none" className="w-full h-full drop-shadow-md">
        <defs>
          <radialGradient id="d5-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="d5-gear" x1="60" y1="30" x2="120" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="100%" stopColor="#0F766E" />
          </linearGradient>
          <linearGradient id="d5-gear-small" x1="110" y1="65" x2="150" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#115E59" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="70" r="60" fill="url(#d5-glow)" />
        {/* Main 3D Cogwheel */}
        <g transform="translate(85, 60)">
          <circle cx="0" cy="0" r="26" fill="url(#d5-gear)" />
          <circle cx="0" cy="0" r="10" fill="#FFFFFF" opacity="0.9" />
          <circle cx="0" cy="0" r="6" fill="#0F766E" />
          {/* Teeth */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <rect
              key={i}
              x="-4"
              y="-32"
              width="8"
              height="8"
              rx="1.5"
              fill="#2DD4BF"
              transform={`rotate(${angle} 0 0)`}
            />
          ))}
        </g>
        {/* Secondary Interlocking Gear */}
        <g transform="translate(130, 85)">
          <circle cx="0" cy="0" r="16" fill="url(#d5-gear-small)" />
          <circle cx="0" cy="0" r="5" fill="#FFFFFF" />
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <rect
              key={i}
              x="-2.5"
              y="-20"
              width="5"
              height="5"
              rx="1"
              fill="#5EEAD4"
              transform={`rotate(${angle} 0 0)`}
            />
          ))}
        </g>
        {/* Solution Light Pulse */}
        <circle cx="50" cy="45" r="4" fill="#2DD4BF" className="animate-ping" />
      </svg>
    </div>
  );
}
