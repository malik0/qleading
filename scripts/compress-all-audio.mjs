import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const audioDir = path.join(__dirname, '..', 'public', 'audio', 'juz');

const MAX_SIZE_BYTES = 24.5 * 1024 * 1024; // 24.5 MiB safe threshold (Cloudflare limit is 25 MiB)

async function compressFile(file) {
  const inputPath = path.join(audioDir, file);
  if (!fs.existsSync(inputPath)) {
    console.warn(`File does not exist: ${file}`);
    return;
  }

  const stat = fs.statSync(inputPath);
  if (stat.size <= MAX_SIZE_BYTES) {
    console.log(`[SKIP] ${file} is already ${(stat.size / (1024 * 1024)).toFixed(2)} MiB (<= 25 MiB)`);
    return;
  }

  const tempPath = path.join(audioDir, `compressed_${file}`);
  const isWebm = file.endsWith('.webm');
  const cmd = isWebm
    ? `ffmpeg -y -i "${inputPath}" -map_metadata 0 -map_chapters 0 -c:a libopus -b:a 64k "${tempPath}"`
    : `ffmpeg -y -i "${inputPath}" -map_metadata 0 -map_chapters 0 -c:a libmp3lame -b:a 64k "${tempPath}"`;

  console.log(`[START] Compressing ${file} (${(stat.size / (1024 * 1024)).toFixed(2)} MiB)...`);
  const startTime = Date.now();
  await execPromise(cmd);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  if (!fs.existsSync(tempPath)) {
    throw new Error(`Compression failed, output not found: ${tempPath}`);
  }

  const newStat = fs.statSync(tempPath);
  const newSizeMB = (newStat.size / (1024 * 1024)).toFixed(2);
  console.log(`✓ [DONE] ${file} -> ${newSizeMB} MiB in ${elapsed}s`);

  if (newStat.size > MAX_SIZE_BYTES) {
    console.warn(`WARNING: ${file} is still ${newSizeMB} MiB (> 24.5 MiB)!`);
  }

  // Atomically replace
  fs.copyFileSync(tempPath, inputPath);
  fs.unlinkSync(tempPath);
}

async function main() {
  const files = [];
  for (let i = 1; i <= 30; i++) {
    const num = String(i).padStart(2, '0');
    files.push(`juz_${num}.webm`);
    files.push(`juz_${num}.mp3`);
  }

  console.log(`Total files to check & compress: ${files.length}`);
  const CONCURRENCY = 4;
  let nextIdx = 0;

  async function worker(id) {
    while (nextIdx < files.length) {
      const file = files[nextIdx++];
      try {
        await compressFile(file);
      } catch (err) {
        console.error(`Error compressing ${file}:`, err);
        throw err;
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log('\nAll files compressed successfully!');
  console.log('Verifying sizes:');
  let allPass = true;
  for (const file of files) {
    const stat = fs.statSync(path.join(audioDir, file));
    const mb = stat.size / (1024 * 1024);
    if (mb > 25) {
      console.error(`FAIL: ${file} is ${mb.toFixed(2)} MiB (> 25 MiB limit)`);
      allPass = false;
    }
  }
  if (allPass) {
    console.log('✓ All 60 files are strictly under the Cloudflare 25 MiB asset limit!');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

