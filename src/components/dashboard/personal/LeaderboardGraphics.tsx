'use client';

import React from 'react';

// ============================================================================
// 1. HERO BANNER ILLUSTRATION (Cúp Vinh Danh Học Thuật & Vòng Nguyệt Quế 3D)
// ============================================================================
export function LeaderboardHeroIllustration() {
  return (
    <div className="relative w-56 sm:w-64 h-36 sm:h-40 select-none flex items-center justify-center shrink-0">
      <svg
        viewBox="0 0 280 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md pointer-events-none"
      >
        <defs>
          {/* Ambient Glow */}
          <radialGradient id="lb-hero-glow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
          </radialGradient>

          {/* Gold Cup Gradient */}
          <linearGradient id="lb-gold-cup" x1="100" y1="30" x2="180" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="25%" stopColor="#FBBF24" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Cup Rim Highlight */}
          <linearGradient id="lb-gold-rim" x1="105" y1="32" x2="175" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Cobalt Base Pedestal */}
          <linearGradient id="lb-pedestal-base" x1="80" y1="120" x2="200" y2="165" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Platinum / Silver Accents */}
          <linearGradient id="lb-silver-wing" x1="70" y1="40" x2="110" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Soft Shadow */}
          <filter id="lb-sh" x="-15%" y="-15%" width="130%" height="135%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#B45309" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Ambient Radial Background Glow */}
        <ellipse cx="140" cy="85" rx="100" ry="65" fill="url(#lb-hero-glow)" />

        {/* Background Laurels Left */}
        <g opacity="0.85">
          <path d="M78 85C74 72 78 58 88 48C90 56 87 68 82 76" fill="#F59E0B" fillOpacity="0.7" />
          <path d="M68 98C62 86 64 71 74 61C77 69 75 81 71 89" fill="#D97706" fillOpacity="0.8" />
          <path d="M64 114C56 103 57 88 66 78C70 86 69 98 67 106" fill="#B45309" fillOpacity="0.6" />
          <path d="M88 122C78 116 72 104 74 92C80 97 84 107 86 116" fill="#FBBF24" fillOpacity="0.9" />
        </g>

        {/* Background Laurels Right */}
        <g opacity="0.85">
          <path d="M202 85C206 72 202 58 192 48C190 56 193 68 198 76" fill="#F59E0B" fillOpacity="0.7" />
          <path d="M212 98C218 86 216 71 206 61C203 69 205 81 209 89" fill="#D97706" fillOpacity="0.8" />
          <path d="M216 114C224 103 223 88 214 78C210 86 211 98 213 106" fill="#B45309" fillOpacity="0.6" />
          <path d="M192 122C202 116 208 104 206 92C200 97 196 107 194 116" fill="#FBBF24" fillOpacity="0.9" />
        </g>

        {/* Trophy Handles (Tai Cúp) */}
        <path
          d="M98 48C80 48 72 65 78 84C83 98 97 104 108 102"
          stroke="url(#lb-gold-cup)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M182 48C200 48 208 65 202 84C197 98 183 104 172 102"
          stroke="url(#lb-gold-cup)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Trophy Main Cup Body */}
        <g filter="url(#lb-sh)">
          {/* Main Chalice */}
          <path
            d="M102 36C102 36 106 88 140 96C174 88 178 36 178 36L102 36Z"
            fill="url(#lb-gold-cup)"
          />
          {/* Rim */}
          <ellipse cx="140" cy="36" rx="38" ry="7" fill="url(#lb-gold-rim)" />
          {/* Inner Cup Shading */}
          <ellipse cx="140" cy="36" rx="34" ry="5" fill="#78350F" />

          {/* Trophy Stem & Knocker */}
          <path d="M134 95H146V118H134V95Z" fill="#D97706" />
          <ellipse cx="140" cy="118" rx="14" ry="4" fill="#FBBF24" />

          {/* Trophy Star Emblem */}
          <path
            d="M140 50L142.5 57H149.5L144 61.5L146 68.5L140 64.5L134 68.5L136 61.5L130.5 57H137.5L140 50Z"
            fill="#FFFFFF"
            opacity="0.95"
          />
        </g>

        {/* Tiered Architectural Pedestal Base (Bệ Đứng Bậc Thang) */}
        <g>
          {/* Step 1 (Top Tier) */}
          <rect x="115" y="122" width="50" height="10" rx="2" fill="#D97706" />
          <rect x="117" y="123" width="46" height="2" fill="#FEF3C7" opacity="0.6" />

          {/* Step 2 (Middle Pedestal) */}
          <path d="M100 132L106 148H174L180 132H100Z" fill="url(#lb-pedestal-base)" />
          {/* Metallic Engraved Plate on Pedestal */}
          <rect x="118" y="137" width="44" height="7" rx="1.5" fill="#1E293B" stroke="#93C5FD" strokeWidth="0.75" />
          <text x="140" y="142.5" fill="#93C5FD" fontSize="4.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            NEXA • TOP 1
          </text>

          {/* Step 3 (Bottom Plinth) */}
          <rect x="85" y="148" width="110" height="8" rx="3" fill="#0F172A" />
          <rect x="88" y="149" width="104" height="1.5" fill="#3B82F6" opacity="0.7" />
        </g>

        {/* Floating Sparkle Stars */}
        <g>
          {/* Star Top Left */}
          <path d="M65 30L67 34L71 35L67 37L65 41L63 37L59 35L63 34L65 30Z" fill="#FBBF24" />
          {/* Star Top Right */}
          <path d="M215 32L217 36L221 37L217 39L215 43L213 39L209 37L213 36L215 32Z" fill="#FBBF24" />
          {/* Star Small */}
          <path d="M140 16L141.2 19L144 20L141.2 21L140 24L138.8 21L136 20L138.8 19L140 16Z" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}

