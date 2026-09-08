const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outputDir = path.resolve('scratch');

// DESIGN F: Pristine inner circle, typographic perfection Q tail, luxury Quran & crescent
const svgF = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Deep Cosmic Dark Base -->
    <linearGradient id="bgF" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f20" />
      <stop offset="50%" stop-color="#040711" />
      <stop offset="100%" stop-color="#0d1428" />
    </linearGradient>

    <!-- Vibrant Rainbow Spectrum for Q: Emerald -> Teal -> Sky -> Indigo -> Purple -> Rose -->
    <linearGradient id="qSpectrumF" x1="10%" y1="10%" x2="90%" y2="90%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="18%" stop-color="#06b6d4" />
      <stop offset="38%" stop-color="#3b82f6" />
      <stop offset="62%" stop-color="#6366f1" />
      <stop offset="82%" stop-color="#a855f7" />
      <stop offset="95%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>

    <!-- Glowing Tail Gradient: Rose Pink -> Sunset Orange -> Radiant Gold -->
    <linearGradient id="tailGradF" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="35%" stop-color="#f43f5e" />
      <stop offset="70%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>

    <!-- Pure Brilliant Gold -->
    <linearGradient id="goldF" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="45%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Ambient Core Glow -->
    <radialGradient id="coreGlowF" cx="47%" cy="44%" r="55%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.32" />
      <stop offset="45%" stop-color="#6366f1" stop-opacity="0.2" />
      <stop offset="75%" stop-color="#ec4899" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Glowing Squircle Border -->
    <linearGradient id="borderGradF" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.8" />
      <stop offset="30%" stop-color="#3b82f6" stop-opacity="0.6" />
      <stop offset="70%" stop-color="#ec4899" stop-opacity="0.65" />
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.85" />
    </linearGradient>

    <!-- Book Page Gradient -->
    <linearGradient id="pageGradF" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f0f9ff" />
    </linearGradient>

    <!-- Shadows and Glows -->
    <filter id="shadowF" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.75" />
    </filter>
    <filter id="qGlowF" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#06b6d4" flood-opacity="0.4" />
    </filter>
    <filter id="tailGlowF" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#f43f5e" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- App Card Base Squircle -->
  <rect width="512" height="512" rx="122" fill="url(#bgF)" />
  <rect width="512" height="512" rx="122" fill="url(#coreGlowF)" />
  <rect x="6" y="6" width="500" height="500" rx="118" stroke="url(#borderGradF)" stroke-width="2.5" fill="none" opacity="0.45" />

  <!-- Sacred Geometry Background Watermark (Islamic 8-Point Star, Subtle) -->
  <g transform="translate(236, 224)" opacity="0.06" stroke="#ffffff" stroke-width="2" fill="none">
    <circle r="185" />
    <rect x="-130" y="-130" width="260" height="260" rx="12" />
    <rect x="-130" y="-130" width="260" height="260" rx="12" transform="rotate(45)" />
  </g>

  <!-- THE MASTER LETTER 'Q' + HOLY QURAN EMBLEM -->
  <g filter="url(#shadowF)">

    <!-- The Q Bowl: Pristine circle cx=236, cy=224, R=142, r=96, thickness=46px -->
    <circle cx="236" cy="224" r="142" stroke="url(#qSpectrumF)" stroke-width="46" fill="none" filter="url(#qGlowF)" />

    <!-- The Q Tail: Elegant, fluid typographic flourish sweeping from the bottom right of the ring -->
    <!-- Starts along the outer curve at (328, 308) and (274, 356), swooshes out gracefully toward (442, 404) -->
    <path d="
      M 314 292
      C 342 320, 380 354, 434 388
      C 448 396, 446 410, 432 414
      C 392 422, 340 404, 288 356
      C 278 346, 288 334, 300 324
      C 306 312, 310 302, 314 292
      Z
    " fill="url(#tailGradF)" filter="url(#tailGlowF)" />

    <!-- Tail Core Ribbon Highlight for 3D depth and shimmer -->
    <path d="
      M 324 304
      C 350 330, 386 364, 432 394
      C 406 406, 362 396, 314 362
      C 310 348, 318 330, 324 304
      Z
    " fill="url(#goldF)" opacity="0.75" />

    <!-- SACRED QURAN & RECITATION EMBLEM IN CENTER (cx=236, cy=224) -->
    <g transform="translate(236, 224)">

      <!-- Radiant Islamic Crescent & Star at top -->
      <!-- Crescent -->
      <path d="
        M 0 -64
        A 14 14 0 1 1 12 -46
        A 11 11 0 1 0 -2 -62
        Z
      " fill="url(#goldF)" opacity="0.95" />
      <!-- 4-Point Golden Star -->
      <path d="
        M 10 -60
        Q 10 -55 15 -55
        Q 10 -55 10 -50
        Q 10 -55 5 -55
        Q 10 -55 10 -60
        Z
      " fill="url(#goldF)" />

      <!-- Left Page of Holy Quran -->
      <path d="
        M -2 -24
        C -28 -38, -66 -34, -84 -18
        C -88 -14, -88 28, -88 30
        C -68 14, -30 16, -2 28
        Z
      " fill="url(#pageGradF)" />

      <!-- Right Page of Holy Quran -->
      <path d="
        M 2 -24
        C 28 -38, 66 -34, 84 -18
        C 88 -14, 88 28, 88 30
        C 68 14, 30 16, 2 28
        Z
      " fill="url(#pageGradF)" />

      <!-- Quranic Ayah Lines in Celestial Sky Blue -->
      <path d="
        M -76 -6 C -58 -18, -36 -16, -14 -6
        M -76 6 C -58 -6, -36 -4, -14 6
        M -76 18 C -58 6, -36 8, -14 18
        M 76 -6 C 58 -18, 36 -16, 14 -6
        M 76 6 C 58 -4, 36 -2, 14 6
        M 76 18 C 58 6, 36 8, 14 18
      " stroke="#0284c7" stroke-width="2.8" stroke-linecap="round" opacity="0.85" />

      <!-- Golden Center Spine -->
      <line x1="0" y1="-26" x2="0" y2="30" stroke="url(#goldF)" stroke-width="5" stroke-linecap="round" />

      <!-- Golden Bookmark Ribbon (Tahfeez ribbon) -->
      <path d="
        M 0 28
        C -5 38, -7 48, -11 56
        L 0 50
        L 11 56
        C 7 48, 5 38, 0 28
        Z
      " fill="url(#goldF)" />

      <!-- Wooden Stand / Rehal Base -->
      <path d="
        M -54 38 L -26 54 L -6 46
        M 54 38 L 26 54 L 6 46
      " stroke="url(#goldF)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

async function run() {
  fs.writeFileSync(path.join(outputDir, 'designF.svg'), svgF);
  await sharp(Buffer.from(svgF)).resize(512, 512).png().toFile(path.join(outputDir, 'designF.png'));
  console.log('Design F generated!');
}

run().catch(console.error);

