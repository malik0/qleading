import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const audioDir = path.join(__dirname, '..', 'public', 'audio', 'juz');

function parseChapterTitle(title) {
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

async function extract() {
  console.log('Extracting markers from public/audio/juz/*.webm...');
  const markersMap = {};
  const durationsMap = {};
  let totalCount = 0;

  for (let juzId = 1; juzId <= 30; juzId++) {
    const numStr = String(juzId).padStart(2, '0');
    const webmPath = path.join(audioDir, `juz_${numStr}.webm`);
    const mp3Path = path.join(audioDir, `juz_${numStr}.mp3`);
    const filePath = fs.existsSync(webmPath) ? webmPath : mp3Path;

    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    const probeOut = execSync(
      `ffprobe -v error -show_chapters -show_entries format=duration -print_format json "${filePath}"`,
      { maxBuffer: 20 * 1024 * 1024 }
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
    totalCount += markers.length;
    console.log(`Juz ${numStr}: ${markers.length} markers, ${durationsMap[juzId]}s`);
  }

  const markersFilePath = path.join(__dirname, '..', 'src', 'data', 'juzMarkers.ts');
  const fileContent = `import { AyahMarker, JuzMarkersMap } from "../types/quran";

export const JUZ_MARKERS: JuzMarkersMap = ${JSON.stringify(markersMap, null, 2)};
`;

  fs.writeFileSync(markersFilePath, fileContent, 'utf-8');
  console.log(`\nSuccessfully wrote ${totalCount} markers to ${markersFilePath}!`);
}

extract().catch(console.error);