// ============================================================================
// 2. VÒNG NGUYỆT QUẾ & VƯƠNG MIỆN CHO QUÁN QUÂN (RANK 1 - GOLD CREST)
// ============================================================================
export function LaurelWreathGold() {
  return (
    <svg
      viewBox="0 0 160 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute -top-6 -left-6 w-[calc(100%+48px)] h-[calc(100%+48px)] pointer-events-none z-10 select-none overflow-visible"
    >
      <defs>
        <linearGradient id="gold-leaf-grad" x1="20" y1="20" x2="140" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="30%" stopColor="#FBBF24" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        <linearGradient id="gold-crown-grad" x1="60" y1="4" x2="100" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#D97706" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Imperial Crown Centered on Top */}
      <g filter="url(#gold-glow)">
        <path
          d="M62 26L68 12L80 20L92 12L98 26C98 26 89 28 80 28C71 28 62 26 62 26Z"
          fill="url(#gold-crown-grad)"
          stroke="#78350F"
          strokeWidth="0.75"
        />
        {/* Crown Jewels (Gemstones) */}
        <circle cx="68" cy="12" r="2" fill="#FFFFFF" />
        <circle cx="80" cy="20" r="2.2" fill="#EF4444" stroke="#B91C1C" strokeWidth="0.5" />
        <circle cx="92" cy="12" r="2" fill="#FFFFFF" />
        {/* Crown Base Band */}
        <path d="M63 26C72 28 88 28 97 26V29C88 31 72 31 63 29V26Z" fill="#78350F" />
      </g>

      {/* Left Laurel Wreath Branch */}
      <g fill="url(#gold-leaf-grad)" stroke="#92400E" strokeWidth="0.4">
        {/* Leaves sweeping up and curving in */}
        <path d="M42 42C34 36 26 44 32 52C38 48 40 44 42 42Z" />
        <path d="M30 54C20 52 18 64 26 68C30 62 30 58 30 54Z" />
        <path d="M24 72C14 74 16 86 26 86C28 80 26 76 24 72Z" />
        <path d="M26 90C18 96 24 106 34 102C32 96 30 92 26 90Z" />
        <path d="M36 106C30 114 40 122 48 114C44 110 40 108 36 106Z" />
        <path d="M52 118C50 126 62 130 68 122C62 120 58 118 52 118Z" />
      </g>

      {/* Right Laurel Wreath Branch */}
      <g fill="url(#gold-leaf-grad)" stroke="#92400E" strokeWidth="0.4">
        <path d="M118 42C126 36 134 44 128 52C122 48 120 44 118 42Z" />
        <path d="M130 54C140 52 142 64 134 68C130 62 130 58 130 54Z" />
        <path d="M136 72C146 74 144 86 134 86C132 80 134 76 136 72Z" />
        <path d="M134 90C142 96 136 106 126 102C128 96 130 92 134 90Z" />
        <path d="M124 106C130 114 120 122 112 114C116 110 120 108 124 106Z" />
        <path d="M108 118C110 126 98 130 92 122C98 120 102 118 108 118Z" />
      </g>

      {/* Central Tie Ribbon at Bottom */}
      <circle cx="80" cy="124" r="3.5" fill="#FEF3C7" stroke="#92400E" strokeWidth="0.75" />
    </svg>
  );
}

