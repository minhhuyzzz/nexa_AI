'use client';

import React from 'react';

/**
 * SilkRibbonHeroIllustration
 * Biểu tượng Đồ họa Vector Dải Lụa Phát Triển Năng Lực Số (Silk Ribbon of Digital Excellence)
 * Thiết kế theo phong cách Luxury SaaS: satin sheen, chiều sâu 3D, dải lụa hoàng gia Cobalt & chỉ vàng Champagne.
 */
export function SilkRibbonHeroIllustration() {
  return (
    <div className="relative w-72 sm:w-80 h-52 sm:h-56 select-none flex items-center justify-center shrink-0">
      <svg
        viewBox="0 0 360 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl pointer-events-none"
      >
        <defs>
          {/* 1. Ambient Glow Fields */}
          <radialGradient id="silk-ambient-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#1D4ED8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0B1329" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="gold-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.75" />
            <stop offset="35%" stopColor="#F59E0B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
          </radialGradient>

          {/* 2. Silk Satin Gradients (Cobalt Blue Multi-Stop) */}
          <linearGradient id="silk-body-main" x1="40" y1="20" x2="320" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="22%" stopColor="#2563EB" />
            <stop offset="45%" stopColor="#60A5FA" />
            <stop offset="55%" stopColor="#93C5FD" />
            <stop offset="70%" stopColor="#3B82F6" />
            <stop offset="88%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>

          {/* Mặt lật / Mặt dưới dải lụa (Shadow Underside) */}
          <linearGradient id="silk-underside" x1="120" y1="60" x2="280" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="40%" stopColor="#172554" />
            <stop offset="75%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Dải lụa phụ ánh vàng Champagne (Champagne Gold Silk Ribbon) */}
          <linearGradient id="silk-gold-accent" x1="60" y1="40" x2="300" y2="220" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="25%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#FEF08A" />
            <stop offset="75%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Dải lụa mỏng bay bổng (Cyan Sheer Silk Ribbon) */}
          <linearGradient id="silk-cyan-sheer" x1="80" y1="30" x2="280" y2="230" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#818CF8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </linearGradient>

          {/* Huy hiệu Pha lê Năng lực Số (Crystal Emblem Gradients) */}
          <linearGradient id="crystal-face-top" x1="175" y1="85" x2="205" y2="135" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#BFDBFE" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="crystal-face-right" x1="205" y1="110" x2="230" y2="155" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          <linearGradient id="crystal-face-left" x1="150" y1="110" x2="190" y2="155" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          {/* Drop Shadows */}
          <filter id="silk-drop-shadow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#091024" floodOpacity="0.5" />
          </filter>

          <filter id="crystal-glow" x="-30%" y="-30%" width="160%" height="160%" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Lớp ánh sáng nền toả sâu */}
        <circle cx="190" cy="130" r="125" fill="url(#silk-ambient-glow)" />
        <circle cx="190" cy="130" r="45" fill="url(#gold-core-glow)" />

        {/* 2. Dải lụa mỏng Cyan/Indigo phía sau cùng (Background Sheer Wave) */}
        <path
          d="M 50 180 C 100 230, 200 240, 290 190 C 340 160, 320 80, 240 60 C 180 45, 120 70, 95 110"
          stroke="url(#silk-cyan-sheer)"
          strokeWidth="18"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
        />

        {/* 3. Dải lụa Hoàng Gia Phía Sau (Underside/Back Fold) */}
        <g filter="url(#silk-drop-shadow)">
          <path
            d="M 100 80 C 140 30, 240 25, 290 75 C 330 115, 320 180, 260 205 C 220 220, 160 210, 140 175 Z"
            fill="url(#silk-underside)"
            opacity="0.9"
          />
        </g>

        {/* 4. Dải lụa Chính - Vòng lượn 3D Lộng Lẫy (Main Flowing Silk Ribbon) */}
        <g filter="url(#silk-drop-shadow)">
          {/* Lớp thân lụa mềm mại chính */}
          <path
            d="M 45 160 C 70 80, 130 50, 190 75 C 260 105, 305 60, 335 90 C 315 125, 275 145, 215 130 C 145 110, 105 180, 75 220 C 55 210, 45 190, 45 160 Z"
            fill="url(#silk-body-main)"
          />

          {/* Vạt lụa uốn lượn phía trước (Front Cascade Loop) */}
          <path
            d="M 120 145 C 160 115, 230 110, 275 145 C 320 180, 290 235, 230 235 C 170 235, 135 195, 120 145 Z"
            fill="url(#silk-body-main)"
          />

          {/* Nếp gấp chuyển tiếp tạo gân bóng satin (Specular Ridge Highlight) */}
          <path
            d="M 52 155 C 80 85, 135 58, 192 80 C 255 106, 298 68, 328 92"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.65"
            fill="none"
          />
          <path
            d="M 128 148 C 165 122, 225 118, 268 148 C 305 178, 282 225, 230 228"
            stroke="#93C5FD"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.7"
            fill="none"
          />
        </g>

        {/* 5. Dải lụa Vàng Ánh Kim Đan Xen (Golden Silk Ribbon Spiral) */}
        <g filter="url(#silk-drop-shadow)">
          {/* Dải vàng uốn lượn xuyên qua vòng xoắn */}
          <path
            d="M 70 195 C 95 130, 160 100, 210 120 C 270 145, 310 130, 325 155 C 310 170, 275 165, 225 145 C 175 125, 120 160, 95 215 Z"
            fill="url(#silk-gold-accent)"
          />
          {/* Đường chỉ thêu vàng phát sáng */}
          <path
            d="M 75 190 C 98 132, 160 105, 210 123 C 265 145, 305 135, 320 155"
            stroke="#FEF08A"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeOpacity="0.9"
            fill="none"
          />
        </g>

        {/* 6. Trọng tâm: Huy hiệu Pha Lê Năng Lực Số Đa Giác (Faceted Diamond Core) */}
        <g filter="url(#crystal-glow)" transform="translate(190, 130)">
          {/* Mặt trên (Top Shimmer) */}
          <path d="M 0 -26 L 22 -6 L 0 8 L -22 -6 Z" fill="url(#crystal-face-top)" />
          {/* Mặt phải (Deep Royal Blue) */}
          <path d="M 0 8 L 22 -6 L 16 26 L 0 34 Z" fill="url(#crystal-face-right)" />
          {/* Mặt trái (Cobalt Accent) */}
          <path d="M 0 8 L -22 -6 L -16 26 L 0 34 Z" fill="url(#crystal-face-left)" />

          {/* Đường viền phản chiếu ánh kim */}
          <path d="M 0 -26 L 22 -6 L 16 26 L 0 34 L -16 26 L -22 -6 Z" stroke="#E0F2FE" strokeWidth="1" fill="none" strokeOpacity="0.8" />
          <path d="M -22 -6 L 0 8 L 22 -6" stroke="#FFFFFF" strokeWidth="1" fill="none" strokeOpacity="0.9" />
          <path d="M 0 8 L 0 34" stroke="#60A5FA" strokeWidth="1" fill="none" strokeOpacity="0.8" />

          {/* Ngôi sao 4 cánh ở tâm pha lê (Compass Star of Excellence) */}
          <path
            d="M 0 -12 Q 0 0 12 0 Q 0 0 0 12 Q 0 0 -12 0 Q 0 0 0 -12 Z"
            fill="#FFFFFF"
            opacity="0.95"
          />
          <circle cx="0" cy="0" r="2.5" fill="#FDE68A" />
        </g>

        {/* 7. Hạt sao lấp lánh (Floating Stardust Accents) */}
        <g opacity="0.85">
          {/* Star 1 */}
          <path d="M 90 60 Q 90 67 97 67 Q 90 67 90 74 Q 90 67 83 67 Q 90 67 90 60 Z" fill="#FDE68A" />
          {/* Star 2 */}
          <path d="M 290 50 Q 290 55 295 55 Q 290 55 290 60 Q 290 55 285 55 Q 290 55 290 50 Z" fill="#FFFFFF" />
          {/* Star 3 */}
          <path d="M 315 200 Q 315 205 320 205 Q 315 205 315 210 Q 315 205 310 205 Q 315 205 315 200 Z" fill="#93C5FD" />
          {/* Star 4 */}
          <path d="M 70 120 Q 70 124 74 124 Q 70 124 70 128 Q 70 124 66 124 Q 70 124 70 120 Z" fill="#FDE68A" />
          {/* Glow Dots */}
          <circle cx="110" cy="95" r="2" fill="#FFFFFF" opacity="0.7" />
          <circle cx="270" cy="90" r="2" fill="#FDE68A" opacity="0.8" />
          <circle cx="150" cy="225" r="1.5" fill="#93C5FD" opacity="0.6" />
          <circle cx="280" cy="215" r="2" fill="#FFFFFF" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
}
