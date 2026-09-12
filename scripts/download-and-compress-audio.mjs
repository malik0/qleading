import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, '..', 'public', 'audio', 'juz');
const tempDir = path.join(__dirname, '..', 'public', 'audio', 'temp');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

async function processJuz(juzNum) {
  const numStr = String(juzNum).padStart(2, '0');
  const destFile = path.join(outputDir, `juz_${numStr}.mp3`);
  const tempInput = path.join(tempDir, `raw_${numStr}.mp3`);
  const url = `https://archive.org/download/MaherMualqyPerJuz/${numStr}.mp3`;

  // Check if already compressed and exists (between 5MB and 20MB)
  if (fs.existsSync(destFile)) {
    const stat = fs.statSync(destFile);
    if (stat.size >= 5 * 1024 * 1024 && stat.size <= 20 * 1024 * 1024) {
      console.log(`[Juz ${numStr}] Already compressed: ${(stat.size / 1048576).toFixed(1)} MB. Skipping.`);
      return;
    }
  }

  console.log(`[Juz ${numStr}] Downloading from ${url}...`);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const fileStream = fs.createWriteStream(tempInput);
    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(value);
    }
    fileStream.end();

    await new Promise((resolve) => fileStream.on('finish', resolve));

    const rawStat = fs.statSync(tempInput);
    console.log(`[Juz ${numStr}] Downloaded raw (${(rawStat.size / 1048576).toFixed(1)} MB). Compressing to 32kbps mono...`);

    // Compress using ffmpeg:
    // -vn: discard video/cover thumbnail
    // -ac 1: convert to mono
    // -ar 24000: 24kHz sampling rate (optimal for speech/Quran)
    // -b:a 32k: 32kbps bitrate (~10MB for 45 mins, under Cloudflare 25MB limit)
    execSync(`ffmpeg -y -i "${tempInput}" -vn -ac 1 -ar 24000 -b:a 32k "${destFile}"`, { stdio: 'pipe' });

    const finalStat = fs.statSync(destFile);
    console.log(`[Juz ${numStr}] Successfully compressed -> ${(finalStat.size / 1048576).toFixed(2)} MB`);

    try { fs.unlinkSync(tempInput); } catch {}
  } catch (err) {
    console.error(`[Juz ${numStr}] Error processing:`, err.message);
    if (fs.existsSync(tempInput)) try { fs.unlinkSync(tempInput); } catch {}
  }
}

async function main() {
  console.log("Starting download and compression for Sheikh Saud Al-Shuraim (30 Juzs)...");
  console.log(`Target directory: ${outputDir}`);

  for (let i = 1; i <= 30; i++) {
    await processJuz(i);
  }

  if (fs.existsSync(tempDir)) {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }

  console.log("All 30 Juz audio files successfully compressed and stored with the app!");
}

main();

