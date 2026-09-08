const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outputDir = path.resolve('scratch');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// VARIANT 1: Sleek continuous modern Q with dynamic sweep & refined glowing Quran
const svg1 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="v1_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1021" />
      <stop offset="50%" stop-color="#060913" />
      <stop offset="100%" stop-color="#0d1428" />
    </linearGradient>

    <linearGradient id="v1_border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
      <stop offset="35%" stop-color="#818cf8" stop-opacity="0.6" />
      <stop offset="70%" stop-color="#ec4899" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.9" />
    </linearGradient>

    <!-- Rich vibrant multi-hue gradient for Q -->
    <linearGradient id="v1_qGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe" />
      <stop offset="25%" stop-color="#3b82f6" />
      <stop offset="50%" stop-color="#8b5cf6" />
      <stop offset="75%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>

    <linearGradient id="v1_tailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="40%" stop-color="#f43f5e" />
      <stop offset="75%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>

    <linearGradient id="v1_gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>

    <radialGradient id="v1_glow" cx="48%" cy="46%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
      <stop offset="50%" stop-color="#8b5cf6" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <filter id="v1_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.7" />
    </filter>
    <filter id="v1_qGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#0ea5e9" flood-opacity="0.4" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="120" fill="url(#v1_bg)" />
  <rect width="512" height="512" rx="120" fill="url(#v1_glow)" />
  <rect x="6" y="6" width="500" height="500" rx="116" stroke="url(#v1_border)" stroke-width="2.5" fill="none" opacity="0.5" />

  <!-- Single unified Q Path with organic calligraphy tail -->
  <g filter="url(#v1_shadow)">
    <!-- Main Q Body & Sweeping Tail -->
    <path d="
      M 240 76
      C 142 76, 76 142, 76 240
      C 76 338, 142 404, 240 404
      C 278 404, 314 391, 342 370
      C 356 384, 384 414, 424 430
      C 434 434, 442 426, 436 416
      C 422 390, 408 358, 396 334
      C 402 306, 404 274, 404 240
      C 404 142, 338 76, 240 76
      Z
      M 240 128
      C 304 128, 352 178, 352 240
      C 352 268, 344 294, 330 314
      C 310 292, 280 274, 252 266
      C 272 290, 290 320, 296 348
      C 280 354, 260 356, 240 356
      C 176 356, 128 304, 128 240
      C 128 178, 176 128, 240 128
      Z
    " fill="url(#v1_qGrad)" fill-rule="evenodd" filter="url(#v1_qGlow)" />

    <!-- Quran Emblem nested in Q Center -->
    <g transform="translate(240, 236)">
      <!-- Audio wave crown -->
      <path d="
        M -36 -50 L -36 -40
        M -18 -58 L -18 -42
        M 0 -64 L 0 -44
        M 18 -58 L 18 -42
        M 36 -50 L 36 -40
      " stroke="url(#v1_gold)" stroke-width="3.5" stroke-linecap="round" />

      <!-- Left Page -->
      <path d="
        M -2 -24
        C -26 -36, -60 -32, -76 -18
        C -80 -14, -80 24, -80 26
        C -62 14, -28 16, -2 28
        Z
      " fill="#ffffff" />
      <!-- Right Page -->
      <path d="
        M 2 -24
        C 26 -36, 60 -32, 76 -18
        C 80 -14, 80 24, 80 26
        C 62 14, 28 16, 2 28
        Z
      " fill="#f8fafc" />

      <!-- Page lines -->
      <path d="
        M -68 -8 C -52 -18, -32 -16, -14 -8
        M -68 4 C -52 -6, -32 -4, -14 4
        M -68 16 C -52 6, -32 8, -14 16
        M 68 -8 C 52 -18, 32 -16, 14 -8
        M 68 4 C 52 -6, 32 -4, 14 4
        M 68 16 C 52 6, 32 8, 14 16
      " stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" opacity="0.75" />

      <!-- Spine & Bookmark Ribbon -->
      <line x1="0" y1="-26" x2="0" y2="30" stroke="url(#v1_gold)" stroke-width="4.5" stroke-linecap="round" />
      <path d="M 0 28 L -8 48 L 0 44 L 8 48 Z" fill="url(#v1_gold)" />
      <!-- Rehal base -->
      <path d="M -48 36 L -24 50 L -6 44 M 48 36 L 24 50 L 6 44" stroke="url(#v1_gold)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

// VARIANT 2: Premium 3D Ribbon Q with emerald, sky, purple & gold Islamic geometry
const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="v2_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a101f" />
      <stop offset="50%" stop-color="#030712" />
      <stop offset="100%" stop-color="#0c1328" />
    </linearGradient>

    <!-- Top Left to Bottom Right Arc Gradient -->
    <linearGradient id="v2_arc1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="25%" stop-color="#06b6d4" />
      <stop offset="55%" stop-color="#3b82f6" />
      <stop offset="85%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>

    <!-- Tail & Bottom Flourish Gradient -->
    <linearGradient id="v2_arc2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="35%" stop-color="#f43f5e" />
      <stop offset="70%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>

    <linearGradient id="v2_gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="40%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <radialGradient id="v2_glow" cx="46%" cy="44%" r="55%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.35" />
      <stop offset="45%" stop-color="#8b5cf6" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <filter id="v2_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000000" flood-opacity="0.75" />
    </filter>
    <filter id="v2_glowFilt" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#38bdf8" flood-opacity="0.4" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="120" fill="url(#v2_bg)" />
  <rect width="512" height="512" rx="120" fill="url(#v2_glow)" />
  
  <!-- Subtle Islamic 8-Point Star ambient watermark in background -->
  <g transform="translate(256, 240)" opacity="0.07" stroke="#ffffff" stroke-width="2" fill="none">
    <rect x="-110" y="-110" width="220" height="220" rx="10" />
    <rect x="-110" y="-110" width="220" height="220" rx="10" transform="rotate(45)" />
  </g>

  <!-- Colorful Outer Squircle Rim -->
  <rect x="6" y="6" width="500" height="500" rx="116" stroke="url(#v2_arc1)" stroke-width="2" fill="none" opacity="0.4" />

  <g filter="url(#v2_shadow)">
    <!-- Outer Q Ring with elegant varying stroke -->
    <path d="
      M 240 84
      A 144 144 0 1 1 138 342
      A 144 144 0 0 1 240 84
      Z
      M 240 136
      A 92 92 0 1 0 175 301
      A 92 92 0 0 0 240 136
      Z
    " fill="url(#v2_arc1)" fill-rule="evenodd" filter="url(#v2_glowFilt)" />

    <!-- Dynamic Tail that crosses through and extends majestically -->
    <path d="
      M 264 260
      C 300 294, 340 334, 420 380
      C 434 388, 432 404, 416 406
      C 370 412, 310 398, 252 352
      C 228 332, 218 312, 226 294
      C 232 278, 248 266, 264 260
      Z
    " fill="url(#v2_arc2)" filter="url(#v2_glowFilt)" />

    <!-- Tail Core Highlight -->
    <path d="
      M 276 272
      C 308 304, 346 342, 414 386
      C 382 396, 332 388, 280 348
      C 258 332, 250 318, 256 304
      C 260 292, 268 280, 276 272
      Z
    " fill="url(#v2_gold)" opacity="0.75" />

    <!-- Quran & Recitation Audio Centerpiece -->
    <g transform="translate(240, 230)">
      <!-- Radiant Islamic Crescent & Star at top -->
      <path d="
        M 0 -64
        A 14 14 0 1 1 12 -46
        A 12 12 0 1 0 -2 -62
        Z
      " fill="url(#v2_gold)" opacity="0.9" />

      <!-- Glowing Open Quran (Wings of Light) -->
      <!-- Left Page -->
      <path d="
        M -2 -22
        C -28 -34, -62 -30, -78 -16
        C -82 -12, -82 26, -82 28
        C -64 14, -28 16, -2 28
        Z
      " fill="#ffffff" />
      <!-- Right Page -->
      <path d="
        M 2 -22
        C 28 -34, 62 -30, 78 -16
        C 82 -12, 82 26, 82 28
        C 64 14, 28 16, 2 28
        Z
      " fill="#f8fafc" />

      <!-- Elegant Verse Lines -->
      <path d="
        M -70 -6 C -54 -16, -34 -14, -14 -6
        M -70 6 C -54 -4, -34 -2, -14 6
        M -70 18 C -54 8, -34 10, -14 18
        M 70 -6 C 54 -16, 34 -14, 14 -6
        M 70 6 C 54 -4, 34 -2, 14 6
        M 70 18 C 54 8, 34 10, 14 18
      " stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round" opacity="0.8" />

      <!-- Gold Center Spine & Bookmark Ribbon -->
      <line x1="0" y1="-24" x2="0" y2="30" stroke="url(#v2_gold)" stroke-width="5" stroke-linecap="round" />
      <path d="
        M 0 28
        C -5 36, -7 46, -10 52
        L 0 47
        L 10 52
        C 7 46, 5 36, 0 28
        Z
      " fill="url(#v2_gold)" />

      <!-- Elegant Golden Stand / Rehal -->
      <path d="
        M -48 38 L -24 52 L -6 46
        M 48 38 L 24 52 L 6 46
      " stroke="url(#v2_gold)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

// VARIANT 3: Bold Geometric Modern Letter Q where the Q is the hero, Quran is integrated as the heart
const svg3 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="v3_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#020617" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>

    <linearGradient id="v3_qGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee" />
      <stop offset="20%" stop-color="#3b82f6" />
      <stop offset="45%" stop-color="#6366f1" />
      <stop offset="70%" stop-color="#a855f7" />
      <stop offset="90%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>

    <linearGradient id="v3_tailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="50%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#facc15" />
    </linearGradient>

    <linearGradient id="v3_gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#eab308" />
    </linearGradient>

    <radialGradient id="v3_glow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35" />
      <stop offset="50%" stop-color="#a855f7" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <filter id="v3_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="124" fill="url(#v3_bg)" />
  <rect width="512" height="512" rx="124" fill="url(#v3_glow)" />
  <rect x="5" y="5" width="502" height="502" rx="120" stroke="url(#v3_qGrad)" stroke-width="2.5" fill="none" opacity="0.4" />

  <g filter="url(#v3_shadow)">
    <!-- The Q Bowl: Clean, bold, iconic ring -->
    <circle cx="236" cy="226" r="142" stroke="url(#v3_qGrad)" stroke-width="48" fill="none" />

    <!-- The Q Tail: Elegant, tapered curved blade -->
    <path d="
      M 314 286
      C 346 318, 386 358, 432 388
      C 440 393, 434 406, 422 404
      C 370 398, 320 376, 276 332
      C 264 320, 260 306, 266 294
      C 274 278, 294 272, 314 286
      Z
    " fill="url(#v3_tailGrad)" />

    <!-- Quran Silhouette Inside The Ring -->
    <g transform="translate(236, 226)">
      <!-- Audio wave arcs above -->
      <path d="M -30 -54 A 36 36 0 0 1 30 -54" stroke="url(#v3_gold)" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0.8" />
      <path d="M -18 -46 A 22 22 0 0 1 18 -46" stroke="url(#v3_gold)" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.9" />

      <!-- Left Page -->
      <path d="
        M -2 -22
        C -26 -34, -58 -30, -74 -16
        C -78 -12, -78 26, -78 28
        C -60 14, -26 16, -2 28
        Z
      " fill="#ffffff" />
      <!-- Right Page -->
      <path d="
        M 2 -22
        C 26 -34, 58 -30, 74 -16
        C 78 -12, 78 26, 78 28
        C 60 14, 26 16, 2 28
        Z
      " fill="#f1f5f9" />

      <!-- Verses text stripes in vibrant theme colors -->
      <path d="
        M -64 -6 C -48 -16, -28 -14, -12 -6
        M -64 6 C -48 -4, -28 -2, -12 6
        M -64 18 C -48 8, -28 10, -12 18
        M 64 -6 C 48 -16, 28 -14, 12 -6
        M 64 6 C 48 -4, 28 -2, 12 6
        M 64 18 C 48 8, 28 10, 12 18
      " stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round" opacity="0.8" />

      <!-- Gold Spine -->
      <line x1="0" y1="-24" x2="0" y2="30" stroke="url(#v3_gold)" stroke-width="4.5" stroke-linecap="round" />
      <!-- Gold Bookmark ribbon -->
      <path d="M 0 28 L -8 48 L 0 43 L 8 48 Z" fill="url(#v3_gold)" />
      <!-- Rehal Stand -->
      <path d="M -44 36 L -20 50 L -6 44 M 44 36 L 20 50 L 6 44" stroke="url(#v3_gold)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

async function run() {
  fs.writeFileSync(path.join(outputDir, 'variant1.svg'), svg1);
  fs.writeFileSync(path.join(outputDir, 'variant2.svg'), svg2);
  fs.writeFileSync(path.join(outputDir, 'variant3.svg'), svg3);

  await sharp(Buffer.from(svg1)).resize(512, 512).png().toFile(path.join(outputDir, 'variant1.png'));
  await sharp(Buffer.from(svg2)).resize(512, 512).png().toFile(path.join(outputDir, 'variant2.png'));
  await sharp(Buffer.from(svg3)).resize(512, 512).png().toFile(path.join(outputDir, 'variant3.png'));
  console.log('All variants generated!');
}

run().catch(console.error);