// ============================================================================
// 3. VÒNG NGUYỆT QUẾ CHO Á QUÂN (RANK 2 - SILVER CREST)
// ============================================================================
export function LaurelWreathSilver() {
  return (
    <svg
      viewBox="0 0 150 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute -top-5 -left-5 w-[calc(100%+40px)] h-[calc(100%+40px)] pointer-events-none z-10 select-none overflow-visible"
    >
      <defs>
        <linearGradient id="silver-leaf-grad" x1="20" y1="20" x2="130" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#E2E8F0" />
          <stop offset="70%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <filter id="silver-glow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#475569" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Top Silver Star Crest */}
      <g filter="url(#silver-glow)">
        <polygon
          points="75,10 78,18 86,18 80,23 82,31 75,26 68,31 70,23 64,18 72,18"
          fill="#FFFFFF"
          stroke="#475569"
          strokeWidth="0.75"
        />
        <circle cx="75" cy="21" r="2" fill="#60A5FA" />
      </g>

      {/* Left Laurel Wreath Branch */}
      <g fill="url(#silver-leaf-grad)" stroke="#475569" strokeWidth="0.35">
        <path d="M40 38C32 34 26 42 32 48C36 44 38 40 40 38Z" />
        <path d="M28 50C18 50 18 60 26 62C28 58 28 54 28 50Z" />
        <path d="M24 66C16 68 18 78 26 76C28 72 26 68 24 66Z" />
        <path d="M28 82C22 88 28 96 36 92C34 88 32 84 28 82Z" />
        <path d="M40 96C36 104 46 110 52 102C48 100 44 98 40 96Z" />
      </g>

      {/* Right Laurel Wreath Branch */}
      <g fill="url(#silver-leaf-grad)" stroke="#475569" strokeWidth="0.35">
        <path d="M110 38C118 34 124 42 118 48C114 44 112 40 110 38Z" />
        <path d="M122 50C132 50 132 60 124 62C122 58 122 54 122 50Z" />
        <path d="M126 66C134 68 132 78 124 76C122 72 124 68 126 66Z" />
        <path d="M122 82C128 88 122 96 114 92C116 88 118 84 122 82Z" />
        <path d="M110 96C114 104 104 110 98 102C102 100 106 98 110 96Z" />
      </g>

      {/* Central Tie Pin at Bottom */}
      <circle cx="75" cy="110" r="3" fill="#F8FAFC" stroke="#64748B" strokeWidth="0.75" />
    </svg>
  );
}

// ============================================================================
// 4. VÒNG NGUYỆT QUẾ CHO QUÝ QUÂN (RANK 3 - BRONZE CREST)
// ============================================================================
export function LaurelWreathBronze() {
  return (
    <svg
      viewBox="0 0 150 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute -top-5 -left-5 w-[calc(100%+40px)] h-[calc(100%+40px)] pointer-events-none z-10 select-none overflow-visible"
    >
      <defs>
        <linearGradient id="bronze-leaf-grad" x1="20" y1="20" x2="130" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="35%" stopColor="#D97706" />
          <stop offset="75%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        <filter id="bronze-glow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#78350F" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Top Bronze Shield Crest */}
      <g filter="url(#bronze-glow)">
        <path
          d="M68 14H82L84 24C84 29 75 33 75 33C75 33 66 29 66 24L68 14Z"
          fill="#D97706"
          stroke="#78350F"
          strokeWidth="0.75"
        />
        <circle cx="75" cy="22" r="2.2" fill="#FEF3C7" />
      </g>

      {/* Left Laurel Wreath Branch */}
      <g fill="url(#bronze-leaf-grad)" stroke="#78350F" strokeWidth="0.35">
        <path d="M40 38C32 34 26 42 32 48C36 44 38 40 40 38Z" />
        <path d="M28 50C18 50 18 60 26 62C28 58 28 54 28 50Z" />
        <path d="M24 66C16 68 18 78 26 76C28 72 26 68 24 66Z" />
        <path d="M28 82C22 88 28 96 36 92C34 88 32 84 28 82Z" />
        <path d="M40 96C36 104 46 110 52 102C48 100 44 98 40 96Z" />
      </g>

      {/* Right Laurel Wreath Branch */}
      <g fill="url(#bronze-leaf-grad)" stroke="#78350F" strokeWidth="0.35">
        <path d="M110 38C118 34 124 42 118 48C114 44 112 40 110 38Z" />
        <path d="M122 50C132 50 132 60 124 62C122 58 122 54 122 50Z" />
        <path d="M126 66C134 68 132 78 124 76C122 72 124 68 126 66Z" />
        <path d="M122 82C128 88 122 96 114 92C116 88 118 84 122 82Z" />
        <path d="M110 96C114 104 104 110 98 102C102 100 106 98 110 96Z" />
      </g>

      {/* Central Tie Pin at Bottom */}
      <circle cx="75" cy="110" r="3" fill="#FDE68A" stroke="#78350F" strokeWidth="0.75" />
    </svg>
  );
}

