const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outputDir = path.resolve('scratch');

// STYLE 1: Modern Geometric - The Tail is a sleek 45-degree diagonal bar / pill passing through the lower right
const svg1 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="s1_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f20" />
      <stop offset="50%" stop-color="#040711" />
      <stop offset="100%" stop-color="#0d1428" />
    </linearGradient>

    <linearGradient id="s1_qGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="20%" stop-color="#06b6d4" />
      <stop offset="40%" stop-color="#3b82f6" />
      <stop offset="65%" stop-color="#6366f1" />
      <stop offset="85%" stop-color="#a855f7" />
      <stop offset="95%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>

    <linearGradient id="s1_tailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="40%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>

    <linearGradient id="s1_gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="45%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <radialGradient id="s1_glow" cx="47%" cy="44%" r="55%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.32" />
      <stop offset="45%" stop-color="#6366f1" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <filter id="s1_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.75" />
    </filter>
    <filter id="s1_glowFilt" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#06b6d4" flood-opacity="0.4" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="122" fill="url(#s1_bg)" />
  <rect width="512" height="512" rx="122" fill="url(#s1_glow)" />
  <rect x="6" y="6" width="500" height="500" rx="118" stroke="url(#s1_qGrad)" stroke-width="2.5" fill="none" opacity="0.45" />

  <g filter="url(#s1_shadow)">
    <!-- Perfect Q Ring -->
    <circle cx="236" cy="224" r="142" stroke="url(#s1_qGrad)" stroke-width="46" fill="none" filter="url(#s1_glowFilt)" />

    <!-- 45-degree diagonal rounded tail bar crossing cleanly through lower-right -->
    <!-- Center of pass: (336, 324), width 46, length 140 -->
    <rect x="300" y="290" width="136" height="46" rx="23" transform="rotate(45 300 290)" fill="url(#s1_tailGrad)" />

    <!-- Quran in Center -->
    <g transform="translate(236, 224)">
      <!-- Crescent & Star -->
      <path d="M 0 -64 A 14 14 0 1 1 12 -46 A 11 11 0 1 0 -2 -62 Z" fill="url(#s1_gold)" opacity="0.95" />
      <circle cx="8" cy="-56" r="2.5" fill="url(#s1_gold)" />

      <!-- Left Page -->
      <path d="M -2 -24 C -28 -38, -66 -34, -84 -18 C -88 -14, -88 28, -88 30 C -68 14, -30 16, -2 28 Z" fill="#ffffff" />
      <!-- Right Page -->
      <path d="M 2 -24 C 28 -38, 66 -34, 84 -18 C 88 -14, 88 28, 88 30 C 68 14, 30 16, 2 28 Z" fill="#f8fafc" />

      <!-- Verse Lines -->
      <path d="M -76 -6 C -58 -18, -36 -16, -14 -6 M -76 6 C -58 -6, -36 -4, -14 6 M -76 18 C -58 6, -36 8, -14 18 M 76 -6 C 58 -18, 36 -16, 14 -6 M 76 6 C 58 -4, 36 -2, 14 6 M 76 18 C 58 6, 36 8, 14 18" stroke="#0284c7" stroke-width="2.8" stroke-linecap="round" opacity="0.85" />

      <!-- Spine & Ribbon -->
      <line x1="0" y1="-26" x2="0" y2="30" stroke="url(#s1_gold)" stroke-width="5" stroke-linecap="round" />
      <path d="M 0 28 C -5 38, -7 48, -11 56 L 0 50 L 11 56 C 7 48, 5 38, 0 28 Z" fill="url(#s1_gold)" />
      <!-- Rehal Base -->
      <path d="M -54 38 L -26 54 L -6 46 M 54 38 L 26 54 L 6 46" stroke="url(#s1_gold)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

