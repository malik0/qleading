import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const bucket = "qleading-audio";
const audioDirectory = path.resolve("public/audio/juz");
const AUDIO_FILE = /^juz_(?:0[1-9]|[12]\d|30)\.(?:webm|mp3)$/;
const files = (await readdir(audioDirectory))
  .filter((file) => AUDIO_FILE.test(file))
  .sort();
const requestedFiles = process.argv.slice(2).filter((file) => AUDIO_FILE.test(file));
const selectedFiles = requestedFiles.length
  ? files.filter((file) => requestedFiles.includes(file))
  : files;
const reportPath = path.resolve(
  requestedFiles.length
    ? ".wrangler/audio-r2-retry-report.json"
    : ".wrangler/audio-r2-upload-report.json",
);
const results = [];

if (files.length !== 60) {
  throw new Error(`Expected 60 Juz audio files; found ${files.length}.`);
}

for (const [offset, file] of selectedFiles.entries()) {
  const contentType = file.endsWith(".webm") ? "audio/webm" : "audio/mpeg";
  const args = [
    "wrangler", "r2", "object", "put", `${bucket}/juz/${file}`,
    "--file", path.join(audioDirectory, file),
    "--content-type", contentType,
    "--remote",
  ];

  let uploaded = false;
  let attempts = 0;
  for (let attempt = 1; attempt <= 3; attempt++) {
    attempts = attempt;
    const result = spawnSync("npx", args, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.status === 0) {
      uploaded = true;
      break;
    }
    console.warn(`Retrying ${file} (${attempt}/3)…`);
  }

  results.push({ file, uploaded, attempts });
  console.log(`${uploaded ? "Uploaded" : "Failed"} ${offset + 1}/${selectedFiles.length}: ${file}`);
  await writeFile(reportPath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    results,
  }, null, 2));
}

const failures = results.filter(({ uploaded }) => !uploaded);
console.log(`Finished: ${results.length - failures.length} uploaded, ${failures.length} failed.`);
if (failures.length) process.exitCode = 1;
