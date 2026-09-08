const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080d1a" />
      <stop offset="45%" stop-color="#050813" />
      <stop offset="100%" stop-color="#0c1224" />
    </linearGradient>

    <!-- Border Glow Gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
      <stop offset="25%" stop-color="#818cf8" stop-opacity="0.6" />
      <stop offset="60%" stop-color="#f43f5e" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.8" />
    </linearGradient>

    <!-- Ambient Core Glow -->
    <radialGradient id="coreGlow" cx="46%" cy="44%" r="55%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.32" />
      <stop offset="40%" stop-color="#818cf8" stop-opacity="0.18" />
      <stop offset="75%" stop-color="#c084fc" stop-opacity="0.06" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Primary Q Outer Ring Gradient -->
    <linearGradient id="qRingGrad" x1="10%" y1="10%" x2="90%" y2="90%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="22%" stop-color="#3b82f6" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="75%" stop-color="#a855f7" />
      <stop offset="90%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>

    <!-- Q Tail Sweep Gradient -->
    <linearGradient id="qTailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="35%" stop-color="#f43f5e" />
      <stop offset="70%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>

    <!-- Gold Accent Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="40%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Book Pages Gradient -->
    <linearGradient id="pageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.65" />
    </filter>
    <filter id="qGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#0284c7" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- App Card Base Squircle -->
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)" />

  <!-- Ambient Radial Glow -->
  <rect width="512" height="512" rx="120" fill="url(#coreGlow)" />

  <!-- Subtle Colorful Outer Rim -->
  <rect x="5" y="5" width="502" height="502" rx="116" stroke="url(#borderGrad)" stroke-width="2.5" fill="none" opacity="0.45" />

  <!-- THE 'Q' + QURAN ICON -->
  <g filter="url(#dropShadow)">

    <!-- The Q Ring (Bold circular loop) -->
    <!-- Center (236, 226), outer radius 136, inner radius 92 (thickness 44) -->
    <path d="
      M 236 90
      A 136 136 0 1 1 235.9 90
      Z
      M 236 134
      A 92 92 0 1 0 236.1 134
      Z
    " fill="url(#qRingGrad)" fill-rule="evenodd" filter="url(#qGlow)" />

    <!-- Modern Q Tail Flourish -->
    <!-- A dynamic, sweeping ribbon that flows out of the bottom right of the Q -->
    <path d="
      M 296 280
      C 328 308, 376 342, 420 366
      C 428 370, 426 382, 414 386
      C 376 398, 328 392, 274 358
      C 256 346, 248 334, 252 322
      C 256 308, 274 294, 296 280
      Z
    " fill="url(#qTailGrad)" filter="url(#qGlow)" />

    <!-- Tail Accent Stroke (Gives beautiful 3D layered ribbon feel) -->
    <path d="
      M 302 286
      C 330 314, 376 348, 418 368
      C 386 382, 342 380, 294 354
      C 278 344, 270 334, 272 326
      C 276 312, 288 300, 302 286
      Z
    " fill="url(#goldGrad)" opacity="0.4" />

    <!-- Centered Sacred Quran & Audio Light inside the Q Loop -->
    <g transform="translate(236, 222)">

      <!-- Audio Waves / Light Beams Rising above the Quran -->
      <line x1="-32" y1="-50" x2="-32" y2="-38" stroke="url(#goldGrad)" stroke-width="3.5" stroke-linecap="round" opacity="0.75" />
      <line x1="-16" y1="-58" x2="-16" y2="-40" stroke="url(#goldGrad)" stroke-width="3.5" stroke-linecap="round" opacity="0.9" />
      <line x1="0" y1="-64" x2="0" y2="-42" stroke="url(#goldGrad)" stroke-width="4" stroke-linecap="round" />
      <line x1="16" y1="-58" x2="16" y2="-40" stroke="url(#goldGrad)" stroke-width="3.5" stroke-linecap="round" opacity="0.9" />
      <line x1="32" y1="-50" x2="32" y2="-38" stroke="url(#goldGrad)" stroke-width="3.5" stroke-linecap="round" opacity="0.75" />

      <!-- Left Page of Holy Quran -->
      <path d="
        M -2 -24
        C -24 -34, -58 -32, -72 -20
        C -76 -16, -76 26, -76 28
        C -58 14, -26 16, -2 28
        Z
      " fill="url(#pageGrad)" filter="url(#qGlow)" />

      <!-- Right Page of Holy Quran -->
      <path d="
        M 2 -24
        C 24 -34, 58 -32, 72 -20
        C 76 -16, 76 26, 76 28
        C 58 14, 26 16, 2 28
        Z
      " fill="url(#pageGrad)" filter="url(#qGlow)" />

      <!-- Soft Page Shading / Verses Lines -->
      <path d="
        M -64 -10 C -48 -20, -28 -18, -12 -10
        M -64 2 C -48 -8, -28 -6, -12 2
        M -64 14 C -48 4, -28 6, -12 14
      " stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" opacity="0.65" />

      <path d="
        M 64 -10 C 48 -20, 28 -18, 12 -10
        M 64 2 C 48 -8, 28 -6, 12 2
        M 64 14 C 48 4, 28 6, 12 14
      " stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" opacity="0.65" />

      <!-- Golden Center Spine -->
      <line x1="0" y1="-26" x2="0" y2="30" stroke="url(#goldGrad)" stroke-width="4.5" stroke-linecap="round" />

      <!-- Golden Bookmark Ribbon (Tahfeez) hanging down -->
      <path d="
        M 0 28
        C -4 36, -6 44, -9 50
        L 0 46
        L 9 50
        C 6 44, 4 36, 0 28
        Z
      " fill="url(#goldGrad)" />

      <!-- Wooden Stand / Rehal Base in Warm Gold -->
      <path d="
        M -46 36 L -22 50 L -8 44
        M 46 36 L 22 50 L 8 44
      " stroke="url(#goldGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
    </g>
  </g>
</svg>`;

const outputDir = path.resolve('scratch');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(path.join(outputDir, 'test_icon.svg'), svg);

sharp(Buffer.from(svg))
  .resize(512, 512)
  .png()
  .toFile(path.join(outputDir, 'test_icon.png'))
  .then(() => {
    console.log('Successfully generated scratch/test_icon.png');
  })
  .catch(err => {
    console.error('Error generating png:', err);
  });

