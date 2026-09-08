const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outputDir = path.resolve('scratch');

// CONCEPT G: The Golden Bookmark Ribbon extends and flourishes out as the tail of the Q!
const svgG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f20" />
      <stop offset="50%" stop-color="#040711" />
      <stop offset="100%" stop-color="#0d1428" />
    </linearGradient>

    <linearGradient id="qRingG" x1="10%" y1="10%" x2="90%" y2="90%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="22%" stop-color="#06b6d4" />
      <stop offset="48%" stop-color="#3b82f6" />
      <stop offset="75%" stop-color="#6366f1" />
      <stop offset="90%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#d946ef" />
    </linearGradient>

    <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef9c3" />
      <stop offset="35%" stop-color="#fde047" />
      <stop offset="70%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>

    <radialGradient id="glowG" cx="47%" cy="44%" r="55%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.32" />
      <stop offset="45%" stop-color="#6366f1" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <filter id="shadowG" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.75" />
    </filter>
    <filter id="glowFiltG" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#06b6d4" flood-opacity="0.4" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="122" fill="url(#bgG)" />
  <rect width="512" height="512" rx="122" fill="url(#glowG)" />
  <rect x="6" y="6" width="500" height="500" rx="118" stroke="url(#qRingG)" stroke-width="2.5" fill="none" opacity="0.45" />

  <g filter="url(#shadowG)">
    <!-- Main Colorful Q Ring -->
    <circle cx="236" cy="224" r="142" stroke="url(#qRingG)" stroke-width="46" fill="none" filter="url(#glowFiltG)" />

    <!-- Radiant Golden Calligraphic Tail of the Q -->
    <!-- Elegantly swoops from the bottom center across the ring and kicks up gracefully at the bottom right -->
    <path d="
      M 236 296
      C 270 296, 310 320, 350 354
      C 390 388, 424 406, 442 404
      C 450 403, 452 392, 444 386
      C 418 368, 386 338, 356 304
      C 334 278, 310 264, 286 264
      C 272 264, 258 274, 248 284
      Z
    " fill="url(#goldG)" filter="url(#glowFiltG)" />

    <!-- Quran in Center -->
    <g transform="translate(236, 220)">
      <!-- Crescent & Star -->
      <path d="M 0 -64 A 14 14 0 1 1 12 -46 A 11 11 0 1 0 -2 -62 Z" fill="url(#goldG)" opacity="0.95" />
      <circle cx="8" cy="-56" r="2.5" fill="url(#goldG)" />

      <!-- Left Page -->
      <path d="M -2 -24 C -28 -38, -66 -34, -84 -18 C -88 -14, -88 28, -88 30 C -68 14, -30 16, -2 28 Z" fill="#ffffff" />
      <!-- Right Page -->
      <path d="M 2 -24 C 28 -38, 66 -34, 84 -18 C 88 -14, 88 28, 88 30 C 68 14, 30 16, 2 28 Z" fill="#f8fafc" />

      <!-- Verse Lines -->
      <path d="M -76 -6 C -58 -18, -36 -16, -14 -6 M -76 6 C -58 -6, -36 -4, -14 6 M -76 18 C -58 6, -36 8, -14 18 M 76 -6 C 58 -18, 36 -16, 14 -6 M 76 6 C 58 -4, 36 -2, 14 6 M 76 18 C 58 6, 36 8, 14 18" stroke="#0284c7" stroke-width="2.8" stroke-linecap="round" opacity="0.85" />

      <!-- Spine -->
      <line x1="0" y1="-26" x2="0" y2="30" stroke="url(#goldG)" stroke-width="5" stroke-linecap="round" />
      <!-- Rehal Base -->
      <path d="M -54 38 L -26 54 L -6 46 M 54 38 L 26 54 L 6 46" stroke="url(#goldG)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

// CONCEPT H: Single-piece unified Q where the bottom-right of the circle opens and swoops outward into a tapered calligraphic tail
const svgH = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgH" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f20" />
      <stop offset="50%" stop-color="#040711" />
      <stop offset="100%" stop-color="#0d1428" />
    </linearGradient>

    <!-- Spectrum: Teal -> Cyan -> Blue -> Purple -> Magenta -> Orange -> Gold -->
    <linearGradient id="qSpectrumH" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="20%" stop-color="#3b82f6" />
      <stop offset="45%" stop-color="#6366f1" />
      <stop offset="70%" stop-color="#a855f7" />
      <stop offset="85%" stop-color="#ec4899" />
      <stop offset="95%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>

    <linearGradient id="goldH" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef9c3" />
      <stop offset="35%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <radialGradient id="glowH" cx="47%" cy="44%" r="55%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.32" />
      <stop offset="45%" stop-color="#6366f1" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <filter id="shadowH" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.75" />
    </filter>
    <filter id="glowFiltH" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#06b6d4" flood-opacity="0.4" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="122" fill="url(#bgH)" />
  <rect width="512" height="512" rx="122" fill="url(#glowH)" />
  <rect x="6" y="6" width="500" height="500" rx="118" stroke="url(#qSpectrumH)" stroke-width="2.5" fill="none" opacity="0.45" />

  <g filter="url(#shadowH)">
    <!-- THE Q: Unified Outer Contour and Inner Circular Hole -->
    <path d="
      M 236 80
      C 150 80, 80 150, 80 236
      C 80 322, 150 392, 236 392
      C 276 392, 312 376, 340 350
      C 370 380, 408 412, 442 418
      C 448 419, 452 411, 446 405
      C 424 380, 396 344, 380 310
      C 388 288, 392 262, 392 236
      C 392 150, 322 80, 236 80
      Z
      M 236 130
      C 295 130, 342 177, 342 236
      C 342 295, 295 342, 236 342
      C 177 342, 130 295, 130 236
      C 130 177, 177 130, 236 130
      Z
    " fill="url(#qSpectrumH)" fill-rule="evenodd" filter="url(#glowFiltH)" />

    <!-- Quran in Center -->
    <g transform="translate(236, 226)">
      <!-- Audio waves -->
      <path d="M -30 -56 A 38 38 0 0 1 30 -56" stroke="url(#goldH)" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.75" />
      <path d="M -16 -48 A 20 20 0 0 1 16 -48" stroke="url(#goldH)" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0.9" />

      <!-- Left Page -->
      <path d="M -2 -24 C -28 -38, -66 -34, -84 -18 C -88 -14, -88 28, -88 30 C -68 14, -30 16, -2 28 Z" fill="#ffffff" />
      <!-- Right Page -->
      <path d="M 2 -24 C 28 -38, 66 -34, 84 -18 C 88 -14, 88 28, 88 30 C 68 14, 30 16, 2 28 Z" fill="#f8fafc" />

      <!-- Verse Lines -->
      <path d="M -76 -6 C -58 -18, -36 -16, -14 -6 M -76 6 C -58 -6, -36 -4, -14 6 M -76 18 C -58 6, -36 8, -14 18 M 76 -6 C 58 -18, 36 -16, 14 -6 M 76 6 C 58 -4, 36 -2, 14 6 M 76 18 C 58 6, 36 8, 14 18" stroke="#0284c7" stroke-width="2.8" stroke-linecap="round" opacity="0.85" />

      <!-- Spine & Ribbon -->
      <line x1="0" y1="-26" x2="0" y2="30" stroke="url(#goldH)" stroke-width="5" stroke-linecap="round" />
      <path d="M 0 28 C -5 38, -7 48, -11 56 L 0 50 L 11 56 C 7 48, 5 38, 0 28 Z" fill="url(#goldH)" />
      <!-- Rehal Base -->
      <path d="M -54 38 L -26 54 L -6 46 M 54 38 L 26 54 L 6 46" stroke="url(#goldH)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

async function run() {
  fs.writeFileSync(path.join(outputDir, 'conceptG.svg'), svgG);
  fs.writeFileSync(path.join(outputDir, 'conceptH.svg'), svgH);

  await sharp(Buffer.from(svgG)).resize(512, 512).png().toFile(path.join(outputDir, 'conceptG.png'));
  await sharp(Buffer.from(svgH)).resize(512, 512).png().toFile(path.join(outputDir, 'conceptH.png'));
  console.log('Concepts G & H generated!');
}

run().catch(console.error);