// ============================================================================
// 5. HUY CHƯƠNG KIM LOẠI CHO BẢNG DANH SÁCH (TABLE MEDAL COIN BADGES)
// ============================================================================
export function TableMedalBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 relative select-none">
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8 drop-shadow-xs">
          <defs>
            <linearGradient id="t-gold" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="35%" stopColor="#FBBF24" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            {/* Blue Ribbon */}
            <linearGradient id="t-ribbon" x1="8" y1="0" x2="24" y2="12" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>
          </defs>
          {/* Ribbon */}
          <path d="M10 2L13 14L8 15L6 3Z" fill="url(#t-ribbon)" />
          <path d="M22 2L19 14L24 15L26 3Z" fill="url(#t-ribbon)" />
          {/* Outer Coin */}
          <circle cx="16" cy="18" r="11" fill="url(#t-gold)" stroke="#78350F" strokeWidth="0.75" />
          <circle cx="16" cy="18" r="8.5" stroke="#FEF3C7" strokeWidth="0.75" strokeDasharray="1 1" />
          {/* Digit 1 */}
          <text x="16" y="22" fill="#78350F" fontSize="11" fontWeight="900" fontFamily="monospace" textAnchor="middle">
            1
          </text>
        </svg>
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 relative select-none">
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8 drop-shadow-xs">
          <defs>
            <linearGradient id="t-silver" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#CBD5E1" />
              <stop offset="75%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="t-ribbon-silver" x1="8" y1="0" x2="24" y2="12" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>
          <path d="M10 2L13 14L8 15L6 3Z" fill="url(#t-ribbon-silver)" />
          <path d="M22 2L19 14L24 15L26 3Z" fill="url(#t-ribbon-silver)" />
          <circle cx="16" cy="18" r="11" fill="url(#t-silver)" stroke="#334155" strokeWidth="0.75" />
          <circle cx="16" cy="18" r="8.5" stroke="#FFFFFF" strokeWidth="0.75" strokeDasharray="1 1" />
          <text x="16" y="22" fill="#1E293B" fontSize="11" fontWeight="900" fontFamily="monospace" textAnchor="middle">
            2
          </text>
        </svg>
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 relative select-none">
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8 drop-shadow-xs">
          <defs>
            <linearGradient id="t-bronze" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="40%" stopColor="#D97706" />
              <stop offset="75%" stopColor="#92400E" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
            <linearGradient id="t-ribbon-bronze" x1="8" y1="0" x2="24" y2="12" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
          </defs>
          <path d="M10 2L13 14L8 15L6 3Z" fill="url(#t-ribbon-bronze)" />
          <path d="M22 2L19 14L24 15L26 3Z" fill="url(#t-ribbon-bronze)" />
          <circle cx="16" cy="18" r="11" fill="url(#t-bronze)" stroke="#451A03" strokeWidth="0.75" />
          <circle cx="16" cy="18" r="8.5" stroke="#FEF3C7" strokeWidth="0.75" strokeDasharray="1 1" />
          <text x="16" y="22" fill="#451A03" fontSize="11" fontWeight="900" fontFamily="monospace" textAnchor="middle">
            3
          </text>
        </svg>
      </div>
    );
  }

  return (
    <span className="w-7 h-7 mx-auto rounded-lg bg-slate-100 dark:bg-zinc-850 text-slate-500 dark:text-neutral-400 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-center text-xs font-bold font-mono tabular-nums shadow-2xs">
      #{rank}
    </span>
  );
}

