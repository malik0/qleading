import { File } from 'megajs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { pipeline } from 'stream/promises';

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

const WEBM_FOLDER_URL = 'https://mega.nz/folder/HE0H1aTA#r5VFQlUrvpHSdDZL64ioFQ';
const MP3_FOLDER_URL = 'https://mega.nz/folder/PdVEyKqL#5bjMV-pscdxWXF2g_SVlLg';

function getJuzNumFromFileName(name) {
  // e.g. Part_01_Juz_01.webm -> 1
  const m = name.match(/Juz_(\d+)/i) || name.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

async function downloadFile(megaFile, destPath) {
  const tempPath = destPath + '.tmp';
  const stream = megaFile.download();
  const writeStream = fs.createWriteStream(tempPath);
  await pipeline(stream, writeStream);
  fs.renameSync(tempPath, destPath);
}

// Download a list of files with limited concurrency
async function downloadQueue(items, concurrency = 3) {
  let index = 0;
  const total = items.length;

  async function worker() {
    while (index < total) {
      const currentIdx = index++;
      const item = items[currentIdx];
      const { file, dest, name, type } = item;
      
      // Check if file already exists with expected size from Mega (+- 100KB)
      if (fs.existsSync(dest)) {
        const stat = fs.statSync(dest);
        if (Math.abs(stat.size - file.size) < 100000) {
          console.log(`[${currentIdx + 1}/${total}] Exists: ${name} (${(stat.size / 1048576).toFixed(1)} MB). Skipping.`);
          continue;
        }
      }

      console.log(`[${currentIdx + 1}/${total}] Downloading ${type}: ${name} (${(file.size / 1048576).toFixed(1)} MB)...`);
      try {
        await downloadFile(file, dest);
        const stat = fs.statSync(dest);
        console.log(`[${currentIdx + 1}/${total}] Done: ${name} (${(stat.size / 1048576).toFixed(1)} MB)`);
      } catch (err) {
        console.error(`[${currentIdx + 1}/${total}] ERROR downloading ${name}:`, err.message);
        throw err;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
}

function parseChapterTitle(title) {
  // Expected formats: "Al-Fatiha 1:1", "Al-Baqarah 2:142", "Ali 'Imran 3:1", "An-Nisa 4:24", "Ya-Sin 36:1"
  // Regex matches: Name, SurahNum:AyahNum
  const m = title.trim().match(/^(.*?)\s+(\d+):(\d+)$/);
  if (m) {
    return {
      surahName: m[1].trim(),
      surahNumber: parseInt(m[2], 10),
      ayahNumber: parseInt(m[3], 10),
    };
  }
  return {
    surahName: title.trim(),
    surahNumber: 0,
    ayahNumber: 0,
  };
}

async function extractMarkersAndDurations() {
  console.log('\n--- EXTRACTING MARKERS & DURATIONS FROM WEBM FILES ---');
  const markersMap = {};
  const durationsMap = {};

  for (let juzId = 1; juzId <= 30; juzId++) {
    const numStr = String(juzId).padStart(2, '0');
    const webmPath = path.join(outputDir, `juz_${numStr}.webm`);
    const mp3Path = path.join(outputDir, `juz_${numStr}.mp3`);
    const filePath = fs.existsSync(webmPath) ? webmPath : mp3Path;

    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: File not found for Juz ${juzId}: ${filePath}`);
      continue;
    }

    // Run ffprobe to get chapters and duration
    try {
      const probeOut = execSync(
        `ffprobe -v error -show_chapters -show_entries format=duration -print_format json "${filePath}"`,
        { maxBuffer: 15 * 1024 * 1024 }
      );
      const probeData = JSON.parse(probeOut.toString());

      const duration = probeData.format?.duration ? parseFloat(probeData.format.duration) : 0;
      durationsMap[juzId] = Math.round(duration);

      const rawChapters = probeData.chapters || [];
      const markers = rawChapters.map((ch, idx) => {
        const title = ch.tags?.title || `Ayah ${idx + 1}`;
        const parsed = parseChapterTitle(title);
        const startTime = parseFloat(ch.start_time || '0');
        const endTime = parseFloat(ch.end_time || '0');

        return {
          id: idx + 1,
          title,
          surahName: parsed.surahName,
          surahNumber: parsed.surahNumber,
          ayahNumber: parsed.ayahNumber,
          startTime: Math.round(startTime * 1000) / 1000,
          endTime: Math.round(endTime * 1000) / 1000,
        };
      });

      markersMap[juzId] = markers;
      console.log(`Juz ${numStr}: ${markers.length} Ayah markers, duration: ${durationsMap[juzId]}s (${(durationsMap[juzId] / 60).toFixed(1)} min)`);
    } catch (err) {
      console.error(`Error probing Juz ${juzId}:`, err.message);
    }
  }

  // Write the static dataset; keep the TypeScript loader and lookup helper intact.
  const markersFilePath = path.join(__dirname, '..', 'src', 'data', 'juzMarkers.json');
  const fileContent = JSON.stringify(markersMap, null, 2) + '\n';

  fs.writeFileSync(markersFilePath, fileContent, 'utf-8');
  console.log(`\nSuccessfully wrote markers to ${markersFilePath}!`);

  return { markersMap, durationsMap };
}

async function main() {
  console.log('Connecting to Mega folders...');
  const webmFolder = File.fromURL(WEBM_FOLDER_URL);
  await webmFolder.loadAttributes();
  console.log(`WebM folder loaded: "${webmFolder.name}" (${webmFolder.children.length} files)`);

  const mp3Folder = File.fromURL(MP3_FOLDER_URL);
  await mp3Folder.loadAttributes();
  console.log(`MP3 folder loaded: "${mp3Folder.name}" (${mp3Folder.children.length} files)`);

  // Build download queue for WebM files
  const webmQueue = [];
  for (const file of webmFolder.children) {
    const juzNum = getJuzNumFromFileName(file.name);
    if (juzNum) {
      const numStr = String(juzNum).padStart(2, '0');
      webmQueue.push({
        file,
        dest: path.join(outputDir, `juz_${numStr}.webm`),
        name: file.name,
        type: 'WebM',
        juzNum,
      });
    }
  }
  webmQueue.sort((a, b) => a.juzNum - b.juzNum);

  // Build download queue for MP3 files
  const mp3Queue = [];
  for (const file of mp3Folder.children) {
    const juzNum = getJuzNumFromFileName(file.name);
    if (juzNum) {
      const numStr = String(juzNum).padStart(2, '0');
      mp3Queue.push({
        file,
        dest: path.join(outputDir, `juz_${numStr}.mp3`),
        name: file.name,
        type: 'MP3',
        juzNum,
      });
    }
  }
  mp3Queue.sort((a, b) => a.juzNum - b.juzNum);

  console.log(`\n--- DOWNLOADING ${webmQueue.length} WEBM FILES ---`);
  await downloadQueue(webmQueue, 4);

  console.log(`\n--- DOWNLOADING ${mp3Queue.length} MP3 FILES ---`);
  await downloadQueue(mp3Queue, 4);

  console.log('\nAll audio files downloaded successfully!');

  // Extract markers and durations
  const { durationsMap } = await extractMarkersAndDurations();

  // Save durations summary to JSON for easy inspection
  fs.writeFileSync(
    path.join(__dirname, 'durations.json'),
    JSON.stringify(durationsMap, null, 2),
    'utf-8'
  );
  console.log('Durations saved to scripts/durations.json');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
