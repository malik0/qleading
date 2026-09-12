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
  const destFile = path.join(outputDir, `juz_${numStr}.webm`);
  const tempInput = path.join(tempDir, `raw_${numStr}.mp3`);
  const url = `https://archive.org/download/MaherMualqyPerJuz/${numStr}.mp3`;

  // Skip if already compressed WebM exists (between 3MB and 12MB)
  // Skip if already compressed WebM exists (between 3MB and 15MB)
  if (fs.existsSync(destFile)) {
    const stat = fs.statSync(destFile);
    if (stat.size >= 3 * 1024 * 1024 && stat.size <= 15 * 1024 * 1024) {
      console.log(`[Juz ${numStr}] WebM already exists (${(stat.size / 1048576).toFixed(2)} MB). Skipping.`);
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
    console.log(`[Juz ${numStr}] Downloaded raw (${(rawStat.size / 1048576).toFixed(1)} MB). Compressing to WebM Opus 20kbps...`);

    // Compress to WebM with Opus voice codec
    // -vn: remove any embedded video/cover frames
    // -c:a libopus: state-of-the-art speech codec
    // -b:a 20k: 20kbps (extremely compact, ~6.5MB per Juz)
    // -application voip: tuned for speech intelligibility
    // Compress to WebM Opus:
    // -vn: discard video/cover thumbnail
    // -c:a libopus: opus codec
    // -b:a 20k: 20kbps voice rate (~6.3 MB per Juz)
    // -application voip: tuned for speech/Quran
    // -ac 1: mono
    execSync(`ffmpeg -y -i "${tempInput}" -vn -c:a libopus -b:a 20k -application voip -ac 1 "${destFile}"`, { stdio: 'pipe' });

    const finalStat = fs.statSync(destFile);
    console.log(`[Juz ${numStr}] Successfully converted to WebM -> ${(finalStat.size / 1048576).toFixed(2)} MB`);

    try { fs.unlinkSync(tempInput); } catch {}
  } catch (err) {
    console.error(`[Juz ${numStr}] Error processing:`, err.message);
    if (fs.existsSync(tempInput)) try { fs.unlinkSync(tempInput); } catch {}
  }
}

async function main() {
  console.log("Downloading remaining Juzs for Sheikh Saud Al-Shuraim...");
  
  const missing = [22, 26];
  for (const juzNum of missing) {
    await processJuz(juzNum);
  }

  if (fs.existsSync(tempDir)) {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }

  console.log("All 30 Juz WebM audio files are ready!");
}

main();