// ============================================================================
// 6. ISOMETRIC ARCHITECTURAL PODIUM PEDESTAL (BỆ VINH DANH KIẾN TRÚC)
// ============================================================================
export function PodiumPedestalBase({ rank }: { rank: 1 | 2 | 3 }) {
  if (rank === 1) {
    return (
      <div className="w-full mt-3 pt-2 select-none">
        <svg viewBox="0 0 240 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-8">
          <defs>
            <linearGradient id="ped-gold-face" x1="0" y1="0" x2="240" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          {/* Top Step Cap */}
          <path d="M12 4L32 0H208L228 4H12Z" fill="#F59E0B" />
          {/* Main Front Plate */}
          <rect x="12" y="4" width="216" height="26" rx="2" fill="url(#ped-gold-face)" stroke="#D97706" strokeWidth="1" />
          {/* Metallic Accent Lines */}
          <line x1="24" y1="8" x2="216" y2="8" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.8" />
          {/* Roman Numeral I */}
          <text x="120" y="22" fill="#92400E" fontSize="14" fontWeight="900" fontFamily="monospace" textAnchor="middle">
            I
          </text>
        </svg>
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div className="w-full mt-3 pt-2 select-none">
        <svg viewBox="0 0 240 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-6">
          <defs>
            <linearGradient id="ped-silver-face" x1="0" y1="0" x2="240" y2="26" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#E2E8F0" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <path d="M12 4L32 0H208L228 4H12Z" fill="#94A3B8" />
          <rect x="12" y="4" width="216" height="20" rx="2" fill="url(#ped-silver-face)" stroke="#64748B" strokeWidth="1" />
          <line x1="24" y1="7" x2="216" y2="7" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.9" />
          <text x="120" y="19" fill="#334155" fontSize="12" fontWeight="900" fontFamily="monospace" textAnchor="middle">
            II
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full mt-3 pt-2 select-none">
      <svg viewBox="0 0 240 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-5">
        <defs>
          <linearGradient id="ped-bronze-face" x1="0" y1="0" x2="240" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <path d="M12 3L32 0H208L228 3H12Z" fill="#B45309" />
        <rect x="12" y="3" width="216" height="18" rx="2" fill="url(#ped-bronze-face)" stroke="#92400E" strokeWidth="1" />
        <line x1="24" y1="6" x2="216" y2="6" stroke="#FEF3C7" strokeWidth="0.75" strokeOpacity="0.9" />
        <text x="120" y="17" fill="#78350F" fontSize="11" fontWeight="900" fontFamily="monospace" textAnchor="middle">
          III
        </text>
      </svg>
    </div>
  );
}

// ============================================================================
// 7. EMPTY LEADERBOARD VECTOR ILLUSTRATION (KHI CHƯA CÓ DỮ LIỆU)
// ============================================================================
export function EmptyLeaderboardIllustration({ periodText }: { periodText: string }) {
  return (
    <div className="py-14 px-4 text-center flex flex-col items-center justify-center select-none">
      <svg viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-28 mb-4">
        <defs>
          <linearGradient id="empty-podium" x1="40" y1="40" x2="140" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
        </defs>
        {/* Soft Background Circle */}
        <circle cx="90" cy="55" r="45" fill="#F1F5F9" opacity="0.6" />
        {/* Empty 3-tier podium */}
        <rect x="30" y="65" width="35" height="35" rx="3" fill="#E2E8F0" />
        <text x="47.5" y="86" fill="#94A3B8" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">2</text>
        <rect x="72" y="45" width="36" height="55" rx="3" fill="#CBD5E1" />
        <text x="90" y="75" fill="#64748B" fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle">1</text>
        <rect x="115" y="75" width="35" height="25" rx="3" fill="#E2E8F0" />
        <text x="132.5" y="92" fill="#94A3B8" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">3</text>
        {/* Flag on Podium 1 */}
        <line x1="90" y1="20" x2="90" y2="45" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
        <polygon points="90,20 110,26 90,32" fill="#2563EB" />
      </svg>
      <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
        Chưa có thành tích ghi nhận trong {periodText}
      </h3>
      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm leading-relaxed">
        Hãy là học viên đầu tiên hoàn thành bài khảo thí năng lực số để mở màn bảng vinh danh {periodText}!
      </p>
    </div>
  );
}
