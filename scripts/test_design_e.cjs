const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outputDir = path.resolve('scratch');

// ELEGANT DESIGN E: Fluid calligraphic Q with organic S-curve flourish and refined Quran
const svgE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Deep Cosmic Dark Base -->
    <linearGradient id="bgE" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1022" />
      <stop offset="50%" stop-color="#050814" />
      <stop offset="100%" stop-color="#0e152c" />
    </linearGradient>

    <!-- Vibrant Multi-Color Spectral Gradient for the Q -->
    <!-- Emerald -> Cyan -> Azure -> Indigo -> Violet -> Fuchsia -> Coral -->
    <linearGradient id="qSpectrumE" x1="5%" y1="5%" x2="95%" y2="95%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="18%" stop-color="#06b6d4" />
      <stop offset="38%" stop-color="#3b82f6" />
      <stop offset="62%" stop-color="#6366f1" />
      <stop offset="80%" stop-color="#a855f7" />
      <stop offset="92%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>

    <!-- Flourish Tail Gradient: Fuchsia -> Sunset Coral -> Radiant Amber Gold -->
    <linearGradient id="tailGradE" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="35%" stop-color="#f43f5e" />
      <stop offset="70%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>

    <!-- Gold Accent Gradient -->
    <linearGradient id="goldE" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="45%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Core Radial Glow -->
    <radialGradient id="coreGlowE" cx="47%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.32" />
      <stop offset="45%" stop-color="#6366f1" stop-opacity="0.2" />
      <stop offset="75%" stop-color="#ec4899" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Glowing Card Rim -->
    <linearGradient id="rimGradE" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.75" />
      <stop offset="30%" stop-color="#3b82f6" stop-opacity="0.6" />
      <stop offset="70%" stop-color="#ec4899" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.85" />
    </linearGradient>

    <!-- Drop Shadow & Glow Filters -->
    <filter id="shadowE" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.75" />
    </filter>
    <filter id="glowFiltE" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#06b6d4" flood-opacity="0.4" />
    </filter>
    <filter id="tailGlowE" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#f43f5e" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Squircle Base -->
  <rect width="512" height="512" rx="120" fill="url(#bgE)" />
  <rect width="512" height="512" rx="120" fill="url(#coreGlowE)" />
  <rect x="6" y="6" width="500" height="500" rx="116" stroke="url(#rimGradE)" stroke-width="2.5" fill="none" opacity="0.45" />

  <!-- Master Q Group -->
  <g filter="url(#shadowE)">
    <!-- THE Q LOOP: Center (238, 224), Outer Radius 144, Inner Radius 96 -->
    <circle cx="238" cy="224" r="144" stroke="url(#qSpectrumE)" stroke-width="48" fill="none" filter="url(#glowFiltE)" />

    <!-- THE Q TAIL: Fluid S-curve calligraphic flourish -->
    <!-- Originates inside/at bottom-right of ring (290, 275), sweeps down-right with a graceful curve that kicks up at tip (438, 386) -->
    <path d="
      M 276 270
      C 304 278, 334 300, 366 332
      C 398 364, 428 382, 444 382
      C 452 382, 450 392, 440 398
      C 416 414, 376 422, 326 394
      C 290 374, 268 348, 258 322
      C 252 306, 258 288, 276 270
      Z
    " fill="url(#tailGradE)" filter="url(#tailGlowE)" />

    <!-- 3D Ribbon Gleam on Tail -->
    <path d="
      M 284 278
      C 310 286, 338 306, 370 338
      C 402 368, 430 382, 442 384
      C 424 394, 388 402, 344 382
      C 310 366, 288 344, 278 322
      C 272 308, 274 292, 284 278
      Z
    " fill="url(#goldE)" opacity="0.65" />

    <!-- SACRED QURAN & RECITATION AUDIO EMBLEM IN CENTER (cx=238, cy=224) -->
    <g transform="translate(238, 222)">
      <!-- Audio Wave Rays Rising above the Quran -->
      <line x1="-32" y1="-56" x2="-32" y2="-44" stroke="url(#goldE)" stroke-width="3" stroke-linecap="round" opacity="0.75" />
      <line x1="-16" y1="-62" x2="-16" y2="-46" stroke="url(#goldE)" stroke-width="3.5" stroke-linecap="round" opacity="0.9" />
      <line x1="0" y1="-68" x2="0" y2="-48" stroke="url(#goldE)" stroke-width="4" stroke-linecap="round" />
      <line x1="16" y1="-62" x2="16" y2="-46" stroke="url(#goldE)" stroke-width="3.5" stroke-linecap="round" opacity="0.9" />
      <line x1="32" y1="-56" x2="32" y2="-44" stroke="url(#goldE)" stroke-width="3" stroke-linecap="round" opacity="0.75" />

      <!-- Left Page of Holy Quran -->
      <path d="
        M -2 -24
        C -28 -38, -66 -34, -84 -18
        C -88 -14, -88 28, -88 30
        C -68 14, -30 16, -2 28
        Z
      " fill="#ffffff" />

      <!-- Right Page of Holy Quran -->
      <path d="
        M 2 -24
        C 28 -38, 66 -34, 84 -18
        C 88 -14, 88 28, 88 30
        C 68 14, 30 16, 2 28
        Z
      " fill="#f8fafc" />

      <!-- Quranic Ayah Lines in Celestial Cyan -->
      <path d="
        M -76 -6 C -58 -18, -36 -16, -14 -6
        M -76 6 C -58 -6, -36 -4, -14 6
        M -76 18 C -58 6, -36 8, -14 18
        M 76 -6 C 58 -18, 36 -16, 14 -6
        M 76 6 C 58 -4, 36 -2, 14 6
        M 76 18 C 58 6, 36 8, 14 18
      " stroke="#0284c7" stroke-width="2.8" stroke-linecap="round" opacity="0.85" />

      <!-- Golden Spine -->
      <line x1="0" y1="-26" x2="0" y2="30" stroke="url(#goldE)" stroke-width="5" stroke-linecap="round" />

      <!-- Golden Bookmark Ribbon -->
      <path d="
        M 0 28
        C -5 38, -7 48, -11 56
        L 0 50
        L 11 56
        C 7 48, 5 38, 0 28
        Z
      " fill="url(#goldE)" />

      <!-- Rehal (Wooden Quran Stand) Base -->
      <path d="
        M -54 38 L -26 54 L -6 46
        M 54 38 L 26 54 L 6 46
      " stroke="url(#goldE)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

async function run() {
  fs.writeFileSync(path.join(outputDir, 'designE.svg'), svgE);
  await sharp(Buffer.from(svgE)).resize(512, 512).png().toFile(path.join(outputDir, 'designE.png'));
  console.log('Design E generated!');
}

run().catch(console.error);