// STYLE 2: Continuous Calligraphic Ribbon Q (single stroke from top looping around and extending into tail)
const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="s2_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f20" />
      <stop offset="50%" stop-color="#040711" />
      <stop offset="100%" stop-color="#0d1428" />
    </linearGradient>

    <linearGradient id="s2_qGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="18%" stop-color="#06b6d4" />
      <stop offset="38%" stop-color="#3b82f6" />
      <stop offset="60%" stop-color="#6366f1" />
      <stop offset="78%" stop-color="#a855f7" />
      <stop offset="90%" stop-color="#ec4899" />
      <stop offset="96%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>

    <linearGradient id="s2_gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="45%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <radialGradient id="s2_glow" cx="47%" cy="44%" r="55%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.32" />
      <stop offset="45%" stop-color="#6366f1" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <filter id="s2_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.75" />
    </filter>
    <filter id="s2_glowFilt" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#06b6d4" flood-opacity="0.4" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="122" fill="url(#s2_bg)" />
  <rect width="512" height="512" rx="122" fill="url(#s2_glow)" />
  <rect x="6" y="6" width="500" height="500" rx="118" stroke="url(#s2_qGrad)" stroke-width="2.5" fill="none" opacity="0.45" />

  <g filter="url(#s2_shadow)">
    <!-- Continuous Q stroke with round cap at top-right, looping around counter-clockwise and sweeping out to bottom-right -->
    <path d="
      M 310 120
      A 142 142 0 1 0 350 310
      C 370 345, 400 380, 440 405
    " stroke="url(#s2_qGrad)" stroke-width="46" fill="none" stroke-linecap="round" filter="url(#s2_glowFilt)" />

    <!-- Quran in Center -->
    <g transform="translate(236, 224)">
      <!-- Audio wave arcs above Quran -->
      <path d="M -30 -56 A 38 38 0 0 1 30 -56" stroke="url(#s2_gold)" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7" />
      <path d="M -16 -48 A 20 20 0 0 1 16 -48" stroke="url(#s2_gold)" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0.9" />

      <!-- Left Page -->
      <path d="M -2 -24 C -28 -38, -66 -34, -84 -18 C -88 -14, -88 28, -88 30 C -68 14, -30 16, -2 28 Z" fill="#ffffff" />
      <!-- Right Page -->
      <path d="M 2 -24 C 28 -38, 66 -34, 84 -18 C 88 -14, 88 28, 88 30 C 68 14, 30 16, 2 28 Z" fill="#f8fafc" />

      <!-- Verse Lines -->
      <path d="M -76 -6 C -58 -18, -36 -16, -14 -6 M -76 6 C -58 -6, -36 -4, -14 6 M -76 18 C -58 6, -36 8, -14 18 M 76 -6 C 58 -18, 36 -16, 14 -6 M 76 6 C 58 -4, 36 -2, 14 6 M 76 18 C 58 6, 36 8, 14 18" stroke="#0284c7" stroke-width="2.8" stroke-linecap="round" opacity="0.85" />

      <!-- Spine & Ribbon -->
      <line x1="0" y1="-26" x2="0" y2="30" stroke="url(#s2_gold)" stroke-width="5" stroke-linecap="round" />
      <path d="M 0 28 C -5 38, -7 48, -11 56 L 0 50 L 11 56 C 7 48, 5 38, 0 28 Z" fill="url(#s2_gold)" />
      <!-- Rehal Base -->
      <path d="M -54 38 L -26 54 L -6 46 M 54 38 L 26 54 L 6 46" stroke="url(#s2_gold)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

// STYLE 3: Modern Tech Curved Q - Full circle with an elegant curved swoosh tail outside
const svg3 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="s3_bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f20" />
      <stop offset="50%" stop-color="#040711" />
      <stop offset="100%" stop-color="#0d1428" />
    </linearGradient>

    <linearGradient id="s3_qGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="20%" stop-color="#06b6d4" />
      <stop offset="42%" stop-color="#3b82f6" />
      <stop offset="68%" stop-color="#6366f1" />
      <stop offset="85%" stop-color="#a855f7" />
      <stop offset="95%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>

    <linearGradient id="s3_tailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="35%" stop-color="#f43f5e" />
      <stop offset="70%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>

    <linearGradient id="s3_gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="45%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <radialGradient id="s3_glow" cx="47%" cy="44%" r="55%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.32" />
      <stop offset="45%" stop-color="#6366f1" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <filter id="s3_shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.75" />
    </filter>
    <filter id="s3_glowFilt" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#06b6d4" flood-opacity="0.4" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="122" fill="url(#s3_bg)" />
  <rect width="512" height="512" rx="122" fill="url(#s3_glow)" />
  <rect x="6" y="6" width="500" height="500" rx="118" stroke="url(#s3_qGrad)" stroke-width="2.5" fill="none" opacity="0.45" />

  <g filter="url(#s3_shadow)">
    <!-- Complete Ring -->
    <circle cx="236" cy="224" r="142" stroke="url(#s3_qGrad)" stroke-width="46" fill="none" filter="url(#s3_glowFilt)" />

    <!-- Curved, elegant wave tail hugging and kicking out from the bottom right -->
    <path d="
      M 318 318
      C 348 348, 380 376, 424 394
      C 434 398, 444 396, 442 384
      C 440 372, 428 362, 404 344
      C 376 322, 354 300, 340 282
      Z
    " fill="none" />

    <!-- Sleek stroke-based tail with round ends -->
    <path d="
      M 320 308
      C 350 338, 384 374, 436 400
    " stroke="url(#s3_tailGrad)" stroke-width="42" stroke-linecap="round" />

    <!-- Quran in Center -->
    <g transform="translate(236, 224)">
      <!-- Crescent & Star -->
      <path d="M 0 -64 A 14 14 0 1 1 12 -46 A 11 11 0 1 0 -2 -62 Z" fill="url(#s3_gold)" opacity="0.95" />
      <circle cx="8" cy="-56" r="2.5" fill="url(#s3_gold)" />

      <!-- Left Page -->
      <path d="M -2 -24 C -28 -38, -66 -34, -84 -18 C -88 -14, -88 28, -88 30 C -68 14, -30 16, -2 28 Z" fill="#ffffff" />
      <!-- Right Page -->
      <path d="M 2 -24 C 28 -38, 66 -34, 84 -18 C 88 -14, 88 28, 88 30 C 68 14, 30 16, 2 28 Z" fill="#f8fafc" />

      <!-- Verse Lines -->
      <path d="M -76 -6 C -58 -18, -36 -16, -14 -6 M -76 6 C -58 -6, -36 -4, -14 6 M -76 18 C -58 6, -36 8, -14 18 M 76 -6 C 58 -18, 36 -16, 14 -6 M 76 6 C 58 -4, 36 -2, 14 6 M 76 18 C 58 6, 36 8, 14 18" stroke="#0284c7" stroke-width="2.8" stroke-linecap="round" opacity="0.85" />

      <!-- Spine & Ribbon -->
      <line x1="0" y1="-26" x2="0" y2="30" stroke="url(#s3_gold)" stroke-width="5" stroke-linecap="round" />
      <path d="M 0 28 C -5 38, -7 48, -11 56 L 0 50 L 11 56 C 7 48, 5 38, 0 28 Z" fill="url(#s3_gold)" />
      <!-- Rehal Base -->
      <path d="M -54 38 L -26 54 L -6 46 M 54 38 L 26 54 L 6 46" stroke="url(#s3_gold)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </g>
</svg>`;

async function run() {
  fs.writeFileSync(path.join(outputDir, 'style1.svg'), svg1);
  fs.writeFileSync(path.join(outputDir, 'style2.svg'), svg2);
  fs.writeFileSync(path.join(outputDir, 'style3.svg'), svg3);

  await sharp(Buffer.from(svg1)).resize(512, 512).png().toFile(path.join(outputDir, 'style1.png'));
  await sharp(Buffer.from(svg2)).resize(512, 512).png().toFile(path.join(outputDir, 'style2.png'));
  await sharp(Buffer.from(svg3)).resize(512, 512).png().toFile(path.join(outputDir, 'style3.png'));
  console.log('Styles 1, 2, 3 generated!');
}

run().catch(console.error);

