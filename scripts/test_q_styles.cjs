const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outputDir = path.resolve('scratch');

// DESIGN A: Refined continuous unified Q with elegant calligraphic sweep
const svgA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Deep Cosmic Obsidian Background -->
    <linearGradient id="bgA" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c1122" />
      <stop offset="45%" stop-color="#060914" />
      <stop offset="100%" stop-color="#0f162e" />
    </linearGradient>

    <!-- Spectrum Gradient for Q Loop: Emerald -> Cyan -> Blue -> Purple -> Pink -> Amber -->
    <linearGradient id="qSpectrum" x1="5%" y1="10%" x2="95%" y2="90%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="18%" stop-color="#06b6d4" />
      <stop offset="40%" stop-color="#3b82f6" />
      <stop offset="65%" stop-color="#8b5cf6" />
      <stop offset="85%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>

    <!-- Vibrant Tail Gradient: Hot Pink -> Coral -> Sunset Gold -->
    <linearGradient id="tailGradA" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="30%" stop-color="#f43f5e" />
      <stop offset="65%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>

    <!-- Pure Gold Shimmer -->
    <linearGradient id="goldA" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef9c3" />
      <stop offset="45%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Luminous Core Glow -->
    <radialGradient id="coreGlowA" cx="47%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.32" />
      <stop offset="40%" stop-color="#8b5cf6" stop-opacity="0.2" />
      <stop offset="75%" stop-color="#ec4899" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Outer Rim Glow -->
    <linearGradient id="rimGradA" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.7" />
      <stop offset="35%" stop-color="#8b5cf6" stop-opacity="0.6" />
      <stop offset="70%" stop-color="#ec4899" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.8" />
    </linearGradient>

    <filter id="shadowA" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000000" flood-opacity="0.75" />
    </filter>
    <filter id="qGlowA" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#06b6d4" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Background Squircle Card -->
  <rect width="512" height="512" rx="120" fill="url(#bgA)" />
  <rect width="512" height="512" rx="120" fill="url(#coreGlowA)" />
  <rect x="5" y="5" width="502" height="502" rx="116" stroke="url(#rimGradA)" stroke-width="2.5" fill="none" opacity="0.4" />

  <!-- Master 'Q' Group -->
  <g filter="url(#shadowA)">
    <!-- The Q Loop (Bold, balanced circular ring, cx=236, cy=226) -->
    <!-- Outer R=144, Inner R=94, Stroke width=50 -->
    <path d="
      M 236 82
      A 144 144 0 1 1 235.9 82
      Z
      M 236 132
      A 94 94 0 1 0 236.1 132
      Z
    " fill="url(#qSpectrum)" fill-rule="evenodd" filter="url(#qGlowA)" />

    <!-- Seamless Tail: Sweeps gracefully from inner lower-right, over the ring and out to the corner -->
    <!-- Tapered start at (246, 286), smoothly widens through the ring (316, 316), swooshes out to (434, 394) -->
    <path d="
      M 236 298
      C 270 292, 318 312, 362 344
      C 394 366, 428 392, 442 400
      C 448 404, 444 414, 434 412
      C 396 406, 350 388, 308 354
      C 280 332, 260 316, 236 298
      Z
    " fill="url(#tailGradA)" filter="url(#qGlowA)" />

    <!-- Tail Highlight Ribbon for dimensional gleam -->
    <path d="
      M 252 300
      C 282 302, 324 322, 368 352
      C 400 374, 430 398, 440 402
      C 416 400, 372 386, 334 358
      C 304 336, 276 318, 252 300
      Z
    " fill="url(#goldA)" opacity="0.7" />

    <!-- SACRED OPEN QURAN & AUDIO EMBLEM IN CENTER -->
    <g transform="translate(236, 222)">
      <!-- Audio wave arcs above Quran (representing continuous recitation) -->
      <path d="M -34 -58 A 42 42 0 0 1 34 -58" stroke="url(#goldA)" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.6" />
      <path d="M -22 -50 A 28 28 0 0 1 22 -50" stroke="url(#goldA)" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0.85" />
      <path d="M -10 -42 A 14 14 0 0 1 10 -42" stroke="url(#goldA)" stroke-width="4" fill="none" stroke-linecap="round" />

      <!-- Left Page of Holy Quran (Crisp curved parchment) -->
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

      <!-- Quranic text / Juz lines (rendered in sky blue & teal) -->
      <path d="
        M -76 -6 C -58 -18, -36 -16, -14 -6
        M -76 6 C -58 -6, -36 -4, -14 6
        M -76 18 C -58 6, -36 8, -14 18
        M 76 -6 C 58 -18, 36 -16, 14 -6
        M 76 6 C 58 -4, 36 -2, 14 6
        M 76 18 C 58 6, 36 8, 14 18
      " stroke="#0284c7" stroke-width="2.8" stroke-linecap="round" opacity="0.8" />

      <!-- Golden Center Spine -->
      <line x1="0" y1="-26" x2="0" y2="30" stroke="url(#goldA)" stroke-width="5" stroke-linecap="round" />

      <!-- Golden Bookmark Ribbon (Tahfeez ribbon) -->
      <path d="
        M 0 28
        C -5 38, -7 48, -11 56
        L 0 50
        L 11 56
        C 7 48, 5 38, 0 28
        Z
      " fill="url(#goldA)" />

      <!-- Wooden Stand / Rehal Base -->
      <path d="
        M -54 38 L -26 54 L -6 46
        M 54 38 L 26 54 L 6 46
      " stroke="url(#goldA)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

// DESIGN B: Modern Stylized "Q" where the loop bottom gracefully transitions into an energetic swoop
const svgB = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgB" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1024" />
      <stop offset="50%" stop-color="#04060f" />
      <stop offset="100%" stop-color="#0e1730" />
    </linearGradient>

    <linearGradient id="qGradB" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe" />
      <stop offset="25%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="75%" stop-color="#a855f7" />
      <stop offset="90%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>

    <linearGradient id="tailGradB" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="40%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#facc15" />
    </linearGradient>

    <linearGradient id="goldB" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <radialGradient id="glowB" cx="48%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35" />
      <stop offset="50%" stop-color="#a855f7" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <filter id="shadowB" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="120" fill="url(#bgB)" />
  <rect width="512" height="512" rx="120" fill="url(#glowB)" />
  <rect x="5" y="5" width="502" height="502" rx="116" stroke="url(#qGradB)" stroke-width="2.5" fill="none" opacity="0.4" />

  <g filter="url(#shadowB)">
    <!-- Top Arc of Q -->
    <path d="
      M 112 226
      C 112 150, 168 94, 244 94
      C 320 94, 376 150, 376 226
      C 376 302, 320 358, 244 358
      C 200 358, 162 336, 138 304
      L 98 334
      C 132 378, 184 406, 244 406
      C 346 406, 424 328, 424 226
      C 424 124, 346 46, 244 46
      C 142 46, 64 124, 64 226
      C 64 266, 76 304, 98 334
      Z
    " fill="none" />

    <!-- A sleek continuous dynamic Q contour -->
    <path d="
      M 236 80
      C 146 80, 84 144, 84 232
      C 84 320, 146 384, 236 384
      C 272 384, 306 372, 334 350
      C 356 376, 392 408, 436 418
      C 444 420, 448 412, 442 404
      C 418 376, 396 342, 382 312
      C 386 286, 388 260, 388 232
      C 388 144, 326 80, 236 80
      Z
      M 236 130
      C 294 130, 338 174, 338 232
      C 338 258, 328 284, 314 302
      C 290 286, 260 274, 234 268
      C 252 292, 274 320, 282 342
      C 268 346, 252 348, 236 348
      C 178 348, 134 304, 134 232
      C 134 174, 178 130, 236 130
      Z
    " fill="url(#qGradB)" />

    <!-- Radiant tail overlay blade -->
    <path d="
      M 314 302
      C 342 328, 384 366, 436 418
      C 444 420, 448 412, 442 404
      C 418 376, 394 340, 380 310
      C 358 304, 334 300, 314 302
      Z
    " fill="url(#tailGradB)" />

    <!-- Quran Emblem -->
    <g transform="translate(236, 226)">
      <!-- Audio waves -->
      <line x1="-28" y1="-54" x2="-28" y2="-44" stroke="url(#goldB)" stroke-width="3" stroke-linecap="round" opacity="0.8" />
      <line x1="-14" y1="-60" x2="-14" y2="-46" stroke="url(#goldB)" stroke-width="3.5" stroke-linecap="round" opacity="0.9" />
      <line x1="0" y1="-66" x2="0" y2="-48" stroke="url(#goldB)" stroke-width="4" stroke-linecap="round" />
      <line x1="14" y1="-60" x2="14" y2="-46" stroke="url(#goldB)" stroke-width="3.5" stroke-linecap="round" opacity="0.9" />
      <line x1="28" y1="-54" x2="28" y2="-44" stroke="url(#goldB)" stroke-width="3" stroke-linecap="round" opacity="0.8" />

      <!-- Left Page -->
      <path d="
        M -2 -24
        C -28 -38, -66 -34, -84 -18
        C -88 -14, -88 28, -88 30
        C -68 14, -30 16, -2 28
        Z
      " fill="#ffffff" />
      <!-- Right Page -->
      <path d="
        M 2 -24
        C 28 -38, 66 -34, 84 -18
        C 88 -14, 88 28, 88 30
        C 68 14, 30 16, 2 28
        Z
      " fill="#f8fafc" />

      <!-- Page lines -->
      <path d="
        M -76 -6 C -58 -18, -36 -16, -14 -6
        M -76 6 C -58 -6, -36 -4, -14 6
        M -76 18 C -58 6, -36 8, -14 18
        M 76 -6 C 58 -18, 36 -16, 14 -6
        M 76 6 C 58 -4, 36 -2, 14 6
        M 76 18 C 58 6, 36 8, 14 18
      " stroke="#0ea5e9" stroke-width="2.8" stroke-linecap="round" opacity="0.8" />

      <!-- Spine & ribbon -->
      <line x1="0" y1="-26" x2="0" y2="30" stroke="url(#goldB)" stroke-width="5" stroke-linecap="round" />
      <path d="M 0 28 L -10 52 L 0 46 L 10 52 Z" fill="url(#goldB)" />
      <!-- Rehal base -->
      <path d="M -52 38 L -26 54 L -6 46 M 52 38 L 26 54 L 6 46" stroke="url(#goldB)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

async function run() {
  fs.writeFileSync(path.join(outputDir, 'designA.svg'), svgA);
  fs.writeFileSync(path.join(outputDir, 'designB.svg'), svgB);

  await sharp(Buffer.from(svgA)).resize(512, 512).png().toFile(path.join(outputDir, 'designA.png'));
  await sharp(Buffer.from(svgB)).resize(512, 512).png().toFile(path.join(outputDir, 'designB.png'));
  console.log('Design A and B generated!');
}

run().catch(console.error);

