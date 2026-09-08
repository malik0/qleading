const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outputDir = path.resolve('scratch');

const masterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Deep Cosmic Dark Background -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1124" />
      <stop offset="50%" stop-color="#040711" />
      <stop offset="100%" stop-color="#0d152c" />
    </linearGradient>

    <!-- Spectrum Gradient for Q: Sacred Emerald -> Celestial Cyan -> Royal Blue -> Violet -> Rose -> Sunset Amber -> Gold -->
    <linearGradient id="qSpectrum" x1="5%" y1="5%" x2="95%" y2="95%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="18%" stop-color="#06b6d4" />
      <stop offset="38%" stop-color="#3b82f6" />
      <stop offset="62%" stop-color="#6366f1" />
      <stop offset="80%" stop-color="#a855f7" />
      <stop offset="90%" stop-color="#ec4899" />
      <stop offset="96%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>

    <!-- Glowing Tail Overlay -->
    <linearGradient id="tailAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" stop-opacity="0.9" />
      <stop offset="40%" stop-color="#f43f5e" />
      <stop offset="75%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#fde047" />
    </linearGradient>

    <!-- Pure Luminous Gold -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef9c3" />
      <stop offset="30%" stop-color="#fbbf24" />
      <stop offset="70%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Core Radial Glow behind the Quran -->
    <radialGradient id="centerGlow" cx="48%" cy="44%" r="52%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.36" />
      <stop offset="45%" stop-color="#6366f1" stop-opacity="0.22" />
      <stop offset="75%" stop-color="#ec4899" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Outer Squircle Rim Glow -->
    <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.75" />
      <stop offset="25%" stop-color="#06b6d4" stop-opacity="0.85" />
      <stop offset="55%" stop-color="#6366f1" stop-opacity="0.65" />
      <stop offset="80%" stop-color="#ec4899" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.9" />
    </linearGradient>

    <!-- Book Page Gradient -->
    <linearGradient id="pageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>

    <!-- Filters -->
    <filter id="shadowMaster" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.8" />
    </filter>
    <filter id="qGlowMaster" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#06b6d4" flood-opacity="0.45" />
    </filter>
    <filter id="tailGlowMaster" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="10" flood-color="#f43f5e" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Base Squircle Container -->
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)" />
  <rect width="512" height="512" rx="120" fill="url(#centerGlow)" />
  <rect x="6" y="6" width="500" height="500" rx="116" stroke="url(#rimGrad)" stroke-width="2.5" fill="none" opacity="0.45" />

  <!-- Subtle Islamic Geometric Watermark -->
  <g transform="translate(236, 224)" opacity="0.05" stroke="#ffffff" stroke-width="2" fill="none">
    <circle r="185" />
    <rect x="-130" y="-130" width="260" height="260" rx="12" />
    <rect x="-130" y="-130" width="260" height="260" rx="12" transform="rotate(45)" />
  </g>

  <!-- MASTER 'Q' COMPOSITION -->
  <g filter="url(#shadowMaster)">

    <!-- THE UNIFIED 'Q' BODY -->
    <!-- Beautiful, smooth continuous stroke where the outer contour sweeps out into the tail, and inner cutout is a pristine circle -->
    <path d="
      M 236 78
      C 148 78, 78 148, 78 236
      C 78 324, 148 394, 236 394
      C 278 394, 316 378, 344 350
      C 372 378, 410 412, 444 418
      C 451 419, 455 411, 449 405
      C 426 380, 398 344, 381 308
      C 390 286, 394 262, 394 236
      C 394 148, 324 78, 236 78
      Z
      M 236 130
      C 295 130, 342 177, 342 236
      C 342 295, 295 342, 236 342
      C 177 342, 130 295, 130 236
      C 130 177, 177 130, 236 130
      Z
    " fill="url(#qSpectrum)" fill-rule="evenodd" filter="url(#qGlowMaster)" />

    <!-- Luminous 3D Accent Ribbon along the Tail -->
    <path d="
      M 344 350
      C 372 378, 410 412, 444 418
      C 451 419, 455 411, 449 405
      C 426 380, 398 344, 381 308
      C 374 322, 362 338, 344 350
      Z
    " fill="url(#tailAccent)" filter="url(#tailGlowMaster)" />

    <!-- Gleaming Gold Filament on Tail Edge -->
    <path d="
      M 360 358
      C 386 382, 418 410, 444 416
      C 432 402, 408 376, 384 336
    " stroke="url(#goldGrad)" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.85" />

    <!-- SACRED OPEN QURAN & RECITATION AUDIO EMBLEM (Center cx=236, cy=224) -->
    <g transform="translate(236, 222)">

      <!-- Audio Waves / Light of Revelation emanating upwards -->
      <path d="M -32 -56 A 40 40 0 0 1 32 -56" stroke="url(#goldGrad)" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7" />
      <path d="M -18 -48 A 22 22 0 0 1 18 -48" stroke="url(#goldGrad)" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0.9" />

      <!-- Radiant Islamic Crescent & Star -->
      <path d="M 0 -64 A 12 12 0 1 1 10 -48 A 9.5 9.5 0 1 0 -2 -62 Z" fill="url(#goldGrad)" />
      <circle cx="7" cy="-57" r="2.2" fill="url(#goldGrad)" />

      <!-- Left Page of Holy Quran (White pearl with soft drop shadow) -->
      <path d="
        M -2 -24
        C -28 -38, -66 -34, -84 -18
        C -88 -14, -88 28, -88 30
        C -68 14, -30 16, -2 28
        Z
      " fill="url(#pageGrad)" />

      <!-- Right Page of Holy Quran -->
      <path d="
        M 2 -24
        C 28 -38, 66 -34, 84 -18
        C 88 -14, 88 28, 88 30
        C 68 14, 30 16, 2 28
        Z
      " fill="url(#pageGrad)" />

      <!-- Quranic Ayah Lines (Emerald & Sky gradient ribbons) -->
      <path d="
        M -76 -6 C -58 -18, -36 -16, -14 -6
        M -76 6 C -58 -6, -36 -4, -14 6
        M -76 18 C -58 6, -36 8, -14 18
        M 76 -6 C 58 -18, 36 -16, 14 -6
        M 76 6 C 58 -4, 36 -2, 14 6
        M 76 18 C 58 6, 36 8, 14 18
      " stroke="#0284c7" stroke-width="2.8" stroke-linecap="round" opacity="0.85" />

      <!-- Center Golden Spine -->
      <line x1="0" y1="-26" x2="0" y2="30" stroke="url(#goldGrad)" stroke-width="5" stroke-linecap="round" />

      <!-- Golden Bookmark Ribbon (Tahfeez ribbon) with V-cut -->
      <path d="
        M 0 28
        C -5 38, -7 48, -11 56
        L 0 50
        L 11 56
        C 7 48, 5 38, 0 28
        Z
      " fill="url(#goldGrad)" />

      <!-- Wooden Quran Stand (Rehal) Base in Polished Gold -->
      <path d="
        M -54 38 L -26 54 L -6 46
        M 54 38 L 26 54 L 6 46
      " stroke="url(#goldGrad)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

async function run() {
  fs.writeFileSync(path.join(outputDir, 'masterpiece.svg'), masterSvg);

  await sharp(Buffer.from(masterSvg)).resize(512, 512).png().toFile(path.join(outputDir, 'masterpiece_512.png'));
  await sharp(Buffer.from(masterSvg)).resize(192, 192).png().toFile(path.join(outputDir, 'masterpiece_192.png'));
  await sharp(Buffer.from(masterSvg)).resize(48, 48).png().toFile(path.join(outputDir, 'masterpiece_48.png'));
  await sharp(Buffer.from(masterSvg)).resize(32, 32).png().toFile(path.join(outputDir, 'masterpiece_32.png'));
  console.log('Masterpiece generated at 512, 192, 48, 32!');
}

run().catch(console.error);

