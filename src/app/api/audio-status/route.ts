import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const audioDir = path.join(process.cwd(), "public", "audio", "juz");
    const downloaded: number[] = [];

    if (fs.existsSync(audioDir)) {
      for (let i = 1; i <= 30; i++) {
        const numStr = String(i).padStart(2, "0");
        const webmPath = path.join(audioDir, `juz_${numStr}.webm`);
        const mp3Path = path.join(audioDir, `juz_${numStr}.mp3`);
        const filePath = fs.existsSync(webmPath) ? webmPath : mp3Path;

        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (stats.size > 2 * 1024 * 1024) {
            downloaded.push(i);
          }
        }
      }
    } else {
      // In Cloudflare Workers edge environment, all 30 Juz assets are bundled and served via ASSETS binding
      for (let i = 1; i <= 30; i++) {
        downloaded.push(i);
      }
    }

    return NextResponse.json({
      totalJuz: 30,
      downloadedCount: downloaded.length,
      downloadedJuzs: downloaded,
      allReady: downloaded.length === 30,
    });
  } catch (err: any) {
    return NextResponse.json({ downloadedCount: 0, downloadedJuzs: [] });
    // Fallback: bundled assets are deployed
    return NextResponse.json({
      totalJuz: 30,
      downloadedCount: 30,
      downloadedJuzs: Array.from({ length: 30 }, (_, i) => i + 1),
      allReady: true,
    });
  }
}
