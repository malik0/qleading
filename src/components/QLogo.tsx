import React, { useId } from "react";

interface QLogoProps {
  className?: string;
  size?: number;
}

export const QLogo: React.FC<QLogoProps> = ({ className = "w-10 h-10", size }) => {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  const bgGradId = `bg_${id}`;
  const qSpectrumId = `qSpectrum_${id}`;
  const tailAccentId = `tailAccent_${id}`;
  const goldGradId = `goldGrad_${id}`;
  const centerGlowId = `centerGlow_${id}`;
  const rimGradId = `rimGrad_${id}`;
  const pageGradId = `pageGrad_${id}`;
  const shadowId = `shadow_${id}`;
  const qGlowId = `qGlow_${id}`;
  const tailGlowId = `tailGlow_${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Qleading Logo"
    >
      <defs>
        {/* Deep Cosmic Obsidian Dark Background */}
        <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a1024" />
          <stop offset="50%" stopColor="#030712" />
          <stop offset="100%" stopColor="#0d152c" />
        </linearGradient>

        {/* Spectrum Gradient for Q: Sacred Emerald -> Radiant Cyan -> Azure Blue -> Violet -> Rose Fuchsia -> Sunset Amber -> Gold */}
        <linearGradient id={qSpectrumId} x1="5%" y1="5%" x2="95%" y2="95%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="16%" stopColor="#06b6d4" />
          <stop offset="36%" stopColor="#3b82f6" />
          <stop offset="60%" stopColor="#6366f1" />
          <stop offset="78%" stopColor="#a855f7" />
          <stop offset="90%" stopColor="#ec4899" />
          <stop offset="96%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>

        {/* Glowing Tail Ribbon Overlay */}
        <linearGradient id={tailAccentId} x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="35%" stopColor="#f43f5e" />
          <stop offset="70%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#facc15" />
        </linearGradient>

        {/* Pure Luminous Gold Gradient */}
        <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="35%" stopColor="#fbbf24" />
          <stop offset="75%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Core Radial Glow behind Quran */}
        <radialGradient id={centerGlowId} cx="48%" cy="44%" r="56%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.38" />
          <stop offset="42%" stopColor="#6366f1" stopOpacity="0.22" />
          <stop offset="75%" stopColor="#ec4899" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Outer Squircle Rim Glow */}
        <linearGradient id={rimGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
          <stop offset="25%" stopColor="#06b6d4" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#6366f1" stopOpacity="0.7" />
          <stop offset="80%" stopColor="#ec4899" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.95" />
        </linearGradient>

        {/* Book Page Gradient */}
        <linearGradient id={pageGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f0f9ff" />
        </linearGradient>

        {/* Filters */}
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#000000" floodOpacity="0.85" />
        </filter>
        <filter id={qGlowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="#06b6d4" floodOpacity="0.5" />
        </filter>
        <filter id={tailGlowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="12" floodColor="#f43f5e" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* Base Squircle Container */}
      <rect width="512" height="512" rx="116" fill={`url(#${bgGradId})`} />
      <rect width="512" height="512" rx="116" fill={`url(#${centerGlowId})`} />
      <rect
        x="6"
        y="6"
        width="500"
        height="500"
        rx="112"
        stroke={`url(#${rimGradId})`}
        strokeWidth="2.5"
        fill="none"
        opacity="0.5"
      />

      {/* Subtle Islamic Geometric Watermark */}
      <g transform="translate(242, 230)" opacity="0.055" stroke="#ffffff" strokeWidth="2" fill="none">
        <circle r="200" />
        <rect x="-142" y="-142" width="284" height="284" rx="16" />
        <rect x="-142" y="-142" width="284" height="284" rx="16" transform="rotate(45)" />
      </g>

      {/* MASTER 'Q' COMPOSITION */}
      <g filter={`url(#${shadowId})`}>
        {/* THE UNIFIED 'Q' BODY */}
        <path
          d="
            M 242 66
            C 151 66, 78 139, 78 230
            C 78 321, 151 394, 242 394
            C 286 394, 326 376, 355 346
            C 384 376, 424 416, 460 424
            C 468 425, 472 417, 466 411
            C 440 384, 408 344, 390 306
            C 400 283, 406 257, 406 230
            C 406 139, 333 66, 242 66
            Z
            M 242 122
            C 302 122, 350 170, 350 230
            C 350 290, 302 338, 242 338
            C 182 338, 134 290, 134 230
            C 134 170, 182 122, 242 122
            Z
          "
          fill={`url(#${qSpectrumId})`}
          fillRule="evenodd"
          filter={`url(#${qGlowId})`}
        />

        {/* Luminous 3D Accent Ribbon along the Tail */}
        <path
          d="
            M 355 346
            C 384 376, 424 416, 460 424
            C 468 425, 472 417, 466 411
            C 440 384, 408 344, 390 306
            C 382 322, 370 336, 355 346
            Z
          "
          fill={`url(#${tailAccentId})`}
          filter={`url(#${tailGlowId})`}
        />

        {/* Gleaming Gold Filament on Tail Edge */}
        <path
          d="
            M 374 354
            C 402 382, 436 414, 460 422
            C 446 406, 420 376, 394 334
          "
          stroke={`url(#${goldGradId})`}
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        {/* SACRED OPEN QURAN & RECITATION AUDIO EMBLEM */}
        <g transform="translate(242, 226)">
          {/* Concentric Audio Wave Arcs */}
          <path
            d="M -36 -62 A 44 44 0 0 1 36 -62"
            stroke={`url(#${goldGradId})`}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M -22 -52 A 26 26 0 0 1 22 -52"
            stroke={`url(#${goldGradId})`}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            opacity="0.9"
          />
          <circle cx="0" cy="-42" r="3.5" fill={`url(#${goldGradId})`} />

          {/* Left Page of Holy Quran */}
          <path
            d="
              M -2 -26
              C -32 -42, -74 -36, -94 -18
              C -98 -14, -98 30, -98 32
              C -76 16, -34 18, -2 30
              Z
            "
            fill={`url(#${pageGradId})`}
          />

          {/* Right Page of Holy Quran */}
          <path
            d="
              M 2 -26
              C 32 -42, 74 -36, 94 -18
              C 98 -14, 98 30, 98 32
              C 76 16, 34 18, 2 30
              Z
            "
            fill={`url(#${pageGradId})`}
          />

          {/* Quranic Ayah Lines */}
          <path
            d="
              M -84 -6 C -64 -18, -40 -16, -16 -6
              M -84 6 C -64 -6, -40 -4, -16 6
              M -84 18 C -64 6, -40 8, -16 18
              M 84 -6 C 64 -18, 40 -16, 16 -6
              M 84 6 C 64 -4, 40 -2, 16 6
              M 84 18 C 64 6, 40 8, 16 18
            "
            stroke="#0284c7"
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Center Golden Spine */}
          <line
            x1="0"
            y1="-28"
            x2="0"
            y2="32"
            stroke={`url(#${goldGradId})`}
            strokeWidth="5.5"
            strokeLinecap="round"
          />

          {/* Golden Bookmark Ribbon */}
          <path
            d="
              M 0 30
              C -6 40, -8 52, -12 60
              L 0 54
              L 12 60
              C 8 52, 6 40, 0 30
              Z
            "
            fill={`url(#${goldGradId})`}
          />

          {/* Wooden Quran Stand (Rehal) Base in Polished Gold */}
          <path
            d="
              M -60 40 L -28 56 L -6 48
              M 60 40 L 28 56 L 6 48
            "
            stroke={`url(#${goldGradId})`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
};

