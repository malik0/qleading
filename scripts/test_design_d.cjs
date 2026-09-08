const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outputDir = path.resolve('scratch');

// DESIGN D: Geometric Perfection Q with Calligraphic Tail & Harmonious Quran
const svgD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Deep Midnight Gradient Base -->
    <linearGradient id="bgD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1124" />
      <stop offset="50%" stop-color="#050814" />
      <stop offset="100%" stop-color="#0e162e" />
    </linearGradient>

    <!-- Spectrum Gradient for Q: Emerald -> Sky Cyan -> Royal Blue -> Violet -> Rose -->
    <linearGradient id="qSpectrumD" x1="10%" y1="10%" x2="85%" y2="85%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="20%" stop-color="#06b6d4" />
      <stop offset="42%" stop-color="#3b82f6" />
      <stop offset="68%" stop-color="#7c3aed" />
      <stop offset="88%" stop-color="#db2777" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>

    <!-- Glowing Tail Gradient: Rose -> Amber Orange -> Radiant Gold -->
    <linearGradient id="tailGradD" x1="10%" y1="20%" x2="90%" y2="90%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="35%" stop-color="#f43f5e" />
      <stop offset="70%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>

    <!-- Pure Luminous Gold -->
    <linearGradient id="goldD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="45%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Ambient Core Glow -->
    <radialGradient id="coreGlowD" cx="47%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.3" />
      <stop offset="45%" stop-color="#7c3aed" stop-opacity="0.18" />
      <stop offset="75%" stop-color="#db2777" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Glowing Card Border -->
    <linearGradient id="rimGradD" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.75" />
      <stop offset="30%" stop-color="#3b82f6" stop-opacity="0.6" />
      <stop offset="65%" stop-color="#db2777" stop-opacity="0.65" />
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.8" />
    </linearGradient>

    <!-- Book Page Gradient -->
    <linearGradient id="pageGradD" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f0f9ff" />
    </linearGradient>

    <filter id="shadowD" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.75" />
    </filter>
    <filter id="qGlowD" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#06b6d4" flood-opacity="0.4" />
    </filter>
    <filter id="tailGlowD" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#f43f5e" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- App Card Base -->
  <rect width="512" height="512" rx="122" fill="url(#bgD)" />
  <rect width="512" height="512" rx="122" fill="url(#coreGlowD)" />
  <rect x="6" y="6" width="500" height="500" rx="118" stroke="url(#rimGradD)" stroke-width="2.5" fill="none" opacity="0.45" />

  <!-- Subtle sacred geometry ambient background pattern -->
  <g transform="translate(240, 226)" opacity="0.06" stroke="#ffffff" stroke-width="2" fill="none">
    <circle r="180" />
    <polygon points="0,-180 127,-127 180,0 127,127 0,180 -127,127 -180,0 -127,-127" />
  </g>

  <!-- MASTER 'Q' + QURAN EMBLEM -->
  <g filter="url(#shadowD)">
    <!-- THE 'Q' BODY: Perfectly unified circular ring with sweeping calligraphic tail -->
    <!-- Center (240, 226). Outer radius R=142, Inner cutout radius r=94 -->
    <path d="
      M 240 84
      A 142 142 0 0 1 376 270
      C 394 308, 426 352, 442 390
      C 448 402, 436 414, 424 408
      C 382 388, 334 372, 286 366
      A 142 142 0 0 1 98 226
      A 142 142 0 0 1 240 84
      Z
      M 240 132
      A 94 94 0 1 0 240.1 132
      Z
    " fill="url(#qSpectrumD)" fill-rule="evenodd" filter="url(#qGlowD)" />

    <!-- Radiant Glowing Accent Layer along the Tail Sweep -->
    <path d="
      M 342 292
      C 370 326, 408 368, 442 390
      C 448 402, 436 414, 424 408
      C 378 386, 326 368, 274 364
      C 298 358, 322 344, 342 320
      C 348 312, 350 300, 342 292
      Z
    " fill="url(#tailGradD)" filter="url(#tailGlowD)" />

    <!-- Shimmering Golden Ribbon Highlight on Tail -->
    <path d="
      M 346 304
      C 374 336, 412 374, 438 394
      C 406 386, 362 374, 314 366
      C 330 354, 342 334, 346 304
      Z
    " fill="url(#goldD)" opacity="0.8" />

    <!-- SACRED OPEN QURAN & RECITATION EMBLEM IN CENTER (cx=240, cy=226) -->
    <g transform="translate(240, 224)">
      <!-- Audio Wave Rays / Divine Light Beams above Quran -->
      <line x1="-30" y1="-56" x2="-30" y2="-44" stroke="url(#goldD)" stroke-width="3" stroke-linecap="round" opacity="0.75" />
      <line x1="-15" y1="-62" x2="-15" y2="-46" stroke="url(#goldD)" stroke-width="3.5" stroke-linecap="round" opacity="0.9" />
      <line x1="0" y1="-68" x2="0" y2="-48" stroke="url(#goldD)" stroke-width="4" stroke-linecap="round" />
      <line x1="15" y1="-62" x2="15" y2="-46" stroke="url(#goldD)" stroke-width="3.5" stroke-linecap="round" opacity="0.9" />
      <line x1="30" y1="-56" x2="30" y2="-44" stroke="url(#goldD)" stroke-width="3" stroke-linecap="round" opacity="0.75" />

      <!-- Left Page of Holy Quran -->
      <path d="
        M -2 -24
        C -28 -38, -66 -34, -84 -18
        C -88 -14, -88 28, -88 30
        C -68 14, -30 16, -2 28
        Z
      " fill="url(#pageGradD)" />

      <!-- Right Page of Holy Quran -->
      <path d="
        M 2 -24
        C 28 -38, 66 -34, 84 -18
        C 88 -14, 88 28, 88 30
        C 68 14, 30 16, 2 28
        Z
      " fill="url(#pageGradD)" />

      <!-- Quranic Ayah / Juz Lines (Rich Sapphire Blue) -->
      <path d="
        M -76 -6 C -58 -18, -36 -16, -14 -6
        M -76 6 C -58 -6, -36 -4, -14 6
        M -76 18 C -58 6, -36 8, -14 18
        M 76 -6 C 58 -18, 36 -16, 14 -6
        M 76 6 C 58 -4, 36 -2, 14 6
        M 76 18 C 58 6, 36 8, 14 18
      " stroke="#0284c7" stroke-width="2.8" stroke-linecap="round" opacity="0.85" />

      <!-- Golden Center Spine -->
      <line x1="0" y1="-26" x2="0" y2="30" stroke="url(#goldD)" stroke-width="5" stroke-linecap="round" />

      <!-- Golden Bookmark Ribbon (Tahfeez ribbon) -->
      <path d="
        M 0 28
        C -5 38, -7 48, -11 56
        L 0 50
        L 11 56
        C 7 48, 5 38, 0 28
        Z
      " fill="url(#goldD)" />

      <!-- Wooden Stand / Rehal Base -->
      <path d="
        M -54 38 L -26 54 L -6 46
        M 54 38 L 26 54 L 6 46
      " stroke="url(#goldD)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

async function run() {
  fs.writeFileSync(path.join(outputDir, 'designD.svg'), svgD);
  await sharp(Buffer.from(svgD)).resize(512, 512).png().toFile(path.join(outputDir, 'designD.png'));
  console.log('Design D generated!');
}

run().catch(console.error);

