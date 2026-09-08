import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetDir = path.join(__dirname, '..', 'public', 'audio', 'juz');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// All 30 Juz files on archive.org
const JUZ_FILES = Array.from({ length: 30 }, (_, i) => {
  const juzNum = String(i + 1).padStart(2, '0');
  return {
    juz: i + 1,
    fileName: `Al-Quran Juz ${juzNum}.mp3`,
    targetName: `juz_${juzNum}.mp3`,
    url: `https://archive.org/download/misyarirasyidperjuz/Al-Quran%20Juz%20${juzNum}.mp3`
  };
});

async function downloadFile(item) {
  const destPath = path.join(targetDir, item.targetName);

  if (fs.existsSync(destPath)) {
    const stats = fs.statSync(destPath);
    if (stats.size > 10 * 1024 * 1024) { // More than 10MB, already downloaded
      console.log(`[Juz ${item.juz}] Already exists (${(stats.size / 1048576).toFixed(1)} MB). Skipping.`);
      return true;
    }
  }

  console.log(`[Juz ${item.juz}] Downloading from ${item.url}...`);
  try {
    const response = await fetch(item.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const totalBytes = Number(response.headers.get('content-length')) || 0;
    const fileStream = fs.createWriteStream(destPath);
    let downloaded = 0;
    let lastLog = Date.now();

    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(value);
      downloaded += value.length;

      if (Date.now() - lastLog > 3000) {
        lastLog = Date.now();
        const percent = totalBytes ? ((downloaded / totalBytes) * 100).toFixed(1) + '%' : 'unknown';
        console.log(`[Juz ${item.juz}] Progress: ${(downloaded / 1048576).toFixed(1)} MB / ${(totalBytes / 1048576).toFixed(1)} MB (${percent})`);
      }
    }

    fileStream.end();
    console.log(`[Juz ${item.juz}] Completed download: ${item.targetName} (${(downloaded / 1048576).toFixed(1)} MB)`);
    return true;
  } catch (error) {
    console.error(`[Juz ${item.juz}] Failed to download:`, error.message);
    if (fs.existsSync(destPath)) {
      try { fs.unlinkSync(destPath); } catch {}
    }
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 30;

  console.log(`Starting download of 30 Juz audio files (limit: ${limit})...`);
  console.log(`Target directory: ${targetDir}`);

  const toDownload = JUZ_FILES.slice(0, limit);
  for (const item of toDownload) {
    await downloadFile(item);
  }
  console.log("Audio download process finished.");
}

main();

